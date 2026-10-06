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

  const btn = "rounded-full border border-neutral-300 px-4 py-2 font-mono text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-xs uppercase text-neutral-400">compartilhar</span>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}>whatsapp</a>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}>x</a>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}>facebook</a>
      <button onClick={copiar} className={btn}>{copiado ? "copiado ✓" : "copiar link"}</button>
    </div>
  );
}
