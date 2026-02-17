"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  // Navigation is only visible on app pages, not the minimal homepage
  if (pathname === "/") return null;

  return (
    <nav className="sticky top-0 z-50 bg-[#0B2A4A]/80 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-[#55D6C2] flex items-center justify-center transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#0B2A4A]" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tighter text-white">STEMS.IO</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/saved"
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${
              pathname === "/saved" ? "text-[#55D6C2]" : "text-white/40 hover:text-white"
            }`}
          >
            Library
          </Link>
          <Link
            href="/new"
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${
              pathname === "/new" ? "text-[#55D6C2]" : "text-white/40 hover:text-white"
            }`}
          >
            Studio
          </Link>
        </div>
      </div>
    </nav>
  );
}
