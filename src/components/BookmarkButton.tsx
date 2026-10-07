"use client";

import { useEffect, useState } from "react";

const KEY = "ar_saved";

export function getSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function BookmarkButton({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(getSaved().includes(slug)), [slug]);

  function toggle() {
    const list = getSaved();
    const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next.includes(slug));
  }

  return (
    <button
      onClick={toggle}
      title={title}
      className={`rounded-full border px-4 py-2 text-xs transition ${saved ? "border-[#9333ea] bg-[#9333ea]/10 text-[#9333ea]" : "border-[#e5e7eb] dark:border-[#2a2a30]"}`}
    >
      {saved ? "★ salvo" : "☆ salvar"}
    </button>
  );
}
