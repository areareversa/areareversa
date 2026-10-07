import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { publishedFilter } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await prisma.post
    .findMany({ where: publishedFilter(), orderBy: { createdAt: "desc" }, take: 20 })
    .catch(() => []);

  const items = posts
    .map(
      (p) => `
    <item>
      <title>${p.title}</title>
      <link>${site.url}/blog/${p.slug}</link>
      <guid>${site.url}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <description>${p.excerpt}</description>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${site.name}</title>
    <link>${site.url}</link>
    <description>${site.description}</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
