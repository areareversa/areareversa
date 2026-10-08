export const metadata = { title: "Sobre", description: "O que é a área reversa." };

export default function Sobre() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-5xl font-bold tracking-[-0.04em]">sobre</h1>
      <p className="text-lg leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
        A <strong>área reversa</strong> nasceu de uma ideia simples: toda narrativa pública — uma fala de político, um discurso de CEO, uma reportagem, uma postagem de rede social — é montada por alguém, com alguma intenção, usando certos recortes e omitindo outros. Nossa proposta é fazer o caminho contrário do espectador comum: em vez de consumir a narrativa pronta, nós a desmontamos.
      </p>
      <p className="text-lg leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
        Nos posts e no podcast analisamos como mensagens são construídas: qual estrutura retórica está em jogo, que dados aparecem e quais somem, quais pressupostos estão embutidos e como a mesma história muda dependendo de quem a conta. Usamos fontes primárias (documentos oficiais, transcrições, leis) sempre que possível e deixamos as referências no pé de cada conteúdo.
      </p>
      <p className="text-lg leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
        Não somos um veículo partidário — o método se aplica a qualquer lado do espectro. A ideia é que, no final de cada análise, você consiga enxergar a "caixa de ferramentas" que existe por trás do discurso.
      </p>
      <p className="text-lg leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
        <strong>Método · Contexto · Sem filtro.</strong>
      </p>
    </div>
  );
}
