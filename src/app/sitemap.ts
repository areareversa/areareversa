import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const posts = await prisma.post
    .findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
    .catch(() => []);

  return [
    { url: site.url, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${site.url}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${site.url}/podcast`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    ...posts.map((p) => ({
      url: `${site.url}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
