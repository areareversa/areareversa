"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  createdAt: string | Date;
};

export function PostGrid({ posts }: { posts: Post[] }) {
  const [ativo, setAtivo] = useState<Post | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAtivo(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
            className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 text-left transition hover:shadow-md dark:border-neutral-800"
          >
            {p.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverImage} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-900" />
            )}
            <div className="flex flex-col gap-2 p-4">
              <span className="font-mono text-xs uppercase text-neutral-400">{p.category}</span>
              <span className="text-lg font-semibold leading-snug">{p.title}</span>
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
            className="max-w-lg animate-[slideUp_.25s_ease] rounded-2xl bg-white p-8 dark:bg-neutral-950"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-xs uppercase text-neutral-400">{ativo.category}</span>
            <h2 className="mt-2 text-2xl font-bold">{ativo.title}</h2>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400">{ativo.excerpt}</p>
            <div className="mt-6 flex gap-4">
              <Link href={`/blog/${ativo.slug}`} className="rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">
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
