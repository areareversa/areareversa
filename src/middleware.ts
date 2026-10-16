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

  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = [
    "default-src 'self'",
    /**
     * Sem nonce, e sem 'strict-dynamic'.
     *
     * O site usava `script-src 'self' 'nonce-…' 'strict-dynamic'`, com o nonce
     * gerado aqui. Isso desligava o site inteiro — e foi um bug silencioso,
     * porque o HTML se renderiza igual:
     *
     *  - 'strict-dynamic' faz o navegador **ignorar 'self'**. Só passa script
     *    com nonce, e nenhum <script> tinha: 0 de 18 na home, 0 de 21 no post.
     *  - o nonce precisa chegar no header da **requisição** (docs do Next,
     *    "How nonces work in Next.js"). Aqui ele ia no header da resposta.
     *  - nonce exige renderização **dinâmica** (docs, "Static vs Dynamic
     *    Rendering with CSP"), e o build marca /blog como estático e os posts
     *    como SSG. Script gerado em build não tem nonce para carimbar.
     *
     * Resultado: 16–17 violações de CSP por página, zero hidratação. Busca,
     * modo escuro, modo leitura, TTS, sumário, salvos, comentários, share e
     * newsletter não funcionavam — e o useScrollDepth por isso nunca registrava
     * evento. Entrou em c1dac30, em 09/10.
     *
     * A troca: perde-se a proteção estrita de script inline. Em troca o site
     * volta a ser estático, cacheável e rápido. Para voltar atrás: usar SRI
     * (experimental.sri no next.config, hash dos arquivos no build) ou aceitar
     * renderização dinâmica em todas as rotas.
     */
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
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

  // Sem x-nonce: sem nonce na política, o header não serve para nada.

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