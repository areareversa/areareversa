import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      confirmed: false, // Also un-confirm so they can resubscribe later
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
    // Don't reveal if email exists or not
    return NextResponse.json({ ok: true, message: "Se o e-mail existir, enviaremos link de cancelamento." });
  }

  // Generate unsubscribe token
  const crypto = await import("crypto");
  const unsubscribeToken = crypto.randomBytes(32).toString("hex");
  
  await prisma.emailSubscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribeToken },
  });

  // TODO: Send unsubscribe email with link
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br"}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
  console.log(`[Newsletter] Unsubscribe link for ${clean}: ${unsubscribeUrl}`);

  return NextResponse.json({ ok: true, message: "Se o e-mail existir, enviaremos link de cancelamento." });
}