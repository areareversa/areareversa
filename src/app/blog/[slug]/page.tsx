import { publishedFilter, isVisible } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PostPageClient from "./PostPageClient";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";

export const revalidate = 60;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br").replace(
  /\/+$/,
  ""
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post) return { title: "não encontrado" };
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br").replace(
    /\/+$/,
    ""
  );
  return {
    title: post.title,
    description: post.excerpt,
    other: {
      webmention: `${siteUrl}/api/webmention`,
      "llms-txt": `${siteUrl}/llms.txt`,
    },
    // URL canônica: impede que o Google indexe o .md, versões com query ou
    // duplicatas do mesmo post como páginas diferentes.
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
      types: {
        "text/html": [{ url: `${siteUrl}/blog/${post.slug}` }],
        // a mesma página em markdown limpo, para agentes (llmstxt.org)
        "text/markdown": [{ url: `${siteUrl}/blog/${post.slug}.md` }],
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${siteUrl}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt?.toISOString() ?? post.createdAt.toISOString(),
      authors: [post.author],
      tags: post.tags,
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

/**
 * Gera as rotas no build.
 *
 * Sem isto, uma rota dinâmica não é pré-renderizada: o Next a renderiza a
 * cada visita e responde "no-store" — que era o que deixava a página de
 * artigo em ~670 ms mesmo com revalidate = 60.
 *
 * Com generateStaticParams, os 13 posts viram páginas estáticas no build e
 * passam a sair do cache da borda. Post novo continua funcionando: o admin
 * chama revalidatePath("/blog"), e a página é regenerada na borda.
 */
export async function generateStaticParams() {
  const posts = await prisma.post
    .findMany({ where: publishedFilter(), select: { slug: true } })
    .catch(() => []);
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post || !isVisible(post)) notFound();

  const [related, comments, mentions] = await Promise.all([
    prisma.post
      .findMany({
        where: { ...publishedFilter(), category: post.category, NOT: { id: post.id } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { slug: true, title: true, excerpt: true, category: true, author: true, createdAt: true, coverImage: true, views: true, content: true },
      })
      .catch(() => []),
    prisma.comment
      .findMany({ where: { postId: post.id, hidden: false }, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    prisma.webmention
      .findMany({
        where: { postSlug: post.slug, status: "approved" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          source: true,
          type: true,
          title: true,
          authorName: true,
          authorUrl: true,
          authorPhoto: true,
          content: true,
          adminReply: true,
          createdAt: true,
        },
      })
      .catch(() => []),
  ]);

  const crumbs = [
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ];

  return (
    <>
      <StructuredDataBreadcrumb items={crumbs} />
      <PostPageClient
        initialPost={{
          ...post,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt?.toISOString(),
        }}
        initialComments={comments}
        initialMentions={mentions.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      />
    </>
  );
}