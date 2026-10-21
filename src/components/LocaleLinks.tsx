"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

const LOCALES = ["pt-BR", "en-US", "es-ES"];

/**
 * Links do header cientes do idioma.
 *
 * O Header vive no layout raiz, que também serve o português (fora do
 * `[locale]`). Os links dele eram fixos em pt-BR, então quem estava em
 * `/en-US` e clicava em "blog" caía no blog em português. Aqui o prefixo sai
 * da própria URL, mantendo a navegação no idioma em que a pessoa está.
 *
 * Não usa o contexto do next-intl de propósito: o layout raiz não tem o
 * `NextIntlClientProvider` nas rotas em português, então `useTranslations`
 * estouraria lá. Os rótulos do menu são os mesmos em qualquer idioma.
 *
 * As rotas que só existem em português (`/tags`, `/sobre`, `/salvos`) não são
 * afetadas: sem tradução, o prefixo não é aplicado e o link continua válido.
 */
export function LocaleLinks({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const params = useParams();

  const first = pathname.split("/")[1] ?? "";
  const locale = LOCALES.includes(first) ? first : "pt-BR";
  const pref = locale === "pt-BR" ? "" : `/${locale}`;

  // Repõe parâmetros dinâmicos (ex.: slug do artigo) no destino.
  function href(path: string) {
    let out = `${pref}${path}`;
    for (const [k, v] of Object.entries(params ?? {})) {
      if (typeof v === "string") out = out.replace(`[${k}]`, v);
    }
    return out;
  }

  const cls = "text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8]";

  return (
    <nav aria-label="Navegação principal" className={className}>
      <Link href={href("/blog")} className={cls}>
        blog
      </Link>
      <Link href={href("/podcast")} className={cls}>
        podcast
      </Link>
      <Link href="/tags" className={cls}>
        tags
      </Link>
      <Link href="/sobre" className={cls}>
        sobre
      </Link>
      <Link href="/salvos" className={cls}>
        salvos
      </Link>
      <a href="#contato" className={cls}>
        contato
      </a>
    </nav>
  );
}

/**
 * Botão "Começar →" do header, também ciente do idioma: aponta para o blog no
 * idioma em que a pessoa está.
 */
export function LocaleStartButton() {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/")[1] ?? "";
  const locale = LOCALES.includes(first) ? first : "pt-BR";
  const href = locale === "pt-BR" ? "/blog" : `/${locale}/blog`;

  return (
    <Link
      href={href}
      className="rounded-full bg-[#0f0f12] px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-[#0f0f12]"
    >
      Começar →
    </Link>
  );
}

/**
 * Link da marca (logo) no header. Sem isto, quem está em `/en-US` volta para a
 * home em português ao clicar no logo.
 */
export function LocaleBrandLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/")[1] ?? "";
  const locale = LOCALES.includes(first) ? first : "pt-BR";
  const href = locale === "pt-BR" ? "/" : `/${locale}`;

  return (
    <Link href={href} aria-label="área reversa" className={className}>
      {children}
    </Link>
  );
}
