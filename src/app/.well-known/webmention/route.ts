import { NextResponse } from "next/server";
import { POST as handlePost } from "../../api/webmention/route";
import { getSiteUrl } from "@/lib/webmention";

export const dynamic = "force-dynamic";

/**
 * /.well-known/webmention — o protocolo manda responder OPTIONS e POST aqui.
 * O processamento real acontece em /api/webmention (GET redireciona para lá).
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Accept-Post": "application/x-www-form-urlencoded",
    },
  });
}

export async function GET() {
  const siteUrl = await getSiteUrl();
  return NextResponse.json({
    endpoint: `${siteUrl}/api/webmention`,
    supported: ["reply", "like", "repost", "mention", "bookend"],
  });
}

export { handlePost as POST };