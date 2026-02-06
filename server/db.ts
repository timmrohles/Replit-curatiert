import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

export async function queryDB(text: string, params: unknown[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    const sanitizedRows = result.rows.map((row: any) => {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(row)) {
        sanitized[key] = typeof value === "bigint" ? Number(value) : value;
      }
      return sanitized;
    });
    return { rows: sanitizedRows, rowCount: result.rowCount };
  } catch (error: any) {
    console.error("[DB] Query error:", error.message, "Query:", text.substring(0, 200));
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

export { pool };
