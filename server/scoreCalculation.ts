import { queryDB } from "./db";

interface AwardCounts {
  winner: number;
  shortlist: number;
  longlist: number;
}

interface ScoreContext {
  indieNames: string[];
  spPatterns: { pattern: string; match_type: string }[];
  awardMap: Record<number, AwardCounts>;
  mediaMap: Record<number, number>;
  curationMap: Record<number, number>;
}

async function loadScoreContext(): Promise<ScoreContext> {
  let indieNames: string[] = [];
  let spPatterns: { pattern: string; match_type: string }[] = [];
  try {
    const indieRes = await queryDB('SELECT name FROM indie_publishers');
    indieNames = (indieRes.rows || []).map((r: any) => r.name.toLowerCase());
    const spRes = await queryDB('SELECT pattern, match_type FROM selfpublisher_patterns');
    spPatterns = spRes.rows || [];
  } catch { /* tables may not exist */ }

  let awardMap: Record<number, AwardCounts> = {};
  try {
    const awardRes = await queryDB(
      `SELECT ar.book_id, ao.result_status, ao.title AS outcome_name
       FROM award_recipients ar
       JOIN award_outcomes ao ON ar.award_outcome_id = ao.id
       WHERE ar.book_id IS NOT NULL`
    );
    for (const row of awardRes.rows || []) {
      if (!row.book_id) continue;
      if (!awardMap[row.book_id]) awardMap[row.book_id] = { winner: 0, shortlist: 0, longlist: 0 };
      const status = (row.result_status || '').toLowerCase();
      if (status === 'winner' || status === 'gewinner' || status === 'special') awardMap[row.book_id].winner++;
      else if (status === 'shortlist' || status === 'finalist') awardMap[row.book_id].shortlist++;
      else if (status === 'longlist' || status === 'nominee') awardMap[row.book_id].longlist++;
    }
  } catch { /* award tables may not exist */ }

  let mediaMap: Record<number, number> = {};
  try {
    const mediaRes = await queryDB(
      `SELECT eb.matched_book_id AS book_id, COUNT(DISTINCT eb.episode_id) AS mention_count
       FROM extracted_books eb
       WHERE eb.matched_book_id IS NOT NULL AND eb.is_verified = true
       GROUP BY eb.matched_book_id`
    );
    for (const row of mediaRes.rows || []) {
      mediaMap[row.book_id] = parseInt(row.mention_count) || 0;
    }
  } catch { /* table may not exist */ }

  let curationMap: Record<number, number> = {};
  try {
    const curationRes = await queryDB(
      `SELECT cb.book_id, COUNT(DISTINCT cb.curation_id) AS curation_count
       FROM curation_books cb
       GROUP BY cb.book_id`
    );
    for (const row of curationRes.rows || []) {
      curationMap[row.book_id] = parseInt(row.curation_count) || 0;
    }
  } catch { /* table may not exist */ }

  return { indieNames, spPatterns, awardMap, mediaMap, curationMap };
}

function calculateBookScores(book: { id: number; author: string; publisher: string }, ctx: ScoreContext) {
  const awards = ctx.awardMap[book.id] || { winner: 0, shortlist: 0, longlist: 0 };
  const rawAward = awards.winner * 10 + awards.shortlist * 6 + awards.longlist * 4;
  const awardScore = Math.min(rawAward, 20);

  const mediaMentions = ctx.mediaMap[book.id] || 0;
  const mediaScore = Math.min(mediaMentions * 3, 9);

  const curationCount = ctx.curationMap[book.id] || 0;
  const curationScore = Math.min(curationCount * 2, 10);

  const publisherLower = (book.publisher || '').toLowerCase();
  const authorLower = (book.author || '').toLowerCase();
  const isIndieVerlag = ctx.indieNames.some(name => publisherLower === name);
  const isSelfPublisher = ctx.spPatterns.some((sp) => {
    if (sp.match_type === 'exact') return publisherLower === sp.pattern.toLowerCase();
    return publisherLower.includes(sp.pattern.toLowerCase());
  });
  const isAuthorPublisher = authorLower && publisherLower && (
    authorLower === publisherLower || publisherLower.includes(authorLower) || authorLower.includes(publisherLower)
  );

  let structureBonus = 0;
  if (isIndieVerlag) structureBonus += 2;
  if (isSelfPublisher || isAuthorPublisher) structureBonus += 1;

  const baseScore = awardScore + mediaScore + curationScore + structureBonus;
  const totalScore = baseScore;
  const awardCount = awards.winner + awards.shortlist + awards.longlist;
  const nominationCount = awards.shortlist + awards.longlist;
  const indieType = isIndieVerlag ? 'indie' : (isSelfPublisher || isAuthorPublisher) ? 'selfpublishing' : null;
  const isIndie = isIndieVerlag || isSelfPublisher || isAuthorPublisher;
  const isHiddenGem = baseScore >= 5 && curationCount <= 1 && mediaMentions <= 1;

  return {
    awardScore, mediaScore, curationScore, structureBonus,
    baseScore, totalScore, awardCount, nominationCount,
    isIndie, indieType, isHiddenGem,
  };
}

