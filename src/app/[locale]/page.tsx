import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { publishedFilter, localizePost } from "@/lib/posts";
import HomePageClient from "./HomePageClient";
import { fetchEpisodes } from "@/lib/podcast";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteT = await getTranslations({ locale, namespace: "site" });

  return {
    title: siteT("name"),
    description: siteT("description"),
    openGraph: {
      siteName: siteT("name"),
      title: siteT("name"),
      description: siteT("description"),
      locale: locale.replace("-", "_"),
      type: "website",
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const [latestPosts, latestEpisode, categories, topClicks] = await Promise.all([
    prisma.post
      .findMany({
        where: publishedFilter(),
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          author: true,
          createdAt: true,
          updatedAt: true,
          coverImage: true,
          views: true,
          tags: true,
          content: true,
          readingMinutes: true,
        },
      })
      .catch(() => []),
    fetchEpisodes({ revalidate: 600 }).catch(() => null),
    prisma.post
      .groupBy({
        by: ["category"],
        where: publishedFilter(),
        _count: { _all: true },
        orderBy: { category: "asc" },
      })
      .catch(() => []),
    prisma.event
      .groupBy({
        by: ["target"],
        where: { type: "click", createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        _count: { _all: true },
        orderBy: { _count: { target: "desc" } },
        take: 5,
      })
      .catch(() => []),
  ]);

  const topSlugs = topClicks.map((t) => t.target).filter(Boolean) as string[];
  const topPosts = topSlugs.length
    ? await prisma.post
        .findMany({ where: { slug: { in: topSlugs } }, select: { slug: true, title: true, excerpt: true } })
        .catch(() => [])
    : [];

  return (
    <HomePageClient
      initialLocale={locale}
      initialPosts={latestPosts.map((p) => ({
        ...localizePost(p, locale),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt?.toISOString(),
      }))}
      initialEpisode={latestEpisode?.episodes?.[0] ?? null}
      initialCategories={categories.map((c) => c.category)}
      initialTopPosts={topPosts}
    />
  );
}
