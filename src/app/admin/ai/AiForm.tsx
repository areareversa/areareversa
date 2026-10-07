"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AiForm() {
  const [tema, setTema] = useState("");
  const [instrucoes, setInstrucoes] = useState("");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function gerar() {
    setLoading(true);
    setErro("");
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema, instrucoes }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.texto) setTexto(data.texto);
    else setErro(data.error ?? "Erro desconhecido");
  }

  function usarNaPostagem() {
    sessionStorage.setItem("ar_ai_content", texto);
    router.push("/admin/new");
  }

  const input = "rounded-lg border border-neutral-300 bg-transparent px-4 py-2 dark:border-[#2a2a30]";

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-bold">escrever com IA</h1>
      <label className="flex flex-col gap-1 text-sm">
        Tema da postagem
        <input className={input} value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: a narrativa da semana" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Instruções extras (opcional)
        <textarea className={input} rows={3} value={instrucoes} onChange={(e) => setInstrucoes(e.target.value)} />
      </label>
      <button onClick={gerar} disabled={loading || !tema} className="rounded-lg bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900">
        {loading ? "gerando..." : "gerar rascunho"}
      </button>
      {erro && <p className="text-sm text-red-500">{erro}</p>}
      {texto && (
        <>
          <textarea readOnly rows={18} value={texto} className={`${input} font-mono text-sm`} />
          <button onClick={usarNaPostagem} className="rounded-lg border border-neutral-300 px-4 py-2 dark:border-[#2a2a30]">
            usar este texto na nova postagem →
          </button>
        </>
      )}
    </div>
  );
}
