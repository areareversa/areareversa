"use client";

import { useState, useEffect } from "react";
import { PodcastEpisodeSkeleton } from "@/components/Skeletons";
import { GAEvents } from "@/lib/gaEvents";
import { usePlayer } from "@/lib/PlayerContext";

type Ep = {
  title: string;
  link: string;
  pubDate: string;
  audioUrl?: string;
  contentSnippet?: string;
  duration?: string;
  guid?: string;
};

export default function PodcastClient({ initialEpisodes }: { initialEpisodes: Ep[] }) {
  const [episodes, setEpisodes] = useState<Ep[]>(initialEpisodes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const { play, setQueueEpisodes } = usePlayer();

  useEffect(() => {
    const validEpisodes = episodes.filter((ep) => ep.audioUrl) as (Ep & { audioUrl: string })[];
    if (validEpisodes.length > 0) {
      setQueueEpisodes(validEpisodes);
    }
  }, [episodes, setQueueEpisodes]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/podcast")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.episodes) && d.episodes.length > 0) {
          setEpisodes(d.episodes);
          setUpdatedAt(d.fetchedAt ?? null);
          setError(null);
        } else {
          // mantém o que veio do servidor em vez de mostrar a página vazia
          setError(d.error ?? "feed indisponível");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("não consegui atualizar a lista");
        setLoading(false);
      });
  }, []);

  const handlePlay = (ep: Ep & { audioUrl: string }) => {
    play(ep);
    GAEvents.podcastPlay(ep.title, ep.link);
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-[-0.04em]">podcast</h1>
      <p className="max-w-xl text-[#4b5563] dark:text-[#d4d4d8]">
        Bastidores, ideias e discursos desmontados ao vivo. Ouça os episódios mais recentes do canal da área reversa:
      </p>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
          Episódios
          {updatedAt ? (
            <span className="ml-2 font-sans text-xs normal-case tracking-normal text-[#9ca3af]/70">
              atualizado em {new Date(updatedAt).toLocaleString("pt-BR")}
            </span>
          ) : null}
        </h2>
        {error ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
            Não consegui atualizar a lista agora ({error}). Mostrando a última versão conhecida.
          </p>
        ) : null}
        {loading ? (
          <>
            <PodcastEpisodeSkeleton />
            <PodcastEpisodeSkeleton />
            <PodcastEpisodeSkeleton />
          </>
        ) : (
          episodes.map((ep) => (
            <div key={ep.guid ?? ep.audioUrl ?? ep.link} className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30]">
              <a href={ep.link} target="_blank" rel="noreferrer" className="font-semibold hover:text-[#9333ea]">
                {ep.title}
              </a>
              <p className="flex flex-wrap gap-x-3 text-xs text-[#9ca3af]">
                {ep.pubDate && <time dateTime={ep.pubDate}>{new Date(ep.pubDate).toLocaleDateString("pt-BR")}</time>}
                {ep.duration && <span>{ep.duration}</span>}
              </p>
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
          ))
        )}
        {!loading && episodes.length === 0 && <p className="text-sm text-[#9ca3af]">Episódios indisponíveis no momento. Tente novamente mais tarde.</p>}
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