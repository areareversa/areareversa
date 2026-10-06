import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/Header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <Header />
        <main className="mx-auto min-h-[60vh] max-w-5xl px-6 py-12">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
