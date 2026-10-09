"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PersistentPlayer() {
  const { currentEpisode, isPlaying, currentTime, duration, volume, toggle, seek, setVolume, stop, next, previous } = usePlayer();

  if (!currentEpisode) return null;

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5e7eb] bg-white/95 backdrop-blur-sm dark:border-[#2a2a30] dark:bg-[#0f0f12]/95 animate-slideUp"
      style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.1)" }}
      role="region"
      aria-label="Player de podcast persistente"
    >
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Episode info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9333ea] truncate">
              {currentEpisode.title}
            </p>
            {currentEpisode.pubDate && (
              <p className="text-[11px] text-[#9ca3af] truncate">
                {formatDistanceToNow(new Date(currentEpisode.pubDate), { addSuffix: true, locale: ptBR })}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={previous}
              className="p-2 rounded-full hover:bg-[#9333ea]/10 text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8] transition"
              aria-label="Anterior"
              title="Anterior"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>

            <button
              onClick={toggle}
              className="p-2.5 rounded-full bg-[#0f0f12] text-white hover:scale-105 active:scale-95 transition dark:bg-white dark:text-[#0f0f12]"
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              title={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              onClick={next}
              className="p-2 rounded-full hover:bg-[#9333ea]/10 text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8] transition"
              aria-label="Próximo"
              title="Próximo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>

          {/* Progress + Time */}
          <div className="flex items-center gap-3 min-w-[200px] max-w-[300px]">
            <span className="text-[11px] text-[#9ca3af] font-mono w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-[#e5e7eb] rounded-full cursor-pointer relative" role="slider" aria-label="Progresso do episódio" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
              <div
                className="h-full bg-[#9333ea] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
              <button
                onMouseDown={(e) => {
                  const handleMove = (moveEvent: MouseEvent) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                    seek(percent * duration);
                  };
                  const handleUp = () => {
                    document.removeEventListener("mousemove", handleMove);
                    document.removeEventListener("mouseup", handleUp);
                  };
                  document.addEventListener("mousemove", handleMove);
                  document.addEventListener("mouseup", handleUp);
                }}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#9333ea] opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
                aria-hidden="true"
              />
            </div>
            <span className="text-[11px] text-[#9ca3af] font-mono w-10">{formatTime(duration)}</span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              className="p-1.5 text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8] transition"
              aria-label={volume > 0 ? "Mutar" : "Desmutar"}
            >
              {volume > 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1.5 appearance-none bg-[#e5e7eb] rounded-full cursor-pointer accent-[#9333ea]"
              aria-label="Volume"
            />
          </div>

          {/* Close */}
          <button
            onClick={stop}
            className="p-2 rounded-full hover:bg-[#9333ea]/10 text-[#9ca3af] hover:text-[#9333ea] transition"
            aria-label="Fechar player"
            title="Fechar player"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}