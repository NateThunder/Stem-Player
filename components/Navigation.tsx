"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <nav className={`sticky top-0 z-50 transition-all ${
      isHome
        ? "bg-white/90 backdrop-blur-md border-b border-black/5"
        : "bg-[#0B2A4A]/80 backdrop-blur-xl border-b border-white/5"
    }`}>
      <div className="mx-auto max-w-6xl px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-[#55D6C2] flex items-center justify-center transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#0B2A4A]" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className={`text-xl font-bold tracking-tighter ${isHome ? "text-[#0B2A4A]" : "text-white"}`}>STEMS.IO</span>
        </Link>
        <div className="flex items-center gap-8">
          {isHome ? (
            <>
              <Link href="#features" className="text-sm font-bold uppercase tracking-widest text-[#0B2A4A]/60 hover:text-[#0B2A4A]">Features</Link>
              <Link href="#pricing" className="text-sm font-bold uppercase tracking-widest text-[#0B2A4A]/60 hover:text-[#0B2A4A]">Pricing</Link>
              <Link href="#" className="text-sm font-bold uppercase tracking-widest text-[#0B2A4A]/60 hover:text-[#0B2A4A]">FAQ</Link>
              <Link href="#" className="text-sm font-bold uppercase tracking-widest text-[#0B2A4A]/60 hover:text-[#0B2A4A]">Contact</Link>
              <Link href="/saved" className="rounded-xl bg-[#55D6C2] px-5 py-2.5 text-sm font-bold text-[#0B2A4A] shadow-lg shadow-[#55D6C2]/20">Get Started</Link>
            </>
          ) : (
            <>
              <Link
                href="/saved"
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  pathname === "/saved" ? "text-[#55D6C2]" : "text-white/50 hover:text-white"
                }`}
              >
                Library
              </Link>
              <Link
                href="/new"
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  pathname === "/new" ? "text-[#55D6C2]" : "text-white/50 hover:text-white"
                }`}
              >
                Studio
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
