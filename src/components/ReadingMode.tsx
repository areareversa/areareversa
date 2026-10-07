"use client";

import { useState } from "react";

export function ReadingMode() {
  const [size, setSize] = useState(100);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[#9ca3af]">leitura</span>
      <button
        onClick={() => setSize((s) => Math.max(80, s - 10))}
        className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-xs dark:border-[#2a2a30]"
        aria-label="Diminuir fonte"
      >
        A-
      </button>
      <button
        onClick={() => setSize((s) => Math.min(140, s + 10))}
        className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-xs dark:border-[#2a2a30]"
        aria-label="Aumentar fonte"
      >
        A+
      </button>
      <style>{`.article-body { font-size: ${size}%; }`}</style>
    </div>
  );
}
