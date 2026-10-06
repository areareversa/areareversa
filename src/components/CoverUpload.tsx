"use client";

import { useState } from "react";

export function CoverUpload() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      const input = document.querySelector<HTMLInputElement>('input[name="coverImage"]');
      if (input) input.value = data.url;
      setMsg("imagem enviada ✓");
    } else {
      setMsg("erro: " + (data.error ?? "falha no upload"));
    }
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      Ou enviar imagem (Vercel Blob)
      <input type="file" accept="image/*" onChange={onChange} className="text-sm" />
      {loading && <span className="text-xs text-neutral-400">enviando...</span>}
      {msg && <span className="text-xs text-neutral-500">{msg}</span>}
    </label>
  );
}
