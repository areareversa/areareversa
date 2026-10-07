import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function key() {
  return process.env.GEMINI_API_KEY;
}

export async function POST(req: Request) {
  const k = key();
  if (!k) return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });

  const { slug, mode, pergunta } = await req.json().catch(() => ({}));
  const post = await prisma.post.findUnique({ where: { slug: String(slug ?? "") } }).catch(() => null);
  if (!post) return NextResponse.json({ error: "post não encontrado" }, { status: 404 });

  let prompt: string;
  if (mode === "resumir") {
    prompt = `Resuma em português, em no máximo 5 bullet points, o post abaixo. Seja direto.\n\nTítulo: ${post.title}\n\n${post.content}`;
  } else if (mode === "perguntar") {
    if (!pergunta || !String(pergunta).trim()) {
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
    }
    prompt = `Responda à pergunta usando APENAS o conteúdo do post abaixo. Se não houver resposta, diga que o post não cobre esse ponto.\n\nPost: ${post.title}\n\n${post.content}\n\nPergunta: ${pergunta}`;
  } else {
    return NextResponse.json({ error: "modo inválido" }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${k}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "Falha ao gerar", detalhe: data }, { status: 500 });
  return NextResponse.json({ texto: text });
}
