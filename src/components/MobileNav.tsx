"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] text-sm dark:border-[#2a2a30] sm:hidden"
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <nav
          aria-label="Navegação mobile"
          className="absolute inset-x-0 top-[72px] flex flex-col gap-1 border-b border-[#e5e7eb] bg-white p-4 text-sm sm:hidden dark:border-[#2a2a30] dark:bg-[#0f0f12]"
          onClick={() => setOpen(false)}
        >
          <Link href="/blog" className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">blog</Link>
          <Link href="/podcast" className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">podcast</Link>
          <Link href="/salvos" className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">salvos</Link>
          <a href="#contato" className="rounded-lg px-3 py-2.5 hover:bg-[#9333ea]/10">contato</a>
          <Link href="/blog" className="mt-1 rounded-[14px] bg-[#0f0f12] px-4 py-2.5 text-center font-semibold text-white dark:bg-white dark:text-[#0f0f12]">Começar →</Link>
          <div className="mt-2 flex justify-center"><ThemeToggle /></div>
        </nav>
      )}
    </>
  );
}
