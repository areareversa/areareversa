"use client";

import { useEffect, useRef, useState } from "react";
import { Highlight } from "./Highlight";
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
  readingMinutes?: number | null;
};

export function PostGrid({ posts, q }: { posts: Post[]; q?: string }) {
  const [ativo, setAtivo] = useState<Post | null>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const voltarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAtivo(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ao abrir a prévia, leva o foco para dentro do diálogo; ao fechar, devolve
  // o foco para onde o usuário estava. Sem isso o teclado "some" no fundo.
  useEffect(() => {
    if (ativo) {
      voltarRef.current = document.activeElement as HTMLElement;
      fecharRef.current?.focus();
      const { overflow } = document.body.style;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
        voltarRef.current?.focus?.();
      };
    }
  }, [ativo]);

  if (posts.length === 0) {
    return <p className="py-4 text-neutral-500">Nenhuma postagem encontrada.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          /**
           * O card inteiro é um Link de verdade, não um <button>.
           *
           * Com <button>, o leitor de tela anuncia "botão" em vez de "link", não
           * dá para abrir em aba nova com Ctrl+clique nem copiar o endereço, e
           * a navegação depende de JavaScript. O botão de prévia fica como
           * controle separado ao lado — link dentro de botão é HTML inválido e
           * quebra a navegação por teclado.
           */
          <article
            key={p.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_#0f172a1f] dark:border-[#2a2a30] dark:bg-[#17171c] dark:hover:shadow-[0_8px_24px_#00000066]"
          >
            <Link
              href={`/blog/${p.slug}`}
              className="flex flex-col rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#9333ea]"
            >
              {p.coverImage ? (
                <Image
                  src={p.coverImage}
                  /* decorativa: o título do post já está em texto logo abaixo,
                     então repetir no alt só faz o leitor de tela ler duas vezes */
                  alt=""
                  width={640}
                  height={360}
                  /*
                    O card mantém a caixa 16:9 para o grid ficar alinhado, mas
                    usa object-contain: capa widescreen ou retrato aparece
                    inteira, com a barra da caixa aparecendo nas laterais. Antes
                    era object-cover, que cortava.
                  */
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
                  {p.category} · {p.author}
                  {p.readingMinutes ? ` · ${p.readingMinutes} min` : ""}
                </span>
                {/* h2 cria a hierarquia que faltava: o título da página é h1 e o
                    título de cada post é h2 */}
                <h2 className="text-lg font-semibold leading-snug tracking-tight">
                  <Highlight text={p.title} q={q} />
                </h2>
              </div>
            </Link>

            <button
              onClick={() => setAtivo(p)}
              aria-label={`Prévia rápida de ${p.title}`}
              className="absolute right-3 top-3 rounded-full border border-[#e5e7eb] bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 transition hover:border-[#9333ea] hover:text-[#9333ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9333ea] dark:border-[#2a2a30] dark:bg-neutral-900/90 dark:text-neutral-300"
            >
              prévia
            </button>
          </article>
        ))}
      </div>

      {ativo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="previa-titulo"
          className="fixed inset-0 z-50 flex animate-[fadeIn_.2s_ease] items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setAtivo(null)}
        >
          <div
            className="max-w-lg animate-[slideUp_.25s_ease] rounded-2xl border border-[#e5e7eb] bg-white p-8 dark:border-[#2a2a30] dark:bg-[#17171c]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-xs uppercase text-neutral-400">{ativo.category}</span>
            <h2 id="previa-titulo" className="mt-2 text-2xl font-bold">
              {ativo.title}
            </h2>
            <p className="mt-1 font-mono text-xs text-neutral-400">
              {new Date(ativo.createdAt).toLocaleDateString("pt-BR")} ·{" "}
              {new Date(ativo.createdAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {ativo.author}
            </p>
            <p className="mt-3 text-neutral-600 dark:text-[#d4d4d8]">{ativo.excerpt}</p>
            <div className="mt-6 flex gap-4">
              <Link
                href={`/blog/${ativo.slug}`}
                className="rounded-[14px] bg-[#0f0f12] px-4 py-2 text-white dark:bg-white dark:text-[#0f0f12]"
              >
                ler post completo →
              </Link>
              <button
                ref={fecharRef}
                onClick={() => setAtivo(null)}
                className="text-sm underline underline-offset-4"
              >
                fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}