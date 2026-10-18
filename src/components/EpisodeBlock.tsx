"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { GAEvents } from "@/lib/gaEvents";

export type EpisodeForPost = {
  title: string;
  link?: string;
  pubDate?: string;
  audioUrl: string;
  duration?: string;
  /** true quando o episódio é mesmo o do post; false quando é o mais recente. */
  matched: boolean;
};

/**
 * Bloco do episódio no fim do artigo.
 *
 * Quando `matched` é true, o episódio é o do próprio post e o cartão convida a
 * ouvir o artigo. Quando é false, é o episódio mais recente do canal: o texto
 * muda para não afirmar que o áudio trata daquele assunto.
 *
 * O botão toca no player fixo do site (o mesmo da página /podcast), em vez de
 * mandar a pessoa para o app do Spotify. O link para o Spotify fica abaixo, para
 * quem quiser ouvir no app.
 */
export default function EpisodeBlock({ episode }: { episode: EpisodeForPost }) {
  const { play, setQueueEpisodes } = usePlayer();

  const tocar = () => {
    setQueueEpisodes([episode]);
    play(episode);
    GAEvents.podcastPlay(episode.title, episode.link ?? "");
  };

  return (
    <section
      aria-labelledby="episodio-do-post"
      className="flex flex-col gap-3 rounded-2xl border border-[#9333ea]/30 bg-[#f9f7fa] p-5 dark:border-[#9333ea]/40 dark:bg-[#17171c]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9333ea]">
        {episode.matched ? "Escute este artigo" : "Podcast da área reversa"}
      </p>
      <h2 id="episodio-do-post" className="text-base font-semibold leading-snug tracking-tight">
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
      <button
        onClick={tocar}
        className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-left text-sm font-medium transition hover:border-[#9333ea]/60 hover:text-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c] dark:hover:text-[#9333ea]"
      >
        ▶ {episode.matched ? "Ouvir este episódio" : "Ouvir o episódio"}
      </button>
      {episode.link && (
        <a
          href={episode.link}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[#9333ea] underline underline-offset-4"
        >
          abrir no Spotify →
        </a>
      )}
    </section>
  );
}