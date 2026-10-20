import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publishedFilter, isVisible } from "@/lib/posts";
import PostPageClient from "./PostPageClient";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";
import { fetchEpisodes } from "@/lib/podcast";
import { resolveEpisode } from "@/lib/podcast-match";

export const revalidate = 60;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br").replace(/\/+$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "post" });
  const siteT = await getTranslations({ locale, namespace: "site" });

  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post) return { title: t("notFound") };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br").replace(/\/+$/, "");
  const postUrl = `${siteUrl}/${locale === "pt-BR" ? "" : locale + "/" }blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    other: {
      webmention: `${siteUrl}/api/webmention`,
      "llms-txt": `${siteUrl}/llms.txt`,
    },
    alternates: {
      canonical: postUrl,
      types: {
        "text/html": [{ url: postUrl }],
        "text/markdown": [{ url: `${postUrl}.md` }],
      },
    },
    openGraph: {
      siteName: siteT("name"),
      title: post.title,
      description: post.excerpt,
      locale: locale.replace("-", "_"),
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt?.toISOString() ?? post.createdAt.toISOString(),
      authors: [post.author],
      tags: post.tags,
      ...(post.coverImage
        ? {
            images: [
              { url: post.coverImage, width: 1200, height: 630, alt: post.title },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const posts = await prisma.post
    .findMany({ where: publishedFilter(), select: { slug: true } })
    .catch(() => []);
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const commonT = await getTranslations({ locale, namespace: "common" });
  const postT = await getTranslations({ locale, namespace: "post" });

  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post || !isVisible(post)) notFound();

  // Resolve localized content if available
  const title: string = (post as any)[`title_${locale}`] || post.title;
  const excerpt: string = (post as any)[`excerpt_${locale}`] || post.excerpt;
  const content: string = (post as any)[`content_${locale}`] || post.content;

  const localizedPost = {
    id: post.id,
    slug: post.slug,
    title,
    excerpt,
    content,
    category: post.category,
    author: post.author,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt?.toISOString() ?? null,
    coverImage: post.coverImage,
    tags: post.tags,
    views: post.views,
    readingMinutes: post.readingMinutes ?? null,
  };

  const feed = await fetchEpisodes({ revalidate: 600 }).catch(() => null);
  const achado = feed?.episodes?.length ? resolveEpisode(title, feed.episodes) : null;
  const episode = achado
    ? {
        title: achado.episode.title,
        link: achado.episode.link,
        pubDate: achado.episode.pubDate,
        audioUrl: achado.episode.audioUrl!,
        duration: achado.episode.duration,
        matched: achado.matched,
      }
    : null;

  const crumbs = [
    { name: commonT("nav.home"), url: `${SITE_URL}/${locale === "pt-BR" ? "" : locale + "/"} ` },
    { name: commonT("nav.blog"), url: `${SITE_URL}/${locale === "pt-BR" ? "" : locale + "/" }blog` },
    { name: title, url: `${SITE_URL}/${locale === "pt-BR" ? "" : locale + "/" }blog/${post.slug}` },
  ];

  return (
    <>
      <StructuredDataBreadcrumb items={crumbs} />
      <PostPageClient
        initialPost={localizedPost}
        initialComments={[]}
        initialMentions={[]}
        episode={episode}
      />
    </>
  );
}