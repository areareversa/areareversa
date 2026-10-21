"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { GAEvents } from "@/lib/gaEvents";
import type { Episode } from "@/lib/podcast";

/**
 * Último episódio do podcast na landing.
 *
 * A landing original só tinha o botão "Ouvir o podcast" levando para /podcast —
 * quem chegava não via que o episódio mais recente já estava ali para tocar. O
 * bloco reaproveita o player fixo do site (o mesmo de /podcast e do fim dos
 * artigos), então dá para ouvir sem sair da home.
 *
 * O alinhamento segue a landing em pt-BR (coluna à esquerda, sem centralizar):
 * é uma seção a mais entre o hero e "Últimas do blog", não um destaque de topo.
 */
export default function LandingPodcast({ episode }: { episode: Episode & { audioUrl: string } }) {
  const { play, setQueueEpisodes } = usePlayer();

  const tocar = () => {
    setQueueEpisodes([episode]);
    play(episode);
    GAEvents.podcastPlay(episode.title, episode.link ?? "");
  };

  return (
    <section
      aria-labelledby="ultimo-episodio"
      className="flex flex-col items-start gap-4 rounded-3xl border border-[#9333ea]/30 bg-[#9333ea]/5 p-8 dark:border-[#9333ea]/40 dark:bg-[#17171c]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9333ea]">
        Último episódio do podcast
      </p>
      <h2
        id="ultimo-episodio"
        className="max-w-3xl text-2xl font-bold leading-snug tracking-[-0.02em]"
      >
        {episode.title}
      </h2>
      {episode.pubDate && (
        <p className="text-xs text-[#9ca3af]">
          <time dateTime={episode.pubDate}>
            {new Date(episode.pubDate).toLocaleDateString("pt-BR")}
          </time>
          {episode.duration ? ` · ${episode.duration}` : ""}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          onClick={tocar}
          className="rounded-[14px] bg-[#0f0f12] px-6 py-3.5 text-base font-semibold text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-[#0f0f12]"
        >
          ▶ Ouvir o episódio
        </button>
        {episode.link && (
          <a
            href={episode.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#9333ea] underline underline-offset-4"
          >
            abrir no Spotify →
          </a>
        )}
      </div>
    </section>
  );
}
