"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { readingTimeMinutes } from "@/lib/readingTime";
import { useTranslations, useFormatter, useLocale } from "next-intl";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string | null;
  coverImage: string | null;
  views: number;
  tags: string[];
  content: string;
  readingMinutes: number | null;
};

type Episode = {
  title: string;
  link?: string;
  pubDate?: string;
  duration?: string;
  audioUrl?: string;
  contentSnippet?: string;
};

export default function HomePageClient({
  initialLocale,
  initialPosts,
  initialEpisode,
}: {
  initialLocale: string;
  initialPosts: Post[];
  initialEpisode: Episode | null;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [episode, setEpisode] = useState<Episode | null>(initialEpisode);
  const [loading, setLoading] = useState(!initialPosts?.length);
  const t = useTranslations("home");
  const blogT = useTranslations("blog");
  const commonT = useTranslations("common");
  const fmt = useFormatter();
  const currentLocale = useLocale();

  useEffect(() => {
    if (initialPosts?.length) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch("/api/blog").then((r) => r.json()),
      fetch("/api/podcast").then((r) => r.json()),
    ])
      .then(([postsData, podcastData]) => {
        setPosts(postsData.posts ?? []);
        setEpisode(podcastData.episodes?.[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialPosts, initialEpisode]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-[#e5e7eb] rounded w-1/3 dark:bg-[#2a2a30]" />
          <div className="h-8 bg-[#e5e7eb] rounded w-1/2 dark:bg-[#2a2a30]" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-[#2a2a30] dark:bg-[#17171c]">
                <div className="aspect-video w-full bg-[#e5e7eb] dark:bg-[#2a2a30]" />
                <div className="flex flex-col gap-2 p-5">
                  <div className="h-4 bg-[#e5e7eb] rounded w-3/4 dark:bg-[#2a2a30]" />
                  <div className="h-6 bg-[#e5e7eb] rounded w-full dark:bg-[#2a2a30]" />
                  <div className="h-4 bg-[#e5e7eb] rounded w-1/2 dark:bg-[#2a2a30]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl mb-4">{t("heroTitle")}</h1>
        <p className="text-lg text-[#4b5563] dark:text-[#d4d4d8] max-w-2xl mx-auto">{t("heroSubtitle")}</p>
      </header>

      {episode && episode.audioUrl && (
        <section className="mb-12" aria-labelledby="latest-podcast">
          <div className="flex flex-col gap-4 rounded-2xl border border-[#9333ea]/30 bg-[#f9f7fa] p-6 dark:border-[#9333ea]/40 dark:bg-[#17171c]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9333ea]">{t("latestPodcast")}</span>
              <h2 id="latest-podcast" className="text-base font-semibold leading-snug tracking-tight">
                {episode.title}
              </h2>
            </div>
            <p className="text-xs text-[#9ca3af]">
              <time dateTime={episode.pubDate}>{episode.pubDate ? (new Date(episode.pubDate)).toLocaleDateString("pt-BR") : ""}</time>
              {episode.duration ? ` · {episode.duration}` : ""}
            </p>
            <div className="flex flex-wrap gap-3">
              {episode.audioUrl && (
                <button
                  onClick={() => {
                    const event = new CustomEvent("play-podcast", { detail: episode });
                    window.dispatchEvent(event);
                  }}
                  className="w-full sm:w-auto rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-left text-sm font-medium transition hover:border-[#9333ea]/60 hover:text-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c] dark:hover:text-[#9333ea]"
                >
                  ▶ {t("play")}
                </button>
              )}
              {episode.link && (
                <a href={episode.link} target="_blank" rel="noreferrer" className="text-sm text-[#9333ea] underline underline-offset-4">
                  {t("podcast.openSpotify")}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mb-12" aria-labelledby="latest-posts">
        <div className="flex items-center justify-between mb-6">
          <h2 id="latest-posts" className="text-2xl font-bold tracking-[-0.02em]">{t("latestPosts")}</h2>
          <Link href={`/\${currentLocale === "pt-BR" ? "" : locale + "/" }blog`} className="text-sm text-[#9333ea] hover:underline">
            {t("allPosts")}
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="mx-auto max-w-2xl py-12 text-center text-[#4b5563] dark:text-[#d4d4d8]">
            {t("noPosts")}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.slug} className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_#0f172a1f] dark:border-[#2a2a30] dark:bg-[#17171c] dark:hover:shadow-[0_8px_24px_#00000066]">
                <Link href={`/\${currentLocale === "pt-BR" ? "" : locale + "/" }blog/${post.slug}`} className="flex flex-col rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#9333ea]">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt=""
                      width={640}
                      height={360}
                      className="aspect-video w-full bg-[#f9f7fa] object-contain dark:bg-[#1a1a20]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBwVC0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    />
                  ) : (
                    <div className="aspect-video w-full bg-[#f9f7fa] dark:bg-[#1a1a20]" />
                  )}
                  <div className="flex flex-col gap-2 p-5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                      {post.category} · {post.author}
                    </span>
                    <h2 className="text-lg font-semibold leading-snug tracking-tight group-hover:text-[#9333ea] transition-colors">
                      {post.title}
                    </h2>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12" aria-labelledby="newsletter">
        <div className="rounded-2xl border border-[#9333ea]/30 bg-[#f9f7fa] p-8 dark:border-[#9333ea]/40 dark:bg-[#17171c] text-center">
          <h2 className="text-2xl font-bold tracking-[-0.02em] mb-2">{t("newsletter.title")}</h2>
          <p className="text-[#4b5563] dark:text-[#d4d4d8] mb-6 max-w-md mx-auto">{t("newsletter.description")}</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" action="/api/newsletter" method="POST">
            <input
              type="email"
              name="email"
              placeholder={t("newsletter.placeholder")}
              required
              className="flex-1 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm transition hover:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c] dark:text-white"
            />
            <button type="submit" className="rounded-xl bg-[#9333ea] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#7c2d9f]">
              {t("newsletter.subscribe")}
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="tags">
        <div className="flex items-center justify-between mb-6">
          <h2 id="tags" className="text-2xl font-bold tracking-[-0.02em]">{t("tags")}</h2>
          <Link href={`/\${currentLocale === "pt-BR" ? "" : locale + "/" }blog`} className="text-sm text-[#9333ea] hover:underline">
            {t("allPosts")}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {["urna eletrônica", "orçamento", "fundo partidário", "narrativas", "TCU", "centrão", "MEI", "previdência", "eleições"].map((tag) => (
            <Link key={tag} href={`/\${currentLocale === "pt-BR" ? "" : locale + "/" }tag/${encodeURIComponent(tag)}`} className="rounded-full border border-[#e5e7eb] px-3 py-1 text-xs text-[#4b5563] transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] dark:text-[#d4d4d8]">
              #{tag}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}