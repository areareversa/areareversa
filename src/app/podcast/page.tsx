import type { Metadata } from "next";
import PodcastClient from "./PodcastClient";
import { fetchEpisodes } from "@/lib/podcast";

export const metadata: Metadata = {
  title: "Podcast",
  description: "O podcast da área reversa: desmontando narrativas, ideias, discursos e políticas.",
};

export const revalidate = 300;

export default async function PodcastPage() {
  const { episodes } = await fetchEpisodes({ revalidate: 300 });
  return <PodcastClient initialEpisodes={episodes} />;
}