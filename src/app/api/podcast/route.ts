import { fetchEpisodes } from "@/lib/podcast";

export const dynamic = "force-dynamic";

/**
 * API do podcast — sempre busca o feed na hora (sem cache), para que um
 * episódio publicado no Spotify apareça no site assim que a página carregar.
 */
export async function GET() {
  const result = await fetchEpisodes({ revalidate: false });

  return Response.json(
    {
      episodes: result.episodes,
      count: result.episodes.length,
      source: result.source ?? null,
      fetchedAt: result.fetchedAt,
      error: result.error ?? null,
    },
    {
      status: result.episodes.length > 0 ? 200 : 502,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}