import * as cheerio from "cheerio";
import * as fs from "fs";

const BASE_URL = "https://www.literaturpreisgewinner.de";

const CATEGORY_MAP: Record<string, string> = {
  belletristik: "Belletristik",
  "belletristik-international": "Belletristik (International)",
  krimis: "Krimis",
  "sf-fantasy": "SF & Fantasy",
  sachbuch: "Sachbuch",
  "kinder-jugend": "Kinder & Jugend",
  sonstige: "Sonstige",
};

function isHeaderRow(texts: string[]): boolean {
  const joined = texts.join(" ").toLowerCase();
  return (
    (joined.includes("preis") && joined.includes("autor")) ||
    (joined.includes("jahr") && joined.includes("autor")) ||
    (joined.includes("kategorie") && joined.includes("autor")) ||
    (joined.includes("preis") && joined.includes("titel"))
  );
}

function isYearSectionHeader(texts: string[]): number | null {
  if (texts.length === 1) {
    const yearMatch = texts[0].match(/(\d{4})/);
    if (yearMatch) {
      const y = parseInt(yearMatch[1]);
      if (y >= 1900 && y <= 2030) return y;
    }
  }
  return null;
}

function extractIsbnFromUrl(url: string): string | null {
  const match = url.match(/\/dp\/(\d{10})\/?/);
  return match ? match[1] : null;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function scrapeIndex() {
  const html = await fetchPage(BASE_URL + "/a-z");
  const $ = cheerio.load(html);
  const awards: { name: string; url: string; category: string }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const name = $(el).text().trim();
    if (
      href.startsWith(BASE_URL + "/") &&
      name.length > 2 &&
      !href.endsWith("/a-z") &&
      !href.endsWith("/impressum") &&
      !href.endsWith("/datenschutz")
    ) {
      const pathParts = href.replace(BASE_URL + "/", "").split("/");
      if (pathParts.length === 2 && pathParts[1].length > 0) {
        const categorySlug = pathParts[0];
        awards.push({
          name,
          url: href,
          category: CATEGORY_MAP[categorySlug] || categorySlug,
        });
      }
    }
  });

  return awards.filter((a, i, arr) => arr.findIndex((b) => b.url === a.url) === i);
}

async function scrapeAward(info: { name: string; url: string; category: string }) {
  const html = await fetchPage(info.url);
  const $ = cheerio.load(html);
  const contentEl = $(".entry-content").first();

  const descParagraphs: string[] = [];
  contentEl.children("p").each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 20) descParagraphs.push(t);
  });

  interface Edition {
    year: number;
    outcomes: { level: string; recipients: { author: string; title: string | null; isbn: string | null }[] }[];
  }

  const editionMap = new Map<number, Edition>();
  const tables = contentEl.find("table");

  tables.each((_, table) => {
    let currentYear: number | null = null;
    let currentLevel = "";
    let headerType = "standard";

    $(table).find("tr").each((_, tr) => {
      const cells = $(tr).find("td, th");
      const cellTexts: string[] = [];
      const cellLinks: string[] = [];
      cells.each((_, cell) => {
        cellTexts.push($(cell).text().trim());
        cellLinks.push($(cell).find("a").first().attr("href") || "");
      });

      const sectionYear = isYearSectionHeader(cellTexts);
      if (sectionYear !== null) {
        currentYear = sectionYear;
        currentLevel = "";
        return;
      }

      if (isHeaderRow(cellTexts)) {
        const joined = cellTexts.join("|").toLowerCase();
        if (joined.includes("jahr")) headerType = "year-author-title";
        else if (joined.includes("kategorie")) headerType = "category-author-title";
        else headerType = "standard";
        return;
      }

      if (cellTexts.length < 2 || cellTexts.every((t) => !t)) return;

      let author = "";
      let title: string | null = null;
      let isbn: string | null = null;
      let yearFromRow: number | null = null;

      if (headerType === "year-author-title" && cellTexts.length >= 3) {
        const py = parseInt(cellTexts[0]);
        if (py >= 1900 && py <= 2030) yearFromRow = py;
        author = cellTexts[1];
        title = cellTexts[2] || null;
        isbn = cellLinks[2] ? extractIsbnFromUrl(cellLinks[2]) : null;
        currentLevel = "Gewinner";
      } else if (cellTexts.length >= 3) {
        if (cellTexts[0].length > 0) currentLevel = cellTexts[0];
        author = cellTexts[1];
        title = cellTexts[2] || null;
        isbn = cellLinks[2] ? extractIsbnFromUrl(cellLinks[2]) : null;
      } else if (cellTexts.length === 2) {
        author = cellTexts[0];
        title = cellTexts[1] || null;
        isbn = cellLinks[1] ? extractIsbnFromUrl(cellLinks[1]) : null;
      }

      if (!author || author.length < 2) return;
      if (["autor", "preisträger", "laudator"].includes(author.toLowerCase())) return;

      const effectiveYear = yearFromRow || currentYear;
      if (!effectiveYear) return;
      if (!currentLevel) currentLevel = "Gewinner";

      let edition = editionMap.get(effectiveYear);
      if (!edition) {
        edition = { year: effectiveYear, outcomes: [] };
        editionMap.set(effectiveYear, edition);
      }

      let outcome = edition.outcomes.find((o) => o.level === currentLevel);
      if (!outcome) {
        outcome = { level: currentLevel, recipients: [] };
        edition.outcomes.push(outcome);
      }

      outcome.recipients.push({
        author,
        title: title && title.length > 0 ? title : null,
        isbn,
      });
    });
  });

  const editions = Array.from(editionMap.values()).sort((a, b) => b.year - a.year);
  const slug = info.url.split("/").pop() || "";

  return {
    name: info.name,
    slug,
    url: info.url,
    category: info.category,
    description: descParagraphs.slice(0, 2).join(" "),
    editions,
  };
}

async function main() {
  console.log("Scraping award index...");
  const awardList = await scrapeIndex();
  console.log(`Found ${awardList.length} awards`);

  const allAwards: any[] = [];
  for (let i = 0; i < awardList.length; i++) {
    try {
      const award = await scrapeAward(awardList[i]);
      const rc = award.editions.reduce(
        (s, e) => s + e.outcomes.reduce((s2, o) => s2 + o.recipients.length, 0), 0
      );
      console.log(`  [${i + 1}/${awardList.length}] ${award.name}: ${award.editions.length} years, ${rc} recipients`);
      allAwards.push(award);
    } catch (err: any) {
      console.error(`  [${i + 1}/${awardList.length}] ERROR ${awardList[i].name}: ${err.message}`);
    }
    if (i % 20 === 19) await new Promise((r) => setTimeout(r, 300));
  }

  const totalEditions = allAwards.reduce((s, a) => s + a.editions.length, 0);
  const totalRecipients = allAwards.reduce(
    (s, a) => s + a.editions.reduce(
      (s2: number, e: any) => s2 + e.outcomes.reduce((s3: number, o: any) => s3 + o.recipients.length, 0), 0
    ), 0
  );

  console.log(`\nTotal: ${allAwards.length} awards, ${totalEditions} editions, ${totalRecipients} recipients`);

  fs.writeFileSync("scripts/awards-data.json", JSON.stringify(allAwards, null, 2));
  console.log("Written to scripts/awards-data.json");
}

main().catch(console.error);
