import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { generateToken, sendConfirmationEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  
  if (!rateLimit(`newsletter:${ip}`, 5)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde." }, { status: 429 });
  }
  
  const clean = String(email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  // Check if already confirmed
  const existing = await prisma.emailSubscriber.findUnique({ where: { email: clean } });
  if (existing?.confirmed) {
    return NextResponse.json({ error: "Este e-mail já está inscrito e confirmado." }, { status: 400 });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.emailSubscriber.upsert({
    where: { email: clean },
    update: { 
      token, 
      tokenExpiresAt: expiresAt,
      confirmed: false,
    },
    create: { 
      email: clean, 
      token, 
      tokenExpiresAt: expiresAt,
      confirmed: false,
    },
  });

  // Send confirmation email
  await sendConfirmationEmail(clean, token).catch(console.error);

  return NextResponse.json({ ok: true, message: "E-mail de confirmação enviado. Verifique sua caixa de entrada." });
}