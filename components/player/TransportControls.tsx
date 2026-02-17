"use client";

import { useCallback, useEffect, useState } from "react";
import PixelIcon from "./PixelIcon";

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
            <PixelIcon type="restart" size={24} />
          </button>

          <button
            onClick={onPlayPause}
            className="h-14 w-14 rounded-full bg-[#55D6C2] text-[#0B2A4A] flex items-center justify-center shadow-[4px_4px_0_#0B2A4A22] transition hover:scale-110 active:scale-95"
          >
            {isPlaying ? (
              <PixelIcon type="pause" size={32} color="#0B2A4A" />
            ) : (
              <PixelIcon type="play" size={32} color="#0B2A4A" />
            )}
          </button>

          <div className="w-6" /> {/* Spacer for symmetry */}
        </div>
      </div>
    </div>
  );
}
