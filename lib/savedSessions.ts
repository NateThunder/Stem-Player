export type SavedStem = {
  name: string;
  fileUrl: string;
  color?: string;
};

export type SavedSession = {
  id: string;
  title: string;
  artistName?: string;
  stems: SavedStem[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "stem_player_saved_sessions";

const canUseStorage = () => typeof window !== "undefined";

const readSessions = (): SavedSession[] => {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSessions = (sessions: SavedSession[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const listSavedSessions = () => readSessions();

export const getSavedSessionById = (id: string) =>
  readSessions().find((session) => session.id === id) ?? null;

export const saveSession = (input: Omit<SavedSession, "id" | "createdAt" | "updatedAt">) => {
  const sessions = readSessions();
  const now = new Date().toISOString();
  const next: SavedSession = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
  writeSessions([next, ...sessions]);
  return next;
};

export const deleteSavedSession = (id: string) => {
  const sessions = readSessions().filter((session) => session.id !== id);
  writeSessions(sessions);
  return sessions;
};
