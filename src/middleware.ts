import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  /**
   * /blog/<slug>.md → /blog-md/<slug> (interno)
   *
   * A especificação llms.txt pede que cada página tenha uma versão markdown na
   * mesma URL, com a extensão trocada. O App Router não aceita "[slug].md" como
   * pasta de rota, então o rewrite acontece aqui. O que o agente vê continua
   * sendo /blog/fulano.md.
   */
  const mdMatch = pathname.match(/^\/blog\/([^/]+)\.md$/);

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data:",
    "font-src 'self'",
    "media-src 'self' https:",
    "connect-src 'self' https:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  // o rewrite precisa acontecer ANTES dos headers, mas sem pular os headers:
  // o markdown também é uma resposta da aplicação e merece as mesmas proteções.
  const response = mdMatch
    ? (() => {
        const url = request.nextUrl.clone();
        url.pathname = `/blog-md/${mdMatch[1]}`;
        return NextResponse.rewrite(url);
      })()
    : NextResponse.next();

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Pass nonce to client via header for Script components
  response.headers.set("x-nonce", nonce);

  /**
   * Header Link: para agentes, conforme a especificação llms.txt.
   *   rel="alternate" type="text/markdown" → a mesma página em markdown
   *   rel="describedby"                   → o llms.txt que cobre esta URL
   * O header serve para recursos que não são HTML (o próprio markdown),
   * então dá pra adicionar sem mexer em cada página.
   */
  if (!mdMatch && (pathname === "/" || pathname === "/blog" || pathname.startsWith("/blog/"))) {
    const slug = pathname.startsWith("/blog/") ? pathname.slice("/blog/".length) : "";
    const parts = [`<${origin}/llms-full.txt>; rel="alternate"; type="text/markdown"`];
    if (slug && !slug.includes(".")) {
      parts.unshift(`<${origin}/blog/${slug}.md>; rel="alternate"; type="text/markdown"`);
    }
    parts.push(`<${origin}/llms.txt>; rel="describedby"`);
    response.headers.set("Link", parts.join(", "));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$).*)",
  ],
};