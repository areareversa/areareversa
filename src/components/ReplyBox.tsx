"use client";

import { useState } from "react";

export function ReplyBox({ commentId, defaultValue, action }: { commentId: string; defaultValue?: string | null; action: (formData: FormData) => Promise<void> }) {
  const [reply, setReply] = useState(defaultValue ?? "");
  const [loading, setLoading] = useState(false);

  async function gerarComIA() {
    setLoading(true);
    const res = await fetch("/api/ai/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (data.resposta) setReply(data.resposta);
    else alert(data.error ?? "Erro ao gerar");
  }

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <textarea
        name="reply"
        rows={3}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Resposta oficial..."
        className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-[#2a2a30]"
      />
      <div className="flex gap-3">
        <button type="button" onClick={gerarComIA} disabled={loading} className="rounded-full border border-[#9333ea]/50 px-3 py-1 text-xs text-[#9333ea] disabled:opacity-50">
          {loading ? "gerando..." : "gerar com IA"}
        </button>
        <button className="rounded-full border border-neutral-300 px-3 py-1 text-xs dark:border-[#2a2a30]">salvar resposta</button>
      </div>
    </form>
  );
}
