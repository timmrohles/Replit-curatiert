import Parser from "rss-parser";
import OpenAI from "openai";
import { queryDB } from "../db";

const rssParser = new Parser({
  customFields: {
    item: [
      ["itunes:duration", "itunesDuration"],
      ["itunes:episode", "itunesEpisode"],
      ["enclosure", "enclosure"],
    ],
  },
});

const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
});

const AI_MODEL = "mistralai/mistral-small-3.1-24b-instruct";

function parseEpisodeNumber(title: string): number | null {
  const patterns = [
    /Folge\s+(\d+)/i,
    /#(\d+)/,
    /Episode\s+(\d+)/i,
    /Ep\.\s*(\d+)/i,
    /E(\d+)/i,
    /Ausgabe\s+(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function parseDuration(raw: string | undefined): number | null {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const parts = raw.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export async function addContentSource(
  userId: string,
  sourceType: string,
  feedUrl: string
) {
  try {
    console.log(`[PodcastExtractor] Adding content source for user ${userId}: ${feedUrl}`);

    let title = feedUrl;
    let websiteUrl: string | null = null;
    let imageUrl: string | null = null;
    let description: string | null = null;

    try {
      const feed = await rssParser.parseURL(feedUrl);
      title = feed.title || feedUrl;
      websiteUrl = feed.link || null;
      imageUrl = (feed as any).itunes?.image || (feed as any).image?.url || null;
      description = feed.description || null;
    } catch (e) {
      console.log(`[PodcastExtractor] Could not pre-fetch feed metadata: ${(e as Error).message}`);
    }

    const result = await queryDB(
      `INSERT INTO content_sources (user_id, source_type, title, feed_url, website_url, image_url, description, is_active, sync_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'weekly')
       RETURNING *`,
      [userId, sourceType, title, feedUrl, websiteUrl, imageUrl, description]
    );

    console.log(`[PodcastExtractor] Content source added with id ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    console.log(`[PodcastExtractor] Error adding content source: ${(error as Error).message}`);
    throw error;
  }
}

export async function getContentSources(userId: string) {
  try {
    const result = await queryDB(
      `SELECT * FROM content_sources WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.log(`[PodcastExtractor] Error getting content sources: ${(error as Error).message}`);
    throw error;
  }
}

export async function updateContentSource(
  id: number,
  updates: Partial<{
    title: string;
    feed_url: string;
    website_url: string;
    image_url: string;
    description: string;
    is_active: boolean;
    sync_frequency: string;
  }>
) {
  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await queryDB(
      `UPDATE content_sources SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    console.log(`[PodcastExtractor] Content source ${id} updated`);
    return result.rows[0] || null;
  } catch (error) {
    console.log(`[PodcastExtractor] Error updating content source: ${(error as Error).message}`);
    throw error;
  }
}

export async function deleteContentSource(id: number) {
  try {
    console.log(`[PodcastExtractor] Deleting content source ${id} with cascade`);

    await queryDB(
      `DELETE FROM extracted_books WHERE source_id = $1`,
      [id]
    );
    await queryDB(
      `DELETE FROM content_episodes WHERE source_id = $1`,
      [id]
    );
    await queryDB(
      `DELETE FROM content_sources WHERE id = $1`,
      [id]
    );

    console.log(`[PodcastExtractor] Content source ${id} deleted`);
    return true;
  } catch (error) {
    console.log(`[PodcastExtractor] Error deleting content source: ${(error as Error).message}`);
    throw error;
  }
}

export async function syncSource(sourceId: number) {
  try {
    console.log(`[PodcastExtractor] Syncing source ${sourceId}`);

    const sourceResult = await queryDB(
      `SELECT * FROM content_sources WHERE id = $1`,
      [sourceId]
    );
    if (sourceResult.rows.length === 0) {
      throw new Error(`Content source ${sourceId} not found`);
    }

    const source = sourceResult.rows[0];
    const feed = await rssParser.parseURL(source.feed_url);

    console.log(`[PodcastExtractor] Fetched ${feed.items?.length || 0} episodes from feed`);

    let newEpisodes = 0;
    let skipped = 0;

    for (const item of feed.items || []) {
      const guid = item.guid || item.link || item.title || "";
      if (!guid) {
        skipped++;
        continue;
      }

      const existing = await queryDB(
        `SELECT id FROM content_episodes WHERE source_id = $1 AND guid = $2`,
        [sourceId, guid]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      const episodeNumber = (item as any).itunesEpisode
        ? parseInt((item as any).itunesEpisode, 10)
        : parseEpisodeNumber(item.title || "");

      const audioUrl =
        (item as any).enclosure?.url ||
        (item as any).enclosures?.[0]?.url ||
        null;

      const durationSeconds = parseDuration((item as any).itunesDuration);

      const description = item.contentSnippet || item.content || (item as any)["content:encoded"] || "";

      await queryDB(
        `INSERT INTO content_episodes (source_id, title, episode_number, description, content_url, audio_url, published_at, duration_seconds, guid, is_processed, processing_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, 'pending')`,
        [
          sourceId,
          item.title || "Untitled",
          episodeNumber,
          description,
          item.link || null,
          audioUrl,
          item.pubDate ? new Date(item.pubDate) : null,
          durationSeconds,
          guid,
        ]
      );

      newEpisodes++;
    }

    await queryDB(
      `UPDATE content_sources SET last_synced_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [sourceId]
    );

    console.log(`[PodcastExtractor] Sync complete: ${newEpisodes} new, ${skipped} skipped`);
    return { newEpisodes, skipped, total: feed.items?.length || 0 };
  } catch (error) {
    console.log(`[PodcastExtractor] Error syncing source: ${(error as Error).message}`);
    throw error;
  }
}

export async function processEpisode(episodeId: number) {
  try {
    console.log(`[PodcastExtractor] Processing episode ${episodeId}`);

    const epResult = await queryDB(
      `SELECT * FROM content_episodes WHERE id = $1`,
      [episodeId]
    );
    if (epResult.rows.length === 0) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    const episode = epResult.rows[0];

    await queryDB(
      `UPDATE content_episodes SET processing_status = 'processing', updated_at = NOW() WHERE id = $1`,
      [episodeId]
    );

    const textToAnalyze = episode.description || episode.raw_text || "";
    if (!textToAnalyze.trim()) {
      await queryDB(
        `UPDATE content_episodes SET is_processed = true, processing_status = 'completed', processing_error = 'No text content available', updated_at = NOW() WHERE id = $1`,
        [episodeId]
      );
      console.log(`[PodcastExtractor] Episode ${episodeId} has no text content, skipping`);
      return { books: [] };
    }

    const prompt = `Du bist ein Experte für Buchempfehlungen und Literaturanalyse. Analysiere die folgenden Podcast-Shownotes bzw. Episodenbeschreibung und extrahiere alle erwähnten Bücher.

Für jedes Buch gib bitte folgende Informationen an:
- title: Der vollständige Buchtitel
- author: Der Autor/die Autorin
- isbn: Die ISBN-Nummer (falls in den Shownotes erwähnt, sonst null)
- sentiment: Die Stimmung der Empfehlung (very_positive, positive, neutral, negative, critical)
- recommendation_strength: Stärke der Empfehlung von 1-5 (5 = absolute Pflichtlektüre)
- host_quote: Ein bemerkenswertes Zitat oder eine Aussage über dieses Buch aus den Shownotes (falls vorhanden)
- context_note: Kurzer Kontext, wie das Buch besprochen wurde (z.B. "Hauptthema der Episode", "Kurze Erwähnung als Lesetipp", etc.)
- confidence: Wie sicher bist du, dass es sich tatsächlich um ein Buch handelt (0.0 bis 1.0)

Antworte ausschließlich im folgenden JSON-Format:
{
  "books": [
    {
      "title": "Buchtitel",
      "author": "Autor",
      "isbn": null,
      "sentiment": "positive",
      "recommendation_strength": 4,
      "host_quote": "Zitat über das Buch",
      "context_note": "Kontext der Besprechung",
      "confidence": 0.9
    }
  ]
}

Falls keine Bücher erwähnt werden, antworte mit: {"books": []}

Hier sind die Shownotes/Beschreibung:

Titel: ${episode.title}
${textToAnalyze}`;

    const response = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "";

    let extracted: { books: any[] } = { books: [] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.log(`[PodcastExtractor] Failed to parse AI response: ${(parseErr as Error).message}`);
      await queryDB(
        `UPDATE content_episodes SET is_processed = true, processing_status = 'error', processing_error = $2, updated_at = NOW() WHERE id = $1`,
        [episodeId, `JSON parse error: ${(parseErr as Error).message}`]
      );
      return { books: [] };
    }

    for (const book of extracted.books || []) {
      let coverUrl: string | null = null;
      try {
        coverUrl = await fetchCoverFromOpenLibrary(book.title || "", book.author || "");
      } catch {}
      await queryDB(
        `INSERT INTO extracted_books (episode_id, source_id, title, author, isbn, sentiment, recommendation_strength, host_quote, context_note, extraction_confidence, is_verified, is_visible, cover_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, true, $11)`,
        [
          episodeId,
          episode.source_id,
          book.title || "Unbekannt",
          book.author || "Unbekannt",
          book.isbn || null,
          book.sentiment || "neutral",
          book.recommendation_strength || 3,
          book.host_quote || null,
          book.context_note || null,
          book.confidence || 0.5,
          coverUrl,
        ]
      );
    }

    await queryDB(
      `UPDATE content_episodes SET is_processed = true, processing_status = 'completed', processing_error = NULL, updated_at = NOW() WHERE id = $1`,
      [episodeId]
    );

    console.log(`[PodcastExtractor] Episode ${episodeId} processed: ${extracted.books.length} books extracted`);
    return extracted;
  } catch (error) {
    console.log(`[PodcastExtractor] Error processing episode ${episodeId}: ${(error as Error).message}`);
    await queryDB(
      `UPDATE content_episodes SET processing_status = 'error', processing_error = $2, updated_at = NOW() WHERE id = $1`,
      [episodeId, (error as Error).message]
    ).catch(() => {});
    throw error;
  }
}

export async function syncAndProcessSource(sourceId: number) {
  try {
    console.log(`[PodcastExtractor] Starting sync and process for source ${sourceId}`);

    const syncResult = await syncSource(sourceId);

    const unprocessed = await queryDB(
      `SELECT id FROM content_episodes WHERE source_id = $1 AND is_processed = false ORDER BY published_at DESC`,
      [sourceId]
    );

    console.log(`[PodcastExtractor] Processing ${unprocessed.rows.length} unprocessed episodes`);

    let processed = 0;
    let errors = 0;

    for (const row of unprocessed.rows) {
      try {
        await processEpisode(row.id);
        processed++;
      } catch (err) {
        errors++;
        console.log(`[PodcastExtractor] Failed to process episode ${row.id}: ${(err as Error).message}`);
      }
    }

    console.log(`[PodcastExtractor] Sync and process complete: ${processed} processed, ${errors} errors`);
    return { ...syncResult, processed, errors };
  } catch (error) {
    console.log(`[PodcastExtractor] Error in syncAndProcessSource: ${(error as Error).message}`);
    throw error;
  }
}

export async function getEpisodesWithBooks(sourceId: number) {
  try {
    const episodes = await queryDB(
      `SELECT * FROM content_episodes WHERE source_id = $1 ORDER BY published_at DESC`,
      [sourceId]
    );

    const result = [];
    for (const ep of episodes.rows) {
      const books = await queryDB(
        `SELECT * FROM extracted_books WHERE episode_id = $1 ORDER BY recommendation_strength DESC`,
        [ep.id]
      );
      result.push({ ...ep, books: books.rows });
    }

    return result;
  } catch (error) {
    console.log(`[PodcastExtractor] Error getting episodes with books: ${(error as Error).message}`);
    throw error;
  }
}

export async function getExtractedBooksForUser(userId: string) {
  try {
    const result = await queryDB(
      `SELECT eb.*, ce.title AS episode_title, ce.published_at AS episode_published_at, cs.title AS source_title
       FROM extracted_books eb
       JOIN content_episodes ce ON eb.episode_id = ce.id
       JOIN content_sources cs ON eb.source_id = cs.id
       WHERE cs.user_id = $1
       ORDER BY eb.recommendation_strength DESC, eb.extraction_confidence DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.log(`[PodcastExtractor] Error getting extracted books for user: ${(error as Error).message}`);
    throw error;
  }
}

export async function matchBookToDatabase(title: string, author: string) {
  try {
    console.log(`[PodcastExtractor] Matching book: "${title}" by ${author}`);

    const result = await queryDB(
      `SELECT id, title, author, isbn13, cover_url
       FROM books
       WHERE LOWER(title) LIKE $1
       OR similarity(LOWER(title), LOWER($2)) > 0.3
       ORDER BY similarity(LOWER(title), LOWER($2)) DESC
       LIMIT 5`,
      [`%${title.toLowerCase()}%`, title]
    );

    if (result.rows.length === 0) {
      const fallback = await queryDB(
        `SELECT id, title, author, isbn13, cover_url
         FROM books
         WHERE LOWER(title) LIKE $1
         LIMIT 5`,
        [`%${title.toLowerCase().split(" ").slice(0, 3).join("%")}%`]
      );
      return fallback.rows;
    }

    return result.rows;
  } catch (error) {
    console.log(`[PodcastExtractor] Error matching book to database: ${(error as Error).message}`);
    try {
      const fallback = await queryDB(
        `SELECT id, title, author, isbn13, cover_url
         FROM books
         WHERE LOWER(title) LIKE $1
         LIMIT 5`,
        [`%${title.toLowerCase()}%`]
      );
      return fallback.rows;
    } catch {
      return [];
    }
  }
}

export async function verifyExtractedBook(bookId: number, verified: boolean) {
  try {
    const result = await queryDB(
      `UPDATE extracted_books SET is_verified = $2 WHERE id = $1 RETURNING *`,
      [bookId, verified]
    );
    console.log(`[PodcastExtractor] Book ${bookId} verification set to ${verified}`);
    return result.rows[0] || null;
  } catch (error) {
    console.log(`[PodcastExtractor] Error verifying book: ${(error as Error).message}`);
    throw error;
  }
}

export async function fetchCoverFromOpenLibrary(title: string, author: string): Promise<string | null> {
  try {
    const query = `${title} ${author}`.trim();
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3&fields=cover_i,title,author_name`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const docs = data.docs || [];
    for (const doc of docs) {
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function batchFetchCovers(limit = 50): Promise<{ updated: number; skipped: number; errors: number }> {
  let updated = 0, skipped = 0, errors = 0;
  try {
    const result = await queryDB(
      `SELECT id, title, author FROM extracted_books WHERE cover_url IS NULL AND is_visible = true ORDER BY id LIMIT $1`,
      [limit]
    );
    console.log(`[PodcastExtractor] Batch cover fetch: ${result.rows.length} books without covers`);
    for (const book of result.rows) {
      try {
        const coverUrl = await fetchCoverFromOpenLibrary(book.title, book.author);
        if (coverUrl) {
          await queryDB(`UPDATE extracted_books SET cover_url = $1 WHERE id = $2`, [coverUrl, book.id]);
          updated++;
        } else {
          await queryDB(`UPDATE extracted_books SET cover_url = '' WHERE id = $1`, [book.id]);
          skipped++;
        }
        await new Promise(r => setTimeout(r, 200));
      } catch {
        errors++;
      }
    }
    console.log(`[PodcastExtractor] Batch cover fetch complete: ${updated} updated, ${skipped} not found, ${errors} errors`);
    return { updated, skipped, errors };
  } catch (error) {
    console.log(`[PodcastExtractor] Batch cover fetch error: ${(error as Error).message}`);
    throw error;
  }
}

export async function toggleBookVisibility(bookId: number, visible: boolean) {
  try {
    const result = await queryDB(
      `UPDATE extracted_books SET is_visible = $2 WHERE id = $1 RETURNING *`,
      [bookId, visible]
    );
    console.log(`[PodcastExtractor] Book ${bookId} visibility set to ${visible}`);
    return result.rows[0] || null;
  } catch (error) {
    console.log(`[PodcastExtractor] Error toggling book visibility: ${(error as Error).message}`);
    throw error;
  }
}
