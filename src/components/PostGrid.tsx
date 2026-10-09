"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Highlight } from "./Highlight";
import { readingTimeMinutes } from "@/lib/readingTime";
import Link from "next/link";
import Image from "next/image";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  createdAt: string | Date;
  author: string;
  content?: string;
};

export function PostGrid({ posts, q }: { posts: Post[]; q?: string }) {
  const [ativo, setAtivo] = useState<Post | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAtivo(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const prefetch = (slug: string) => {
    router.prefetch(`/blog/${slug}`);
  };

  if (posts.length === 0) {
    return <p className="py-4 text-neutral-500">Nenhuma postagem encontrada.</p>;
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <button
            key={p.id}
            onClick={() => setAtivo(p)}
            onMouseEnter={() => prefetch(p.slug)}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_#0f172a1f] dark:border-[#2a2a30] dark:bg-[#17171c] dark:hover:shadow-[0_8px_24px_#00000066]"
          >
            {p.coverImage ? (
              <Image
                src={p.coverImage}
                alt={p.title}
                width={640}
                height={360}
                className="aspect-video w-full object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
            ) : (
              <div className="aspect-video w-full bg-[#f9f7fa] dark:bg-[#1a1a20]" />
            )}
            <div className="flex flex-col gap-2 p-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">{p.category} · {p.author}{p.content ? ` · ${readingTimeMinutes(p.content)} min` : ""}</span>
              <span className="text-lg font-semibold leading-snug tracking-tight"><Highlight text={p.title} q={q} /></span>
            </div>
          </button>
        ))}
      </div>

      {ativo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ativo.title}
          className="fixed inset-0 z-50 flex animate-[fadeIn_.2s_ease] items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setAtivo(null)}
        >
          <div
            className="max-w-lg animate-[slideUp_.25s_ease] rounded-2xl border border-[#e5e7eb] bg-white p-8 dark:border-[#2a2a30] dark:bg-[#17171c]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-xs uppercase text-neutral-400">{ativo.category}</span>
            <h2 className="mt-2 text-2xl font-bold">{ativo.title}</h2>
            <p className="mt-1 font-mono text-xs text-neutral-400">
              {new Date(ativo.createdAt).toLocaleDateString("pt-BR")} · {new Date(ativo.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {ativo.author}
            </p>
            <p className="mt-3 text-neutral-600 dark:text-[#d4d4d8]">{ativo.excerpt}</p>
            <div className="mt-6 flex gap-4">
              <Link href={`/blog/${ativo.slug}`} className="rounded-[14px] bg-[#0f0f12] px-4 py-2 text-white dark:bg-white dark:text-[#0f0f12]">
                ler post completo →
              </Link>
              <button onClick={() => setAtivo(null)} className="text-sm underline underline-offset-4">
                fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
