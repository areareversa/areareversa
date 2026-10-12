/**
 * Feed do podcast (Anchor/Spotify for Creators).
 *
 * O site lê o RSS direto, então publicar um episódio novo no Spotify aparece
 * aqui automaticamente — sem precisar mexer em código nem no admin.
 */

export type Episode = {
  title: string;
  link: string;
  pubDate: string;
  audioUrl?: string;
  contentSnippet?: string;
  duration?: string;
  image?: string;
  guid?: string;
  size?: string;
};

/** Ordem de tentativa: o primeiro que responder com itens válidos ganha. */
export const FEED_URLS = [
  "https://anchor.fm/s/118427fe8/podcast/rss",
  "https://podcasters.spotify.com/pod/show/118427fe8/rss",
];

const UA = "Mozilla/5.0 (compatible; area-reversa/1.0; +https://areareversa.com.br)";

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function tag(block: string, name: string): string {
  const m = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i")
  );
  return m ? stripCdata(m[1]) : "";
}

function attr(block: string, tagName: string, attrName: string): string {
  const m = block.match(
    new RegExp(`<${tagName}[^>]*\\b${attrName}\\s*=\\s*["']([^"']+)["']`, "i")
  );
  return m ? m[1].trim() : "";
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

export function parseFeed(xml: string): Episode[] {
  const blocks = xml.split(/<item(?:\s[^>]*)?>/i).slice(1);

  return blocks
    .map((block) => {
      const audioUrl = attr(block, "enclosure", "url") || undefined;
      const image =
        attr(block, "itunes:image", "href") ||
        (() => {
          const itunesImg = block.match(/<itunes:image>([\s\S]*?)<\/itunes:image>/i);
          return itunesImg ? stripCdata(itunesImg[1]) : "";
        })() ||
        undefined;

      return {
        title: decode(tag(block, "title")),
        link: tag(block, "link"),
        guid: tag(block, "guid") || undefined,
        pubDate: tag(block, "pubDate"),
        audioUrl,
        contentSnippet:
          decode(tag(block, "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).slice(
            0,
            200
          ) || undefined,
        duration: tag(block, "itunes:duration") || undefined,
        size: attr(block, "enclosure", "length") || undefined,
        image,
      } satisfies Episode;
    })
    .filter((ep) => ep.title && ep.audioUrl);
}

export type FeedResult = {
  episodes: Episode[];
  source?: string;
  fetchedAt: string;
  error?: string;
};

/**
 * Busca os episódios no feed.
 * `revalidate: false` desliga o cache de dados do Next (usado na API, que
 * precisa ser sempre atual) — em no máximo `timeoutMs` a resposta é usada.
 */
export async function fetchEpisodes(opts?: {
  revalidate?: number | false;
  timeoutMs?: number;
}): Promise<FeedResult> {
  const { revalidate = 300, timeoutMs = 8000 } = opts ?? {};
  const fetchedAt = new Date().toISOString();
  const errors: string[] = [];

  for (const url of FEED_URLS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(timeoutMs),
        ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate } }),
      });

      if (!res.ok) {
        errors.push(`${url}: HTTP ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const episodes = parseFeed(xml);

      if (episodes.length === 0) {
        errors.push(`${url}: feed sem itens válidos`);
        continue;
      }

      return { episodes, source: url, fetchedAt };
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { episodes: [], fetchedAt, error: errors.join(" | ") };
}