import { Pool } from "pg";
import * as cheerio from "cheerio";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

async function query(text: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

const BASE_URL = "https://www.literaturpreisgewinner.de";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeAuthorName(name: string): string {
  name = name.trim();
  if (name.includes(",")) {
    const parts = name.split(",").map((p) => p.trim());
    if (parts.length === 2 && parts[1].length > 0) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return name;
}

function extractIsbnFromUrl(url: string): string | null {
  const match = url.match(/\/dp\/(\d{10})\/?/);
  return match ? match[1] : null;
}

interface ScrapedAward {
  name: string;
  slug: string;
  url: string;
  category: string;
  description: string;
  editions: ScrapedEdition[];
}

interface ScrapedEdition {
  year: number;
  outcomes: ScrapedOutcome[];
}

interface ScrapedOutcome {
  level: string;
  recipients: ScrapedRecipient[];
}

interface ScrapedRecipient {
  author: string;
  title: string | null;
  isbn: string | null;
}

const CATEGORY_MAP: Record<string, string> = {
  belletristik: "Belletristik",
  "belletristik-international": "Belletristik (International)",
  krimis: "Krimis",
  "sf-fantasy": "SF & Fantasy",
  sachbuch: "Sachbuch",
  "kinder-jugend": "Kinder & Jugend",
  sonstige: "Sonstige",
};

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function scrapeAwardIndex(): Promise<
  { name: string; url: string; category: string }[]
> {
  console.log("Fetching award index from", BASE_URL + "/a-z");
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
        const category = CATEGORY_MAP[categorySlug] || categorySlug;
        awards.push({ name, url: href, category });
      }
    }
  });

  return awards.filter(
    (a, i, arr) => arr.findIndex((b) => b.url === a.url) === i
  );
}

function isHeaderRow(texts: string[]): boolean {
  const joined = texts.join(" ").toLowerCase();
  return (
    joined.includes("preis") && joined.includes("autor") ||
    joined.includes("jahr") && joined.includes("autor") ||
    joined.includes("kategorie") && joined.includes("autor") ||
    joined.includes("preis") && joined.includes("titel")
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

function detectHeaderColumns(
  headerTexts: string[]
): { type: "standard" | "year-author-title" | "category-author-title" } {
  const joined = headerTexts.join("|").toLowerCase();
  if (joined.includes("jahr")) return { type: "year-author-title" };
  if (joined.includes("kategorie")) return { type: "category-author-title" };
  return { type: "standard" };
}

async function scrapeAwardPage(
  awardInfo: { name: string; url: string; category: string },
  retries = 2
): Promise<ScrapedAward> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const html = await fetchPage(awardInfo.url);
      const $ = cheerio.load(html);

      const contentEl = $(".entry-content").first();

      const descParagraphs: string[] = [];
      contentEl.children("p").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) descParagraphs.push(text);
      });
      const description = descParagraphs.slice(0, 2).join(" ");

      const editions: ScrapedEdition[] = [];
      const editionMap = new Map<number, ScrapedEdition>();

      const tables = contentEl.find("table");

      tables.each((_, table) => {
        let currentYear: number | null = null;
        let currentLevel = "";
        let headerType: "standard" | "year-author-title" | "category-author-title" = "standard";

        $(table)
          .find("tr")
          .each((_, tr) => {
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
              const detected = detectHeaderColumns(cellTexts);
              headerType = detected.type;
              return;
            }

            if (cellTexts.length < 2) return;
            if (cellTexts.every((t) => t.length === 0)) return;

            let author = "";
            let title: string | null = null;
            let isbn: string | null = null;
            let yearFromRow: number | null = null;

            if (headerType === "year-author-title" && cellTexts.length >= 3) {
              const parsedYear = parseInt(cellTexts[0]);
              if (parsedYear >= 1900 && parsedYear <= 2030) {
                yearFromRow = parsedYear;
              }
              author = cellTexts[1];
              title = cellTexts[2] || null;
              isbn = cellLinks[2] ? extractIsbnFromUrl(cellLinks[2]) : null;
              currentLevel = "Gewinner";
            } else if (headerType === "category-author-title" && cellTexts.length >= 3) {
              if (cellTexts[0].length > 0) currentLevel = cellTexts[0];
              author = cellTexts[1];
              title = cellTexts[2] || null;
              isbn = cellLinks[2] ? extractIsbnFromUrl(cellLinks[2]) : null;
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
            if (author.toLowerCase() === "autor" || author.toLowerCase() === "preisträger") return;

            const effectiveYear = yearFromRow || currentYear;
            if (!effectiveYear) return;

            if (!currentLevel || currentLevel.length === 0) {
              currentLevel = "Gewinner";
            }

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

      editionMap.forEach((e) => editions.push(e));
      editions.sort((a, b) => b.year - a.year);

      const slug = awardInfo.url.split("/").pop() || slugify(awardInfo.name);

      return {
        name: awardInfo.name,
        slug,
        url: awardInfo.url,
        category: awardInfo.category,
        description,
        editions,
      };
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        console.error(`  FAILED: ${awardInfo.name}: ${err.message}`);
        return {
          name: awardInfo.name,
          slug: slugify(awardInfo.name),
          url: awardInfo.url,
          category: awardInfo.category,
          description: "",
          editions: [],
        };
      }
    }
  }
  throw new Error("unreachable");
}

