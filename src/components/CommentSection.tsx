"use client";

import { useState } from "react";

type Comment = { id: string; name: string; text: string; createdAt: string | Date; adminReply?: string | null };

export function CommentSection({ slug, initialComments }: { slug: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, text, website: (window as any).__hp ?? "" }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setComments([{ ...data.comment }, ...comments]);
      setText("");
      setName("");
      setMsg("Comentário publicado!");
    } else {
      setMsg(data.error ?? "Erro ao comentar");
    }
  }

  const input =
    "w-full rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-2.5 text-sm outline-none focus:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c]";

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Comentários ({comments.length})</h2>

      <form onSubmit={enviar} className="flex flex-col gap-3">
        {/* honeypot anti-bot: invisível para humanos */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" onChange={(e) => (window as any).__hp = e.target.value} />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={input} required aria-label="Seu nome" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Deixe seu comentário..." rows={4} className={input} required aria-label="Seu comentário" />
        <button
          disabled={loading}
          className="w-fit rounded-[14px] bg-[#0f0f12] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-[#0f0f12]"
        >
          {loading ? "enviando..." : "Comentar"}
        </button>
        {msg && <p className="text-xs text-[#4b5563] dark:text-[#d4d4d8]">{msg}</p>}
      </form>

      <div className="flex flex-col gap-4">
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30]">
            <p className="text-xs text-[#9ca3af]">
              <span className="font-semibold text-[#0f0f12] dark:text-white">{c.name}</span> ·{" "}
              {new Date(c.createdAt).toLocaleString("pt-BR")}
            </p>
            <p className="mt-2 text-sm text-[#4b5563] dark:text-[#d4d4d8]">{c.text}</p>
            {c.adminReply && (
              <div className="mt-3 rounded-xl border border-[#9333ea]/40 bg-[#9333ea]/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9333ea]">área reversa respondeu</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.adminReply}</p>
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-[#9ca3af]">Seja o primeiro a comentar.</p>}
      </div>
    </section>
  );
}
