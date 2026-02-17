"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [uploadingStemIndex, setUploadingStemIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(true);
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
      setIsSetupOpen(false);
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

  const handleSaveSession = () => {
    const preparedStems = stems
      .map((stem, index) => ({
        name: stem.name.trim() || `Stem ${index + 1}`,
        fileUrl: stem.fileUrl.trim(),
        color: stem.color.trim() || undefined,
      }))
      .filter((stem) => stem.fileUrl.length > 0);

    if (!preparedStems.length) {
      setError("Add at least one stem with a file before saving.");
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
      throw new Error("Missing Cloudflare Upload URL");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("folder", "stems");

    const response = await fetch(uploadUrl, { method: "POST", body: form });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || "Upload failed");
    }

    return (payload?.file_url || payload?.url) as string;
  };

  const handleStemFilePick = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingStemIndex(index);
    try {
      const fileUrl = await uploadStemToCloudflare(file);
      updateStem(index, {
        fileUrl,
        sourceType: "cloudflare",
        sourceName: file.name,
        name: normalizeNameFromFile(file.name) || stems[index].name,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
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

    const newDrafts = files.map((file, i) => ({
      name: normalizeNameFromFile(file.name) || `Stem ${startIndex + i + 1}`,
      fileUrl: "",
      color: stemPalette[(startIndex + i) % stemPalette.length],
      sourceType: "url" as const,
      sourceName: file.name,
    }));

    setStems((prev) => [...prev, ...newDrafts]);

    const results = await Promise.allSettled(files.map(f => uploadStemToCloudflare(f)));

    setStems((prev) => {
      const next = [...prev];
      results.forEach((res, i) => {
        const idx = startIndex + i;
        if (res.status === "fulfilled" && next[idx]) {
          next[idx] = { ...next[idx], fileUrl: res.value, sourceType: "cloudflare" };
        }
      });
      return next;
    });

    setIsBulkUploading(false);
  };

  const track = useMemo<Track>(() => ({
    title,
    artistName,
    stems: stems
      .filter(s => s.fileUrl)
      .map(s => ({ name: s.name, fileUrl: s.fileUrl, color: s.color }))
  }), [title, artistName, stems]);

  return (
    <div className="min-h-screen bg-[#0B2A4A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 pb-48 space-y-12">
        <section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setIsSetupOpen(!isSetupOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition"
          >
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight">{title}</h1>
              <p className="text-sm font-medium text-white/40">{artistName || "No artist set"}</p>
            </div>
            <div className={`transition-transform ${isSetupOpen ? "rotate-180" : ""}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isSetupOpen && (
            <div className="p-6 pt-0 space-y-8 border-t border-white/5">
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Track Title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:ring-2 ring-[#55D6C2]/30 transition"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Artist Name</span>
                  <input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:ring-2 ring-[#55D6C2]/30 transition"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/30">Stems Configuration</h3>
                  <div className="flex gap-2">
                    <button onClick={addStem} className="text-xs font-bold text-[#55D6C2] hover:underline">+ Add</button>
                    <button onClick={() => bulkUploadInputRef.current?.click()} className="text-xs font-bold text-[#55D6C2] hover:underline">
                      {isBulkUploading ? "Uploading..." : "Bulk Upload"}
                    </button>
                    <input ref={bulkUploadInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => { handleBulkStemFilePick(e.target.files); e.target.value=""; }} />
                  </div>
                </div>

                <div className="grid gap-3">
                  {stems.map((stem, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="h-3 w-3 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: stem.color, boxShadow: `0 0 10px ${stem.color}` }} />
                      <input
                        value={stem.name}
                        onChange={(e) => updateStem(i, { name: e.target.value })}
                        className="flex-1 min-w-[120px] bg-transparent text-sm font-bold outline-none placeholder:text-white/20"
                        placeholder="Stem Name"
                      />
                      <label className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition">
                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleStemFilePick(i, e.target.files?.[0] ?? null)} />
                        {uploadingStemIndex === i ? "..." : stem.fileUrl ? "Re-upload" : "Upload"}
                      </label>
                      <button onClick={() => removeStem(i)} className="text-white/20 hover:text-rose-400 transition">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                      </button>
                      <div className="w-full flex gap-1.5 mt-2 md:mt-0 md:w-auto">
                        {stemPalette.slice(0, 6).map(c => (
                          <button key={c} onClick={() => updateStem(i, { color: c })} className={`h-4 w-4 rounded-full border border-white/10 ${stem.color === c ? "scale-125 border-white shadow-lg" : ""}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                {saveMessage && <span className="text-xs font-bold text-emerald-400 self-center mr-4">{saveMessage}</span>}
                {error && <span className="text-xs font-bold text-rose-400 self-center mr-4">{error}</span>}
                <button
                  onClick={handleSaveSession}
                  className="rounded-xl bg-[#55D6C2] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#0B2A4A] transition hover:scale-105 active:scale-95"
                >
                  Save Session
                </button>
              </div>
            </div>
          )}
        </section>

        {track.stems.length > 0 ? (
          <StemPlayer track={track} />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-20 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-white/20" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No stems loaded</h3>
              <p className="text-sm text-white/30">Upload audio files above to start your session.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewStemPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B2A4A] flex items-center justify-center text-white/40">Loading...</div>}>
      <NewStemPageContent />
    </Suspense>
  );
}
