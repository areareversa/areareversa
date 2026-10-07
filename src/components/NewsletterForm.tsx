"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Inscrição confirmada. Obrigado!" : data.error ?? "Erro ao inscrever");
    if (res.ok) setEmail("");
  }

  return (
    <form onSubmit={enviar} className="flex w-full max-w-md flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-2.5 text-sm outline-none focus:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c]"
        />
        <button
          disabled={loading}
          className="rounded-xl bg-[#0f0f12] px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-[#0f0f12]"
        >
          {loading ? "..." : "Assinar"}
        </button>
      </div>
      {msg && <p className="text-xs text-[#4b5563] dark:text-[#d4d4d8]">{msg}</p>}
    </form>
  );
}
