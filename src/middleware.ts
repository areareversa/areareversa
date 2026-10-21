import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing, locales } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Rotas que vivem fora da árvore `[locale]` (o site antigo, em português,
 * ainda serve `/admin`, `/sobre`, `/salvos` e `/tag`). Sem esta lista o
 * segmento dinâmico `[locale]` engolia esses caminhos, tentava tratá-los como
 * um idioma e devolvia 404.
 */
const NON_LOCALIZED_PREFIXES = ["/admin", "/sobre", "/salvos", "/tag", "/api", "/blog-md"];

function hasLocalePrefix(pathname: string) {
  const first = pathname.split("/")[1] ?? "";
  return (locales as readonly string[]).includes(first);
}

function isNonLocalized(pathname: string) {
  if (hasLocalePrefix(pathname)) return false;
  return NON_LOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas sem tradução seguem direto para o App Router.
  if (isNonLocalized(pathname)) {
    return NextResponse.next();
  }

  /**
   * O next-intl já resolve `/` para o locale padrão em `localePrefix:
   * "as-needed"` (reescreve para /pt-BR por dentro, sem mudar a URL). Só
   * aproveitamos a resposta dele para gravar o cookie de idioma, que o
   * requests.ts do next-intl lê nas próximas visitas.
   */
  const response = intlMiddleware(request);
  if (pathname === "/") {
    response.cookies.set("NEXT_LOCALE", routing.defaultLocale, { path: "/", sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
