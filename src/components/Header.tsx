import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#e5e7eb] bg-white/80 backdrop-blur-md dark:border-[#2a2a30] dark:bg-[#0f0f12]/80">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          área<span className="text-[#9333ea]">reversa</span>
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-6 text-sm">
          <Link href="/blog" className="text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8]">blog</Link>
          <Link href="/podcast" className="text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8]">podcast</Link>
          <a href="#contato" className="text-[#4b5563] hover:text-[#9333ea] dark:text-[#d4d4d8]">contato</a>
          <ThemeToggle />
          <Link
            href="/blog"
            className="rounded-full bg-[#0f0f12] px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-[#0f0f12]"
          >
            Começar →
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const links = Object.entries(site.links);
  return (
    <footer id="contato" className="border-t border-[#e5e7eb] dark:border-[#2a2a30]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-12 text-sm text-[#4b5563] dark:text-[#d4d4d8]">
        <p className="font-semibold text-[#0f0f12] dark:text-white">área<span className="text-[#9333ea]">reversa</span></p>
        <div className="flex flex-wrap gap-5">
          {links.map(([k, v]) => (
            <a key={k} href={v} target="_blank" rel="noreferrer" className="hover:text-[#9333ea]">
              {k}
            </a>
          ))}
        </div>
        <p>
          contato:{" "}
          <a href={`mailto:${process.env.SITE_EMAIL}`} className="text-[#9333ea] hover:underline underline-offset-4">
            {process.env.SITE_EMAIL ?? "areareversa@gmail.com"}
          </a>
        </p>
        <p className="text-xs text-[#9ca3af]">© {new Date().getFullYear()} {site.name} — {site.tagline}</p>
      </div>
    </footer>
  );
}
