"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteSavedSession, listSavedSessions, type SavedSession } from "@/lib/savedSessions";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function SavedSessionsPage() {
  const [sessions, setSessions] = useState<SavedSession[]>(() => listSavedSessions());

  const hasSessions = useMemo(() => sessions.length > 0, [sessions.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saved Stem Sessions</h1>
            <p className="text-sm text-white/60">Open a saved set and load it back into the player.</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            + Add New Stem
          </Link>
        </header>

        {!hasSessions ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-8 text-center text-white/50">
            No saved sessions yet.
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
                      {session.artistName || "Unknown artist"} · {session.stems.length} stems
                    </p>
                    <p className="text-xs text-white/40">Saved: {formatDate(session.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/?sessionId=${session.id}`}
                      className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-sky-400"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSessions(deleteSavedSession(session.id))}
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
      </div>
    </div>
  );
}
