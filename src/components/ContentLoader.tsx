"use client";

import { useEffect } from "react";

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

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
      if (ta) setNativeValue(ta, texto);

      const titulo = document.querySelector<HTMLInputElement>('input[name="title"]');
      if (titulo) {
        const h1 = texto.match(/^#\s+(.+)$/m);
        setNativeValue(titulo, (h1?.[1] ?? tema).trim());
      }

      const slug = document.querySelector<HTMLInputElement>('input[name="slug"]');
      if (slug && titulo) {
        const s = (document.querySelector<HTMLInputElement>('input[name="title"]')?.value ?? "")
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        setNativeValue(slug, s);
      }

      const resumo = document.querySelector<HTMLInputElement>('input[name="excerpt"]');
      if (resumo) {
        const primeiroParagrafo = texto
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith("!["));
        setNativeValue(resumo, (primeiroParagrafo ?? "").replace(/[*_`>]/g, "").slice(0, 180));
      }

      sessionStorage.removeItem("ar_ai_content");
    }
  }, []);
  return null;
}
