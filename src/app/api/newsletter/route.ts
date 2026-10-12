import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { generateToken, sendConfirmationEmail } from "@/lib/email";

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

  const existing = await prisma.emailSubscriber.findUnique({ where: { email: clean } });
  if (existing?.confirmed && !existing.unsubscribedAt) {
    return NextResponse.json(
      { error: "Este e-mail já está inscrito e confirmado." },
      { status: 400 }
    );
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  await prisma.emailSubscriber.upsert({
    where: { email: clean },
    update: {
      token,
      tokenExpiresAt: expiresAt,
      confirmed: false,
      confirmedAt: null,
      unsubscribedAt: null,
    },
    create: {
      email: clean,
      token,
      tokenExpiresAt: expiresAt,
      confirmed: false,
    },
  });

  /**
   * Falha de envio precisa aparecer.
   *
   * Antes o erro era engolido (.catch(console.error)) e a resposta continuava
   * "verifique sua caixa de entrada" — a newsletter podia ficar quebrada
   * semanas sem ninguém perceber. Agora devolvemos 502 e o formulário mostra o erro.
   */
  const result = await sendConfirmationEmail(clean, token);

  if (!result.success) {
    console.error("[Newsletter] falha ao enviar confirmação:", result.reason);
    return NextResponse.json(
      { error: "Não consegui enviar o e-mail agora. Tente de novo em instantes." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "E-mail de confirmação enviado. Verifique sua caixa de entrada.",
  });
}