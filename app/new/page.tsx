"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import StemPlayer, { type Track } from "@/components/player/StemPlayer";
import { getSavedSessionById, saveSession } from "@/lib/savedSessions";

type StemDraft = {
  name: string;
  fileUrl: string;
  color: string;
  sourceType: "url" | "cloudflare";
  sourceName?: string;
};

const defaultStems: StemDraft[] = [
  { name: "Vocals", fileUrl: "", color: "#FF6B6B", sourceType: "url" },
  { name: "Drums", fileUrl: "", color: "#4ECDC4", sourceType: "url" },
  { name: "Bass", fileUrl: "", color: "#45B7D1", sourceType: "url" },
  { name: "Music", fileUrl: "", color: "#96CEB4", sourceType: "url" },
];

const stemPalette = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FF8C42",
  "#98D8C8",
  "#A4B0F5",
];

const normalizeNameFromFile = (fileName: string) =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function NewStemPageContent() {
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("My Stem Session");
  const [artistName, setArtistName] = useState("");
  const [stems, setStems] = useState<StemDraft[]>(defaultStems);
  const [loadedTrack, setLoadedTrack] = useState<Track | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingStemIndex, setUploadingStemIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const bulkUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return;

    let active = true;

    const loadSavedSession = async () => {
      const saved = await getSavedSessionById(sessionId);
      if (!active) return;
      if (!saved) {
        setError("Saved session was not found.");
        return;
      }

      setTitle(saved.title);
      setArtistName(saved.artistName || "");

      const restoredStems: StemDraft[] = saved.stems.map((stem) => ({
        name: stem.name,
        fileUrl: stem.fileUrl,
        color: stem.color || "#4ECDC4",
        sourceType: "url",
        sourceName: undefined,
      }));

      setStems(restoredStems.length ? restoredStems : defaultStems);
      setLoadedTrack({
        title: saved.title,
        artistName: saved.artistName,
        stems: saved.stems.map((stem) => ({
          name: stem.name,
          fileUrl: stem.fileUrl,
          color: stem.color,
        })),
      });
      setShowSetup(false);
      setError(null);
    };

    void loadSavedSession();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const updateStem = (index: number, next: Partial<StemDraft>) => {
    setStems((previous) =>
      previous.map((stem, currentIndex) =>
        currentIndex === index ? { ...stem, ...next } : stem,
      ),
    );
  };

  const addStem = () => {
    setStems((previous) => [
      ...previous,
      {
        name: `Stem ${previous.length + 1}`,
        fileUrl: "",
        color: stemPalette[previous.length % stemPalette.length],
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
    setShowSetup(false);
  };

  const handleSaveSession = () => {
    const preparedStems = stems
      .map((stem, index) => ({
        name: stem.name.trim() || `Stem ${index + 1}`,
        fileUrl: stem.fileUrl.trim(),
        color: stem.color.trim() || undefined,
      }))
      .filter((stem) => stem.fileUrl.length > 0);

    if (!preparedStems.length) {
      setError("Add at least one stem URL before saving.");
      return;
    }

    saveSession({
      title: title.trim() || "Untitled Track",
      artistName: artistName.trim() || undefined,
      stems: preparedStems,
    });

    setSaveMessage("Session saved.");
    setError(null);
    window.setTimeout(() => setSaveMessage(null), 2000);
  };

  const uploadStemToCloudflare = async (file: File) => {
    const uploadUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_UPLOAD_URL;
    if (!uploadUrl) {
      throw new Error("Missing NEXT_PUBLIC_CLOUDFLARE_UPLOAD_URL in .env.local");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("folder", "stems");

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: form,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || `Upload failed (${response.status})`);
    }

    const fileUrl =
      payload?.file_url ||
      payload?.url ||
      payload?.result?.file_url ||
      payload?.result?.url ||
      payload?.result?.variants?.[0];

    if (!fileUrl) {
      throw new Error("Upload succeeded but no file URL was returned.");
    }

    return fileUrl as string;
  };

  const handleStemFilePick = async (index: number, file: File | null) => {
    if (!file) return;

    setUploadingStemIndex(index);
    try {
      const fileUrl = await uploadStemToCloudflare(file);
      const cleanName = normalizeNameFromFile(file.name);
      updateStem(index, {
        fileUrl,
        sourceType: "cloudflare",
        sourceName: file.name,
        name: cleanName || stems[index]?.name || `Stem ${index + 1}`,
      });
      setError(null);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed. Check Worker + CORS.";
      setError(message);
    } finally {
      setUploadingStemIndex(null);
    }
  };

  const handleBulkStemFilePick = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const startIndex = stems.length;

    setIsBulkUploading(true);
    setError(null);

    setStems((previous) => [
      ...previous,
      ...files.map((file, fileIndex) => ({
        name: normalizeNameFromFile(file.name) || `Stem ${startIndex + fileIndex + 1}`,
        fileUrl: "",
        color: stemPalette[(startIndex + fileIndex) % stemPalette.length],
        sourceType: "url" as const,
        sourceName: file.name,
      })),
    ]);

    const results = await Promise.allSettled(files.map((file) => uploadStemToCloudflare(file)));

    setStems((previous) => {
      const next = [...previous];
      results.forEach((result, fileIndex) => {
        const stemIndex = startIndex + fileIndex;
        if (!next[stemIndex]) return;
        if (result.status === "fulfilled") {
          next[stemIndex] = {
            ...next[stemIndex],
            fileUrl: result.value,
            sourceType: "cloudflare",
            sourceName: files[fileIndex].name,
          };
        }
      });
      return next;
    });

    const failedCount = results.filter((result) => result.status === "rejected").length;
    if (failedCount > 0) {
      setError(`${failedCount} of ${files.length} stem uploads failed. Check Worker/CORS and retry.`);
    }

    setIsBulkUploading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B2A4A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 pb-48">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-white">
              {loadedTrack ? loadedTrack.title : "New Studio Session"}
            </h1>
            <p className="text-xl font-medium text-white/40">
              {loadedTrack?.artistName || "Upload stems and build your arrangement."}
            </p>
          </div>
          <button
            onClick={() => setShowSetup(!showSetup)}
            className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
              showSetup
                ? "bg-white/10 text-white"
                : "bg-[#55D6C2]/10 text-[#55D6C2] hover:bg-[#55D6C2]/20"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 transition-transform ${showSetup ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
            {showSetup ? "Hide Setup" : "Edit Setup"}
          </button>
        </header>

        {showSetup && (
        <section className="mb-16 space-y-10 rounded-[40px] border border-white/10 bg-white/[0.02] p-10 shadow-3xl backdrop-blur-sm">
          <div className="grid gap-8 md:grid-cols-2">
            <label className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Track Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B2A4A]/50 px-5 py-4 text-lg outline-none ring-[#55D6C2]/30 focus:ring-2 transition-all"
              />
            </label>

            <label className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Artist Name</span>
              <input
                value={artistName}
                onChange={(event) => setArtistName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B2A4A]/50 px-5 py-4 text-lg outline-none ring-[#55D6C2]/30 focus:ring-2 transition-all"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-10">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addStem}
                className="rounded-2xl bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
              >
                + Add Stem
              </button>
              <input
                ref={bulkUploadInputRef}
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handleBulkStemFilePick(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => bulkUploadInputRef.current?.click()}
                disabled={isBulkUploading}
                className="rounded-2xl bg-[#55D6C2]/10 px-6 py-3 text-sm font-bold text-[#55D6C2] transition hover:bg-[#55D6C2]/20 disabled:opacity-60 active:scale-95"
              >
                {isBulkUploading ? "Uploading..." : "Bulk Upload"}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadTrack}
                className="rounded-2xl bg-[#55D6C2] px-8 py-3 text-sm font-bold text-[#0B2A4A] transition hover:scale-105 active:scale-95"
              >
                Load Player
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-8 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95"
              >
                Save Session
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {stems.map((stem, index) => (
              <div
                key={index}
                className="rounded-2xl border p-3 md:p-4"
                style={{
                  borderColor: `${stem.color}33`,
                  background: `linear-gradient(140deg, ${stem.color}18, rgba(15, 23, 42, 0.55))`,
                }}
              >
                <div className="grid gap-3 md:grid-cols-[16px_1fr_auto_auto] md:items-center">
                  <div
                    className="hidden md:block h-4 w-4 rounded-full shadow-[0_0_18px]"
                    style={{ backgroundColor: stem.color, boxShadow: `0 0 18px ${stem.color}` }}
                  />
                  <input
                    value={stem.name}
                    onChange={(event) => updateStem(index, { name: event.target.value })}
                    className="h-12 rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none ring-[#55D6C2]/40 placeholder:text-white/35 focus:ring"
                    placeholder="Stem name (e.g. Guitar, Bass, Drums...)"
                  />
                  <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/80 transition hover:bg-white/10">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(event) => handleStemFilePick(index, event.target.files?.[0] ?? null)}
                    />
                    {uploadingStemIndex === index
                      ? "Uploading..."
                      : stem.sourceType === "cloudflare"
                        ? "Uploaded"
                        : "Upload Audio"}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeStem(index)}
                    className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-xs text-white/70 transition hover:bg-white/10"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex gap-1.5">
                    {stemPalette.slice(0, 7).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateStem(index, { color })}
                        className={`h-6 w-6 rounded-full border-2 transition hover:scale-110 ${
                          stem.color === color ? "border-white scale-110 shadow-lg" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  {stem.sourceType === "cloudflare" && stem.sourceName ? (
                    <span className="truncate font-medium text-cyan-400">File: {stem.sourceName}</span>
                  ) : (
                    <span className="text-white/30 italic">No audio file</span>
                  )}
                  <input
                    value={stem.fileUrl}
                    onChange={(event) =>
                      updateStem(index, {
                        fileUrl: event.target.value,
                        sourceType: "url",
                        sourceName: undefined,
                      })
                    }
                    className="ml-auto hidden w-[40%] rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-[10px] text-white/40 md:block focus:text-white/80 transition focus:bg-black/40 outline-none"
                    placeholder="External URL (optional)"
                  />
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm font-medium text-rose-400">{error}</p> : null}
          {saveMessage ? <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm font-medium text-emerald-400">{saveMessage}</p> : null}
        </section>
        )}

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

export default function NewStemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B2A4A] text-white">
          <div className="mx-auto max-w-5xl px-6 py-20 text-sm text-white/40">Loading studio...</div>
        </div>
      }
    >
      <NewStemPageContent />
    </Suspense>
  );
}
