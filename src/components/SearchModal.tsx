"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GAEvents } from "@/lib/gaEvents";

type Result = { slug: string; title: string; excerpt: string; category: string };

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-[#9333ea]/20 text-[#9333ea] rounded px-[1px]">{part}</mark>
      : part
  );
}

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
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

  // Debounced search
  useEffect(() => {
    if (!open || !q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.posts ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelectedIndex(-1);
    }
  }, [open]);

  // Keyboard navigation in results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const result = results[selectedIndex];
      setOpen(false);
      router.push(`/blog/${result.slug}`);
      GAEvents.searchClickResult(q, result.title, `/blog/${result.slug}`, selectedIndex + 1);
    }
  }, [open, results, selectedIndex, q, router]);

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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6 pt-24 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-[#2a2a30] dark:bg-[#17171c]" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar posts..."
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-3 text-sm outline-none focus:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#0f0f12]"
          aria-label="Buscar posts"
          aria-autocomplete="list"
          aria-controls="search-results"
        />
        <ul id="search-results" className="mt-3 flex flex-col" role="listbox">
          {loading && (
            <li className="px-3 py-4 text-sm text-[#9ca3af] flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#9333ea]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Buscando...
            </li>
          )}
          {results.map((r, i) => (
            <li key={r.slug} role="option" aria-selected={selectedIndex === i}>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/blog/${r.slug}`);
                  GAEvents.searchClickResult(q, r.title, `/blog/${r.slug}`, i + 1);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedIndex === i
                    ? "bg-[#9333ea]/10 outline-none ring-2 ring-[#9333ea]/30"
                    : "hover:bg-[#9333ea]/10"
                }`}
              >
                <span className="font-semibold block">{highlight(r.title, q)}</span>
                <span className="ml-2 text-xs text-[#9ca3af]">{r.category}</span>
                {r.excerpt && <span className="block mt-1 text-xs text-[#6b7280] line-clamp-1">{highlight(r.excerpt, q)}</span>}
              </button>
            </li>
          ))}
          {!loading && results.length === 0 && q.trim() && (
            <li className="px-3 py-4 text-sm text-[#9ca3af]">Nenhum resultado para "{q}".</li>
          )}
          {!loading && results.length === 0 && !q.trim() && (
            <li className="px-3 py-4 text-sm text-[#9ca3af]">Digite para buscar...</li>
          )}
        </ul>
        <p className="mt-3 text-[11px] text-[#9ca3af] text-center">
          <kbd className="rounded border border-[#e5e7eb] px-1.5 py-0.5 dark:border-[#2a2a30]">↑</kbd> / <kbd className="rounded border border-[#e5e7eb] px-1.5 py-0.5 dark:border-[#2a2a30]">↓</kbd> navega · <kbd className="rounded border border-[#e5e7eb] px-1.5 py-0.5 dark:border-[#2a2a30]">Enter</kbd> abre · <kbd className="rounded border border-[#e5e7eb] px-1.5 py-0.5 dark:border-[#2a2a30]">Esc</kbd> fecha
        </p>
      </div>
    </div>
  );
}