import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });
  }
  const { tema, instrucoes } = await req.json();
  const prompt = `Você é um redator do blog "área reversa" (engenharia reversa de ideias, discursos e políticas, tom crítico, direto, sem filtro). Escreva uma postagem em Markdown bem estruturada (título H1, subtítulos, parágrafos curtos) sobre: ${tema}. ${instrucoes ?? ""}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: "Falha ao gerar", detalhe: data }, { status: 500 });
  }
  return NextResponse.json({ texto: text });
}
