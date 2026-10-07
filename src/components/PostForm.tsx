"use client";

import { useState } from "react";
import { Markdown } from "./Markdown";

type Post = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string | null;
  published: boolean;
  slug?: string;
  tags?: string[];
  publishAt?: Date | string | null;
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
  const [content, setContent] = useState(post?.content ?? "");
  const [tab, setTab] = useState<"escrever" | "preview">("escrever");

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
        Slug (URL)
        <input name="slug" defaultValue={post?.slug} placeholder="gerado do título se vazio" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Categoria
        <input name="category" defaultValue={post?.category ?? "Geral"} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tags (separadas por vírgula)
        <input name="tags" defaultValue={post?.tags?.join(", ")} placeholder="urna eletrônica, TSE, segurança" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Imagem de capa (URL do Pinterest)
        <input name="coverImage" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://i.pinimg.com/..." className={input} />
      </label>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="Pré-visualização da capa" className="aspect-video w-full max-w-md rounded-lg object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      )}
      <p className="text-xs text-neutral-400">Dica: no Pinterest, clique com o botão direito na imagem → &quot;Copiar endereço da imagem&quot;.</p>

      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => setTab("escrever")} className={`rounded-full border px-3 py-1 ${tab === "escrever" ? "border-[#9333ea] text-[#9333ea]" : "border-neutral-300 dark:border-[#2a2a30]"}`}>escrever</button>
        <button type="button" onClick={() => setTab("preview")} className={`rounded-full border px-3 py-1 ${tab === "preview" ? "border-[#9333ea] text-[#9333ea]" : "border-neutral-300 dark:border-[#2a2a30]"}`}>pré-visualizar</button>
      </div>
      {tab === "escrever" ? (
        <label className="flex flex-col gap-1 text-sm">
          Conteúdo (Markdown)
          <textarea name="content" required rows={16} value={content} onChange={(e) => setContent(e.target.value)} className={`${input} font-mono text-sm`} />
        </label>
      ) : (
        <div className="rounded-lg border border-neutral-300 p-4 dark:border-[#2a2a30]">
          <textarea hidden name="content" value={content} onChange={() => {}} />
          <Markdown>{content}</Markdown>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published} /> publicar
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Agendar publicação (opcional)
        <input
          type="datetime-local"
          name="publishAt"
          defaultValue={post?.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : ""}
          className={input}
        />
      </label>
      <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">
        salvar
      </button>
    </form>
  );
}
