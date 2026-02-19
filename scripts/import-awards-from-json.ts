import { Pool, PoolClient } from "pg";
import * as fs from "fs";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeAuthorName(name: string): string {
  name = name.trim();
  if (name.includes(",")) {
    const parts = name.split(",").map((p) => p.trim());
    if (parts.length === 2 && parts[1].length > 0) return `${parts[1]} ${parts[0]}`;
  }
  return name;
}

function mapOutcomeLevel(level: string): { name: string; order: number; status: string } {
  const l = level.toLowerCase().trim();
  if (l.includes("hauptpreis") || l.includes("gewinner") || l.includes("preisträger") || l.includes("preisträgerin") || l === "preis" || l === "roman") return { name: "Gewinner", order: 1, status: "winner" };
  if (l.includes("finalist") || l.includes("shortlist")) return { name: "Shortlist", order: 2, status: "shortlisted" };
  if (l.includes("longlist")) return { name: "Longlist", order: 3, status: "longlisted" };
  if (l.includes("nominier") || l.includes("auswahl")) return { name: "Nominierung", order: 4, status: "nominated" };
  if (l.includes("erstlingsroman") || l.includes("debüt")) return { name: "Debütpreis", order: 5, status: "winner" };
  if (l.includes("kurzgeschichte") || l.includes("erzählung")) return { name: "Kurzgeschichte", order: 6, status: "winner" };
  if (l.includes("kinder") || l.includes("jugend")) return { name: "Kinder-/Jugendbuch", order: 7, status: "winner" };
  if (l.includes("sachbuch")) return { name: "Sachbuch", order: 8, status: "winner" };
  return { name: level || "Gewinner", order: 1, status: "winner" };
}

const bookIndex = new Map<string, number>();
const personCache = new Map<string, number>();

