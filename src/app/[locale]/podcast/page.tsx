import { Metadata } from "next";
import PodcastClient from "./PodcastClient";

export const metadata: Metadata = {
  title: "Podcast",
  description: "O podcast da área reversa: desmontando narrativas, ideias, discursos e políticas.",
};

export const revalidate = 3600;

type Ep = { title: string; link: string; pubDate: string; audioUrl?: string; contentSnippet?: string };

async function fetchEpisodes(): Promise<Ep[]> {
  try {
    const res = await fetch("https://anchor.fm/s/118427fe8/podcast/rss", { next: { revalidate: 3600 } });
    const xml = await res.text();
    const itemsXml = xml.split("<item>").slice(1);
    return itemsXml.map((block) => {
      const get = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      };
      const enc = block.match(/<enclosure[^>]*url="([^"]+)"/);
      return {
        title: get("title"),
        link: get("link"),
        pubDate: get("pubDate"),
        audioUrl: enc?.[1],
        contentSnippet: get("description").replace(/<[^>]+>/g, " ").slice(0, 160),
      };
    });
  } catch {
    return [];
  }
}

export default async function PodcastPage() {
  const episodes = await fetchEpisodes();
  return <PodcastClient initialEpisodes={episodes} />;
}