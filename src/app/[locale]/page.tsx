import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { publishedFilter } from "@/lib/posts";
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

  const [latestPosts, latestEpisode] = await Promise.all([
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
  ]);

  return <HomePageClient initialLocale={locale} initialPosts={latestPosts.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt?.toISOString() }))} initialEpisode={latestEpisode?.episodes?.[0] ?? null} />;
}