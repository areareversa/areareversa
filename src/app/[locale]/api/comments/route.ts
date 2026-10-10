import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const { slug, name, text, website } = await req.json().catch(() => ({}));
  if (website) return NextResponse.json({ ok: true }); // honeypot anti-bot
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`comments:${ip}`, 5)) {
    return NextResponse.json({ error: "Muitos comentários. Aguarde um minuto." }, { status: 429 });
  }
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
