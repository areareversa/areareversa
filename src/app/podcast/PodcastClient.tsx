"use client";

import { useEffect } from "react";
import { usePlayer } from "@/lib/PlayerContext";

type Ep = { title: string; link: string; pubDate: string; audioUrl?: string; contentSnippet?: string };

interface PodcastClientProps {
  episodes: Ep[];
}

export default function PodcastClient({ episodes }: PodcastClientProps) {
  const { play, setQueueEpisodes } = usePlayer();

  useEffect(() => {
    const validEpisodes = episodes.filter((ep) => ep.audioUrl) as (Ep & { audioUrl: string })[];
    if (validEpisodes.length > 0) {
      setQueueEpisodes(validEpisodes);
    }
  }, [episodes, setQueueEpisodes]);

  const handlePlay = (ep: Ep & { audioUrl: string }) => {
    play(ep);
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-[-0.04em]">podcast</h1>
      <p className="max-w-xl text-[#4b5563] dark:text-[#d4d4d8]">
        Bastidores, ideias e discursos desmontados ao vivo. Ouça os episódios mais recentes do canal da área reversa:
      </p>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Episódios</h2>
        {episodes.map((ep) => (
          <div key={ep.link} className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30]">
            <a href={ep.link} target="_blank" rel="noreferrer" className="font-semibold hover:text-[#9333ea]">
              {ep.title}
            </a>
            {ep.pubDate && <p className="text-xs text-[#9ca3af]">{new Date(ep.pubDate).toLocaleDateString("pt-BR")}</p>}
            {ep.contentSnippet && <p className="text-sm text-[#4b5563] dark:text-[#d4d4d8]">{ep.contentSnippet}...</p>}
            {ep.audioUrl && (
              <button
                onClick={() => handlePlay(ep as Ep & { audioUrl: string })}
                className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-3 text-left text-sm font-medium transition hover:border-[#9333ea]/60 hover:text-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c]"
              >
                ▶ Tocar este episódio
              </button>
            )}
          </div>
        ))}
        {episodes.length === 0 && <p className="text-sm text-[#9ca3af]">Episódios indisponíveis no momento. Tente novamente mais tarde.</p>}
      </section>

      <a
        href="https://open.spotify.com/show/55306llwlxedD2t6FzzSr9"
        target="_blank"
        rel="noreferrer"
        className="text-[#9333ea] underline underline-offset-4"
      >
        ouvir no Spotify →
      </a>
    </div>
  );
}