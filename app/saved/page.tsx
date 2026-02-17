"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deleteSavedSession, listSavedSessions, type SavedSession } from "@/lib/savedSessions";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function SavedSessionsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      try {
        const next = await listSavedSessions();
        if (!active) return;
        setSessions(next);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load saved sessions.";
        setError(message);
      } finally {
        if (active) setIsHydrated(true);
      }
    };

    void loadSessions();

    return () => {
      active = false;
    };
  }, []);

  const hasSessions = useMemo(() => sessions.length > 0, [sessions.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved Stems</h1>
            <p className="text-sm text-white/60">Open a saved set and load it back into the player.</p>
          </div>
          <Link
            href="/new"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            + Add New Stem
          </Link>
        </header>

        {!isHydrated ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-20 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
            <p className="text-lg font-medium text-white/70">Loading your collection...</p>
          </div>
        ) : !hasSessions ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 text-white/20">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">No saved stems yet</h2>
            <p className="mb-8 text-white/50">Your musical ideas will appear here once you save them.</p>
            <Link
              href="/new"
              className="inline-flex items-center rounded-xl bg-sky-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-sky-400 active:scale-95"
            >
              + Create Your First Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-sky-500/30 hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex-1">
                  <h2 className="mb-1 text-xl font-bold text-white group-hover:text-sky-400 transition leading-tight">
                    {session.title}
                  </h2>
                  <p className="text-sm font-medium text-white/60">
                    {session.artistName || "Unknown Artist"}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
                    <span>{session.stems.length} Stems</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <Link
                    href={`/new?sessionId=${session.id}`}
                    className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-sky-500 hover:text-slate-900"
                  >
                    Open Player
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this session?")) return;
                      try {
                        const next = await deleteSavedSession(session.id, session.source);
                        setSessions(next);
                        setError(null);
                      } catch (deleteError) {
                        const message =
                          deleteError instanceof Error
                            ? deleteError.message
                            : "Failed to delete saved session.";
                        setError(message);
                      }
                    }}
                    className="rounded-xl border border-white/10 p-2.5 text-white/40 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
                    title="Delete Session"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </div>
    </div>
  );
}
