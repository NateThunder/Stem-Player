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
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-8 text-center text-white/50">
            Loading saved stems...
          </div>
        ) : !hasSessions ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-8 text-center text-white/50">
            No saved stems yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{session.title}</h2>
                    <p className="text-xs text-white/60">
                      {session.artistName || "Unknown artist"} - {session.stems.length} stems
                    </p>
                    <p className="text-xs text-white/40">Saved: {formatDate(session.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/new?sessionId=${session.id}`}
                      className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-sky-400"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
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
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
                    >
                      Delete
                    </button>
                  </div>
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
