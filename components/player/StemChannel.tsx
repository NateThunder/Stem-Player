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

  const sectionStep = sectionCount > 0 ? 1 / sectionCount : 1;
  const currentSectionIndex =
    sectionModeEnabled && sectionCount > 0
      ? Math.min(sectionCount - 1, Math.floor(clamp01(waveformProgress) * sectionCount))
      : -1;
  const hoverSectionIndex =
    sectionModeEnabled && sectionCount > 0 && hoverProgress !== null
      ? Math.min(sectionCount - 1, Math.floor(clamp01(hoverProgress) * sectionCount))
      : -1;
  const pressedSectionIndex =
    sectionModeEnabled && sectionCount > 0 && dragProgress !== null
      ? Math.min(sectionCount - 1, Math.floor(clamp01(dragProgress) * sectionCount))
      : -1;

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
      context.fillStyle = "rgba(2, 6, 23, 0.35)";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(255, 255, 255, 0.14)";
      context.beginPath();
      context.moveTo(0, height / 2);
      context.lineTo(width, height / 2);
      context.stroke();

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
          const value = channel[i];
          if (value < min) min = value;
          if (value > max) max = value;
        }

        const y1 = (1 + min) * amp;
        const y2 = (1 + max) * amp;
        context.moveTo(x + 0.5, y1);
        context.lineTo(x + 0.5, y2);
      }

      context.stroke();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => {
      window.removeEventListener("resize", draw);
    };
  }, [buffer, color]);

  const getRawProgressFromClientX = useCallback(
    (clientX: number, element: HTMLDivElement) => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0) return null;
      return clamp01((clientX - rect.left) / rect.width);
    },
    [clamp01],
  );

  return (
    <div
      className="space-y-3 rounded-2xl border p-4 transition"
      style={{
        borderColor: `${color}55`,
        background: `linear-gradient(140deg, ${color}10, rgba(10,15,20,0.55))`,
        boxShadow: isPlaying && !isMuted ? `0 0 30px ${color}1f` : "none",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className={`text-sm font-semibold ${isMuted ? "text-white/40" : "text-white/80"}`}>
            {stem.name || `Stem ${index + 1}`}
          </span>
        </div>
        <span className="text-xs text-white/60">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
      </div>

      <div className="relative h-16 overflow-hidden rounded-xl border border-white/10">
        <canvas
          ref={canvasRef}
          className={`h-full w-full ${isMuted ? "opacity-40" : "opacity-90"}`}
        />

        {sectionModeEnabled && sectionCount > 0 ? (
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: sectionCount }).map((_, sectionIndex) => {
              const isCurrentSection = sectionIndex === currentSectionIndex;
              const isHoveredSection =
                sectionIndex === hoverSectionIndex || sectionIndex === pressedSectionIndex;

              return (
                <div
                  key={sectionIndex}
                  className="absolute inset-y-0"
                  style={{
                    left: `${sectionIndex * sectionStep * 100}%`,
                    width: `${sectionStep * 100}%`,
                    background: isHoveredSection
                      ? `${color}33`
                      : isCurrentSection
                        ? `${color}1a`
                        : "transparent",
                    borderRight:
                      sectionIndex < sectionCount - 1
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "none",
                  }}
                />
              );
            })}
          </div>
        ) : null}

        <div
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{
            width: `${waveformProgress * 100}%`,
            background: `${color}22`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-white/80"
          style={{ left: `${waveformProgress * 100}%` }}
        />
        {hoverProgress !== null ? (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-cyan-300/90"
            style={{ left: `${hoverProgress * 100}%` }}
          />
        ) : null}

        <div
          className="absolute inset-0 z-20 cursor-pointer touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            event.preventDefault();
            activePointerIdRef.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            const rawProgress = getRawProgressFromClientX(event.clientX, event.currentTarget);
            if (rawProgress !== null) {
              setHoverProgress(rawProgress);
            }
            seekFromClientX(event.clientX, event.currentTarget);
          }}
          onPointerMove={(event) => {
            const rawProgress = getRawProgressFromClientX(event.clientX, event.currentTarget);
            if (rawProgress !== null) {
              setHoverProgress(rawProgress);
            }

            if (activePointerIdRef.current === event.pointerId) {
              event.preventDefault();
              seekFromClientX(event.clientX, event.currentTarget);
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            if (activePointerIdRef.current === event.pointerId) {
              activePointerIdRef.current = null;
            }
            setDragProgress(null);
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            if (activePointerIdRef.current === event.pointerId) {
              activePointerIdRef.current = null;
            }
            setDragProgress(null);
          }}
          onPointerLeave={() => {
            setHoverProgress(null);
          }}
          onLostPointerCapture={() => {
            activePointerIdRef.current = null;
            setDragProgress(null);
          }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={isMuted ? 0 : Math.round(volume * 100)}
        onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
        className="h-2 w-full cursor-pointer accent-sky-400"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            isMuted
              ? "border border-white/20 bg-white/10 text-white/80"
              : "border border-white/10 bg-black/20 text-white/60 hover:bg-white/10"
          }`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          onClick={onToggleSolo}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            isSoloed
              ? "border border-transparent text-slate-950"
              : "border border-white/10 bg-black/20 text-white/60 hover:bg-white/10"
          }`}
          style={isSoloed ? { background: color } : undefined}
        >
          {isSoloed ? "Solo On" : "Solo"}
        </button>
      </div>
    </div>
  );
}
