"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Result = { slug: string; title: string; excerpt: string; category: string };

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setResults(d.posts ?? []))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-[#e5e7eb] px-4 py-1.5 text-xs text-[#9ca3af] transition hover:border-[#9333ea] sm:flex dark:border-[#2a2a30]"
        aria-label="Buscar (Ctrl+K)"
      >
        buscar… <kbd className="rounded border border-[#e5e7eb] px-1.5 py-0.5 dark:border-[#2a2a30]">Ctrl K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 pt-24 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-[#2a2a30] dark:bg-[#17171c]" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar posts..."
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-3 text-sm outline-none focus:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#0f0f12]"
        />
        <ul className="mt-3 flex flex-col">
          {results.map((r) => (
            <li key={r.slug}>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/blog/${r.slug}`);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#9333ea]/10"
              >
                <span className="font-semibold">{r.title}</span>
                <span className="ml-2 text-xs text-[#9ca3af]">{r.category}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-4 text-sm text-[#9ca3af]">Nenhum resultado.</li>}
        </ul>
      </div>
    </div>
  );
}
