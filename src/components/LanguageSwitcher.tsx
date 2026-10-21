"use client";

import { usePathname as useNextPathname, useRouter as useNextRouter, useParams } from "next/navigation";

const OPTIONS = [
  { code: "pt-BR", short: "PT", label: "Português" },
  { code: "en-US", short: "EN", label: "English" },
  { code: "es-ES", short: "ES", label: "Español" },
] as const;

const LOCALES = OPTIONS.map((o) => o.code) as readonly string[];

/**
 * Seletor de idioma do header.
 *
 * Lê o idioma da própria URL em vez do contexto do next-intl: o Header vive no
 * layout raiz, que também serve as páginas em português (fora do `[locale]`) e
 * por isso não tem o `NextIntlClientProvider`. Usar `useLocale` ali estouraria
 * no pt-BR.
 *
 * A troca preserva a página: tira o prefixo de idioma do caminho atual e
 * recoloca o novo, mantendo o slug (ex.: `/en-US/blog/x` ↔ `/blog/x` ↔
 * `/es-ES/blog/x`).
 *
 * Só aparece quando a pessoa está numa rota traduzida (prefixo de idioma) ou
 * na home em português — as rotas que existem apenas em pt-BR (`/sobre`,
 * `/salvos`, `/tag`, `/admin`) não têm equivalente traduzido e dariam 404.
 */
export default function LanguageSwitcher() {
  const pathname = useNextPathname();
  const router = useNextRouter();
  const params = useParams();

  const seg = (pathname ?? "/").split("/");
  const first = seg[1] ?? "";
  const current = LOCALES.includes(first) ? first : "pt-BR";

  // Fora da home e sem prefixo, estamos numa rota só-pt-BR: nada a trocar.
  const stripped = LOCALES.includes(first) ? `/${seg.slice(2).join("/")}` : pathname ?? "/";
  const isHomeOnly = stripped === "/" || stripped === "";
  const traduzida = LOCALES.includes(first) || isHomeOnly;
  if (!traduzida) return null;

  function trocar(next: (typeof OPTIONS)[number]["code"]) {
    if (next === current) return;
    // Repõe os parâmetros dinâmicos (slug, tag) no caminho de destino.
    const base = stripped.replace(/\/+$/, "");
    let destino = base;
    for (const [k, v] of Object.entries(params ?? {})) {
      if (typeof v === "string") destino = destino.replace(`[${k}]`, v);
    }
    destino = destino || "/";
    const url = next === "pt-BR" ? destino : `/${next}${destino === "/" ? "" : destino}`;
    router.push(url);
  }

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className="flex items-center gap-1 rounded-full border border-[#e5e7eb] p-0.5 dark:border-[#2a2a30]"
    >
      {OPTIONS.map((o) => {
        const ativo = o.code === current;
        return (
          <button
            key={o.code}
            onClick={() => trocar(o.code)}
            aria-pressed={ativo}
            title={o.label}
            className={[
              "rounded-full px-2 py-0.5 text-xs font-semibold transition",
              ativo
                ? "bg-[#9333ea] text-white"
                : "text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8]",
            ].join(" ")}
          >
            {o.short}
          </button>
        );
      })}
    </div>
  );
}
