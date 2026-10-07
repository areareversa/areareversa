import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const clean = String(email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }
  await prisma.emailSubscriber.upsert({ where: { email: clean }, update: {}, create: { email: clean } });
  return NextResponse.json({ ok: true });
}
