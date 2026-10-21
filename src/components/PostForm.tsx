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
  titleEn?: string | null;
  excerptEn?: string | null;
  contentEn?: string | null;
  titleEs?: string | null;
  excerptEs?: string | null;
  contentEs?: string | null;
};

type Lang = "pt" | "en" | "es";

const LANGS: { id: Lang; label: string }[] = [
  { id: "pt", label: "Português (original)" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
];

export function PostForm({
  action,
  post,
}: {
  action: (formData: FormData) => Promise<void>;
  post?: Post;
}) {
  const input = "rounded-lg border border-neutral-300 bg-transparent px-4 py-2 dark:border-[#2a2a30]";
  const [cover, setCover] = useState(post?.coverImage ?? "");
  const [lang, setLang] = useState<Lang>("pt");
  const [tab, setTab] = useState<"escrever" | "preview">("escrever");

  // Um estado por idioma para o texto do conteúdo. Só o do idioma ativo aparece,
  // mas ao salvar todos vão juntos no FormData — inclusive os que não foram
  // abertos nesta edição.
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [titleEn, setTitleEn] = useState(post?.titleEn ?? "");
  const [excerptEn, setExcerptEn] = useState(post?.excerptEn ?? "");
  const [contentEn, setContentEn] = useState(post?.contentEn ?? "");
  const [titleEs, setTitleEs] = useState(post?.titleEs ?? "");
  const [excerptEs, setExcerptEs] = useState(post?.excerptEs ?? "");
  const [contentEs, setContentEs] = useState(post?.contentEs ?? "");

  const [traduzindo, setTraduzindo] = useState<Lang | null>(null);
  const [erroTraducao, setErroTraducao] = useState("");

  const campos = {
    pt: { title, excerpt, content, setTitle, setExcerpt, setContent },
    en: { title: titleEn, excerpt: excerptEn, content: contentEn, setTitle: setTitleEn, setExcerpt: setExcerptEn, setContent: setContentEn },
    es: { title: titleEs, excerpt: excerptEs, content: contentEs, setTitle: setTitleEs, setExcerpt: setExcerptEs, setContent: setContentEs },
  };
  const atual = campos[lang];

  /**
   * Traduz o texto em português para o idioma pedido e preenche os campos.
   * A fonte é sempre o português, que é o original — assim o botão funciona
   * mesmo com o campo de destino vazio.
   */
  async function traduzir(destino: Lang) {
    if (destino === "pt") return;
    setErroTraducao("");
    setTraduzindo(destino);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, content, target: destino }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroTraducao(data.error ?? "Falha ao traduzir");
        return;
      }
      const c = campos[destino];
      if (data.title) c.setTitle(data.title);
      if (data.excerpt) c.setExcerpt(data.excerpt);
      if (data.content) c.setContent(data.content);
      setLang(destino);
    } catch {
      setErroTraducao("Erro de conexão ao traduzir.");
    } finally {
      setTraduzindo(null);
    }
  }

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {/* Campos compartilhados pelos três idiomas */}
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
        /* pré-visualização com a proporção real: é aqui que se julga se a capa
           está boa, e o crop antigo (aspect-video + object-cover) enganava —
           mostrava um recorte 16:9 de uma imagem widescreen ou retrato */
        <img src={cover} alt="Pré-visualização da capa" className="h-auto max-w-md rounded-lg" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      )}
      <p className="text-xs text-neutral-400">Dica: no Pinterest, clique com o botão direito na imagem → &quot;Copiar endereço da imagem&quot;. A capa aparece inteira na página do post, na proporção em que foi enviada.</p>

      {/* Abas de idioma */}
      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 text-sm dark:border-[#2a2a30]">
        {LANGS.map((l) => {
          const vazio = l.id !== "pt" && !campos[l.id].title.trim();
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id)}
              className={`rounded-full border px-3 py-1 ${
                lang === l.id ? "border-[#9333ea] text-[#9333ea]" : "border-neutral-300 dark:border-[#2a2a30]"
              }`}
            >
              {l.label}
              {vazio && <span className="ml-1 text-xs text-neutral-400" title="sem tradução">•</span>}
            </button>
          );
        })}
      </div>

      {lang !== "pt" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-[#9333ea]/40 bg-[#9333ea]/5 px-4 py-3 text-sm">
          <button
            type="button"
            onClick={() => traduzir(lang)}
            disabled={traduzindo !== null || !title.trim()}
            className="rounded-lg bg-[#9333ea] px-4 py-2 text-white transition hover:bg-[#7c2d9f] disabled:opacity-50"
          >
            {traduzindo === lang ? "traduzindo..." : `Traduzir do português com IA`}
          </button>
          <span className="text-xs text-neutral-500">
            Preenche os campos abaixo a partir do texto em português. Revise antes de publicar.
          </span>
        </div>
      )}
      {erroTraducao && <p className="text-sm text-red-500">{erroTraducao}</p>}

      <label className="flex flex-col gap-1 text-sm">
        Título
        <input
          name="title"
          required={lang === "pt"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={lang === "pt" ? input : "hidden"}
        />
        <input
          name="titleEn"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className={lang === "en" ? input : "hidden"}
        />
        <input
          name="titleEs"
          value={titleEs}
          onChange={(e) => setTitleEs(e.target.value)}
          className={lang === "es" ? input : "hidden"}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Resumo
        <input
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={lang === "pt" ? input : "hidden"}
        />
        <input
          name="excerptEn"
          value={excerptEn}
          onChange={(e) => setExcerptEn(e.target.value)}
          className={lang === "en" ? input : "hidden"}
        />
        <input
          name="excerptEs"
          value={excerptEs}
          onChange={(e) => setExcerptEs(e.target.value)}
          className={lang === "es" ? input : "hidden"}
        />
      </label>

      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => setTab("escrever")} className={`rounded-full border px-3 py-1 ${tab === "escrever" ? "border-[#9333ea] text-[#9333ea]" : "border-neutral-300 dark:border-[#2a2a30]"}`}>escrever</button>
        <button type="button" onClick={() => setTab("preview")} className={`rounded-full border px-3 py-1 ${tab === "preview" ? "border-[#9333ea] text-[#9333ea]" : "border-neutral-300 dark:border-[#2a2a30]"}`}>pré-visualizar</button>
      </div>
      {/*
        Os três idiomas ficam sempre no DOM e só o ativo aparece. Antes, o campo
        do idioma inativo não era renderizado e sumia do FormData ao salvar —
        ou seja, dava para preencher inglês, trocar para português, salvar e
        perder a tradução sem nenhum aviso.
      */}
      {tab === "escrever" ? (
        <label className="flex flex-col gap-1 text-sm">
          Conteúdo (Markdown)
          <textarea
            name="content"
            required={lang === "pt"}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${lang === "pt" ? input : "hidden"} font-mono text-sm`}
          />
          <textarea
            name="contentEn"
            rows={16}
            value={contentEn}
            onChange={(e) => setContentEn(e.target.value)}
            className={`${lang === "en" ? input : "hidden"} font-mono text-sm`}
          />
          <textarea
            name="contentEs"
            rows={16}
            value={contentEs}
            onChange={(e) => setContentEs(e.target.value)}
            className={`${lang === "es" ? input : "hidden"} font-mono text-sm`}
          />
        </label>
      ) : (
        <div className="rounded-lg border border-neutral-300 p-4 dark:border-[#2a2a30]">
          <Markdown>{atual.content}</Markdown>
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
