import * as cheerio from "cheerio";
import pg from "pg";
import * as fs from "fs";

const { Pool } = pg;
const BASE_URL = "https://www.literaturpreisgewinner.de";

const AFFECTED_AWARDS = [
  "bruno-kreisky-preis-fuer-das-politische-buch",
  "carl-zuckmayer-medaille",
  "crime-cologne-award",
  "deutscher-krimi-preis",
  "deutscher-krimi-preis-international",
  "friedrich-hoelderlin-preis",
  "krimi-blitz",
  "premio-hammett",
  "schubart-literaturpreis",
];

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

interface Edition {
  year: number;
  outcomes: { level: string; recipients: { author: string; title: string | null; isbn: string | null }[] }[];
}

async function scrapeAward(url: string) {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const contentEl = $(".entry-content").first();

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
        const firstVal = cellTexts[0];
        const py = parseInt(firstVal);
        if (py >= 1900 && py <= 2030 && firstVal.match(/^\d{4}$/)) {
          yearFromRow = py;
          author = cellTexts[1];
          title = null;
        } else if (firstVal.match(/^\d+\.?$/)) {
          author = cellTexts[1];
          title = null;
        } else {
          author = cellTexts[0];
          title = cellTexts[1] || null;
          isbn = cellLinks[1] ? extractIsbnFromUrl(cellLinks[1]) : null;
        }
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

  return Array.from(editionMap.values()).sort((a, b) => b.year - a.year);
}

// Import into DB

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/[ß]/g, "ss")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // Load book index for matching
  let bookIndex: Map<string, { id: number; isbn: string }> = new Map();
  if (fs.existsSync("/tmp/book_index.json")) {
    const idx = JSON.parse(fs.readFileSync("/tmp/book_index.json", "utf8"));
    bookIndex = new Map(Object.entries(idx));
    console.log(`Book index: ${bookIndex.size} entries`);
  }

  // Cache existing persons
  const personsResult = await pool.query("SELECT id, name, slug FROM persons");
  const personsBySlug = new Map<string, number>();
  for (const p of personsResult.rows) {
    personsBySlug.set(p.slug, parseInt(p.id));
  }
  console.log(`Existing persons: ${personsBySlug.size}`);

  let totalNewPersons = 0;
  let totalNewRecipients = 0;

  // Find full URLs for affected awards
  const awardIndexHtml = await fetchPage(BASE_URL + "/a-z");
  const $idx = cheerio.load(awardIndexHtml);
  const awardUrls = new Map<string, string>();
  $idx("a[href]").each((_, el) => {
    const href = $idx(el).attr("href") || "";
    for (const slug of AFFECTED_AWARDS) {
      if (href.endsWith("/" + slug)) {
        awardUrls.set(slug, href);
      }
    }
  });

  for (const slug of AFFECTED_AWARDS) {
    const url = awardUrls.get(slug);
    if (!url) {
      console.log(`Skipping ${slug}: URL not found`);
      continue;
    }

    // Get award ID
    const awardRow = await pool.query("SELECT id FROM awards WHERE slug = $1", [slug]);
    if (awardRow.rows.length === 0) {
      console.log(`Skipping ${slug}: not in DB`);
      continue;
    }
    const awardId = awardRow.rows[0].id;

    console.log(`\nProcessing: ${slug} (award_id=${awardId})`);
    const editions = await scrapeAward(url);
    
    let newPersons = 0;
    let newRecipients = 0;

    for (const ed of editions) {
      // Get edition
      const edRow = await pool.query(
        "SELECT id FROM award_editions WHERE award_id = $1 AND year = $2",
        [awardId, ed.year]
      );
      if (edRow.rows.length === 0) continue;
      const editionId = edRow.rows[0].id;

      for (const outcome of ed.outcomes) {
        // Get outcome
        const outcomeRow = await pool.query(
          "SELECT id FROM award_outcomes WHERE award_edition_id = $1 AND title = $2",
          [editionId, outcome.level]
        );
        if (outcomeRow.rows.length === 0) continue;
        const outcomeId = outcomeRow.rows[0].id;

        for (const recipient of outcome.recipients) {
          // Try book matching first
          const normalizedTitle = recipient.title?.toLowerCase().replace(/[^a-z0-9äöüß]+/g, " ").trim();
          const normalizedAuthor = recipient.author.toLowerCase().replace(/[^a-z0-9äöüß]+/g, " ").trim();
          
          let matchedBookId: number | null = null;
          if (normalizedTitle && normalizedAuthor) {
            const key = `${normalizedTitle}|||${normalizedAuthor}`;
            const match = bookIndex.get(key);
            if (match) matchedBookId = match.id;
          }

          if (matchedBookId) {
            // Check if this book recipient already exists
            const existing = await pool.query(
              "SELECT id FROM award_recipients WHERE award_outcome_id = $1 AND book_id = $2",
              [outcomeId, matchedBookId]
            );
            if (existing.rows.length === 0) {
              await pool.query(
                "INSERT INTO award_recipients (award_outcome_id, book_id, notes) VALUES ($1, $2, $3)",
                [outcomeId, matchedBookId, null]
              );
              newRecipients++;
            }
          } else {
            // Person recipient
            const personSlug = slugify(recipient.author);
            let personId = personsBySlug.get(personSlug);
            
            if (!personId) {
              const ins = await pool.query(
                "INSERT INTO persons (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id",
                [recipient.author, personSlug]
              );
              personId = parseInt(ins.rows[0].id);
              personsBySlug.set(personSlug, personId);
              newPersons++;
            }

            // Check existing
            const existing = await pool.query(
              "SELECT id FROM award_recipients WHERE award_outcome_id = $1 AND person_id = $2",
              [outcomeId, personId]
            );
            if (existing.rows.length === 0) {
              const notes = recipient.title ? `Buch: ${recipient.title}` : null;
              await pool.query(
                "INSERT INTO award_recipients (award_outcome_id, person_id, notes) VALUES ($1, $2, $3)",
                [outcomeId, personId, notes]
              );
              newRecipients++;
            }
          }
        }
      }
    }
    
    console.log(`  New persons: ${newPersons}, New recipients: ${newRecipients}`);
    totalNewPersons += newPersons;
    totalNewRecipients += newRecipients;
  }

  console.log(`\nTotal: ${totalNewPersons} new persons, ${totalNewRecipients} new recipients`);
  
  // Verify no more year-like names
  const check = await pool.query("SELECT count(*) FROM persons WHERE name ~ '^[0-9]+\\.?$'");
  console.log(`Remaining bad persons: ${check.rows[0].count}`);
  
  await pool.end();
}

main().catch(console.error);