const INDIE_TAG_ID = 38;

async function updateBookScore(bookId: number, scores: ReturnType<typeof calculateBookScores>) {
  await queryDB(
    `UPDATE books SET award_score = $1, media_score = $2, curation_score = $3,
     structure_bonus = $4, base_score = $5, total_score = $6,
     award_count = $7, nomination_count = $8, is_indie = $9, indie_type = $10, is_hidden_gem = $11
     WHERE id = $12`,
    [scores.awardScore, scores.mediaScore, scores.curationScore, scores.structureBonus,
     scores.baseScore, scores.totalScore, scores.awardCount, scores.nominationCount,
     Boolean(scores.isIndie), scores.indieType || null, Boolean(scores.isHiddenGem), bookId]
  );

  try {
    if (scores.isIndie) {
      await queryDB(
        `INSERT INTO book_tags (book_id, tag_id, origin) VALUES ($1, $2, 'derived') ON CONFLICT (book_id, tag_id) DO NOTHING`,
        [bookId, INDIE_TAG_ID]
      );
    } else {
      await queryDB(
        `DELETE FROM book_tags WHERE book_id = $1 AND tag_id = $2 AND origin = 'derived'`,
        [bookId, INDIE_TAG_ID]
      );
    }
  } catch { /* book_tags table may not exist yet */ }
}

export async function recalculateAllScores(): Promise<number> {
  const ctx = await loadScoreContext();
  const allBooks = await queryDB(`SELECT id, author, publisher FROM books WHERE deleted_at IS NULL`);
  const books = allBooks.rows || [];
  if (books.length === 0) return 0;

  let updated = 0;
  const BATCH_SIZE = 10;
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (book: any) => {
      const scores = calculateBookScores(book, ctx);
      await updateBookScore(book.id, scores);
      updated++;
    }));
    if (i + BATCH_SIZE < books.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log(`[Scores] Recalculated scores for ${updated} books`);
  return updated;
}

export async function recalculateSingleBookScore(bookId: number): Promise<void> {
  const bookRes = await queryDB(`SELECT id, author, publisher FROM books WHERE id = $1 AND deleted_at IS NULL`, [bookId]);
  const book = bookRes.rows[0];
  if (!book) return;

  const ctx = await loadScoreContext();
  const scores = calculateBookScores(book, ctx);
  await updateBookScore(bookId, scores);
  console.log(`[Scores] Recalculated score for book ${bookId}: base=${scores.baseScore}, award=${scores.awardScore}`);
}

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startScoreCron(intervalMs: number = 24 * 60 * 60 * 1000) {
  if (cronInterval) clearInterval(cronInterval);

  console.log(`[Scores] Cron scheduled: full recalculation every ${Math.round(intervalMs / 3600000)}h`);

  console.log(`[Scores] Skipping initial recalculation on startup to prevent overload`);

  cronInterval = setInterval(async () => {
    try {
      const count = await recalculateAllScores();
      console.log(`[Scores] Cron recalculation complete: ${count} books updated`);
    } catch (err) {
      console.error('[Scores] Cron recalculation failed:', err);
    }
  }, intervalMs);
}

export function stopScoreCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}
