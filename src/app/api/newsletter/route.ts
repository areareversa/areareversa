import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import crypto from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function sendConfirmationEmail(email: string, token: string) {
  // TODO: Implement actual email sending with nodemailer
  // For now, log the confirmation link
  const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${token}`;
  console.log(`[Newsletter] Confirmation email for ${email}: ${confirmUrl}`);
  
  // Example with nodemailer (uncomment and configure):
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: "área reversa <newsletter@areareversa.com.br>",
    to: email,
    subject: "Confirme sua inscrição na newsletter da área reversa",
    html: `
      <p>Obrigado por se inscrever!</p>
      <p><a href="${confirmUrl}">Clique aqui para confirmar seu e-mail</a></p>
      <p>Ou copie este link: ${confirmUrl}</p>
    `,
  });
  */
}

async function sendWelcomeEmail(email: string) {
  // TODO: Implement welcome email
  console.log(`[Newsletter] Welcome email sent to ${email}`);
}

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