"use client";

import { useState } from "react";

export function AiPostTools({ slug }: { slug: string }) {
  const [texto, setTexto] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function chamar(mode: string, q?: string) {
    setLoading(true);
    setErro("");
    setTexto("");
    const res = await fetch("/api/ai/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, mode, pergunta: q }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (data.texto) setTexto(data.texto);
    else setErro(data.error ?? "Erro desconhecido");
  }

  const btn = "rounded-full border border-[#e5e7eb] px-4 py-2 text-xs font-semibold transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">IA sobre este post</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => chamar("resumir")} disabled={loading} className={btn}>
          {loading ? "..." : "Resumir"}
        </button>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          chamar("perguntar", pergunta);
        }}
      >
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunte algo sobre o post..."
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-2 text-sm outline-none focus:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c]"
        />
        <button disabled={loading || !pergunta.trim()} className={btn}>
          {loading ? "..." : "Perguntar"}
        </button>
      </form>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
      {texto && <p className="whitespace-pre-wrap text-sm text-[#4b5563] dark:text-[#d4d4d8]">{texto}</p>}
    </div>
  );
}
