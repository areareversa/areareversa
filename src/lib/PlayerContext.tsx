"use client";

import { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from "react";

type Episode = {
  title: string;
  audioUrl: string;
  pubDate?: string;
  link?: string;
  contentSnippet?: string;
  coverImage?: string;
};

type PlayerState = {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isCollapsed: boolean;
};

type PlayerActions = {
  play: (episode: Episode) => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setQueueEpisodes: (eps: Episode[]) => void;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

type PlayerContextType = PlayerState & PlayerActions;

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

const STORAGE_KEY = "ar_player_state_v1";

interface PlayerProviderProps {
  children: ReactNode;
  initialEpisodes?: Episode[];
}

export function PlayerProvider({ children, initialEpisodes = [] }: PlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>(() => {
    if (typeof window === "undefined") {
      return {
        currentEpisode: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isCollapsed: false,
      };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          currentEpisode: parsed.currentEpisode ?? null,
          isPlaying: false,
          currentTime: parsed.currentTime ?? 0,
          duration: 0,
          volume: parsed.volume ?? 1,
          isCollapsed: parsed.isCollapsed ?? false,
        };
      }
    } catch {}
    return {
      currentEpisode: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isCollapsed: false,
    };
  });
  const [queue, setQueue] = useState<Episode[]>(initialEpisodes);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRestoring, setIsRestoring] = useState(true);

  // Refs for callbacks to avoid dependency issues in useEffects
  const playRef = useRef<((episode: Episode) => void) | null>(null);
  const pauseRef = useRef<(() => void) | null>(null);
  const toggleRef = useRef<(() => void) | null>(null);
  const seekRef = useRef<((time: number) => void) | null>(null);
  const setVolumeRef = useRef<((vol: number) => void) | null>(null);
  const nextRef = useRef<(() => void) | null>(null);
  const previousRef = useRef<(() => void) | null>(null);
  const toggleCollapsedRef = useRef<(() => void) | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = state.volume;
    audioRef.current.preload = "metadata";

    const audio = audioRef.current;

    const handleTimeUpdate = () => setState(s => ({ ...s, currentTime: audio.currentTime }));
    const handleLoadedMetadata = () => setState(s => ({ ...s, duration: audio.duration }));
    const handleEnded = () => {
      setState(s => ({ ...s, isPlaying: false, currentTime: 0 }));
      nextRef.current?.();
    };
    const handlePlay = () => setState(s => ({ ...s, isPlaying: true }));
    const handlePause = () => setState(s => ({ ...s, isPlaying: false }));
    const handleError = (e: Event) => console.error("Audio error:", e);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    // Media Session API
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => previousRef.current?.());
      navigator.mediaSession.setActionHandler("nexttrack", () => nextRef.current?.());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null) audio.currentTime = details.seekTime;
      });
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Restore episode and seek to saved position
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && state.currentEpisode) {
        const parsed = JSON.parse(stored);
        if (parsed.currentEpisode?.audioUrl === state.currentEpisode.audioUrl) {
          const audio = audioRef.current;
          if (audio && parsed.currentTime && parsed.currentTime > 0) {
            audio.currentTime = parsed.currentTime;
          }
        }
      }
    } catch {}
    setIsRestoring(false);
  }, [state.currentEpisode]);

  // Update audio src when episode changes
  useEffect(() => {
    if (isRestoring) return;
    const audio = audioRef.current;
    if (!audio || !state.currentEpisode?.audioUrl) return;

    audio.src = state.currentEpisode.audioUrl;
    audio.load();
    if (state.isPlaying) {
      audio.play().catch(() => setState(s => ({ ...s, isPlaying: false })));
    }
  }, [state.currentEpisode?.audioUrl, state.isPlaying, isRestoring]);

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || isRestoring) return;
    const toStore = {
      currentEpisode: state.currentEpisode,
      currentTime: state.currentTime,
      volume: state.volume,
      isCollapsed: state.isCollapsed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [state.currentEpisode, state.currentTime, state.volume, state.isCollapsed, isRestoring]);

  // Update Media Session metadata
  useEffect(() => {
    if (!("mediaSession" in navigator) || !state.currentEpisode) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.currentEpisode.title,
      artist: "área reversa",
      album: "Podcast área reversa",
      artwork: state.currentEpisode.coverImage
        ? [{ src: state.currentEpisode.coverImage, sizes: "512x512", type: "image/png" }]
        : [],
    });
    navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
  }, [state.currentEpisode, state.isPlaying]);

  // --- Callbacks (defined before keyboard shortcuts) ---

  const play = useCallback((episode: Episode) => {
    const index = queue.findIndex(e => e.audioUrl === episode.audioUrl);
    setState(s => ({ ...s, currentEpisode: episode, isPlaying: true }));
    if (index !== -1) setCurrentIndex(index);
  }, [queue]);
  playRef.current = play;

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(s => ({ ...s, isPlaying: false }));
  }, []);
  pauseRef.current = pause;

  const toggle = useCallback(() => {
    if (state.isPlaying) pause(); else audioRef.current?.play().catch(() => {});
  }, [state.isPlaying, pause]);
  toggleRef.current = toggle;

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(s => ({ ...s, currentTime: time }));
    }
  }, []);
  seekRef.current = seek;

  const setVolume = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    if (audioRef.current) audioRef.current.volume = v;
    setState(s => ({ ...s, volume: v }));
  }, []);
  setVolumeRef.current = setVolume;

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current!.currentTime = 0;
    setState(s => ({ ...s, isPlaying: false, currentTime: 0, currentEpisode: null }));
    setCurrentIndex(-1);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
    }
  }, []);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
    playRef.current?.(queue[nextIndex]);
  }, [queue, currentIndex]);
  nextRef.current = next;

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIndex);
    playRef.current?.(queue[prevIndex]);
  }, [queue, currentIndex]);
  previousRef.current = previous;

  const setQueueEpisodes = useCallback((eps: Episode[]) => {
    setQueue(eps);
    if (eps.length > 0 && currentIndex === -1) {
      setCurrentIndex(0);
    }
  }, [currentIndex]);

  const toggleCollapsed = useCallback(() => {
    setState(s => ({ ...s, isCollapsed: !s.isCollapsed }));
  }, []);
  toggleCollapsedRef.current = toggleCollapsed;

  const setCollapsed = useCallback((collapsed: boolean) => {
    setState(s => ({ ...s, isCollapsed: collapsed }));
  }, []);

  // Keyboard shortcuts (at the end, after all callbacks are defined)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          toggleRef.current?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRef.current?.(Math.max(0, state.currentTime - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRef.current?.(Math.min(state.duration, state.currentTime + 10));
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolumeRef.current?.(Math.min(1, state.volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolumeRef.current?.(Math.max(0, state.volume - 0.1));
          break;
        case "m":
        case "M":
          e.preventDefault();
          setVolumeRef.current?.(state.volume > 0 ? 0 : 1);
          break;
        case "n":
          e.preventDefault();
          nextRef.current?.();
          break;
        case "p":
          e.preventDefault();
          previousRef.current?.();
          break;
        case "c":
        case "C":
          e.preventDefault();
          toggleCollapsedRef.current?.();
          break;
        case "Escape":
          if (!state.isCollapsed) {
            e.preventDefault();
            toggleCollapsedRef.current?.();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.currentTime, state.duration, state.volume, state.isCollapsed]);

  return (
    <PlayerContext.Provider value={{ ...state, play, pause, toggle, seek, setVolume, stop, next, previous, setQueueEpisodes, toggleCollapsed, setCollapsed }}>
      {children}
    </PlayerContext.Provider>
  );
}