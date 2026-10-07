import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { slug, name, text } = await req.json().catch(() => ({}));
  const cleanName = String(name ?? "").trim().slice(0, 80);
  const cleanText = String(text ?? "").trim().slice(0, 2000);
  if (!cleanName || !cleanText) {
    return NextResponse.json({ error: "Nome e comentário são obrigatórios" }, { status: 400 });
  }
  const post = await prisma.post.findUnique({ where: { slug: String(slug ?? "") } }).catch(() => null);
  if (!post) return NextResponse.json({ error: "post não encontrado" }, { status: 404 });
  const comment = await prisma.comment.create({
    data: { postId: post.id, name: cleanName, text: cleanText },
  });
  return NextResponse.json({ comment: { id: comment.id, name: comment.name, text: comment.text, createdAt: comment.createdAt } });
}
