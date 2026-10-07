"use client";

import { useEffect } from "react";

export function ContentLoader() {
  useEffect(() => {
    const saved = sessionStorage.getItem("ar_ai_content");
    if (saved) {
      let texto = saved;
      let tema = "";
      try {
        const parsed = JSON.parse(saved);
        texto = parsed.texto ?? "";
        tema = parsed.tema ?? "";
      } catch {}

      const ta = document.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
      if (ta) ta.value = texto;

      const titulo = document.querySelector<HTMLInputElement>('input[name="title"]');
      if (titulo) {
        const h1 = texto.match(/^#\s+(.+)$/m);
        titulo.value = (h1?.[1] ?? tema).trim();
      }

      const resumo = document.querySelector<HTMLInputElement>('input[name="excerpt"]');
      if (resumo) {
        const primeiroParagrafo = texto
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith("!["));
        resumo.value = (primeiroParagrafo ?? "").replace(/[*_`>]/g, "").slice(0, 180);
      }

      sessionStorage.removeItem("ar_ai_content");
    }
  }, []);
  return null;
}
