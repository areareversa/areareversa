"use client";

import { useState, useEffect } from "react";
import { GAEvents } from "@/lib/gaEvents";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copiado, setCopiado] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    GAEvents.share("copy", url, title);
  }

  async function nativeShare() {
    if (!canNativeShare) return;
    try {
      await navigator.share({ title, text: title, url });
      GAEvents.share("native", url, title);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.warn("Native share failed:", e);
      }
    }
  }

  async function copiarEAbrir(appUrl: string, method: "instagram" | "tiktok") {
    await navigator.clipboard.writeText(`${title}\n${url}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    window.open(appUrl, "_blank");
    GAEvents.share(method, url, title);
  }

  const btn = "rounded-full border border-[#e5e7eb] px-4 py-2 text-xs transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30]";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">compartilhar</span>
      {canNativeShare && (
        <button
          onClick={nativeShare}
          className={`${btn} bg-[#9333ea] border-[#9333ea] text-white hover:bg-[#7e22ce] hover:border-[#7e22ce]`}
          title="Compartilhar nativamente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mr-1" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          nativo
        </button>
      )}
      <a className={btn} target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} onClick={() => GAEvents.share("whatsapp", url, title)}>
        whatsapp
      </a>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} onClick={() => GAEvents.share("twitter", url, title)}>
        x
      </a>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} onClick={() => GAEvents.share("linkedin", url, title)}>
        linkedin
      </a>
      <a className={btn} target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} onClick={() => GAEvents.share("facebook", url, title)}>
        facebook
      </a>
      <button onClick={() => copiarEAbrir("https://www.instagram.com/", "instagram")} className={btn} title="Copia o link e abre o Instagram pra colar no story/post">
        instagram
      </button>
      <button onClick={() => copiarEAbrir("https://www.tiktok.com/", "tiktok")} className={btn} title="Copia o link e abre o TikTok pra colar no vídeo">
        tiktok
      </button>
      <button onClick={copiar} className={btn}>{copiado ? "copiado ✓" : "copiar link"}</button>
    </div>
  );
}