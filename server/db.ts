import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  min: 4,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

export const db = drizzle(pool, { schema });

export async function queryDB(text: string, params: unknown[] = []) {
  const start = performance.now();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    const duration = performance.now() - start;
    if (duration > 300) {
      console.warn(`[SLOW QUERY] ${duration.toFixed(0)}ms | ${text.substring(0, 120)}`);
    }
    const sanitizedRows = result.rows.map((row: any) => {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(row)) {
        sanitized[key] = typeof value === "bigint" ? Number(value) : value;
      }
      return sanitized;
    });
    return { rows: sanitizedRows, rowCount: result.rowCount, _durationMs: duration };
  } catch (error: any) {
    const duration = performance.now() - start;
    console.error("[DB] Query error:", error.message, `(${duration.toFixed(0)}ms)`, "Query:", text.substring(0, 200));
    throw error;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await queryDB("SELECT 1");
    console.log("[DB] Connected to Neon PostgreSQL");
    return true;
  } catch (error: any) {
    console.error("[DB] Connection test failed:", error.message);
    return false;
  }
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export async function cachedQuery<T = any>(
  key: string,
  queryFn: () => Promise<{ rows: T[] }>,
  ttlMs: number = 300000
): Promise<T[]> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  const result = await queryFn();
  const data = result.rows || [];
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) cache.delete(key);
  }
}

export { pool };
