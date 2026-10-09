import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { publishedFilter } from "@/lib/posts";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&apos;");
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const posts = await prisma.post
    .findMany({ where: publishedFilter(), orderBy: { createdAt: "desc" }, take: 50 })
    .catch(() => []);

  const items = posts
    .map((p) => {
      const postUrl = `${site.url}/blog/${p.slug}`;
      const pubDate = new Date(p.createdAt).toUTCString();
      const description = escapeXml(stripHtml(p.excerpt));
      const contentEncoded = escapeXml(p.content);

      let mediaContent = "";
      if (p.coverImage) {
        mediaContent = `
        <media:content url="${escapeXml(p.coverImage)}" medium="image" type="image/png">
          <media:title>${escapeXml(p.title)}</media:title>
        </media:content>`;
      }

      const hasAudio = p.content.includes("<audio") || p.content.includes("audioUrl");

      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <content:encoded><![CDATA[${p.content}]]></content:encoded>
      ${mediaContent}
      ${hasAudio ? `
      <itunes:title>${escapeXml(p.title)}</itunes:title>
      <itunes:summary>${description}</itunes:summary>
      <itunes:duration>00:00:00</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      ` : ""}
      <category>${escapeXml(p.category)}</category>
      ${p.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("")}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${site.url}/logo-areareversa-preto.svg</url>
      <title>${escapeXml(site.name)}</title>
      <link>${site.url}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}