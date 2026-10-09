import { publishedFilter, isVisible } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Markdown } from "@/components/Markdown";
import { ShareButtons } from "@/components/ShareButtons";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ReadingMode } from "@/components/ReadingMode";
import { ViewsCounter } from "@/components/ViewsCounter";
import { CommentSection } from "@/components/CommentSection";
import { readingTimeMinutes } from "@/lib/readingTime";
import { site } from "@/lib/site";
import { BookmarkButton } from "@/components/BookmarkButton";
import { TtsReader } from "@/components/TtsReader";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post) return { title: "não encontrado" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/blog/${post.slug}`,
      type: "article",
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post || !isVisible(post)) notFound();

  const [related, comments] = await Promise.all([
    prisma.post
      .findMany({
        where: { ...publishedFilter(), category: post.category, NOT: { id: post.id } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { slug: true, title: true, excerpt: true },
      })
      .catch(() => []),
    prisma.comment
      .findMany({ where: { postId: post.id, hidden: false }, orderBy: { createdAt: "desc" } })
      .catch(() => []),
  ]);

  const breadcrumbs = [
    { name: "Início", url: site.url },
    { name: "Blog", url: `${site.url}/blog` },
    { name: post.title, url: `${site.url}/blog/${post.slug}` },
  ];

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <StructuredDataBreadcrumb items={breadcrumbs} />
      <ReadingProgress />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9333ea]">
        {post.category} · {post.author} · {new Date(post.createdAt).toLocaleDateString("pt-BR")} · {readingTimeMinutes(post.content)} min de leitura · <ViewsCounter slug={post.slug} initial={post.views} />
      </p>
      <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{post.title}</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            author: { "@type": "Organization", name: post.author },
            datePublished: post.createdAt,
            dateModified: post.updatedAt ?? post.createdAt,
            image: post.coverImage ?? undefined,
            publisher: {
              "@type": "Organization",
              name: site.name,
              logo: {
                "@type": "ImageObject",
                url: `${site.url}/logo-areareversa-preto.svg`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${site.url}/blog/${post.slug}`,
            },
          }),
        }}
      />
      {post.coverImage && (
        <Image
          src={post.coverImage}
          alt={post.title}
          width={1200}
          height={675}
          className="aspect-video w-full rounded-2xl object-cover"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      )}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <a key={t} href={`/tag/${encodeURIComponent(t)}`} className="rounded-full border border-[#e5e7eb] px-3 py-1 text-xs text-[#4b5563] transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] dark:text-[#d4d4d8]">
              #{t}
            </a>
          ))}
        </div>
      )}
      <div className="flex flex-col items-start gap-2">
        <ReadingMode />
        <TtsReader text={post.content} />
      </div>
      <Markdown>{post.content}</Markdown>
      <ShareButtons title={post.title} url={`${site.url}/blog/${post.slug}`} />
      <BookmarkButton slug={post.slug} title={post.title} />
      <CommentSection slug={post.slug} initialComments={comments} />

      {related.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Leia também</h2>
          {related.map((r) => (
            <Link key={r.slug} href={`/blog/${r.slug}`} className="rounded-2xl border border-[#e5e7eb] p-5 transition hover:border-[#9333ea]/60 dark:border-[#2a2a30]">
              <h3 className="font-semibold leading-snug tracking-tight">{r.title}</h3>
              <p className="mt-1 text-sm text-[#4b5563] dark:text-[#d4d4d8]">{r.excerpt}</p>
            </Link>
          ))}
        </section>
      )}
    </article>
  );
}
