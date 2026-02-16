import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __stemPlayerDbPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __stemPlayerDbInitPromise: Promise<void> | undefined;
}

const getConnectionString = () => process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

const getPool = () => {
  if (globalThis.__stemPlayerDbPool) return globalThis.__stemPlayerDbPool;
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL or NETLIFY_DATABASE_URL environment variable.");
  }
  globalThis.__stemPlayerDbPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  return globalThis.__stemPlayerDbPool;
};

const initDb = async () => {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist_name TEXT,
      stems JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

export const ensureDb = () => {
  if (!globalThis.__stemPlayerDbInitPromise) {
    globalThis.__stemPlayerDbInitPromise = initDb();
  }
  return globalThis.__stemPlayerDbInitPromise;
};

export { getPool };
