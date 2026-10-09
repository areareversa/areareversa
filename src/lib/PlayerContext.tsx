"use client";

import { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from "react";

type Episode = {
  title: string;
  audioUrl: string;
  pubDate?: string;
  link?: string;
  contentSnippet?: string;
};

type PlayerState = {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
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
};

type PlayerContextType = PlayerState & PlayerActions;

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

interface PlayerProviderProps {
  children: ReactNode;
  initialEpisodes?: Episode[];
}

export function PlayerProvider({ children, initialEpisodes = [] }: PlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentEpisode: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });
  const [queue, setQueue] = useState<Episode[]>(initialEpisodes);
  const [currentIndex, setCurrentIndex] = useState(-1);

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
      next();
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

  // Update audio src when episode changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentEpisode?.audioUrl) return;

    audio.src = state.currentEpisode.audioUrl;
    audio.load();
    if (state.isPlaying) {
      audio.play().catch(() => setState(s => ({ ...s, isPlaying: false })));
    }
  }, [state.currentEpisode?.audioUrl, state.isPlaying]);

  const play = useCallback((episode: Episode) => {
    const index = queue.findIndex(e => e.audioUrl === episode.audioUrl);
    setState(s => ({ ...s, currentEpisode: episode, isPlaying: true }));
    if (index !== -1) setCurrentIndex(index);
  }, [queue]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(s => ({ ...s, isPlaying: false }));
  }, []);

  const toggle = useCallback(() => {
    if (state.isPlaying) pause(); else audioRef.current?.play().catch(() => {});
  }, [state.isPlaying, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(s => ({ ...s, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    if (audioRef.current) audioRef.current.volume = v;
    setState(s => ({ ...s, volume: v }));
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current!.currentTime = 0;
    setState(s => ({ ...s, isPlaying: false, currentTime: 0, currentEpisode: null }));
    setCurrentIndex(-1);
  }, []);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
    play(queue[nextIndex]);
  }, [queue, currentIndex, play]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIndex);
    play(queue[prevIndex]);
  }, [queue, currentIndex, play]);

  // Expose queue setter for podcast page
  const setQueueEpisodes = useCallback((eps: Episode[]) => {
    setQueue(eps);
    if (eps.length > 0 && currentIndex === -1) {
      setCurrentIndex(0);
    }
  }, [currentIndex]);

  return (
    <PlayerContext.Provider value={{ ...state, play, pause, toggle, seek, setVolume, stop, next, previous, setQueueEpisodes }}>
      {children}
    </PlayerContext.Provider>
  );
}