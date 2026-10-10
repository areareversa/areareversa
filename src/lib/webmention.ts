import { prisma } from "./prisma";
import { getSetting } from "./settings";

/**
 * Webmentions (indieweb).
 *
 * Fluxo de entrada:
 *   1. outro site faz POST em /api/webmention com o header `Source`
 *      e o campo `target` apontando para um post daqui
 *   2. baixamos a página de origem e confirmamos que ela realmente
 *      contém um link para o target (anti-spam)
 *   3. extraímos o h-entry (microformats2) e guardamos como "pending"
 *   4. o admin aprova/responde em /admin/mencoes
 */

export const WEBMENTION_TYPES = {
  reply: "resposta",
  like: "curtida",
  repost: "republicação",
  mention: "menção",
  bookend: "link",
} as const;

export type WebmentionType = keyof typeof WEBMENTION_TYPES;

const UA =
  "Mozilla/5.0 (compatible; area-reversa/1.0; +https://areareversa.com.br/about)";
const TIMEOUT_MS = 8000;
const MAX_BYTES = 512_000;

function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    "#39": "'",
    "#34": '"',
  };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&([a-z]+|#\d+);/gi, (m, n) => named[n.toLowerCase()] ?? m);
}

/** Texto puro a partir de HTML — nunca devolve marcação (evita XSS no admin). */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max).trimEnd() + "…";
}

/** Hostnames que nunca podem ser buscados (SSRF / loopback). */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;

  if (h === "::1" || h === "::") return true;
  // IPv6 unique-local (fc00::/7)
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true;

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return false;

  const a = Number(v4[1]);
  const b = Number(v4[2]);
  if (a === 0 || a === 127) return true; // este host / loopback
  if (a === 10) return true; // privado
  if (a === 172 && b >= 16 && b <= 31) return true; // privado
  if (a === 192 && b === 168) return true; // privado
  if (a === 169 && b === 254) return true; // link-local
  if (a >= 224) return true; // multicast / reservado
  return false;
}

