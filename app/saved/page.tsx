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
    <div className="min-h-screen bg-[#0B2A4A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Your Stems</h1>
            <p className="text-lg text-white/50">Manage and explore your saved musical arrangements.</p>
          </div>
          <Link
            href="/new"
            className="rounded-full bg-[#55D6C2] px-8 py-3.5 font-bold text-[#0B2A4A] transition hover:scale-105 active:scale-95"
          >
            Create New Session
          </Link>
        </header>

        {!isHydrated ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.02]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#55D6C2]/20 border-t-[#55D6C2]" />
            <p className="mt-6 text-lg font-medium text-white/50">Loading your collection...</p>
          </div>
        ) : !hasSessions ? (
          <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 text-[#55D6C2]/40">
              <svg viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h2 className="mb-4 text-3xl font-bold">No sessions found</h2>
            <p className="mb-10 max-w-md text-xl text-white/50">
              Start by creating your first session and add your stems to get started with the player.
            </p>
            <Link
              href="/new"
              className="rounded-full bg-[#55D6C2] px-10 py-4 text-lg font-bold text-[#0B2A4A] transition hover:scale-105 active:scale-95"
            >
              Start First Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="group relative flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-8 transition-all hover:border-[#55D6C2]/30 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-[#55D6C2]/5"
              >
                <div className="mb-8 flex-1">
                  <div className="mb-6 h-1 w-12 rounded-full bg-[#55D6C2]" />
                  <h2 className="mb-2 text-2xl font-bold text-white group-hover:text-[#55D6C2] transition-colors leading-tight">
                    {session.title}
                  </h2>
                  <p className="text-lg font-medium text-white/50">
                    {session.artistName || "Unknown Artist"}
                  </p>
                  <div className="mt-8 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white/30">
                    <span className="rounded-full border border-white/10 px-3 py-1">{session.stems.length} Stems</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <Link
                    href={`/new?sessionId=${session.id}`}
                    className="flex-1 rounded-2xl bg-white/10 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#55D6C2] hover:text-[#0B2A4A]"
                  >
                    Launch Player
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
                    className="rounded-2xl border border-white/10 p-3.5 text-white/40 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
                    title="Delete Session"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
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
