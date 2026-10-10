import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

function deviceOf(ua: string): string {
  const m = ua.toLowerCase();
  if (/ipad|tablet/.test(m)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(m)) return "mobile";
  return "desktop";
}

async function geoOf(req: Request): Promise<{ country: string | null; city: string | null }> {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-country-code") ??
    null;
  const city = req.headers.get("x-vercel-ip-city");
  if (country) return { country, city: city ? decodeURIComponent(city) : null };

  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim();
  if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: null, city: null };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) });
    const d = await res.json();
    return { country: d.country_code ?? null, city: d.city ?? null };
  } catch {
    return { country: null, city: null };
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const path = String(body.path ?? "");
  const type = body.type === "click" ? "click" : body.type === "vital" ? "vital" : "pageview";
  const target = body.target ? String(body.target) : null;
  const clientDevice = body.device ? String(body.device) : null;
  const clientReferrer = body.referrer ? String(body.referrer) : null;
  
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`track:${ip}`, 60)) return NextResponse.json({ ok: true });
  
  if (!path || path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true });
  }
  
  const geo = await geoOf(req);
  const ua = req.headers.get("user-agent") ?? "";
  
  // Use client-provided device/referrer if available, fallback to server detection
  const device = clientDevice || deviceOf(ua);
  const referrer = clientReferrer || "";
  const country = geo.country;
  const city = geo.city;
  
  await prisma.event
    .create({
      data: { type, path, target, device, referrer, country, city, ip },
    })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}