export function isSafeRemoteUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (isBlockedHost(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  if (!isSafeRemoteUrl(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return null;

    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("html") && !ctype.includes("xml")) return null;

    const raw = await res.text();
    return { html: raw.slice(0, MAX_BYTES), finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Confere que a página de origem realmente referencia o target. */
export async function sourceLinksToTarget(
  html: string,
  targetUrl: string
): Promise<boolean> {
  const targetPath = new URL(targetUrl).pathname;
  const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi)].map((m) =>
    decodeEntities(m[1])
  );

  return links.some((href) => {
    let resolved: URL;
    try {
      resolved = new URL(href, targetUrl);
    } catch {
      return false;
    }
    const target = new URL(targetUrl);
    if (resolved.origin !== target.origin) return false;
    return resolved.pathname === targetPath;
  });
}

/** Encontra o primeiro elemento com a classe pedida e devolve o HTML interno. */
function pickByClass(html: string, cls: string): string | null {
  const re = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\bclass\\s*=\\s*["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    "i"
  );
  const m = html.match(re);
  return m ? m[2] : null;
}

function metaContent(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]*(?:property|name)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
      "i"
    );
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

function attrOf(html: string, cls: string, attr: string): string | null {
  const re = new RegExp(
    `<[a-z0-9]+\\b[^>]*\\bclass\\s*=\\s*["'][^"']*\\b${cls}\\b[^"']*["'][^>]*\\b${attr}\\s*=\\s*["']([^"']*)["']`,
    "i"
  );
  const m = html.match(re);
  return m?.[1] ? decodeEntities(m[1]) : null;
}

function titleOf(html: string): string | null {
  const og = metaContent(html, "og:title", "twitter:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?.[1] ? truncate(decodeEntities(m[1]).trim(), 200) : null;
}

function absolute(href: string | null, base: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export type ParsedMention = {
  type: WebmentionType;
  title: string | null;
  authorName: string | null;
  authorUrl: string | null;
  authorPhoto: string | null;
  content: string | null;
  published: string | null;
};

type DetectInput = { html: string; target: string };

function detectType({ html, target }: DetectInput): WebmentionType {
  const targetPath = new URL(target).pathname;
  const anchors = [...html.matchAll(/<a\b([^>]*)>/gi)].map((m) => m[1]);
  const relOf = (attrs: string) =>
    (attrs.match(/\brel\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").toLowerCase();

  for (const attrs of anchors) {
    const href = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1];
    const resolved = absolute(href ? decodeEntities(href) : null, target);
    if (!resolved || new URL(resolved).pathname !== targetPath) continue;
    const rel = relOf(attrs);
    if (rel.includes("repost")) return "repost";
    if (rel.includes("like")) return "like";
    if (rel.includes("bookmark")) return "bookend";
    if (rel.includes("in-reply-to") || rel.includes("reply-to")) return "reply";
  }

  if (/\bclass\s*=\s*["'][^"']*\bin-reply-to\b/i.test(html)) return "reply";
  if (/\bclass\s*=\s*["'][^"']*\bu-like-of\b/i.test(html)) return "like";
  if (/\bclass\s*=\s*["'][^"']*\bu-repost-of\b/i.test(html)) return "repost";
  return "mention";
}

/** Extrai o h-entry da página de origem. */
export function parseMention(
  html: string,
  sourceUrl: string,
  target: string
): ParsedMention {
  const entry = pickByClass(html, "h-entry") ?? html;

  const authorBlock = pickByClass(entry, "p-author");
  const authorHtml = authorBlock ?? entry;

  const nameFromBlock =
    authorBlock ? pickByClass(authorBlock, "p-name") : pickByClass(entry, "p-name");

  const authorName =
    (nameFromBlock ? htmlToText(nameFromBlock) : null) ||
    metaContent(html, "author", "article:author") ||
    null;

  const authorUrl =
    absolute(
      (authorBlock ? attrOf(authorBlock, "u-url", "href") : null) ??
        attrOf(entry, "u-url", "href"),
      sourceUrl
    ) ?? null;

  const authorPhoto =
    absolute(
      (authorBlock ? attrOf(authorBlock, "u-photo", "src") : null) ??
        attrOf(entry, "u-photo", "src"),
      sourceUrl
    ) ??
    metaContent(html, "og:image") ??
    null;

  const contentHtml =
    pickByClass(entry, "e-content") ??
    pickByClass(entry, "e-summary") ??
    pickByClass(authorBlock ?? "", "e-content");

  const rawText = contentHtml
    ? htmlToText(contentHtml)
    : htmlToText(pickByClass(html, "e-content") ?? "");

  const content = rawText ? truncate(rawText, 800) : null;

  const publishedRaw =
    (pickByClass(entry, "dt-published") ? attrOf(entry, "dt-published", "datetime") : null) ||
    attrOf(entry, "dt-published", "content") ||
    metaContent(html, "article:published_time");

  let published: string | null = null;
  if (publishedRaw) {
    const d = new Date(publishedRaw);
    if (!Number.isNaN(d.getTime())) published = d.toISOString();
  }

  return {
    type: detectType({ html, target }),
    title: titleOf(html),
    authorName: authorName ? truncate(authorName, 120) : null,
    authorUrl,
    authorPhoto,
    content,
    published,
  };
}

/** Resolve o slug do post a partir da URL alvo. */
async function slugFromTarget(target: string): Promise<string | null> {
  const { pathname } = new URL(target);
  const m = pathname.match(/\/blog\/([^/?#]+)\/?$/);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]);
  const exists = await prisma.post
    .findFirst({ where: { slug }, select: { slug: true } })
    .catch(() => null);
  return exists?.slug ?? null;
}

export async function getSiteUrl(): Promise<string> {
  const configured = await getSetting("site_url").catch(() => "");
  return (configured || process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br").replace(
    /\/+$/,
    ""
  );
}

export type ReceiveResult =
  | { ok: true; duplicate: boolean; id: string; type: string; known: boolean }
  | { ok: false; status: number; error: string };

/** Processa um POST de webmention recebido. */
export async function receiveWebmention(sourceRaw: string, targetRaw: string): Promise<ReceiveResult> {
  const source = String(sourceRaw ?? "").trim();
  const target = String(targetRaw ?? "").trim();

  if (!source || !target) {
    return { ok: false, status: 400, error: "source e target são obrigatórios" };
  }
  if (!isSafeRemoteUrl(source)) {
    return { ok: false, status: 400, error: "source inválido" };
  }
  if (!isSafeRemoteUrl(target)) {
    return { ok: false, status: 400, error: "target inválido" };
  }

  const siteUrl = await getSiteUrl();
  const targetHost = new URL(target).host;
  const siteHost = new URL(siteUrl).host;
  const isOurDomain = targetHost === siteHost || targetHost === `www.${siteHost}`;
  if (!isOurDomain) {
    // não somos um relay aberto para menções de terceiros
    return { ok: false, status: 202, error: "target fora deste site — aceito e ignorado" };
  }

  const page = await fetchHtml(source);
  if (!page) {
    return { ok: false, status: 202, error: "não consegui baixar a página de origem" };
  }

  const links = await sourceLinksToTarget(page.html, target);
  if (!links) {
    return { ok: false, status: 202, error: "a página de origem não contém um link para o target" };
  }

  const parsed = parseMention(page.html, page.finalUrl, target);
  const postSlug = await slugFromTarget(target);

  const existing = await prisma.webmention
    .findUnique({
      where: { source_target: { source, target } },
      select: { id: true, status: true },
    })
    .catch(() => null);

  if (existing) {
    return { ok: true, duplicate: true, id: existing.id, type: parsed.type, known: !!postSlug };
  }

  const created = await prisma.webmention.create({
    data: {
      source,
      target,
      postSlug,
      type: parsed.type,
      title: parsed.title,
      authorName: parsed.authorName,
      authorUrl: parsed.authorUrl,
      authorPhoto: parsed.authorPhoto,
      content: parsed.content,
      published: parsed.published,
      status: "pending",
    },
    select: { id: true },
  });

  return { ok: true, duplicate: false, id: created.id, type: parsed.type, known: !!postSlug };
}

/**
 * Envia webmentions de saída para todos os sites citados no conteúdo.
 * Só dispara para o post já publicado.
 */
export async function sendOutboundWebmentions(post: {
  slug: string;
  content: string;
}): Promise<{ sent: number; failed: number; targets: string[] }> {
  const siteUrl = await getSiteUrl();
  const target = `${siteUrl}/blog/${post.slug}`;

  const urls = [
    ...post.content.matchAll(/https?:\/\/[^\s"'<>()\]]+/g),
  ]
    .map((m) => m[0].replace(/[.,;:)]+$/, ""))
    .filter((u) => {
      try {
        const host = new URL(u).host;
        return host !== new URL(siteUrl).host && host !== `www.${new URL(siteUrl).host}`;
      } catch {
        return false;
      }
    });

  const unique = [...new Set(urls)];
  let sent = 0;
  let failed = 0;
  const tried: string[] = [];

  for (const url of unique) {
    const page = await fetchHtml(url);
    if (!page) {
      failed++;
      continue;
    }

    const endpoint = await findWebmentionEndpoint(page.html, page.finalUrl);

    if (!endpoint) {
      failed++;
      continue;
    }

    tried.push(url);
    const body = new URLSearchParams({ source: target, target: url }).toString();
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": UA,
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status >= 200 && res.status < 300) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { sent, failed, targets: tried };
}

/** Procura o endpoint de webmention declarado pelo site (u-webmention ou <link rel=webmention>). */
export async function findWebmentionEndpoint(
  html: string,
  pageUrl: string
): Promise<string | null> {
  const fromClass = attrOf(html, "u-webmention", "href");
  if (fromClass) return absolute(decodeEntities(fromClass), pageUrl);

  const fromLink = html.match(
    /<link[^>]*\brel\s*=\s*["'][^"']*\bwebmention\b[^"']*["'][^>]*\bhref\s*=\s*["']([^"']+)["']/i
  );
  if (fromLink?.[1]) return absolute(decodeEntities(fromLink[1]), pageUrl);

  const origin = new URL(pageUrl).origin;
  return `${origin}/.well-known/webmention`;
}