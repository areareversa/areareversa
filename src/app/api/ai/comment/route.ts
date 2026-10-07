import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  const k = process.env.GEMINI_API_KEY;
  if (!k) return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });

  const { commentId } = await req.json().catch(() => ({}));
  const comment = await prisma.comment.findUnique({ where: { id: String(commentId ?? "") }, include: { post: true } }).catch(() => null);
  if (!comment) return NextResponse.json({ error: "comentário não encontrado" }, { status: 404 });

  const prompt = `Você é o editor do blog "área reversa" (tom crítico, direto, sem filtro). Escreva uma resposta CURTA (2-4 frases), em português, para o comentário de um leitor no post "${comment.post.title}". Use o conteúdo do post como contexto. Se o comentário for ofensivo, responda com firmeza e respeito, sem atacar de volta.\n\nPost:\n${comment.post.content.slice(0, 6000)}\n\nComentário de ${comment.name}:\n${comment.text}`;

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
  return NextResponse.json({ resposta: text });
}
