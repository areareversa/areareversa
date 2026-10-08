export const metadata = {
  title: "Podcast",
  description: "O podcast da área reversa: desmontando narrativas, ideias, discursos e políticas.",
};

export const revalidate = 3600;

type Ep = { title: string; link: string; pubDate: string; audioUrl?: string; contentSnippet?: string };

export default async function PodcastPage() {
  let episodes: Ep[] = [];
  try {
    const res = await fetch("https://anchor.fm/s/118427fe8/podcast/rss", { next: { revalidate: 3600 } });
    const xml = await res.text();
    const itemsXml = xml.split("<item>").slice(1);
    episodes = itemsXml.map((block) => {
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
  } catch {}

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-[-0.04em]">podcast</h1>
      <p className="max-w-xl text-[#4b5563] dark:text-[#d4d4d8]">
        Bastidores, ideias e discursos desmontados ao vivo. Ouça os episódios mais recentes do canal da área reversa:
      </p>
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a30]">
        <iframe
          title="Podcast área reversa no YouTube"
          src="https://www.youtube.com/embed?listType=search&list=área+reversa+podcast"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Episódios</h2>
        {episodes.map((ep) => (
          <div key={ep.link} className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30]">
            <a href={ep.link} target="_blank" rel="noreferrer" className="font-semibold hover:text-[#9333ea]">
              {ep.title}
            </a>
            {ep.pubDate && <p className="text-xs text-[#9ca3af]">{new Date(ep.pubDate).toLocaleDateString("pt-BR")}</p>}
            {ep.contentSnippet && <p className="text-sm text-[#4b5563] dark:text-[#d4d4d8]">{ep.contentSnippet}...</p>}
            {ep.audioUrl && <audio controls src={ep.audioUrl} className="w-full" preload="none" />}
          </div>
        ))}
        {episodes.length === 0 && <p className="text-sm text-[#9ca3af]">Episódios indisponíveis no momento. Tente novamente mais tarde.</p>}
      </section>

      <a
        href="https://www.youtube.com/@areareversa?sub_confirmation=1"
        target="_blank"
        rel="noreferrer"
        className="text-[#9333ea] underline underline-offset-4"
      >
        inscrever-se no canal →
      </a>
    </div>
  );
}
