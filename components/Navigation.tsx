"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-900" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">StemPlayer</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/saved"
            className={`text-sm font-medium transition ${
              pathname === "/saved" ? "text-sky-400" : "text-white/70 hover:text-white"
            }`}
          >
            Saved Sessions
          </Link>
          <Link
            href="/new"
            className={`text-sm font-medium transition ${
              pathname === "/new" ? "text-sky-400" : "text-white/70 hover:text-white"
            }`}
          >
            New Session
          </Link>
        </div>
      </div>
    </nav>
  );
}
