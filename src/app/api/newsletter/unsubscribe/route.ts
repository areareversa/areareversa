import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const unsubscribeEmailTemplate = (unsubscribeUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f1f1f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Cancelar inscrição</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Clique no botão abaixo para confirmar</p>
  </div>
  <div style="background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-bottom: 16px;">Recebemos um pedido para cancelar sua inscrição na newsletter da <strong>área reversa</strong>.</p>
    <p style="margin-bottom: 24px;">Se foi você, clique no botão abaixo para confirmar o cancelamento:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${unsubscribeUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Cancelar minha inscrição</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
      Ou copie este link no navegador:<br>
      <span style="word-break: break-all; color: #ef4444;">${unsubscribeUrl}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Este link expira em 7 dias. Se não foi você, ignore este e-mail.
    </p>
  </div>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>área reversa — Desmontando narrativas.</p>
  </div>
</body>
</html>
`;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response(
      `<html><body style="font-family:system-ui;padding:2rem;text-align:center">
        <h1>Token inválido</h1><p>Link de cancelamento inválido ou expirado.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const subscriber = await prisma.emailSubscriber.findFirst({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return new Response(
      `<html><body style="font-family:system-ui;padding:2rem;text-align:center">
        <h1>Link inválido</h1><p>Este link de cancelamento não é válido ou já foi usado.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (subscriber.unsubscribedAt) {
    return new Response(
      `<html><body style="font-family:system-ui;padding:2rem;text-align:center">
        <h1>Já cancelado</h1><p>Este e-mail já foi removido da lista.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  await prisma.emailSubscriber.update({
    where: { id: subscriber.id },
    data: { 
      unsubscribedAt: new Date(),
      confirmed: false,
    },
  });

  return new Response(
    `<html><body style="font-family:system-ui;padding:2rem;text-align:center">
      <h1>Cancelado com sucesso</h1>
      <p>O e-mail <strong>${subscriber.email}</strong> foi removido da nossa lista.</p>
      <p>Não receberá mais nossos e-mails. Se mudou de ideia, pode se inscrever novamente no site.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}));
  const clean = String(email ?? "").trim().toLowerCase();
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const subscriber = await prisma.emailSubscriber.findUnique({ where: { email: clean } });
  
  if (!subscriber) {
    return NextResponse.json({ ok: true, message: "Se o e-mail existir, enviaremos link de cancelamento." });
  }

  const crypto = await import("crypto");
  const unsubscribeToken = crypto.randomBytes(32).toString("hex");
  
  await prisma.emailSubscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribeToken },
  });

  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br"}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
  
  // Send unsubscribe email
  await sendEmail(
    clean, 
    "Cancelar inscrição na newsletter da área reversa",
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f1f1f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Cancelar inscrição</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Clique no botão abaixo para confirmar</p>
  </div>
  <div style="background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-bottom: 16px;">Recebemos um pedido para cancelar sua inscrição na newsletter da <strong>área reversa</strong>.</p>
    <p style="margin-bottom: 24px;">Se foi você, clique no botão abaixo para confirmar o cancelamento:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${unsubscribeUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Cancelar minha inscrição</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
      Ou copie este link no navegador:<br>
      <span style="word-break: break-all; color: #ef4444;">${unsubscribeUrl}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Este link expira em 7 dias. Se não foi você, ignore este e-mail.
    </p>
  </div>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>área reversa — Desmontando narrativas.</p>
  </div>
</body>
</html>`
  ).catch(console.error);

  return NextResponse.json({ ok: true, message: "Se o e-mail existir, enviaremos link de cancelamento." });
}