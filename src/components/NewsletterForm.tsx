"use client";

import { useState, useEffect } from "react";
import { GAEvents } from "@/lib/gaEvents";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "check_email" | "confirmed" | "error">("input");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newsletterStatus = params.get("newsletter");
    if (newsletterStatus === "confirmed") {
      setStep("confirmed");
      setMsg("Inscrição confirmada! Obrigado por assinar a newsletter da área reversa.");
    } else if (newsletterStatus === "already_confirmed") {
      setStep("confirmed");
      setMsg("Este e-mail já estava confirmado na nossa lista.");
    } else if (newsletterStatus === "expired_token") {
      setStep("error");
      setMsg("O link de confirmação expirou. Tente se inscrever novamente.");
    } else if (newsletterStatus === "invalid_token") {
      setStep("error");
      setMsg("Link de confirmação inválido.");
    }
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      
      if (res.ok) {
        setStep("check_email");
        setMsg(data.message ?? "E-mail de confirmação enviado. Verifique sua caixa de entrada (e spam).");
        GAEvents.newsletterSignup(email, true);
        setEmail("");
      } else {
        setStep("error");
        setMsg(data.error ?? "Erro ao inscrever");
        GAEvents.newsletterSignup(email, false, data.error);
      }
    } catch {
      setLoading(false);
      setStep("error");
      setMsg("Erro de conexão. Tente novamente.");
      GAEvents.newsletterSignup(email, false, "network_error");
    }
  }

  if (step === "confirmed") {
    return (
      <div className="rounded-2xl border border-[#22c55e]/30 bg-[#f0fdf4] p-4 dark:bg-[#14532e]/30">
        <p className="text-[#166534] dark:text-[#86efac]">{msg}</p>
      </div>
    );
  }

  if (step === "check_email") {
    return (
      <div className="rounded-2xl border border-[#9333ea]/30 bg-[#faf5ff] p-4 dark:bg-[#581c87]/30">
        <p className="text-[#7e22ce] dark:text-[#d8b4fe]">{msg}</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="rounded-2xl border border-[#ef4444]/30 bg-[#fef2f2] p-4 dark:bg-[#7f1d1d]/30">
        <p className="text-[#b91c1c] dark:text-[#fca5a5]">{msg}</p>
        <button onClick={() => { setStep("input"); setMsg(""); }} className="mt-2 text-xs text-[#ef4444] underline">Tentar novamente</button>
      </div>
    );
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
      {msg && <p className="text-xs text-[#ef4444] dark:text-[#fca5a5]">{msg}</p>}
    </form>
  );
}