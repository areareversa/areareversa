"use client";

import { useState, useEffect } from "react";
import { useTranslations, useFormatter, useLocale } from "next-intl";
import { usePlayer } from "@/lib/PlayerContext";
import { SkeletonList } from "@/components/Skeletons";
import { Episode as PodcastEpisode } from "@/lib/podcast";

type Episode = PodcastEpisode;

export default function PodcastPageClient({ initialLocale, initialEpisodes }: { initialLocale: string; initialEpisodes: PodcastEpisode[] }) {
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [loading, setLoading] = useState(!initialEpisodes?.length);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("podcast");
  const commonT = useTranslations("common");
  const fmt = useFormatter();
  const currentLocale = useLocale();
  const { play, setQueueEpisodes } = usePlayer();

  useEffect(() => {
    if (initialEpisodes?.length) {
      setLoading(false);
      return;
    }
    fetch("/api/podcast")
      .then((r) => r.json() as Promise<{ episodes: Episode[] }>)
      .then((data) => {
        if (Array.isArray(data.episodes) && data.episodes.length > 0) {
          setEpisodes(data.episodes as unknown as Episode[]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t("errorLoading"));
        setLoading(false);
      });
  }, [initialEpisodes]);

  const renderSkeleton = () => (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-bold tracking-[-0.04em] mb-8">{t("title")}</h1>
      <div className="space-y-6">
        <SkeletonList count={5} />
      </div>
    </div>
  );

  const renderEpisode = (ep: Episode) => (
    <div key={ep.guid ?? ep.audioUrl ?? ep.title} className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30] dark:bg-[#17171c]">
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
          onClick={() => { 
            const playerEpisode = {
              title: ep.title,
              audioUrl: ep.audioUrl,
              pubDate: ep.pubDate,
              link: ep.link,
              contentSnippet: ep.contentSnippet,
              coverImage: ep.image,
            };
            setQueueEpisodes([ep as any]);
            play(playerEpisode as any);
          }}
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-3 text-left text-sm font-medium transition hover:border-[#9333ea]/60 hover:text-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c]"
        >
          ▶ {t("play")}
        </button>
      )}
    </div>
  );

  const renderEpisodes = () => (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">{t("episodes")}</h2>
      {episodes.length === 0 ? (
        <p className="text-sm text-[#9ca3af]">{t("noEpisodes")}</p>
      ) : (
        episodes.map((ep) => renderEpisode(ep as Episode))
      )}
    </section>
  );

  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-[-0.04em]">{t("title")}</h1>
        <p className="max-w-xl text-[#4b5563] dark:text-[#d4d4d8]">{t("subtitle")}</p>
      </header>

      {error && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 mb-8">
          {t("errorLoading")} ({error}). {t("showingLastKnown")}
        </div>
      )}

      {renderEpisodes()}

      <a href="https://open.spotify.com/show/55306llwlxedD2t6FzzSr9" target="_blank" rel="noreferrer" className="text-[#9333ea] underline underline-offset-4 mt-8 inline-block">
        {t("openSpotify")}
      </a>
    </div>
  );
}