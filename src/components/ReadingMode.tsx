"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "ar_reading_font_size_v1";

export function ReadingMode() {
  const [size, setSize] = useState(() => {
    if (typeof window === "undefined") return 100;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return Math.max(80, Math.min(140, parseInt(stored, 10)));
    } catch {}
    return 100;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--article-font-size", `${size}%`);
    try {
      localStorage.setItem(STORAGE_KEY, String(size));
    } catch {}
  }, [size]);

  return (
    <div className="flex items-center gap-2 text-sm" role="group" aria-label="Controles de tamanho da fonte">
      <span className="text-[#9ca3af]">leitura</span>
      <button
        onClick={() => setSize((s) => Math.max(80, s - 10))}
        className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-xs dark:border-[#2a2a30] hover:border-[#9333ea] hover:text-[#9333ea] transition"
        aria-label="Diminuir fonte"
      >
        A-
      </button>
      <span className="w-10 text-center text-xs font-mono text-[#4b5563] dark:text-[#d4d4d8]">{size}%</span>
      <button
        onClick={() => setSize((s) => Math.min(140, s + 10))}
        className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-xs dark:border-[#2a2a30] hover:border-[#9333ea] hover:text-[#9333ea] transition"
        aria-label="Aumentar fonte"
      >
        A+
      </button>
      <button
        onClick={() => setSize(100)}
        className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-xs dark:border-[#2a2a30] hover:border-[#9333ea] hover:text-[#9333ea] transition"
        aria-label="Resetar fonte"
        title="Resetar (100%)"
      >
        ⟳
      </button>
    </div>
  );
}