async function findBookMatch(
  title: string,
  author: string
): Promise<number | null> {
  const normalizedAuthor = normalizeAuthorName(author);
  const authorParts = normalizedAuthor.split(/\s+/);
  const lastName =
    authorParts.length > 1
      ? authorParts[authorParts.length - 1]
      : authorParts[0];

  const result = await query(
    `SELECT id FROM books
     WHERE LOWER(title) = LOWER($1)
       AND (LOWER(author) LIKE LOWER($2) OR LOWER(author) LIKE LOWER($3))
     LIMIT 1`,
    [title.trim(), `%${lastName}%`, `%${normalizedAuthor}%`]
  );

  if (result.rows.length > 0) return result.rows[0].id;

  try {
    const fuzzy = await query(
      `SELECT id, similarity(LOWER(title), LOWER($1)) as sim
       FROM books
       WHERE LOWER(title) % LOWER($1)
         AND (LOWER(author) LIKE LOWER($2) OR LOWER(author) LIKE LOWER($3))
       ORDER BY sim DESC
       LIMIT 1`,
      [title.trim(), `%${lastName}%`, `%${normalizedAuthor}%`]
    );

    if (fuzzy.rows.length > 0 && fuzzy.rows[0].sim > 0.5) {
      return fuzzy.rows[0].id;
    }
  } catch {
  }

  return null;
}

