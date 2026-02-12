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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0)}
          step={0.01}
          value={Math.min(currentTime, Math.max(duration, 0))}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-sky-400"
        />
        <div className="flex justify-between text-xs text-white/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-sky-400"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
