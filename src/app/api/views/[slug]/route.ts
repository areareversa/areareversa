import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post
    .update({ where: { slug }, data: { views: { increment: 1 } }, select: { views: true } })
    .catch(() => null);
  if (!post) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  return NextResponse.json({ views: post.views });
}
