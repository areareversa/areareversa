import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({ src: "../../public/fonts/plus-jakarta-sans.woff2", weight: "100 900", variable: "--font-jakarta", display: "swap" });
const jetbrains = localFont({ src: "../../public/fonts/jetbrains-mono.woff2", weight: "100 800", variable: "--font-jetbrains", display: "swap" });
import { Header, Footer } from "@/components/Header";
import { Tracker } from "@/components/Tracker";
import { site } from "@/lib/site";

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
      <body className="bg-white text-[#0f0f12] antialiased dark:bg-[#0f0f12] dark:text-white">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ar_theme');if(t==='light'){document.documentElement.classList.remove('dark')}}catch(e){}`,
          }}
        />
        <Header />
        <Tracker />
        <main className="mx-auto min-h-[60vh] w-full max-w-6xl px-6 pt-24 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
