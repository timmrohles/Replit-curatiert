import { Pool } from "pg";
import * as fs from "fs";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
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

async function main() {
  const startIdx = parseInt(process.argv[2] || "0");
  const endIdx = parseInt(process.argv[3] || "999");
  console.log(`=== Import Awards ${startIdx}-${endIdx} ===`);

  // Load book index from cache
  const bookIndex = new Map<string, number>();
  if (fs.existsSync("/tmp/book_index.json")) {
    const data = JSON.parse(fs.readFileSync("/tmp/book_index.json", "utf8"));
    for (const [k, v] of Object.entries(data)) bookIndex.set(k, v as number);
    console.log(`Book index: ${bookIndex.size} entries (from cache)`);
  } else {
    console.log("No book index cache found. Run import-awards-from-json.ts first to build it.");
    process.exit(1);
  }

  function findBook(title: string, author: string): number | null {
    const a = normalizeAuthorName(author).toLowerCase();
    const t = title.trim().toLowerCase();
    const exact = bookIndex.get(`${t}|||${a}`);
    if (exact) return exact;
    const parts = a.split(/\s+/);
    const ln = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    return bookIndex.get(`${t}|||${ln}`) || null;
  }

  // Load existing data to skip duplicates
  const client = await pool.connect();
  
  const existingAwards = new Map<string, number>();
  const aRes = await client.query(`SELECT id, slug FROM awards`);
  aRes.rows.forEach((r: any) => existingAwards.set(r.slug, r.id));
  
  const existingEditions = new Map<string, number>();
  const eRes = await client.query(`SELECT id, award_id, year FROM award_editions`);
  eRes.rows.forEach((r: any) => existingEditions.set(`${r.award_id}:${r.year}`, r.id));

  const existingOutcomes = new Map<string, number>();
  const oRes = await client.query(`SELECT id, award_edition_id, title FROM award_outcomes`);
  oRes.rows.forEach((r: any) => existingOutcomes.set(`${r.award_edition_id}:${r.title}`, r.id));

  const existingRecipients = new Set<string>();
  const rRes = await client.query(`SELECT award_outcome_id, person_id FROM award_recipients`);
  rRes.rows.forEach((r: any) => existingRecipients.add(`${r.award_outcome_id}:${r.person_id}`));

  const personByName = new Map<string, number>();
  const personBySlug = new Map<string, number>();
  const pRes = await client.query(`SELECT id, name, slug FROM persons`);
  pRes.rows.forEach((r: any) => {
    if (r.name) personByName.set(r.name.toLowerCase(), r.id);
    if (r.slug) personBySlug.set(r.slug, r.id);
  });

  console.log(`Existing: ${existingAwards.size} awards, ${existingEditions.size} editions, ${existingOutcomes.size} outcomes, ${existingRecipients.size} recipients, ${personByName.size} persons`);

  const data = JSON.parse(fs.readFileSync("scripts/awards-data.json", "utf8"));
  const awards = data.slice(startIdx, endIdx);
  console.log(`\nProcessing ${awards.length} awards...\n`);

  const totals = { awards: 0, editions: 0, outcomes: 0, recipients: 0, bookMatches: 0, persons: 0, errors: 0 };

  for (let i = 0; i < awards.length; i++) {
    const award = awards[i];
    if (!award.editions?.length) continue;

    try {
      await client.query("BEGIN");

      let awardId = existingAwards.get(award.slug);
      if (!awardId) {
        const ins = await client.query(
          `INSERT INTO awards (name, slug, description, country, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING id`,
          [award.name, award.slug, award.description, award.category.includes("International") ? "International" : "Deutschland"]
        );
        awardId = ins.rows[0].id;
        existingAwards.set(award.slug, awardId);
      }

      let awardRecipients = 0;
      let awardMatches = 0;

      for (const edition of award.editions) {
        const edKey = `${awardId}:${edition.year}`;
        let editionId = existingEditions.get(edKey);
        if (!editionId) {
          const ins = await client.query(
            `INSERT INTO award_editions (award_id, year, created_at, updated_at) VALUES ($1,$2,NOW(),NOW()) RETURNING id`,
            [awardId, edition.year]
          );
          editionId = ins.rows[0].id;
          existingEditions.set(edKey, editionId);
          totals.editions++;
        }

        for (const outcome of edition.outcomes) {
          const mapped = mapOutcomeLevel(outcome.level);
          const outKey = `${editionId}:${mapped.name}`;
          let outcomeId = existingOutcomes.get(outKey);
          if (!outcomeId) {
            const ins = await client.query(
              `INSERT INTO award_outcomes (award_edition_id, outcome_type, title, sort_order, result_status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING id`,
              [editionId, mapped.status, mapped.name, mapped.order, mapped.status]
            );
            outcomeId = ins.rows[0].id;
            existingOutcomes.set(outKey, outcomeId);
            totals.outcomes++;
          }

          for (const r of outcome.recipients) {
            const hasTitle = r.title && r.title.length > 1 && r.title !== r.author;
            let bookId: number | null = null;
            if (hasTitle) {
              bookId = findBook(r.title, r.author);
              if (bookId) { awardMatches++; totals.bookMatches++; }
            }

            const normalized = normalizeAuthorName(r.author);
            const slug = slugify(normalized);
            let personId = personByName.get(normalized.toLowerCase()) || personBySlug.get(slug);
            if (!personId) {
              const ins = await client.query(
                `INSERT INTO persons (name, slug, status, visibility, created_at, updated_at) VALUES ($1,$2,'active','visible',NOW(),NOW()) ON CONFLICT (slug) DO UPDATE SET updated_at=NOW() RETURNING id`,
                [normalized, slug]
              );
              personId = ins.rows[0].id;
              personByName.set(normalized.toLowerCase(), personId);
              personBySlug.set(slug, personId);
              totals.persons++;
            }

            const recKey = `${outcomeId}:${personId}`;
            if (!existingRecipients.has(recKey)) {
              await client.query(
                `INSERT INTO award_recipients (award_outcome_id, recipient_kind, book_id, person_id, notes, created_at) VALUES ($1,$2,$3,$4,$5,NOW())`,
                [outcomeId, bookId ? "book" : "person", bookId, personId, hasTitle && !bookId ? `Buch: "${r.title}"` : null]
              );
              existingRecipients.add(recKey);
              awardRecipients++;
              totals.recipients++;
            }
          }
        }
      }

      await client.query("COMMIT");
      const rc = award.editions.reduce((s: number, e: any) => s + e.outcomes.reduce((s2: number, o: any) => s2 + o.recipients.length, 0), 0);
      console.log(`  [${startIdx + i + 1}] ${award.name}: ${award.editions.length}y ${rc}r → +${awardRecipients} ${awardMatches}m`);
      totals.awards++;
    } catch (err: any) {
      await client.query("ROLLBACK");
      totals.errors++;
      console.error(`  [${startIdx + i + 1}] ERR ${award.name}: ${err.message}`);
    }
  }

  client.release();

  console.log(`\n=== Done ===`);
  console.log(`Awards: ${totals.awards}, Editions: +${totals.editions}, Outcomes: +${totals.outcomes}`);
  console.log(`Recipients: +${totals.recipients}, Book matches: ${totals.bookMatches}, New persons: ${totals.persons}`);
  console.log(`Errors: ${totals.errors}`);

  const c = await Promise.all([
    pool.query("SELECT count(*) FROM awards"),
    pool.query("SELECT count(*) FROM award_editions"),
    pool.query("SELECT count(*) FROM award_recipients"),
    pool.query("SELECT count(*) FROM persons"),
  ]);
  console.log(`\nDB: ${c[0].rows[0].count} awards, ${c[1].rows[0].count} editions, ${c[2].rows[0].count} recipients, ${c[3].rows[0].count} persons`);
  await pool.end();
}

main().catch((err) => { console.error("Fatal:", err); pool.end(); process.exit(1); });
