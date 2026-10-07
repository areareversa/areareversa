"use client";

import { useState } from "react";

type Post = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string | null;
  published: boolean;
};

export function PostForm({
  action,
  post,
}: {
  action: (formData: FormData) => Promise<void>;
  post?: Post;
}) {
  const input = "rounded-lg border border-neutral-300 bg-transparent px-4 py-2 dark:border-[#2a2a30]";
  const [cover, setCover] = useState(post?.coverImage ?? "");
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Título
        <input name="title" required defaultValue={post?.title} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Resumo
        <input name="excerpt" defaultValue={post?.excerpt} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Categoria
        <input name="category" defaultValue={post?.category ?? "Geral"} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Imagem de capa (URL do Pinterest)
        <input name="coverImage" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://i.pinimg.com/..." className={input} />
      </label>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="Pré-visualização da capa" className="aspect-video w-full max-w-md rounded-lg object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      )}
      <p className="text-xs text-neutral-400">Dica: no Pinterest, clique com o botão direito na imagem → "Copiar endereço da imagem".</p>
      <label className="flex flex-col gap-1 text-sm">
        Conteúdo (Markdown)
        <textarea name="content" required rows={16} defaultValue={post?.content} className={`${input} font-mono text-sm`} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published} /> publicar
      </label>
      <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">
        salvar
      </button>
    </form>
  );
}
