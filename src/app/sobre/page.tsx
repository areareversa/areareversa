export const metadata = { title: "Sobre", description: "O que é a área reversa." };

export default function Sobre() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-5xl font-bold tracking-[-0.04em]">sobre</h1>
      <p className="text-lg leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
        A área reversa faz engenharia reversa de ideias, discursos e políticas. Desmontamos narrativas para entender quem montou, com quê e para quê.
      </p>
      <p className="text-lg leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
        Método · Contexto · Sem filtro.
      </p>
    </div>
  );
}
