import { NextResponse } from "next/server";
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

  await prisma.emailSubscriber.update({
    where: { id: subscriber.id },
    data: { 
      confirmed: true, 
      token: null, 
      tokenExpiresAt: null,
      confirmedAt: new Date(),
    },
  });

  // Send welcome email
  await sendWelcomeEmail(subscriber.email).catch(console.error);

  return NextResponse.redirect(new URL("/?newsletter=confirmed", request.url));
}