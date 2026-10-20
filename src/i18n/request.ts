import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import type { GetRequestConfigParams } from "next-intl/server";

export const locales = ["pt-BR", "en-US", "es-ES"] as const;
export const defaultLocale = "pt-BR" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async (params) => {
  const locale = await params.requestLocale;
  if (!locale || !locales.includes(locale as Locale)) notFound();

  const validLocale = locale as Locale;

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default,
    timeZone: "America/Sao_Paulo",
    now: new Date(),
  };
});