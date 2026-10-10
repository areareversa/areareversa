"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const MAX_CHUNK_LENGTH = 20000; // Safe limit for SpeechSynthesisUtterance

export function TtsReader({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef(text);
  const chunksRef = useRef<string[]>([]);

  // Keep text ref updated
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Prepare chunks when text changes
  useEffect(() => {
    const plain = cleanText(text);
    if (plain) {
      chunksRef.current = splitIntoChunks(plain, MAX_CHUNK_LENGTH);
    } else {
      chunksRef.current = [];
    }
    setCurrentChunk(0);
  }, [text]);

  // Load voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const ptBrVoice = availableVoices.find(v => v.lang === "pt-BR" || v.lang.startsWith("pt"));
      if (ptBrVoice) setVoice(ptBrVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function cleanText(raw: string): string {
    return raw
      .replace(/#{1,6}\s/g, "") // headers
      .replace(/\*\*|__/g, "") // bold
      .replace(/\*|_/g, "") // italic
      .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline code
      .replace(/```[\s\S]*?```/g, "") // code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> keep text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // images
      .replace(/^>\s/gm, "") // blockquotes
      .replace(/^[\-*+]\s/gm, "") // list items
      .replace(/^\d+\.\s/gm, "") // ordered lists
      .replace(/---+/g, "") // horizontal rules
      .replace(/https?:\/\/\S+/g, "") // URLs
      .replace(/\n{3,}/g, "\n\n") // multiple newlines
      .replace(/\s+/g, " ") // whitespace
      .trim();
  }

  function splitIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }

      // Find a good break point (sentence end)
      let breakPoint = remaining.lastIndexOf(". ", maxLength);
      if (breakPoint === -1 || breakPoint < maxLength * 0.5) {
        breakPoint = remaining.lastIndexOf(" ", maxLength);
      }
      if (breakPoint === -1 || breakPoint < maxLength * 0.3) {
        breakPoint = maxLength;
      } else {
        breakPoint += 1; // Include the period/space
      }

      chunks.push(remaining.slice(0, breakPoint).trim());
      remaining = remaining.slice(breakPoint).trim();
    }

    return chunks;
  }

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speaking && paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPaused(false);
      setCurrentChunk(0);
      return;
    }

    const chunks = chunksRef.current;
    if (chunks.length === 0) return;

    setSpeaking(true);
    setPaused(false);
    setCurrentChunk(0);
    speakChunk(chunks[0], 0);
  }, [speaking, paused]);

  const speakChunk = (chunk: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = "pt-BR";
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    if (voice) u.voice = voice;

    u.onstart = () => {
      setSpeaking(true);
      setPaused(false);
      setCurrentChunk(index);
    };

    u.onend = () => {
      const chunks = chunksRef.current;
      if (index < chunks.length - 1) {
        // Speak next chunk
        speakChunk(chunks[index + 1], index + 1);
      } else {
        // All done
        setSpeaking(false);
        setPaused(false);
        setCurrentChunk(0);
      }
    };

    u.onerror = (e) => {
      console.error("TTS error:", e);
      // Try next chunk on error
      const chunks = chunksRef.current;
      if (index < chunks.length - 1) {
        speakChunk(chunks[index + 1], index + 1);
      } else {
        setSpeaking(false);
        setPaused(false);
        setCurrentChunk(0);
      }
    };

    u.onpause = () => setPaused(true);
    u.onresume = () => setPaused(false);

    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis && speaking && !paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [speaking, paused]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPaused(false);
      setCurrentChunk(0);
    }
  }, []);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoice = voices.find(v => v.name === e.target.value) || null;
    setVoice(selectedVoice);
    if (selectedVoice) {
      try {
        localStorage.setItem("ar_tts_voice", selectedVoice.name);
      } catch {}
    }
  };

  // Restore saved voice
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedVoiceName = localStorage.getItem("ar_tts_voice");
      if (savedVoiceName && voices.length > 0) {
        const savedVoice = voices.find(v => v.name === savedVoiceName);
        if (savedVoice) setVoice(savedVoice);
      }
    } catch {}
  }, [voices]);

  if (typeof window === "undefined" || !window.speechSynthesis) {
    return (
      <button
        disabled
        className="rounded-full border border-[#e5e7eb] px-4 py-2 text-xs text-[#9ca3af] dark:border-[#2a2a30] cursor-not-allowed"
        title="Síntese de voz não suportada neste navegador"
      >
        ▶ ouvir postagem (indisponível)
      </button>
    );
  }

  const hasText = chunksRef.current.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={speak}
          disabled={!hasText}
          aria-label={speaking ? (paused ? "Continuar leitura" : "Pausar leitura") : "Ouvir postagem"}
          className={`rounded-full border px-4 py-2 text-xs transition ${
            !hasText
              ? "border-[#e5e7eb] text-[#9ca3af] cursor-not-allowed dark:border-[#2a2a30]"
              : speaking
              ? "border-[#9333ea] bg-[#9333ea]/10 text-[#9333ea]"
              : "border-[#e5e7eb] dark:border-[#2a2a30]"
          }`}
        >
          {speaking ? (paused ? "▶ continuar" : "⏸ pausar") : "▶ ouvir postagem"}
        </button>
        {speaking && (
          <button
            onClick={stop}
            aria-label="Parar leitura"
            className="rounded-full border border-[#e5e7eb] px-3 py-2 text-xs hover:border-[#ef4444] hover:text-[#ef4444] transition dark:border-[#2a2a30]"
          >
            ■ parar
          </button>
        )}
      </div>

      {speaking && chunksRef.current.length > 1 && (
        <div className="text-[11px] text-[#9ca3af] font-mono">
          Parte {currentChunk + 1} de {chunksRef.current.length}
        </div>
      )}

      {voices.length > 1 && (
        <select
          value={voice?.name || ""}
          onChange={handleVoiceChange}
          className="rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-3 py-1.5 text-xs dark:border-[#2a2a30] dark:bg-[#17171c]"
          aria-label="Selecionar voz"
        >
          <option value="">Voz padrão do navegador</option>
          {voices
            .filter(v => v.lang.startsWith("pt") || v.lang.startsWith("en"))
            .map(v => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
        </select>
      )}
    </div>
  );
}