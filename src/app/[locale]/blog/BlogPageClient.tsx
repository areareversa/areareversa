"use client";

import Link from "next/link";
import Image from "next/image";
import { readingTimeMinutes } from "@/lib/readingTime";
import { useState, useEffect } from "react";
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

export default function BlogPageClient({ initialLocale, initialPosts }: { initialLocale: string; initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(!initialPosts?.length);
  const t = useTranslations("blog");
  const commonT = useTranslations("common");
  const fmt = useFormatter();
  const currentLocale = useLocale();

  useEffect(() => {
    if (initialPosts?.length) {
      setLoading(false);
      return;
    }
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialPosts]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-[#2a2a30] dark:bg-[#17171c] animate-pulse">
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
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{t("latestPosts")}</h1>
      </header>
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
                    {post.readingMinutes ? ` · ${post.readingMinutes} min` : ""}
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
    </div>
  );
}