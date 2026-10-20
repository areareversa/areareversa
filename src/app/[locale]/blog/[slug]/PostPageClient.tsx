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
import { WebmentionList, type Mention } from "@/components/WebmentionList";
import EpisodeBlock, { type EpisodeForPost } from "@/components/EpisodeBlock";
import { useTranslations, useFormatter, useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string | null;
  coverImage: string | null;
  tags: string[];
  views: number;
  readingMinutes: number | null;
};

type Comment = {
  id: string;
  name: string;
  text: string;
  createdAt: string | Date;
  adminReply?: string | null;
};

export default function PostPageClient({
  initialPost,
  initialComments = [],
  initialMentions = [],
  episode,
}: {
  initialPost: Post | null;
  initialComments: Comment[];
  initialMentions?: Mention[];
  episode?: EpisodeForPost | null;
}) {
  const [post, setPost] = useState<Post | null>(initialPost);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(!initialPost);
  const t = useTranslations("blog");
  const commonT = useTranslations("common");
  const fmt = useFormatter();
  const currentLocale = useLocale();

  useEffect(() => {
    if (initialPost) {
      setLoading(false);
      return;
    }
    const slug = window.location.pathname.split("/blog/")[1]?.split("/")[0];
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

  if (loading) return <PostPageSkeleton />;
  if (!post) return <div className="mx-auto max-w-2xl py-12 text-center text-[#4b5563] dark:text-[#d4d4d8]">{t("notFound")}</div>;

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 h-entry">
      <ReadingProgress />
      <a className="u-url sr-only" href={`${site.url}/\${currentLocale === "pt-BR" ? "" : locale + "/" }blog/${post.slug}`}>
        {post.title}
      </a>
      <a className="u-webmention sr-only" href={`${site.url}/api/webmention`}>
        {t("webmentionEndpoint")}
      </a>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9333ea]">
        {post.category} · <span className="p-author h-card"><a className="u-url p-name" href={`${site.url}/sobre`}>{post.author}</a></span> ·{" "}
        <time className="dt-published" dateTime={post.createdAt}>
          {fmt.dateTime(new Date(post.createdAt) as Date, { dateStyle: "long" })}
        </time>{" "}
        · {readingTimeMinutes(post.content)} {t("readingTime", { minutes: readingTimeMinutes(post.content) })} · <ViewsCounter slug={post.slug} initial={post.views} />
      </p>
      <h1 className="p-name text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{post.title}</h1>
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
              "@id": `${site.url}/\${currentLocale === "pt-BR" ? "" : locale + "/" }blog/${post.slug}`,
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
          className="h-auto max-w-full rounded-2xl"
          sizes="(max-width: 768px) 100vw, 672px"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      )}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/\${currentLocale === "pt-BR" ? "" : locale + "/" }tag/${encodeURIComponent(tag)}`}
              className="rounded-full border border-[#e5e7eb] px-3 py-1 text-xs text-[#4b5563] transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] dark:text-[#d4d4d8]"
            >
              #{tag}
            </Link>
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
        <div className="e-content">
          <Markdown>{post.content}</Markdown>
        </div>
      </MarkdownErrorBoundary>
      {episode && <EpisodeBlock episode={episode} />}
      <ShareButtons title={post.title} url={`${site.url}/\${currentLocale === "pt-BR" ? "" : locale + "/" }blog/${post.slug}`} />
      <BookmarkButton slug={post.slug} title={post.title} />
      <CommentsErrorBoundary>
        <CommentSection slug={post.slug} initialComments={comments} />
      </CommentsErrorBoundary>
      {initialMentions && initialMentions.length > 0 && <WebmentionList mentions={initialMentions} />}

      {related.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">{t("relatedPosts")}</h2>
          {related.map((r) => (
            <Link key={r.slug} href={`/\${currentLocale === "pt-BR" ? "" : locale + "/" }blog/${r.slug}`} className="rounded-2xl border border-[#e5e7eb] p-5 transition hover:border-[#9333ea]/60 dark:border-[#2a2a30]">
              <h3 className="font-semibold leading-snug tracking-tight">{r.title}</h3>
              <p className="mt-1 text-sm text-[#4b5563] dark:text-[#d4d4d8]">{r.excerpt}</p>
            </Link>
          ))}
        </section>
      )}
    </article>
  );
}