import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-neutral-200 dark:border-[#44475a]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-mono text-lg font-bold tracking-tight">
          área<span className="text-neutral-400">reversa</span>
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-6 font-mono text-sm">
          <Link href="/blog" className="hover:underline underline-offset-4">blog</Link>
          <Link href="/podcast" className="hover:underline underline-offset-4">podcast</Link>
          <a href="#contato" className="hover:underline underline-offset-4">contato</a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const links = Object.entries(site.links);
  return (
    <footer id="contato" className="border-t border-neutral-200 dark:border-[#44475a]">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 text-sm text-neutral-500">
        <div className="flex flex-wrap gap-5 font-mono">
          {links.map(([k, v]) => (
            <a key={k} href={v} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4">
              {k}
            </a>
          ))}
        </div>
        <p>
          contato:{" "}
          <a href={`mailto:${process.env.SITE_EMAIL}`} className="underline underline-offset-4">
            {process.env.SITE_EMAIL ?? "areareversa@gmail.com"}
          </a>
        </p>
        <p>© {new Date().getFullYear()} {site.name} — {site.tagline}</p>
      </div>
    </footer>
  );
}
