"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSaved } from "@/components/BookmarkButton";

type Post = { slug: string; title: string; excerpt: string; category: string };

export default function SalvosPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const slugs = getSaved();
    if (slugs.length === 0) return;
    fetch(`/api/search?slugs=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-5xl font-bold tracking-[-0.04em]">salvos</h1>
      {posts.length === 0 && <p className="text-[#4b5563] dark:text-[#d4d4d8]">Nenhum post salvo neste navegador.</p>}
      {posts.map((p) => (
        <Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-2xl border border-[#e5e7eb] p-5 transition hover:border-[#9333ea]/60 dark:border-[#2a2a30]">
          <h3 className="font-semibold leading-snug tracking-tight">{p.title}</h3>
          <p className="mt-1 text-sm text-[#4b5563] dark:text-[#d4d4d8]">{p.excerpt}</p>
        </Link>
      ))}
    </div>
  );
}
