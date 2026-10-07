import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function deviceOf(ua: string): string {
  const m = ua.toLowerCase();
  if (/ipad|tablet/.test(m)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(m)) return "mobile";
  return "desktop";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const path = String(body.path ?? "");
  const type = body.type === "click" ? "click" : "pageview";
  const target = body.target ? String(body.target) : null;
  if (!path || path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true });
  }
  await prisma.event
    .create({
      data: { type, path, target, device: deviceOf(req.headers.get("user-agent") ?? "") },
    })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
