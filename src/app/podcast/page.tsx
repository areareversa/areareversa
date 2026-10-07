export const metadata = {
  title: "Podcast",
  description: "O podcast da área reversa: desmontando narrativas, ideias, discursos e políticas.",
};

export default function PodcastPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-[-0.04em]">podcast</h1>
      <p className="max-w-xl text-[#4b5563] dark:text-[#d4d4d8]">
        Bastidores, ideias e discursos desmontados ao vivo. Ouça os episódios mais recentes do canal da área reversa no YouTube:
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