async function buildBookIndex() {
  const cacheFile = "/tmp/book_index.json";
  if (fs.existsSync(cacheFile)) {
    const data = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    for (const [k, v] of Object.entries(data)) bookIndex.set(k, v as number);
    console.log(`Book index loaded from cache: ${bookIndex.size} entries`);
    return;
  }

  console.log("Building book index from DB...");
  const client = await pool.connect();
  try {
    let offset = 0;
    const batchSize = 50000;
    while (true) {
      const res = await client.query(
        `SELECT id, LOWER(title) as title, LOWER(author) as author FROM books ORDER BY id LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );
      if (res.rows.length === 0) break;
      for (const row of res.rows) {
        if (row.title && row.author) {
          bookIndex.set(`${row.title}|||${row.author}`, row.id);
          const parts = row.author.split(/\s+/);
          if (parts.length > 1) {
            const lastName = parts[parts.length - 1];
            const altKey = `${row.title}|||${lastName}`;
            if (!bookIndex.has(altKey)) bookIndex.set(altKey, row.id);
          }
        }
      }
      offset += res.rows.length;
      process.stdout.write(`  ${offset} books processed\r`);
    }
    console.log(`Book index built: ${bookIndex.size} entries`);

    const cacheData: Record<string, number> = {};
    bookIndex.forEach((v, k) => { cacheData[k] = v; });
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData));
    console.log("Index cached to /tmp/book_index.json");
  } finally {
    client.release();
  }
}

function findBook(title: string, author: string): number | null {
  const normalizedAuthor = normalizeAuthorName(author).toLowerCase();
  const titleLower = title.trim().toLowerCase();
  const exact = bookIndex.get(`${titleLower}|||${normalizedAuthor}`);
  if (exact) return exact;
  const parts = normalizedAuthor.split(/\s+/);
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return bookIndex.get(`${titleLower}|||${lastName}`) || null;
}

async function loadPersons() {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT id, LOWER(name) as name, slug FROM persons`);
    for (const row of res.rows) {
      if (row.name) personCache.set(row.name, row.id);
      if (row.slug) personCache.set(`s:${row.slug}`, row.id);
    }
    console.log(`Loaded ${res.rows.length} persons`);
  } finally {
    client.release();
  }
}

async function getOrCreatePerson(client: PoolClient, name: string): Promise<number> {
  const normalized = normalizeAuthorName(name);
  const slug = slugify(normalized);
  const key = normalized.toLowerCase();
  if (personCache.has(key)) return personCache.get(key)!;
  if (personCache.has(`s:${slug}`)) return personCache.get(`s:${slug}`)!;

  const ins = await client.query(
    `INSERT INTO persons (name, slug, status, visibility, created_at, updated_at)
     VALUES ($1, $2, 'active', 'visible', NOW(), NOW())
     ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [normalized, slug]
  );
  personCache.set(key, ins.rows[0].id);
  personCache.set(`s:${slug}`, ins.rows[0].id);
  return ins.rows[0].id;
}

async function importAward(award: any) {
  const stats = { editions: 0, recipients: 0, bookMatches: 0 };
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let awardRes = await client.query(`SELECT id FROM awards WHERE slug = $1 LIMIT 1`, [award.slug]);
    let awardId: number;
    if (awardRes.rows.length > 0) {
      awardId = awardRes.rows[0].id;
      await client.query(`UPDATE awards SET description = COALESCE(NULLIF($1, ''), description), website_url = $2, updated_at = NOW() WHERE id = $3`, [award.description, award.url, awardId]);
    } else {
      const ins = await client.query(
        `INSERT INTO awards (name, slug, website_url, description, country, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [award.name, award.slug, award.url, award.description, award.category.includes("International") ? "International" : "Deutschland"]
      );
      awardId = ins.rows[0].id;
    }

    for (const edition of award.editions) {
      let edRes = await client.query(`SELECT id FROM award_editions WHERE award_id = $1 AND year = $2 LIMIT 1`, [awardId, edition.year]);
      let editionId: number;
      if (edRes.rows.length > 0) {
        editionId = edRes.rows[0].id;
      } else {
        const ins = await client.query(`INSERT INTO award_editions (award_id, year, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id`, [awardId, edition.year]);
        editionId = ins.rows[0].id;
        stats.editions++;
      }

      for (const outcome of edition.outcomes) {
        const mapped = mapOutcomeLevel(outcome.level);
        let outRes = await client.query(`SELECT id FROM award_outcomes WHERE award_edition_id = $1 AND title = $2 LIMIT 1`, [editionId, mapped.name]);
        let outcomeId: number;
        if (outRes.rows.length > 0) {
          outcomeId = outRes.rows[0].id;
        } else {
          const ins = await client.query(
            `INSERT INTO award_outcomes (award_edition_id, outcome_type, title, sort_order, result_status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
            [editionId, mapped.status, mapped.name, mapped.order, mapped.status]
          );
          outcomeId = ins.rows[0].id;
        }

        for (const r of outcome.recipients) {
          const hasTitle = r.title && r.title.length > 1 && r.title !== r.author;
          let bookId: number | null = null;
          if (hasTitle) {
            bookId = findBook(r.title, r.author);
            if (bookId) stats.bookMatches++;
          }

          const personId = await getOrCreatePerson(client, r.author);
          const er = await client.query(`SELECT id FROM award_recipients WHERE award_outcome_id = $1 AND person_id = $2 LIMIT 1`, [outcomeId, personId]);
          if (er.rows.length === 0) {
            await client.query(
              `INSERT INTO award_recipients (award_outcome_id, recipient_kind, book_id, person_id, notes, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
              [outcomeId, bookId ? "book" : "person", bookId, personId, hasTitle && !bookId ? `Buch: "${r.title}"` : null]
            );
            stats.recipients++;
          }
        }
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return stats;
}

async function main() {
  const startArg = parseInt(process.argv[2] || "0");
  const endArg = parseInt(process.argv[3] || "999");

  console.log(`=== Import Awards (range: ${startArg}-${endArg}) ===`);

  await buildBookIndex();
  await loadPersons();

  const data = JSON.parse(fs.readFileSync("scripts/awards-data.json", "utf8"));
  const awards = data.slice(startArg, endArg);
  console.log(`\nProcessing ${awards.length} awards...\n`);

  const totals = { awards: 0, editions: 0, recipients: 0, bookMatches: 0, errors: 0, skipped: 0 };

  for (let i = 0; i < awards.length; i++) {
    const award = awards[i];
    if (!award.editions || award.editions.length === 0) { totals.skipped++; continue; }

    try {
      const stats = await importAward(award);
      const rc = award.editions.reduce((s: number, e: any) => s + e.outcomes.reduce((s2: number, o: any) => s2 + o.recipients.length, 0), 0);
      console.log(`  [${startArg + i + 1}] ${award.name}: ${award.editions.length}y ${rc}r → +${stats.recipients} ${stats.bookMatches}m`);
      totals.awards++;
      totals.editions += stats.editions;
      totals.recipients += stats.recipients;
      totals.bookMatches += stats.bookMatches;
    } catch (err: any) {
      totals.errors++;
      console.error(`  [${startArg + i + 1}] ERR ${award.name}: ${err.message}`);
    }
  }

  console.log(`\n=== Done === A:${totals.awards} E:+${totals.editions} R:+${totals.recipients} M:${totals.bookMatches} Err:${totals.errors}`);

  const c = await Promise.all([
    pool.query("SELECT count(*) FROM awards"),
    pool.query("SELECT count(*) FROM award_editions"),
    pool.query("SELECT count(*) FROM award_recipients"),
    pool.query("SELECT count(*) FROM persons"),
  ]);
  console.log(`DB: ${c[0].rows[0].count} awards, ${c[1].rows[0].count} editions, ${c[2].rows[0].count} recipients, ${c[3].rows[0].count} persons`);
  await pool.end();
}

main().catch((err) => { console.error("Fatal:", err); pool.end(); process.exit(1); });
