import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendUnsubscribeEmail } from "@/lib/email";
import { getSmtpConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

const SITE_URL = "https://areareversa.com.br";

function page(title: string, body: string) {
  return `<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="robots" content="noindex"></head>
<body style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1f1f1f;padding:2rem 1rem;margin:0">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:2rem">
<h1 style="margin:0 0 1rem;font-size:1.5rem">${title}</h1>
${body}
<p style="margin-top:2rem;font-size:.85rem;color:#9ca3af">
<a href="${SITE_URL}" style="color:#9333ea">área reversa</a> — Desmontando narrativas.
</p>
</div></body></html>`;
}

function htmlResponse(title: string, body: string) {
  return new Response(page(title, body), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return htmlResponse(
      "Link inválido",
      "<p>Este link não tem token. Use o link que veio no e-mail da newsletter.</p>"
    );
  }

  const subscriber = await prisma.emailSubscriber.findFirst({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return htmlResponse(
      "Link inválido",
      "<p>Este link de cancelamento não é válido ou já foi usado.</p>"
    );
  }

  if (subscriber.unsubscribedAt) {
    return htmlResponse(
      "Já cancelado",
      `<p>O e-mail <strong>${subscriber.email}</strong> já foi removido da nossa lista.</p>`
    );
  }

  await prisma.emailSubscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribedAt: new Date(), confirmed: false },
  });

  return htmlResponse(
    "Cancelado com sucesso",
    `<p>O e-mail <strong>${subscriber.email}</strong> foi removido da nossa lista.</p>
     <p>Não receberá mais nossos e-mails. Se mudar de ideia, é só se inscrever novamente no site.</p>
     <p style="margin-top:1.5rem"><a href="${SITE_URL}/rss.xml" style="color:#9333ea">Prefere acompanhar pelo RSS?</a></p>`
  );
}

/**
 * Pedido de cancelamento por e-mail.
 *
 * A resposta é sempre a mesma ("se o e-mail existir...") para não revelar quem
 * está inscrito. O template vem de src/lib/email.ts — antes havia três cópias
 * divergentes deste HTML dentro desta única rota.
 */
export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}));
  const clean = String(email ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const neutro = () =>
    NextResponse.json({
      ok: true,
      message: "Se o e-mail existir na nossa lista, enviamos o link de cancelamento.",
    });

  const subscriber = await prisma.emailSubscriber.findUnique({ where: { email: clean } });
  if (!subscriber || subscriber.unsubscribedAt) return neutro();

  const unsubscribeToken = crypto.randomBytes(32).toString("hex");
  await prisma.emailSubscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribeToken },
  });

  const { siteUrl } = await getSmtpConfig();
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  const result = await sendUnsubscribeEmail(clean, unsubscribeUrl);
  if (!result.success) {
    console.error("[Newsletter] falha ao enviar cancelamento:", result.reason);
    return NextResponse.json(
      { error: "Não consegui enviar o link de cancelamento agora. Tente de novo em instantes." },
      { status: 502 }
    );
  }

  return neutro();
}