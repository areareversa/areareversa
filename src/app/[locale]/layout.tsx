import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { headers } from "next/headers";
import "@/app/globals.css";

import { Header, Footer } from "@/components/Header";
import { Tracker } from "@/components/Tracker";
import { WebVitals } from "@/components/WebVitals";
import { CookieConsent } from "@/components/CookieConsent";
import { GAProvider } from "@/components/GAProvider";
import { StructuredDataWebSite, StructuredDataOrganization } from "@/components/StructuredData";
import { PlayerWrapper } from "@/components/PlayerWrapper";
import { FocusModeProvider } from "@/components/FocusMode";
import { site } from "@/lib/site";
import { getLocale as getLocaleConfig } from "@/i18n/request";

const jakarta = localFont({ src: "../../../public/fonts/plus-jakarta-sans.woff2", weight: "100 900", variable: "--font-jakarta", display: "optional" });
const jetbrains = localFont({ src: "../../../public/fonts/jetbrains-mono.woff2", weight: "100 800", variable: "--font-jetbrains", display: "optional" });

const GA_ID = "G-FRTNFD1KQD";

async function getNonce() {
  const headersList = await headers();
  return headersList.get("x-nonce") ?? "";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  
  return {
    metadataBase: new URL(site.url),
    title: { default: `${messages.name} — ${messages.tagline}`, template: `%s · ${messages.name}` },
    description: messages.description,
    openGraph: {
      siteName: messages.name,
      title: `${messages.name} — ${messages.tagline}`,
      description: messages.description,
      locale: locale.replace('-', '_'),
      type: "website",
    },
    alternates: { types: { "application/rss+xml": "/rss.xml" } },
  };
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const nonce = await getNonce();
  const messages = await getMessages({ locale });
  
  const localeMap: Record<string, string> = {
    'pt-BR': 'pt-BR',
    'en-US': 'en-US',
    'es-ES': 'es-ES',
    'ar-PS': 'ar-PS'
  };
  
  const htmlLang = localeMap[locale] || 'pt-BR';
  const dir = locale.startsWith('ar') ? 'rtl' : 'ltr';

  return (
    <html lang={htmlLang} dir={dir} className={`${jakarta.variable} ${jetbrains.variable} dark`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white text-[#0f0f12] antialiased dark:bg-[#0f0f12] dark:text-white">
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ar_theme_v2');if(t==='light'){document.documentElement.classList.remove('dark')}else if(t==='dark'){document.documentElement.classList.add('dark')}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        {/* Fallback client-side redirect for root path */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.location.pathname==='/'){window.location.href='/pt-BR/';}}catch(e){}}())`,
          }}
        />
        <NextIntlClientProvider messages={await getMessages({ locale })} locale={locale}>
          <FocusModeProvider>
            <PlayerWrapper>
              <Header />
              <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded-lg focus:bg-[#9333ea] focus:px-4 focus:py-2 focus:text-white">
                Pular para o conteúdo
              </a>
              <CookieConsent />
              <GAProvider />
              <Tracker />
              <WebVitals />
              <main id="conteudo" className="mx-auto min-h-[60vh] w-full max-w-6xl px-6 pt-24 pb-16">{children}</main>
            </PlayerWrapper>
          </FocusModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}