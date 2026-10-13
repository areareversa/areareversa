import { buildPostMarkdown } from "@/lib/llms";

export const dynamic = "force-dynamic";

/**
 * Versão markdown de um post.
 *
 * O Next.js App Router não aceita "[slug].md" como pasta de rota, então a URL
 * pública /blog/<slug>.md é reescrita para cá pelo middleware. A partir dessa
 * rota o agente pede /blog/fulano.md e recebe markdown limpo, como a
 * especificação llms.txt recomenda.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const md = await buildPostMarkdown(slug);

  if (!md) {
    return new Response("Post não encontrado.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(md, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}