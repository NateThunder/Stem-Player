import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B2A4A] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-4">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-[#55D6C2] flex items-center justify-center shadow-lg shadow-[#55D6C2]/20">
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-[#0B2A4A]" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h1 className="text-6xl font-black tracking-tighter">STEMS.IO</h1>
          <p className="text-xl text-white/50 font-medium">Simple, powerful stem playback for musicians and producers.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/new"
            className="group relative overflow-hidden rounded-2xl bg-[#55D6C2] p-8 text-left transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative z-10 space-y-2">
              <h2 className="text-2xl font-bold text-[#0B2A4A]">New Session</h2>
              <p className="text-[#0B2A4A]/60 font-medium">Create a new studio project and upload stems.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 text-[#0B2A4A]/10 transition group-hover:scale-110">
              <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </div>
          </Link>

          <Link
            href="/saved"
            className="group relative overflow-hidden rounded-2xl bg-white/5 p-8 text-left border border-white/10 transition hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative z-10 space-y-2">
              <h2 className="text-2xl font-bold text-white">Library</h2>
              <p className="text-white/40 font-medium">Open your saved sessions and previous tracks.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 text-white/5 transition group-hover:scale-110">
              <svg fill="currentColor" viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
