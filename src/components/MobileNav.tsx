"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchModal } from "./SearchModal";
import { ThemeToggle } from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

const LOCALES = ["pt-BR", "en-US", "es-ES"];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname() ?? "/";

  // Mesma regra do header desktop: o prefixo de idioma sai da URL atual para o
  // menu não jogar quem está em /en-US de volta no português.
  const first = pathname.split("/")[1] ?? "";
  const locale = LOCALES.includes(first) ? first : "pt-BR";
  const pref = locale === "pt-BR" ? "" : `/${locale}`;

  // Esc fecha o menu, e o foco volta para o botão que o abriu — sem isso o
  // teclado continua "perdido" no menu que acabou de sumir da tela.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        ref={botaoRef}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="menu-mobile"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] text-sm dark:border-[#2a2a30] sm:hidden"
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>
      {open && (
        <nav
          id="menu-mobile"
          aria-label="Navegação mobile"
          className="absolute inset-x-0 top-[72px] flex flex-col gap-1 border-b border-[#e5e7eb] bg-white p-4 text-sm sm:hidden dark:border-[#2a2a30] dark:bg-[#0f0f12]"
          onClick={() => setOpen(false)}
        >
          <div className="mb-2 flex justify-center">
            <SearchModal />
          </div>
          <Link href={`${pref}/blog`} className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">
            blog
          </Link>
          <Link href={`${pref}/podcast`} className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">
            podcast
          </Link>
          <Link href="/salvos" className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">
            salvos
          </Link>
          <a href="#contato" className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">
            contato
          </a>
          <Link
            href={`${pref}/blog`}
            className="mt-1 rounded-[14px] bg-[#0f0f12] px-4 py-2.5 text-center font-semibold text-white dark:bg-white dark:text-[#0f0f12]"
          >
            Começar →
          </Link>
          <div className="mt-2 flex justify-center">
            <LanguageSwitcher />
          </div>
          <div className="mt-2 flex justify-center">
            <ThemeToggle />
          </div>
        </nav>
      )}
    </>
  );
}