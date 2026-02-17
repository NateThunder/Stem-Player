"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stem = {
  name: string;
  color?: string;
};

type StemChannelProps = {
  stem: Stem;
  index: number;
  volume: number;
  isMuted: boolean;
  isSoloed: boolean;
  isPlaying: boolean;
  buffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  sectionCount: number;
  sectionModeEnabled: boolean;
  onVolumeChange: (value: number) => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
};

const fallbackColors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FF8C42",
  "#98D8C8",
];

export default function StemChannel({
  stem,
  index,
  volume,
  isMuted,
  isSoloed,
  isPlaying,
  buffer,
  currentTime,
  duration,
  sectionCount,
  sectionModeEnabled,
  onVolumeChange,
  onSeek,
  onToggleMute,
  onToggleSolo,
}: StemChannelProps) {
  const color = stem.color || fallbackColors[index % fallbackColors.length];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const waveformProgress =
    Number.isFinite(duration) && duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;

  const clamp01 = useCallback((value: number) => Math.min(Math.max(value, 0), 1), []);

  const snapProgress = useCallback(
    (progress: number) => {
      if (!sectionModeEnabled || sectionCount <= 0) return progress;
      const indexFromProgress = Math.min(
        sectionCount - 1,
        Math.floor(clamp01(progress) * sectionCount),
      );
      return indexFromProgress / sectionCount;
    },
    [clamp01, sectionCount, sectionModeEnabled],
  );

  const seekFromClientX = useCallback(
    (clientX: number, element: HTMLDivElement) => {
      if (!Number.isFinite(duration) || duration <= 0) return;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawProgress = clamp01((clientX - rect.left) / rect.width);
      const targetProgress = snapProgress(rawProgress);
      setDragProgress(targetProgress);
      onSeek(targetProgress * duration);
    },
    [clamp01, duration, onSeek, snapProgress],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      context.clearRect(0, 0, width, height);

      if (!buffer) return;

      const channel = buffer.getChannelData(0);
      const step = Math.max(1, Math.floor(channel.length / width));
      const amp = height / 2;

      context.strokeStyle = color;
      context.lineWidth = 1;
      context.beginPath();

      for (let x = 0; x < width; x += 1) {
        const start = x * step;
        const end = Math.min(start + step, channel.length);
        let min = 1;
        let max = -1;
        for (let i = start; i < end; i += 1) {
          const val = channel[i];
          if (val < min) min = val;
          if (val > max) max = val;
        }
        context.moveTo(x + 0.5, (1 + min) * amp);
        context.lineTo(x + 0.5, (1 + max) * amp);
      }
      context.stroke();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [buffer, color]);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] transition-all ${isPlaying && !isMuted ? "shadow-[4px_4px_0_rgba(0,0,0,0.2)]" : ""}`}>
      {/* Left: Volume Slider & Controls */}
      <div className="flex flex-col items-center gap-4 w-12 shrink-0">
        <div className="relative h-24 w-3 bg-white/5 border border-white/10 overflow-hidden" style={{ imageRendering: "pixelated" }}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={isMuted ? 0 : Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="absolute inset-0 w-24 h-3 -rotate-90 origin-center translate-y-[44px] -translate-x-[45px] cursor-pointer accent-[#55D6C2] opacity-0 z-10"
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#55D6C2] transition-all"
            style={{
              height: `${isMuted ? 0 : volume * 100}%`,
              transition: "height 0.1s steps(10)"
            }}
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <button
            onClick={onToggleMute}
            className={`w-full py-1 text-[8px] font-black rounded uppercase transition shadow-[2px_2px_0_rgba(0,0,0,0.2)] ${isMuted ? "bg-rose-500 text-white" : "bg-white/10 text-white/40 hover:bg-white/20"}`}
          >
            Mute
          </button>
          <button
            onClick={onToggleSolo}
            className={`w-full py-1 text-[8px] font-black rounded uppercase transition shadow-[2px_2px_0_rgba(0,0,0,0.2)] ${isSoloed ? "text-[#0B2A4A]" : "bg-white/10 text-white/40 hover:bg-white/20"}`}
            style={isSoloed ? { backgroundColor: color } : {}}
          >
            Solo
          </button>
        </div>
      </div>

      {/* Right: Waveform & Label */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-black uppercase tracking-widest ${isMuted ? "text-white/20" : "text-white/60"}`}>
            {stem.name || `Stem ${index + 1}`}
          </h4>
          <span className="text-[10px] font-bold text-white/20">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
        </div>

        <div className="relative h-16 bg-black/20 rounded-lg overflow-hidden border border-white/5">
          <canvas ref={canvasRef} className={`w-full h-full ${isMuted ? "opacity-20 grayscale" : "opacity-60"}`} />

          <div
            className="absolute inset-y-0 left-0 transition-all pointer-events-none"
            style={{ width: `${waveformProgress * 100}%`, backgroundColor: `${color}11`, borderRight: `1px solid ${color}` }}
          />

          <div
            className="absolute inset-0 cursor-crosshair z-10"
            onPointerDown={(e) => { e.preventDefault(); seekFromClientX(e.clientX, e.currentTarget); }}
          />
        </div>
      </div>
    </div>
  );
}
