import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { publishedFilter } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const [posts, tags] = await Promise.all([
    prisma.post.findMany({ where: publishedFilter(), select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.post.findMany({ where: publishedFilter(), select: { tags: true } }).catch(() => []),
  ]);

  // Extract unique tags
  const uniqueTags = Array.from(new Set(tags.flatMap((p) => p.tags)));

  const staticPages = [
    { url: site.url, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${site.url}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${site.url}/podcast`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${site.url}/sobre`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${site.url}/salvos`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 },
  ];

  const tagPages = uniqueTags.map((tag) => ({
    url: `${site.url}/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const postPages = posts.map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...tagPages, ...postPages];
}