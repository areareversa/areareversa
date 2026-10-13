import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const jakarta = localFont({ src: "../../public/fonts/plus-jakarta-sans.woff2", weight: "100 900", variable: "--font-jakarta", display: "optional" });
const jetbrains = localFont({ src: "../../public/fonts/jetbrains-mono.woff2", weight: "100 800", variable: "--font-jetbrains", display: "optional" });
import { Header, Footer } from "@/components/Header";
import { GAProvider } from "@/components/GAProvider";
import { StructuredDataWebSite, StructuredDataOrganization } from "@/components/StructuredData";
import { PlayerWrapper } from "@/components/PlayerWrapper";
import { FocusModeProvider } from "@/components/FocusMode";
import { LazyCookieConsent, LazyTracker, LazyWebVitals } from "@/components/LazyClient";
import { IdleMount } from "@/components/IdleMount";
import { site } from "@/lib/site";

const GA_ID = "G-FRTNFD1KQD";


export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    locale: "pt_BR",
    type: "website",
  },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${jetbrains.variable} dark`}>
      <head>
        {/* endpoint de webmention: mesmo para todas as páginas, então vai aqui */}
        <link
          rel="webmention"
          href={`${(process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br").replace(/\/+$/, "")}/api/webmention`}
        />
        <link rel="micropub" href={`${(process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br").replace(/\/+$/, "")}/api/webmention`} />
      </head>
      <body className="bg-white text-[#0f0f12] antialiased dark:bg-[#0f0f12] dark:text-white">
        <script src="/theme.js" />
        <FocusModeProvider>
        <PlayerWrapper>
          <Header />
          <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded-lg focus:bg-[#9333ea] focus:px-4 focus:py-2 focus:text-white">
            Pular para o conteúdo
          </a>
          <IdleMount>
            <LazyCookieConsent />
          </IdleMount>
          <GAProvider />
          <StructuredDataWebSite />
          <StructuredDataOrganization />
          {/*
            Tracking e Core Web Vitals nao atrapalham a leitura e nao precisam
            estar no primeiro carregamento. Entram quando o navegador fica
            ocioso, depois que a pagina ja apareceu.
          */}
          <IdleMount>
            <LazyTracker />
            <LazyWebVitals />
          </IdleMount>
          <main id="conteudo" className="mx-auto min-h-[60vh] w-full max-w-6xl px-6 pt-24 pb-16">{children}</main>
          <Footer />
        </PlayerWrapper>
      </FocusModeProvider>
      </body>
    </html>
  );
}
