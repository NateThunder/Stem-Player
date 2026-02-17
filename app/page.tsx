"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import StemPlayer, { type Track } from "@/components/player/StemPlayer";
import { getSavedSessionById, saveSession, listSavedSessions, type SavedSession } from "@/lib/savedSessions";

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

function StemPlayerHomeContent() {
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("My Stem Session");
  const [artistName, setArtistName] = useState("");
  const [stems, setStems] = useState<StemDraft[]>(defaultStems);
  const [error, setError] = useState<string | null>(null);
  const [uploadingStemIndex, setUploadingStemIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<SavedSession[]>([]);
  const bulkUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      void listSavedSessions().then(setRecentSessions);
      return;
    }

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
      setStems(saved.stems.map((s) => ({
        name: s.name,
        fileUrl: s.fileUrl,
        color: s.color || "#4ECDC4",
        sourceType: "url",
      })));
      setIsSettingsOpen(false);
    };
    void loadSavedSession();
    return () => { active = false; };
  }, [searchParams]);

  const updateStem = (index: number, next: Partial<StemDraft>) => {
    setStems((prev) => prev.map((s, i) => i === index ? { ...s, ...next } : s));
  };

  const addStem = () => {
    setStems((prev) => [...prev, {
      name: `Stem ${prev.length + 1}`,
      fileUrl: "",
      color: stemPalette[prev.length % stemPalette.length],
      sourceType: "url",
    }]);
  };

  const removeStem = (index: number) => {
    setStems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSession = () => {
    const preparedStems = stems
      .filter((s) => s.fileUrl.trim())
      .map((s) => ({ name: s.name.trim(), fileUrl: s.fileUrl.trim(), color: s.color }));

    if (!preparedStems.length) {
      setError("Add at least one stem with audio.");
      return;
    }

    saveSession({ title, artistName, stems: preparedStems });
    setSaveMessage("Saved.");
    window.setTimeout(() => setSaveMessage(null), 2000);
    void listSavedSessions().then(setRecentSessions);
  };

  const uploadStem = async (index: number, file: File) => {
    const uploadUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_UPLOAD_URL;
    if (!uploadUrl) { setError("Upload URL missing"); return; }

    setUploadingStemIndex(index);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      updateStem(index, {
        fileUrl: data.file_url || data.url,
        sourceType: "cloudflare",
        sourceName: file.name,
        name: normalizeNameFromFile(file.name) || stems[index].name,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingStemIndex(null);
    }
  };

  const handleBulkUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsBulkUploading(true);
    const startIndex = stems.length;

    const newDrafts = Array.from(files).map((f, i) => ({
      name: normalizeNameFromFile(f.name) || `Stem ${startIndex + i + 1}`,
      fileUrl: "",
      color: stemPalette[(startIndex + i) % stemPalette.length],
      sourceType: "url" as const,
    }));
    setStems(prev => [...prev, ...newDrafts]);

    // Simple sequential upload for better stability in this simple view
    for (let i = 0; i < files.length; i++) {
      await uploadStem(startIndex + i, files[i]);
    }
    setIsBulkUploading(false);
  };

  const track = useMemo<Track>(() => ({
    title,
    artistName,
    stems: stems.filter(s => s.fileUrl).map(s => ({ name: s.name, fileUrl: s.fileUrl, color: s.color }))
  }), [title, artistName, stems]);

  return (
    <div className="min-h-screen bg-[#0B2A4A] text-white selection:bg-[#55D6C2]/30">
      {/* Ultra-minimal Header */}
      <header className="sticky top-0 z-50 bg-[#0B2A4A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-[#55D6C2] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#0B2A4A]" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight leading-none uppercase">{title}</span>
              {artistName && <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{artistName}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSettingsOpen ? "bg-white text-[#0B2A4A]" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
            >
              {isSettingsOpen ? "Close Setup" : "Edit Stems"}
            </button>
            <button
              onClick={handleSaveSession}
              className="px-4 py-2 rounded-xl bg-[#55D6C2] text-[#0B2A4A] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              {saveMessage || "Save"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        {isSettingsOpen && (
          <section className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Session Name</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[#55D6C2]/20 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Artist</label>
                <input value={artistName} onChange={e => setArtistName(e.target.value)} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[#55D6C2]/20 outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-xs font-black uppercase tracking-widest">Stems</h3>
                <div className="flex gap-4">
                  <button onClick={addStem} className="text-[10px] font-bold text-[#55D6C2]">+ Add Stem</button>
                  <button onClick={() => bulkUploadInputRef.current?.click()} className="text-[10px] font-bold text-[#55D6C2]">
                    {isBulkUploading ? "Uploading..." : "Bulk Upload"}
                  </button>
                  <input ref={bulkUploadInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={e => handleBulkUpload(e.target.files)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stems.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 group">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <input value={s.name} onChange={e => updateStem(i, { name: e.target.value })} className="flex-1 bg-transparent text-[10px] font-black uppercase tracking-widest outline-none truncate" />
                    <label className="cursor-pointer text-[9px] font-black uppercase tracking-tighter text-[#55D6C2] hover:text-white transition whitespace-nowrap">
                      <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files?.[0] && uploadStem(i, e.target.files[0])} />
                      {uploadingStemIndex === i ? "..." : s.fileUrl ? "Re-up" : "Upload"}
                    </label>
                    <button onClick={() => removeStem(i)} className="text-white/10 group-hover:text-rose-400 transition">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {track.stems.length > 0 ? (
          <StemPlayer track={track} />
        ) : !isSettingsOpen && (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-white/10">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Ready to play?</h2>
              <p className="text-sm text-white/30 max-w-xs mx-auto">Upload your stems or choose a recent session to get started with the player.</p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-8 py-3 rounded-xl bg-white text-[#0B2A4A] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
            >
              Start Session
            </button>

            {recentSessions.length > 0 && (
              <div className="pt-12 w-full max-w-md space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">Recent Sessions</h3>
                <div className="grid gap-2">
                  {recentSessions.slice(0, 3).map(s => (
                    <a key={s.id} href={`/?sessionId=${s.id}`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                      <span className="text-sm font-bold">{s.title}</span>
                      <span className="text-[10px] text-white/20 uppercase font-bold">{s.stems.length} Stems</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-2xl">{error}</div>}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B2A4A] flex items-center justify-center text-white/20 font-black uppercase tracking-widest">Stems.io</div>}>
      <StemPlayerHomeContent />
    </Suspense>
  );
}
