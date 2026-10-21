import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing, locales } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * O português é o idioma de origem e vive sem prefixo (`localePrefix:
 * "as-needed"`). As rotas em pt-BR são arquivos normais do App Router
 * (`src/app/page.tsx`, `src/app/blog`, `src/app/podcast`, ...) — a landing
 * original, com as seções que sempre existiram, é a de `/`.
 *
 * O `[locale]` existe para os idiomas traduzidos (`/en-US/...`, `/es-ES/...`).
 * Se o next-intl reescrevesse `/` para `/pt-BR`, ele cairia na home traduzida e
 * a landing original sumiria. Por isso deixamos os caminhos sem prefixo
 * seguirem direto para o App Router e só entregamos ao next-intl o que tem
 * prefixo de idioma de verdade.
 */
function hasLocalePrefix(pathname: string) {
  const first = pathname.split("/")[1] ?? "";
  return (locales as readonly string[]).includes(first);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Já tem prefixo de idioma: next-intl resolve (`/en-US/...`, `/es-ES/...`).
  if (hasLocalePrefix(pathname)) {
    return intlMiddleware(request);
  }

  /**
   * Sem prefixo = pt-BR (idioma padrão). Segue direto para o App Router, que
   * tem a landing, o blog e o podcast originais. O cookie de idioma só orienta
   * as próximas visitas de quem trocar de idioma no seletor.
   */
  const response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", routing.defaultLocale, { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
