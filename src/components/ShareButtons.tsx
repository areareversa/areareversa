"use client";

import { useState } from "react";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copiado, setCopiado] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const btn = "rounded-full border border-[#e5e7eb] px-4 py-2 text-xs transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30]";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">compartilhar</span>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}>whatsapp</a>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}>x</a>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}>facebook</a>
      <button onClick={copiar} className={btn}>{copiado ? "copiado ✓" : "copiar link"}</button>
    </div>
  );
}

