import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const jakarta = localFont({ src: "../../public/fonts/plus-jakarta-sans.woff2", weight: "100 900", variable: "--font-jakarta", display: "swap" });
const jetbrains = localFont({ src: "../../public/fonts/jetbrains-mono.woff2", weight: "100 800", variable: "--font-jetbrains", display: "swap" });
import { Header, Footer } from "@/components/Header";
import { Tracker } from "@/components/Tracker";
import { WebVitals } from "@/components/WebVitals";
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
      <Script
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `,
        }}
      />
      <Script
        strategy="beforeInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <body className="bg-white text-[#0f0f12] antialiased dark:bg-[#0f0f12] dark:text-white">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ar_theme_v2');if(t==='light'){document.documentElement.classList.remove('dark')}}catch(e){}`,
          }}
        />
        <Header />
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded-lg focus:bg-[#9333ea] focus:px-4 focus:py-2 focus:text-white">
          Pular para o conteúdo
        </a>
        <Tracker />
        <WebVitals />
        <main id="conteudo" className="mx-auto min-h-[60vh] w-full max-w-6xl px-6 pt-24 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
