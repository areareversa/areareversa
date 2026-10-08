"use client";

import { useEffect, useRef, useState } from "react";

export function TtsReader({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  function toggle() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const plain = text.replace(/[#>*`\[\]()]/g, " ").replace(/https?:\/\/\S+/g, "");
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = "pt-BR";
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  return (
    <button
      onClick={toggle}
      aria-label={speaking ? "Parar leitura" : "Ouvir postagem"}
      className={`rounded-full border px-4 py-2 text-xs transition ${speaking ? "border-[#9333ea] text-[#9333ea]" : "border-[#e5e7eb] dark:border-[#2a2a30]"}`}
    >
      {speaking ? "■ parar" : "▶ ouvir postagem"}
    </button>
  );
}
