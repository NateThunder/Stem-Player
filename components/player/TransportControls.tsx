"use client";

type TransportControlsProps = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onRestart: () => void;
  onSeek: (time: number) => void;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function TransportControls({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onRestart,
  onSeek,
}: TransportControlsProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-50">
    <div className="space-y-6 rounded-[32px] border border-white/10 bg-[#0B2A4A]/80 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="space-y-3">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0)}
          step={0.01}
          value={Math.min(currentTime, Math.max(duration, 0))}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-[#55D6C2]"
        />
        <div className="flex justify-between text-xs font-bold tabular-nums text-white/40">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Restart"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <rect x="5" y="5" width="2" height="14" rx="1" />
            <path d="M18 6v12L8.5 12z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#55D6C2] text-[#0B2A4A] transition hover:scale-110 active:scale-95 shadow-lg shadow-[#55D6C2]/20"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
    </div>
  );
}
