"use client";

import { useEffect, useState, useRef } from "react";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const article = document.querySelector(".article-body");
    if (!article) return;

    const foundHeadings: Heading[] = [];
    article.querySelectorAll("h2, h3").forEach((h) => {
      const id = h.id || h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (id) {
        h.id = id;
        foundHeadings.push({
          id,
          text: h.textContent || "",
          level: h.tagName === "H2" ? 2 : 3,
        });
      }
    });
    setHeadings(foundHeadings);
  }, []);

  // IntersectionObserver for active heading
  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -66% 0px",
        threshold: 0,
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      ref={containerRef}
      aria-label="Sumário"
      className="hidden lg:block fixed left-[calc(50%+40rem)] top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-4 border-l border-[#e5e7eb] dark:border-[#2a2a30]"
      style={{ left: "calc(50% + 34rem)" }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af] mb-3 sticky top-0 bg-white/90 backdrop-blur dark:bg-[#0f0f12]/90 pb-2 border-b border-[#e5e7eb] dark:border-[#2a2a30]">
        Sumário
      </h3>
      <ul className="space-y-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${h.id}`}
              className={`block px-2 py-1 rounded transition ${
                activeId === h.id
                  ? "text-[#9333ea] font-semibold bg-[#9333ea]/5"
                  : "text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8] dark:hover:text-[#a855f7]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById(h.id);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.pushState(null, "", `#${h.id}`);
                  setActiveId(h.id);
                }
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}