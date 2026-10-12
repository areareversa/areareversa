import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?newsletter=invalid_token", request.url));
  }

  const subscriber = await prisma.emailSubscriber.findFirst({
    where: { token },
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/?newsletter=invalid_token", request.url));
  }

  if (subscriber.tokenExpiresAt && new Date() > subscriber.tokenExpiresAt) {
    return NextResponse.redirect(new URL("/?newsletter=expired_token", request.url));
  }

  if (subscriber.confirmed) {
    return NextResponse.redirect(new URL("/?newsletter=already_confirmed", request.url));
  }

  // O e-mail de boas-vindas precisa de um link de cancelamento funcional
  // (LGPD). Geramos o token agora e devolvemos ?unsubscribed=1 no final.
  const unsubscribeToken = crypto.randomBytes(32).toString("hex");

  await prisma.emailSubscriber.update({
    where: { id: subscriber.id },
    data: {
      confirmed: true,
      token: null,
      tokenExpiresAt: null,
      confirmedAt: new Date(),
      unsubscribeToken,
      unsubscribedAt: null,
    },
  });

  const result = await sendWelcomeEmail(subscriber.email, unsubscribeToken);

  if (!result.success) {
    console.error("[Newsletter] confirmação ok mas e-mail de boas-vindas falhou:", result.reason);
    return NextResponse.redirect(new URL("/?newsletter=confirmed_no_email", request.url));
  }

  return NextResponse.redirect(new URL("/?newsletter=confirmed", request.url));
}