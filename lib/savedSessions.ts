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
  source?: "local" | "remote";
};

const STORAGE_KEY = "stem_player_saved_sessions";
const REMOTE_BASE_URL =
  process.env.NEXT_PUBLIC_REMOTE_SAVED_ORIGIN || "https://stem-player.netlify.app";

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

const listRemoteSessions = async (): Promise<SavedSession[]> => {
  try {
    const response = await fetch(`${REMOTE_BASE_URL}/api/sessions`, { method: "GET" });
    if (!response.ok) return [];
    const payload = (await response.json()) as { sessions?: SavedSession[] };
    return (payload.sessions || []).map((session) => ({ ...session, source: "remote" as const }));
  } catch {
    return [];
  }
};

const getRemoteSessionById = async (id: string): Promise<SavedSession | null> => {
  try {
    const response = await fetch(`${REMOTE_BASE_URL}/api/sessions/${id}`, { method: "GET" });
    if (response.status === 404) return null;
    if (!response.ok) return null;
    const payload = (await response.json()) as { session?: SavedSession };
    return payload.session ? { ...payload.session, source: "remote" as const } : null;
  } catch {
    return null;
  }
};

const mergeSessions = (sessions: SavedSession[]) => {
  const byId = new Map<string, SavedSession>();
  for (const session of sessions) {
    const existing = byId.get(session.id);
    if (!existing) {
      byId.set(session.id, session);
      continue;
    }
    if (Date.parse(session.updatedAt) > Date.parse(existing.updatedAt)) {
      byId.set(session.id, session);
    }
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

export const listSavedSessions = async (): Promise<SavedSession[]> => {
  const localSessions = readSessions().map((session) => ({ ...session, source: "local" as const }));
  const remoteSessions = await listRemoteSessions();
  return mergeSessions([...localSessions, ...remoteSessions]);
};

export const getSavedSessionById = async (id: string) => {
  const local = readSessions().find((session) => session.id === id);
  if (local) return { ...local, source: "local" as const };
  return getRemoteSessionById(id);
};

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
  return { ...next, source: "local" as const };
};

export const deleteSavedSession = async (id: string, source?: "local" | "remote") => {
  if (source && source !== "local") {
    throw new Error("Remote sessions cannot be deleted from this app.");
  }

  const sessions = readSessions().filter((session) => session.id !== id);
  writeSessions(sessions);

  return sessions.map((session) => ({ ...session, source: "local" as const }));
};
