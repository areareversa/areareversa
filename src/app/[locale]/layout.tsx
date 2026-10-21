import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/routing";

/**
 * Diz ao Next quais locales existem. Sem isto o segmento `[locale]` fica sem
 * parâmetros estáticos e, em produção, o `notFound()`/`getMessages()` aqui
 * dispara `DYNAMIC_SERVER_USAGE` (500 nas páginas de artigo).
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}