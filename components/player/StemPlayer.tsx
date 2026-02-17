"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StemChannel from "./StemChannel";
import TransportControls from "./TransportControls";

export type Stem = {
  name: string;
  fileUrl: string;
  color?: string;
};

export type Track = {
  title: string;
  artistName?: string;
  stems: Stem[];
};

type StemPlayerProps = {
  track: Track;
};

export default function StemPlayer({ track }: StemPlayerProps) {
  const sectionCount = 8;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isSectionModeEnabled, setIsSectionModeEnabled] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [volumes, setVolumes] = useState<Record<number, number>>({});
  const [mutedStems, setMutedStems] = useState<Record<number, boolean>>({});
  const [soloedStems, setSoloedStems] = useState<Record<number, boolean>>({});

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<Array<AudioBufferSourceNode | null>>([]);
  const gainNodesRef = useRef<Array<GainNode | null>>([]);
  const buffersRef = useRef<Array<AudioBuffer | null>>([]);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const stems = useMemo(() => track.stems || [], [track.stems]);

  const stopAll = useCallback(() => {
    sourceNodesRef.current.forEach((node) => {
      if (!node) return;
      try {
        node.stop();
      } catch {
        // Node can already be stopped after seek/restart.
      }
    });
    sourceNodesRef.current = [];
    gainNodesRef.current = [];
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    const initialVolumes: Record<number, number> = {};
    stems.forEach((_, index) => {
      initialVolumes[index] = 1;
    });
    setVolumes(initialVolumes);
    setMutedStems({});
    setSoloedStems({});
  }, [stems]);

  useEffect(() => {
    if (!stems.length) return;

    let disposed = false;
    const context = new window.AudioContext();
    audioContextRef.current = context;
    offsetRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLoaded(false);
    setLoadingProgress(0);
    setLoadingError(null);

    const loadAudio = async () => {
      const loadedBuffers: Array<AudioBuffer | null> = [];
      let loaded = 0;

      for (const stem of stems) {
        try {
          const response = await fetch(stem.fileUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await context.decodeAudioData(arrayBuffer);
          loadedBuffers.push(audioBuffer);
        } catch {
          loadedBuffers.push(null);
        }

        loaded += 1;
        if (!disposed) {
          setLoadingProgress(Math.round((loaded / stems.length) * 100));
        }
      }

      if (disposed) return;
      buffersRef.current = loadedBuffers;
      const maxDuration = Math.max(
        ...loadedBuffers.filter((buffer): buffer is AudioBuffer => buffer !== null).map((buffer) => buffer.duration),
        0,
      );
      setDuration(maxDuration);
      setIsLoaded(true);
      if (maxDuration === 0) {
        setLoadingError("None of the stem files could be decoded. Check URLs/CORS.");
      }
    };

    void loadAudio();

    return () => {
      disposed = true;
      stopAll();
      if (audioContextRef.current === context) {
        audioContextRef.current = null;
      }
      void context.close();
    };
  }, [stems, stopAll]);

  useEffect(() => {
    const hasSolo = Object.values(soloedStems).some(Boolean);
    const now = audioContextRef.current?.currentTime ?? 0;

    gainNodesRef.current.forEach((gainNode, index) => {
      if (!gainNode) return;
      let volume = (volumes[index] ?? 1) * masterVolume;
      if (hasSolo) {
        volume = soloedStems[index] ? volume : 0;
      } else if (mutedStems[index]) {
        volume = 0;
      }
      gainNode.gain.setValueAtTime(volume, now);
    });
  }, [volumes, mutedStems, soloedStems, masterVolume]);

  const startPlayback = useCallback(
    (offset = 0) => {
      const context = audioContextRef.current;
      if (!context || !buffersRef.current.length) return;

      if (context.state === "suspended") {
        void context.resume();
      }

      stopAll();

      const hasSolo = Object.values(soloedStems).some(Boolean);
      const sources: Array<AudioBufferSourceNode | null> = [];
      const gains: Array<GainNode | null> = [];

      buffersRef.current.forEach((buffer, index) => {
        if (!buffer) {
          sources.push(null);
          gains.push(null);
          return;
        }

        const source = context.createBufferSource();
        const gainNode = context.createGain();
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(context.destination);

        let volume = (volumes[index] ?? 1) * masterVolume;
        if (hasSolo) {
          volume = soloedStems[index] ? volume : 0;
        } else if (mutedStems[index]) {
          volume = 0;
        }
        gainNode.gain.setValueAtTime(volume, context.currentTime);

        // Shared offset for every stem keeps channels aligned.
        source.start(0, offset);
        sources.push(source);
        gains.push(gainNode);
      });

      sourceNodesRef.current = sources;
      gainNodesRef.current = gains;
      startTimeRef.current = context.currentTime;
      offsetRef.current = offset;

      const tick = () => {
        const elapsed = context.currentTime - startTimeRef.current + offset;
        setCurrentTime(elapsed);
        if (elapsed >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          offsetRef.current = 0;
          stopAll();
          return;
        }
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    },
    [duration, mutedStems, soloedStems, stopAll, volumes, masterVolume],
  );

  const handlePlayPause = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    if (isPlaying) {
      const elapsed = context.currentTime - startTimeRef.current + offsetRef.current;
      offsetRef.current = elapsed;
      stopAll();
      setIsPlaying(false);
    } else {
      startPlayback(offsetRef.current);
      setIsPlaying(true);
    }
  }, [isPlaying, startPlayback, stopAll]);

  const handleSeek = useCallback(
    (time: number) => {
      const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
      const clampedTime = Math.min(Math.max(time, 0), safeDuration);
      offsetRef.current = clampedTime;
      setCurrentTime(clampedTime);
      if (isPlaying) {
        startPlayback(clampedTime);
      }
    },
    [duration, isPlaying, startPlayback],
  );

  const handleRestart = useCallback(() => {
    offsetRef.current = 0;
    setCurrentTime(0);
    if (isPlaying) {
      startPlayback(0);
    }
  }, [isPlaying, startPlayback]);

  const handleVolumeChange = useCallback((index: number, value: number) => {
    setVolumes((previous) => ({ ...previous, [index]: value }));
  }, []);

  const handleToggleMute = useCallback((index: number) => {
    setMutedStems((previous) => ({ ...previous, [index]: !previous[index] }));
  }, []);

  const handleToggleSolo = useCallback((index: number) => {
    setSoloedStems((previous) => ({ ...previous, [index]: !previous[index] }));
  }, []);

  if (!stems.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/60">
        No stems provided for this track.
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">{track.title}</h2>
          {track.artistName ? (
            <p className="text-lg font-medium text-white/50">{track.artistName}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/40" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <div className="w-32">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-[#55D6C2]"
              />
            </div>
            <span className="w-8 text-right text-xs font-bold text-white/60">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSectionModeEnabled((previous) => !previous)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isSectionModeEnabled
                  ? "bg-[#55D6C2] text-[#0B2A4A]"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Section Seek {isSectionModeEnabled ? "On" : "Off"}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              {sectionCount} Parts
            </span>
          </div>
        </div>
      </header>

      {!isLoaded ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-sm text-white/60">Loading stems... {loadingProgress}%</p>
          {loadingError ? <p className="text-xs text-rose-300">{loadingError}</p> : null}
        </div>
      ) : null}

      {isLoaded ? (
        <>
          <TransportControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
            onRestart={handleRestart}
            onSeek={handleSeek}
          />

          <div className="space-y-3">
            {stems.map((stem, index) => (
              <StemChannel
                key={`${stem.name}-${index}`}
                stem={stem}
                index={index}
                volume={volumes[index] ?? 1}
                isMuted={Boolean(mutedStems[index])}
                isSoloed={Boolean(soloedStems[index])}
                isPlaying={isPlaying}
                buffer={buffersRef.current[index] ?? null}
                currentTime={currentTime}
                duration={duration}
                sectionCount={sectionCount}
                sectionModeEnabled={isSectionModeEnabled}
                onVolumeChange={(value) => handleVolumeChange(index, value)}
                onToggleMute={() => handleToggleMute(index)}
                onToggleSolo={() => handleToggleSolo(index)}
                onSeek={handleSeek}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
