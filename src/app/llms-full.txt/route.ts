import { buildLlmsFullTxt } from "@/lib/llms";

export const dynamic = "force-dynamic";

/** Conteúdo integral de todos os posts, em um arquivo só. */
export async function GET() {
  const body = await buildLlmsFullTxt();

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}