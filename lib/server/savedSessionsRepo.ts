import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { SavedSession, SavedStem } from "@/lib/savedSessions";
import { ensureDb, getPool } from "@/lib/server/db";

type SavedSessionRow = {
  id: string;
  title: string;
  artist_name: string | null;
  stems: SavedStem[];
  created_at: Date | string;
  updated_at: Date | string;
};

const mapRowToSession = (row: SavedSessionRow): SavedSession => ({
  id: row.id,
  title: row.title,
  artistName: row.artist_name ?? undefined,
  stems: row.stems,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

const hasDatabaseConnection = () =>
  Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL);

const localStorePath = path.join(process.cwd(), ".data", "saved-sessions.json");

const readLocalSessions = async (): Promise<SavedSession[]> => {
  try {
    const content = await fs.readFile(localStorePath, "utf8");
    const parsed = JSON.parse(content) as SavedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw error;
  }
};

const writeLocalSessions = async (sessions: SavedSession[]): Promise<void> => {
  await fs.mkdir(path.dirname(localStorePath), { recursive: true });
  await fs.writeFile(localStorePath, JSON.stringify(sessions, null, 2), "utf8");
};

export const listSavedSessionsFromDb = async (): Promise<SavedSession[]> => {
  if (!hasDatabaseConnection()) {
    const sessions = await readLocalSessions();
    return sessions.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  await ensureDb();
  const pool = getPool();
  const result = await pool.query<SavedSessionRow>(
    "SELECT id, title, artist_name, stems, created_at, updated_at FROM saved_sessions ORDER BY created_at DESC",
  );
  return result.rows.map(mapRowToSession);
};

export const getSavedSessionByIdFromDb = async (id: string): Promise<SavedSession | null> => {
  if (!hasDatabaseConnection()) {
    const sessions = await readLocalSessions();
    return sessions.find((session) => session.id === id) || null;
  }

  await ensureDb();
  const pool = getPool();
  const result = await pool.query<SavedSessionRow>(
    "SELECT id, title, artist_name, stems, created_at, updated_at FROM saved_sessions WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0] ? mapRowToSession(result.rows[0]) : null;
};

export const createSavedSessionInDb = async (input: {
  title: string;
  artistName?: string;
  stems: SavedStem[];
}): Promise<SavedSession> => {
  if (!hasDatabaseConnection()) {
    const now = new Date().toISOString();
    const session: SavedSession = {
      id: randomUUID(),
      title: input.title,
      artistName: input.artistName,
      stems: input.stems,
      createdAt: now,
      updatedAt: now,
    };
    const sessions = await readLocalSessions();
    sessions.unshift(session);
    await writeLocalSessions(sessions);
    return session;
  }

  await ensureDb();
  const pool = getPool();
  const id = randomUUID();
  const result = await pool.query<SavedSessionRow>(
    `
      INSERT INTO saved_sessions (id, title, artist_name, stems)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, title, artist_name, stems, created_at, updated_at
    `,
    [id, input.title, input.artistName ?? null, JSON.stringify(input.stems)],
  );
  return mapRowToSession(result.rows[0]);
};

export const deleteSavedSessionInDb = async (id: string): Promise<void> => {
  if (!hasDatabaseConnection()) {
    const sessions = await readLocalSessions();
    await writeLocalSessions(sessions.filter((session) => session.id !== id));
    return;
  }

  await ensureDb();
  const pool = getPool();
  await pool.query("DELETE FROM saved_sessions WHERE id = $1", [id]);
};
