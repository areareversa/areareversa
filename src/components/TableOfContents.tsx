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
    /**
     * O sumário mora na margem direita do artigo, e a conta é apertada.
     *
     * O artigo é `max-w-2xl` (672 px) centralizado, então a borda direita dele
     * está em `50% + 336 px`. Para caber, o sumário precisa de 256 px de
     * largura mais uma folga de 16 px: borda direita em `50% + 608 px`.
     * Isso só cabe se a janela tiver 2 × 608 = 1216 px ou mais.
     *
     * Antes o `left` era `50% + 34rem` (544 px) e o aparecimento vinha em
     * `lg:` (1024 px). Entre 1024 e 1599 px o painel saía da tela: numa janela
     * de 1366 px, que é a resolução clássica de desktop, só 139 dos 256 px
     * apareciam — o sumário saía pela metade. Aqui a folga encolhe para 16 px
     * e o corte vai para 1280 px, a menor largura com sobra real.
     *
     * Abaixo de 1280 px não há margem que caiba: sobra 176 px de cada lado do
     * artigo numa tela de 1024, e o painel precisa de 256. Esconder é a única
     * saída honesta — sobrepor o artigo seria pior. `xl` do Tailwind já é
     * 1280 px, então não precisa de variante arbitrária.
     */
    <nav
      ref={containerRef}
      aria-label="Sumário"
      className="hidden xl:block fixed top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto border-l border-[#e5e7eb] px-4 py-4 dark:border-[#2a2a30]"
      style={{ left: "calc(50% + 22rem)" }}
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