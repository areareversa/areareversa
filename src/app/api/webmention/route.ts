import { NextResponse } from "next/server";
import { receiveWebmention, getSiteUrl } from "@/lib/webmention";

export const dynamic = "force-dynamic";

/**
 * Endpoint receptor de webmentions.
 *
 * Outro site envia:  POST /api/webmention
 *   header: Source: https://exemplo.com/artigo
 *   corpo:   target=https://areareversa.com.br/blog/meu-post
 *
 * Retornamos 202 (não 4xx) quando aceitamos mas não processamos — o protocolo
 * manda não punir quem erra o endereço, para não frustrar o autor.
 */
export async function POST(req: Request) {
  const source =
    req.headers.get("source") ??
    req.headers.get("Source") ??
    "";

  const ctype = req.headers.get("content-type") ?? "";

  let target = "";
  try {
    if (ctype.includes("application/json")) {
      const body = (await req.json()) as { source?: string; target?: string };
      target = String(body.target ?? "");
      if (!source && body.source) {
        const s = String(body.source);
        return handle(s, target);
      }
    } else {
      const form = await req.formData();
      target = String(form.get("target") ?? "");
    }
  } catch {
    return NextResponse.json({ ok: false, error: "corpo inválido" }, { status: 400 });
  }

  return handle(source, target);
}

async function handle(source: string, target: string) {
  if (!source || !target) {
    return NextResponse.json(
      { ok: false, error: "header Source e parâmetro target são obrigatórios" },
      { status: 400 }
    );
  }

  const result = await receiveWebmention(source, target);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, accepted: true, reason: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    duplicate: result.duplicate,
    type: result.type,
    matchedPost: result.known,
  });
}

/** Descoberta do endpoint (o protocolo pede que isso responda GET). */
export async function GET() {
  const siteUrl = await getSiteUrl();
  return NextResponse.json({
    endpoint: `${siteUrl}/api/webmention`,
    supported: ["reply", "like", "repost", "mention", "bookend"],
  });
}