async function findOrCreatePerson(name: string): Promise<number> {
  const normalized = normalizeAuthorName(name);
  const slug = slugify(normalized);

  const existing = await query(
    `SELECT id FROM persons WHERE LOWER(name) = LOWER($1) OR slug = $2 LIMIT 1`,
    [normalized, slug]
  );

  if (existing.rows.length > 0) return existing.rows[0].id;

  const ins = await query(
    `INSERT INTO persons (name, slug, status, visibility, created_at, updated_at)
     VALUES ($1, $2, 'active', 'visible', NOW(), NOW())
     ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [normalized, slug]
  );

  return ins.rows[0].id;
}

function mapOutcomeLevel(level: string): {
  name: string;
  order: number;
  status: string;
} {
  const l = level.toLowerCase().trim();
  if (
    l.includes("hauptpreis") ||
    l.includes("gewinner") ||
    l.includes("preisträger") ||
    l.includes("preisträgerin") ||
    l === "preis" ||
    l === "roman" ||
    l === "hauptkategorie"
  ) {
    return { name: "Gewinner", order: 1, status: "winner" };
  }
  if (
    l.includes("finalist") ||
    l.includes("shortlist") ||
    l.includes("short list")
  ) {
    return { name: "Shortlist", order: 2, status: "shortlisted" };
  }
  if (l.includes("longlist") || l.includes("long list")) {
    return { name: "Longlist", order: 3, status: "longlisted" };
  }
  if (l.includes("nominier") || l.includes("auswahl")) {
    return { name: "Nominierung", order: 4, status: "nominated" };
  }
  if (
    l.includes("erstlingsroman") ||
    l.includes("debüt") ||
    l.includes("debut")
  ) {
    return { name: "Debütpreis", order: 5, status: "winner" };
  }
  if (l.includes("kurzgeschichte") || l.includes("erzählung")) {
    return { name: "Kurzgeschichte", order: 6, status: "winner" };
  }
  if (l.includes("kinder") || l.includes("jugend")) {
    return { name: "Kinder-/Jugendbuch", order: 7, status: "winner" };
  }
  if (l.includes("sachbuch") || l.includes("non-fiction")) {
    return { name: "Sachbuch", order: 8, status: "winner" };
  }
  if (l.includes("förder") || l.includes("ehrung") || l.includes("ehrenpreis")) {
    return { name: level, order: 9, status: "special" };
  }
  return { name: level || "Gewinner", order: 1, status: "winner" };
}

async function importAward(award: ScrapedAward): Promise<{
  bookMatches: number;
  personCreated: number;
  editions: number;
  recipients: number;
}> {
  const stats = {
    bookMatches: 0,
    personCreated: 0,
    editions: 0,
    recipients: 0,
  };

  const existingAward = await query(
    `SELECT id FROM awards WHERE slug = $1 LIMIT 1`,
    [award.slug]
  );

  let awardId: number;
  if (existingAward.rows.length > 0) {
    awardId = existingAward.rows[0].id;
    await query(
      `UPDATE awards SET description = COALESCE(NULLIF($1, ''), description), website_url = $2, updated_at = NOW() WHERE id = $3`,
      [award.description, award.url, awardId]
    );
  } else {
    const ins = await query(
      `INSERT INTO awards (name, slug, website_url, description, country, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
      [
        award.name,
        award.slug,
        award.url,
        award.description,
        award.category.includes("International")
          ? "International"
          : "Deutschland",
      ]
    );
    awardId = ins.rows[0].id;
  }

  for (const edition of award.editions) {
    const existingEdition = await query(
      `SELECT id FROM award_editions WHERE award_id = $1 AND year = $2 LIMIT 1`,
      [awardId, edition.year]
    );

    let editionId: number;
    if (existingEdition.rows.length > 0) {
      editionId = existingEdition.rows[0].id;
    } else {
      const ins = await query(
        `INSERT INTO award_editions (award_id, year, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
        [awardId, edition.year]
      );
      editionId = ins.rows[0].id;
      stats.editions++;
    }

    for (const outcome of edition.outcomes) {
      const mapped = mapOutcomeLevel(outcome.level);

      const existingOutcome = await query(
        `SELECT id FROM award_outcomes WHERE award_edition_id = $1 AND title = $2 LIMIT 1`,
        [editionId, mapped.name]
      );

      let outcomeId: number;
      if (existingOutcome.rows.length > 0) {
        outcomeId = existingOutcome.rows[0].id;
      } else {
        const ins = await query(
          `INSERT INTO award_outcomes (award_edition_id, outcome_type, title, sort_order, result_status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
          [editionId, mapped.status, mapped.name, mapped.order, mapped.status]
        );
        outcomeId = ins.rows[0].id;
      }

      for (const recipient of outcome.recipients) {
        const hasTitle =
          recipient.title &&
          recipient.title.length > 1 &&
          recipient.title !== recipient.author;

        let bookId: number | null = null;
        let personId: number | null = null;
        let recipientKind = "person";

        if (hasTitle) {
          bookId = await findBookMatch(recipient.title!, recipient.author);
          if (bookId) {
            recipientKind = "book";
            stats.bookMatches++;
          }
        }

        personId = await findOrCreatePerson(recipient.author);
        if (!bookId) {
          recipientKind = "person";
        }

        const existingRecipient = await query(
          `SELECT id FROM award_recipients
           WHERE award_outcome_id = $1
             AND person_id = $2
           LIMIT 1`,
          [outcomeId, personId]
        );

        if (existingRecipient.rows.length === 0) {
          await query(
            `INSERT INTO award_recipients (award_outcome_id, recipient_kind, book_id, person_id, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              outcomeId,
              recipientKind,
              bookId,
              personId,
              hasTitle && !bookId
                ? `Buch: "${recipient.title}"`
                : null,
            ]
          );
          stats.recipients++;
          if (!bookId) stats.personCreated++;
        }
      }
    }
  }

  return stats;
}

async function enableTrigram() {
  try {
    await query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
  } catch {
    console.warn("pg_trgm not available, using exact matching only");
  }
}

async function main() {
  console.log("=== Literaturpreis Import ===");
  console.log("Source: literaturpreisgewinner.de\n");

  await enableTrigram();

  const awardList = await scrapeAwardIndex();
  console.log(`Found ${awardList.length} awards. Starting scrape + import...\n`);

  const totalStats = {
    awards: 0,
    editions: 0,
    recipients: 0,
    bookMatches: 0,
    personCreated: 0,
    errors: 0,
    skipped: 0,
  };

  for (let i = 0; i < awardList.length; i++) {
    const awardInfo = awardList[i];
    try {
      const award = await scrapeAwardPage(awardInfo);
      const recipientCount = award.editions.reduce(
        (sum, e) =>
          sum + e.outcomes.reduce((s, o) => s + o.recipients.length, 0),
        0
      );

      if (award.editions.length === 0) {
        console.log(
          `  [${i + 1}/${awardList.length}] ${award.name}: keine Daten gefunden (übersprungen)`
        );
        totalStats.skipped++;
        continue;
      }

      console.log(
        `  [${i + 1}/${awardList.length}] ${award.name}: ${award.editions.length} Jahrgänge, ${recipientCount} Einträge`
      );

      const stats = await importAward(award);
      totalStats.awards++;
      totalStats.editions += stats.editions;
      totalStats.recipients += stats.recipients;
      totalStats.bookMatches += stats.bookMatches;
      totalStats.personCreated += stats.personCreated;
    } catch (err: any) {
      totalStats.errors++;
      console.error(`  [${i + 1}/${awardList.length}] ERROR ${awardInfo.name}: ${err.message}`);
    }

    if (i % 10 === 9) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log("\n=== Import Complete ===");
  console.log(`Awards imported:     ${totalStats.awards}`);
  console.log(`Awards skipped:      ${totalStats.skipped}`);
  console.log(`Editions created:    ${totalStats.editions}`);
  console.log(`Recipients added:    ${totalStats.recipients}`);
  console.log(`  - Book matches:    ${totalStats.bookMatches}`);
  console.log(`  - Person entries:  ${totalStats.personCreated}`);
  console.log(`Errors:              ${totalStats.errors}`);

  const awardCount = await query("SELECT count(*) FROM awards");
  const editionCount = await query("SELECT count(*) FROM award_editions");
  const recipientCount = await query("SELECT count(*) FROM award_recipients");
  const personCount = await query("SELECT count(*) FROM persons");

  console.log("\n=== Database Totals ===");
  console.log(`Awards:      ${awardCount.rows[0].count}`);
  console.log(`Editions:    ${editionCount.rows[0].count}`);
  console.log(`Recipients:  ${recipientCount.rows[0].count}`);
  console.log(`Persons:     ${personCount.rows[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  pool.end();
  process.exit(1);
});
