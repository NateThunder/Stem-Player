"use client";

import { useCallback, useEffect, useState } from "react";

type TransportControlsProps = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onRestart: () => void;
  onSeek: (time: number) => void;
};

const formatTime = (time: number) => {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function TransportControls({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onRestart,
  onSeek,
}: TransportControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B2A4A]/80 backdrop-blur-2xl border-t border-white/5 p-6">
      <div className="mx-auto max-w-6xl flex flex-col items-center gap-4">
        {/* Progress Bar */}
        <div className="w-full flex items-center gap-4">
          <span className="text-[10px] font-black tabular-nums text-white/40">{formatTime(currentTime)}</span>
          <div
            className="relative flex-1 h-1 bg-white/5 rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const p = (e.clientX - rect.left) / rect.width;
              onSeek(p * duration);
            }}
          >
            <div
              className="absolute inset-y-0 left-0 bg-[#55D6C2] rounded-full"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute h-3 w-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/3 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-black tabular-nums text-white/40">{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-12">
          <button
            onClick={onRestart}
            className="text-white/20 hover:text-white transition active:scale-90"
            title="Restart"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            className="h-14 w-14 rounded-full bg-[#55D6C2] text-[#0B2A4A] flex items-center justify-center shadow-lg shadow-[#55D6C2]/20 transition hover:scale-110 active:scale-95"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-8 w-8 translate-x-0.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="w-6" /> {/* Spacer for symmetry */}
        </div>
      </div>
    </div>
  );
}
