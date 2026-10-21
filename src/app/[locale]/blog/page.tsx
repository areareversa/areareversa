import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { publishedFilter, localizePost } from "@/lib/posts";
import BlogPageClient from "./BlogPageClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const siteT = await getTranslations({ locale, namespace: "site" });

  return {
    title: t("latestPosts"),
    description: siteT("description"),
    openGraph: {
      title: t("latestPosts"),
      description: siteT("description"),
      locale: locale.replace("-", "_"),
      type: "website",
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = await prisma.post
    .findMany({
      where: publishedFilter(),
      orderBy: { createdAt: "desc" },
      take: 20,
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
    .catch(() => []);

  return <BlogPageClient initialLocale={locale} initialPosts={posts.map(p => ({ ...localizePost(p, locale), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt?.toISOString() }))} />;
}