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
      let volume = volumes[index] ?? 1;
      if (hasSolo) {
        volume = soloedStems[index] ? volume : 0;
      } else if (mutedStems[index]) {
        volume = 0;
      }
      gainNode.gain.setValueAtTime(volume, now);
    });
  }, [volumes, mutedStems, soloedStems]);

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

        let volume = volumes[index] ?? 1;
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
    [duration, mutedStems, soloedStems, stopAll, volumes],
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
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-white">{track.title}</h2>
        {track.artistName ? <p className="text-sm text-white/60">{track.artistName}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSectionModeEnabled((previous) => !previous)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              isSectionModeEnabled
                ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100"
                : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Section Seek {isSectionModeEnabled ? "On" : "Off"}
          </button>
          <span className="text-xs text-white/50">{sectionCount} sections</span>
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
