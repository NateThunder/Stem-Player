"use client";

import { useEffect, useRef, useState } from "react";
import StemPlayer, { type Track } from "@/components/player/StemPlayer";

type StemDraft = {
  name: string;
  fileUrl: string;
  color: string;
  sourceType: "url" | "local";
  sourceName?: string;
};

const defaultStems: StemDraft[] = [
  { name: "Vocals", fileUrl: "", color: "#FF6B6B", sourceType: "url" },
  { name: "Drums", fileUrl: "", color: "#4ECDC4", sourceType: "url" },
  { name: "Bass", fileUrl: "", color: "#45B7D1", sourceType: "url" },
  { name: "Music", fileUrl: "", color: "#96CEB4", sourceType: "url" },
];

export default function Home() {
  const [title, setTitle] = useState("My Stem Session");
  const [artistName, setArtistName] = useState("");
  const [stems, setStems] = useState<StemDraft[]>(defaultStems);
  const [loadedTrack, setLoadedTrack] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localObjectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const objectUrls = localObjectUrlsRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  const updateStem = (index: number, next: Partial<StemDraft>) => {
    setStems((previous) =>
      previous.map((stem, currentIndex) =>
        currentIndex === index ? { ...stem, ...next } : stem,
      ),
    );
  };

  const addStem = () => {
    const palette = ["#FFEAA7", "#DDA0DD", "#FF8C42", "#98D8C8", "#A4B0F5"];
    setStems((previous) => [
      ...previous,
      {
        name: `Stem ${previous.length + 1}`,
        fileUrl: "",
        color: palette[previous.length % palette.length],
        sourceType: "url",
      },
    ]);
  };

  const removeStem = (index: number) => {
    setStems((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const loadTrack = () => {
    const preparedStems = stems
      .map((stem, index) => ({
        name: stem.name.trim() || `Stem ${index + 1}`,
        fileUrl: stem.fileUrl.trim(),
        color: stem.color.trim() || undefined,
      }))
      .filter((stem) => stem.fileUrl.length > 0);

    if (!preparedStems.length) {
      setError("Add at least one stem URL before loading.");
      return;
    }

    setError(null);
    setLoadedTrack({
      title: title.trim() || "Untitled Track",
      artistName: artistName.trim() || undefined,
      stems: preparedStems,
    });
  };

  const handleStemFilePick = (index: number, file: File | null) => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    localObjectUrlsRef.current.add(objectUrl);

    updateStem(index, {
      fileUrl: objectUrl,
      sourceType: "local",
      sourceName: file.name,
    });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Stem Player</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Add stem URLs or pick audio files from your local drive, then load a synchronized Web Audio player. Best
            results come from stems exported from the same timeline start and sample rate.
          </p>
        </header>

        <section className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-white/60">Track title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-sky-500/50 focus:ring"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-white/60">Artist name</span>
              <input
                value={artistName}
                onChange={(event) => setArtistName(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-sky-500/50 focus:ring"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="space-y-3">
            {stems.map((stem, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_2fr_100px_auto]">
                <input
                  value={stem.name}
                  onChange={(event) => updateStem(index, { name: event.target.value })}
                  className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-sky-500/50 focus:ring"
                  placeholder="Stem name"
                />
                <input
                  value={stem.fileUrl}
                  onChange={(event) =>
                    updateStem(index, {
                      fileUrl: event.target.value,
                      sourceType: "url",
                      sourceName: undefined,
                    })
                  }
                  className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-sky-500/50 focus:ring"
                  placeholder="https://.../stem.wav"
                />
                <input
                  value={stem.color}
                  onChange={(event) => updateStem(index, { color: event.target.value })}
                  className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm outline-none ring-sky-500/50 focus:ring"
                  placeholder="#4ECDC4"
                />
                <button
                  type="button"
                  onClick={() => removeStem(index)}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10"
                >
                  Remove
                </button>
                <div className="md:col-span-4 flex items-center gap-3 text-xs text-white/60">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/15 px-3 py-1.5 transition hover:bg-white/10">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(event) => handleStemFilePick(index, event.target.files?.[0] ?? null)}
                    />
                    Choose local file
                  </label>
                  {stem.sourceType === "local" && stem.sourceName ? (
                    <span className="text-cyan-300">Local: {stem.sourceName}</span>
                  ) : (
                    <span>Using URL source</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addStem}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              Add Stem
            </button>
            <button
              type="button"
              onClick={loadTrack}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400"
            >
              Load Track
            </button>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </section>

        {loadedTrack ? (
          <StemPlayer track={loadedTrack} />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.01] p-8 text-center text-white/50">
            Add stems and click Load Track to start.
          </div>
        )}
      </div>
    </div>
  );
}
