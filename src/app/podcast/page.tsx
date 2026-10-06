export const metadata = {
  title: "Podcast",
  description: "O podcast da área reversa: desmontando narrativas, ideias, discursos e políticas.",
};

export default function PodcastPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-tight">podcast</h1>
      <p className="max-w-xl text-neutral-500">
        Bastidores, ideias e discursos desmontados ao vivo. Ouça os episódios mais recentes do canal da área reversa no YouTube:
      </p>
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe
          title="Podcast área reversa no YouTube"
          src="https://www.youtube.com/embed?listType=search&list=área+reversa+podcast"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <a
        href="https://www.youtube.com/@areareversa?sub_confirmation=1"
        target="_blank"
        rel="noreferrer"
        className="font-mono text-sm underline underline-offset-4"
      >
        inscrever-se no canal →
      </a>
    </div>
  );
}
