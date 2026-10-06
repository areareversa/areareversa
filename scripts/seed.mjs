import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const img = (u) => u;

const posts = [
  {
    title: "A UE96: a primeira urna eletrônica do Brasil",
    category: "Urna Eletrônica",
    excerpt: "Como era a UE96, com teclado de telefone, processador 386SX e 2 MB de RAM.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/0/08/Urna_Eletr%C3%B4nica_Brasileira.jpg"),
    content: `# A UE96: a primeira urna eletrônica do Brasil\n\nEm 1996, o Brasil realizou as primeiras eleições parcialmente eletrônicas. A **UE96** usava um teclado similar ao de telefone, disquetes de 1,44 MB e processador Intel 386SX.\n\n## Detalhes\n\n- Processador: Intel 386SX (40 MHz)\n- Memória: 2 MB\n- Armazenamento: 2 disquetes\n- Acesso: teclado numérico com Braille\n\nFoi a prova de que votar por computador poderia ser simples.`,
  },
  {
    title: "Teclado em Braille: acessibilidade desde o início",
    category: "Urna Eletrônica",
    excerpt: "O teclado numérico da urna tem marcações em Braille desde 1996.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/d/d1/Urna_Eletr%C3%B4nica_Confirma.svg"),
    content: `# Teclado em Braille\n\nDesde a UE96, o teclado da urna traz marcações em Braille para eleitores com deficiência visual.\n\n## Recursos de acessibilidade\n\n- Teclas em Braille\n- Fones de ouvido\n- Sintetizador de voz\n- Intérprete de Libras na tela (UE2020 em diante)`,
  },
  {
    title: "UE98: a primeira a mostrar a foto do candidato",
    category: "Urna Eletrônica",
    excerpt: "A UE98 trouxe a foto dos candidatos na tela e as primeiras mídias flash.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/0/08/Urna_Eletr%C3%B4nica_Brasileira.jpg"),
    content: `# UE98\n\nEm 1998, a UE98 passou a exibir a **foto do candidato** na tela, ajudando eleitores a confirmar o voto.\n\n- Cyrix Geode GXLV 166 MHz\n- 8 MB de RAM\n- Primeiras memórias flash de 15 MB\n- Fiscalização dos dados da votação`,
  },
  {
    title: "UE2000: 100% das eleições eletrônicas",
    category: "Urna Eletrônica",
    excerpt: "Em 2000 o Brasil virou o primeiro país do mundo com eleições 100% eletrônicas.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/d/df/30_anos_da_Urna_Eletr%C3%B4nica_%2855249084336%29.jpg"),
    content: `# UE2000\n\nNas municipais de 2000, cerca de 406 mil urnas UE2000 foram usadas e **todos os eleitores votaram por computador** — um recorde mundial.\n\n## Novidades\n\n- Saída de áudio para fones\n- Teclado com feedback tátil e sonoro\n- Recuperação de falhas sem perder votos`,
  },
  {
    title: "O teclado colorido: BRANCO, CORRIGE e CONFIRMA",
    category: "Urna Eletrônica",
    excerpt: "As três teclas de ação que guiam a votação na urna.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/d/d1/Urna_Eletr%C3%B4nica_Confirma.svg"),
    content: `# As teclas de ação\n\n- **BRANCO** (branca): vota em branco\n- **CORRIGE** (vermelha): anula e permite votar de novo\n- **CONFIRMA** (verde, maior): confirma o voto\n\nO design simula o telefone para facilitar o uso por qualquer pessoa.`,
  },
  {
    title: "UE2020: a urna das eleições recentes",
    category: "Urna Eletrônica",
    excerpt: "Novo design, mais segurança e intérprete de Libras na tela.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/6/62/Urna_eletr%C3%B4nica_brasileira_UE2020.jpg"),
    content: `# UE2020\n\nModelo usado nas eleições de 2020 e 2022, com leitor de QR Code para zerésima e novos recursos de segurança.\n\n- Intérprete de Libras na urna\n- Novo layout\n- Lacre físico reforçado`,
  },
  {
    title: "UE2022: a geração mais nova",
    category: "Urna Eletrônica",
    excerpt: "Fabricada em 2023, 14ª geração de urnas, com teclado sensível ao toque para o mesário.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/6/62/Urna_eletr%C3%B4nica_brasileira_UE2020.jpg"),
    content: `# UE2022\n\nA 14ª geração, fabricada em 2023, traz melhorias no processamento e na interação com o mesário.\n\n## Segurança\n\n- Criptografia avançada\n- Software assinado digitalmente\n- Sistema que só roda no hardware oficial`,
  },
  {
    title: "Como funciona o Teste Público de Segurança (TPS)",
    category: "Urna Eletrônica",
    excerpt: "Especialistas são convidados a tentar hackear a urna antes de cada eleição.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/0/08/Urna_Eletr%C3%B4nica_Brasileira.jpg"),
    content: `# TPS\n\nAntes de cada eleição, o TSE abre as urnas para especialistas tentarem encontrar falhas.\n\n## Fases\n\n1. Inspeção do código-fonte\n2. Ataques físicos e lógicos\n3. Relatório público\n\nÉ um dos mecanismos mais transparentes do mundo.`,
  },
  {
    title: "A zerésima e o boletim de urna",
    category: "Urna Eletrônica",
    excerpt: "Documentos que comprovam que a urna começa zerada e registram o resultado local.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/d/df/30_anos_da_Urna_Eletr%C3%B4nica_%2855249084336%29.jpg"),
    content: `# Zerésima e Boletim de Urna\n\n- **Zerésima**: prova que a urna inicia com zero votos\n- **Boletim de urna**: resultado impresso em cada seção, afixado na porta\n\nQualquer pessoa pode conferir o boletim com o resultado oficial.`,
  },
  {
    title: "Vulnerabilidade histórica: o caso do voto impresso (2002)",
    category: "Urna Eletrônica",
    excerpt: "A urna UE2002 chegou a imprimir o voto, gerando debate sobre sigilo e manuseio.",
    coverImage: img("https://upload.wikimedia.org/wikipedia/commons/d/d1/Urna_Eletr%C3%B4nica_Confirma.svg"),
    content: `# O caso do voto impresso\n\nEm 2002, as urnas imprimiam cada voto para conferência. A medida foi abandonada pela Lei 10.740/2003.\n\n## Por que foi abandonada\n\n- Risco de violar o sigilo do voto\n- Custos operacionais\n- Manuseio humano dos comprovantes\n\nHoje, a auditoria é feita por outros mecanismos (TPS, boletins, cerimônia do código-fonte).`,
  },
];

for (const p of posts) {
  const slug = p.title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  await prisma.post.upsert({
    where: { slug },
    update: { coverImage: p.coverImage },
    create: { ...p, slug, published: true },
  });
  console.log("ok:", slug);
}

await prisma.$disconnect();
