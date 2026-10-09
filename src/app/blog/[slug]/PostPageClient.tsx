"use client";

import { useState, useEffect } from "react";
import { PostPageSkeleton } from "@/components/Skeletons";
import { readingTimeMinutes } from "@/lib/readingTime";
import Link from "next/link";
import Image from "next/image";
import { Markdown } from "@/components/Markdown";
import { ShareButtons } from "@/components/ShareButtons";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ReadingMode } from "@/components/ReadingMode";
import { ViewsCounter } from "@/components/ViewsCounter";
import { CommentSection } from "@/components/CommentSection";
import { BookmarkButton } from "@/components/BookmarkButton";
import { TtsReader } from "@/components/TtsReader";
import { TableOfContents } from "@/components/TableOfContents";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";
import { FocusModeToggle } from "@/components/FocusMode";
import { MarkdownErrorBoundary, TTSErrorBoundary, CommentsErrorBoundary } from "@/components/ErrorBoundary";
import { site } from "@/lib/site";
import { GAEvents } from "@/lib/gaEvents";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  coverImage: string | null;
  tags: string[];
  views: number;
};

type Comment = {
  id: string;
  name: string;
  text: string;
  createdAt: string | Date;
  adminReply?: string | null;
};

export default function PostPageClient({ initialPost, initialComments = [] }: { initialPost: Post | null; initialComments: Comment[] }) {
  const [post, setPost] = useState<Post | null>(initialPost);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(!initialPost);

  useEffect(() => {
    if (initialPost) {
      setLoading(false);
      return;
    }
    // If no initial post (direct navigation), fetch from API
    const slug = window.location.pathname.split("/blog/")[1];
    if (slug) {
      fetch(`/api/post/${slug}`)
        .then((r) => r.json())
        .then((data) => {
          setPost(data.post);
          setComments(data.comments ?? []);
          setRelated(data.related ?? []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [initialPost]);

  const breadcrumbs = post ? [
    { name: "Início", url: site.url },
    { name: "Blog", url: `${site.url}/blog` },
    { name: post.title, url: `${site.url}/blog/${post.slug}` },
  ] : [];

  if (loading) return <PostPageSkeleton />;

  if (!post) return <div className="mx-auto max-w-2xl py-12 text-center text-[#4b5563] dark:text-[#d4d4d8]">Post não encontrado.</div>;

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
        <TTSErrorBoundary>
          <TtsReader text={post.content} />
        </TTSErrorBoundary>
        <FocusModeToggle />
      </div>
      <TableOfContents />
      <MarkdownErrorBoundary>
        <Markdown>{post.content}</Markdown>
      </MarkdownErrorBoundary>
      <ShareButtons title={post.title} url={`${site.url}/blog/${post.slug}`} />
      <BookmarkButton slug={post.slug} title={post.title} />
      <CommentsErrorBoundary>
        <CommentSection slug={post.slug} initialComments={comments} />
      </CommentsErrorBoundary>

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