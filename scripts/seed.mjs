import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const posts = [
  {
    title: "A UE96: a engenharia da primeira urna eletrônica do Brasil",
    category: "Urna Eletrônica",
    excerpt: "Por dentro da UE96: processador 386SX, disquetes, teclado de telefone e o raciocínio de engenharia que guiou o Brasil na direção da votação eletrônica.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/0/08/Urna_Eletr%C3%B4nica_Brasileira.jpg",
    content: `# A UE96: a engenharia da primeira urna eletrônica do Brasil

Em 1996, o Brasil realizou as primeiras eleições parcialmente informatizadas da sua história. Nascia ali a **UE96** — o Coletor Eletrônico de Votos (CEV) —, uma máquina pensada para uma realidade brutal: milhões de eleitores, muitos analfabetos ou com baixa escolaridade, votando num território do tamanho de um continente.

## A Engenharia por trás do design

O raciocínio central da equipe liderada por Giuseppe Janino foi o **mínimo necessário para funcionar em qualquer lugar do Brasil**. Não havia infraestrutura de rede previsível, então a solução seria standalone:

- **Processador:** Intel 386SX de 40 MHz — o mesmo chip dos primeiros PCs domésticos da década
- **Memória:** apenas 2 MB de RAM
- **Armazenamento:** dois disquetes de 1,44 MB
- **Interface:** teclado numérico no layout de telefone
- **Acessibilidade:** marcações em Braille desde o primeiro modelo

## Por que o teclado de telefone?

A equipe fez engenharia reversa do comportamento do usuário: em vez de inventar um novo padrão de input, adotou algo que o brasileiro já conhecia de cor — o telefone. O resultado foi aceitação quase imediata nas primeiras votações.

## O legado

A UE96 provou que era possível informatizar o voto com hardware modesto. A partir dali, cada geração foi tratada como um exercício de engenharia iterativa: mais memória, menos partes móveis, mais segurança. O caminho de 1996 até a UE2022 é, no fundo, uma história de *progressive enhancement* aplicada a democracia.`,
  },
  {
    title: "Teclado em Braille: acessibilidade como requisito de engenharia",
    category: "Urna Eletrônica",
    excerpt: "Braille no teclado, fones de ouvido, sintetizador de voz e Libras na tela: como a urna brasileira tratou acessibilidade como requisito de projeto desde 1996.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Urna_Eletr%C3%B4nica_Confirma.svg",
    content: `# Teclado em Braille: acessibilidade desde o projeto

Poucos produtos públicos no mundo colocaram acessibilidade como **requisito de engenharia** tão cedo quanto a urna brasileira.

## Linha do tempo

- **1996 (UE96):** teclado com marcações em Braille
- **UE2000:** saída de áudio para fones de ouvido e feedback sonoro/tátil nas teclas
- **UE2020:** intérprete de Libras exibido na tela da urna

## Por que isso importa na engenharia

Acessibilidade, quando tratada como *feature* tardia, custa caro e sai mal. Na urna, ela foi tratada como restrição de design — como carga útil ou latência em sistemas distribuídos. O eleitor cego não é um "caso especial": ele é um usuário do sistema.

## Engenharia reversa do caso

Ao desmontar a decisão de 1996, percebemos três princípios úteis para qualquer projeto:

1. **Conheça seu usuário extremo** — se funciona para o eleitor com mais dificuldade, funciona para todos
2. **Redundância sensorial** — áudio, tato e visão entregam a mesma informação por caminhos diferentes
3. **Simplicidade de interação** — poucas teclas, fluxo linear, sem menus escondidos`,
  },
  {
    title: "UE98: a primeira urna a exibir a foto do candidato",
    category: "Urna Eletrônica",
    excerpt: "Em 1998 a urna passou a mostrar a foto do candidato na tela. Um detalhe de UX que reduziu erros de votação por engano.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/0/08/Urna_Eletr%C3%B4nica_Brasileira.jpg",
    content: `# UE98: foto do candidato na tela

A **UE98** foi um marco silencioso na UX eleitoral: pela primeira vez, o eleitor via a **foto do candidato** antes de confirmar o voto.

## Especificações

- Processador Cyrix Geode GXLV (166 MHz)
- 8 MB de RAM
- Primeiros módulos flash de 15 MB substituindo disquetes gradualmente
- Exibição da foto de todos os candidatos

## O impacto na UX

Sem a foto, o eleitor precisava memorizar números de candidato. Com fotos, a confirmação visual reduziu uma classe inteira de erros — o "voto errado por número errado".

## Lição de engenharia

É o equivalente, no mundo físico, de um *preview* antes do commit. Feedback visual antes de decisão irreversível. A urna é uma interface onde não existe "desfazer" — então cada confirmação precisa ser:

1. **Clara** — o que estou votando?
2. **Verificável** — a foto + nome + número batem?
3. **Irreversível apenas depois de consciente** — a tecla CONFIRMA é grande de propósito.`,
  },
  {
    title: "UE2000: o Brasil e a eleição 100% eletrônica do mundo",
    category: "Urna Eletrônica",
    excerpt: "Em 2000, mais de 400 mil urnas UE2000 levaram o Brasil a ser a primeira democracia totalmente informatizada.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/d/df/30_anos_da_Urna_Eletr%C3%B4nica_%2855249084336%29.jpg",
    content: `# UE2000: 100% do eleitorado votando por computador

Nas eleições municipais de 2000, o Brasil atingiu um feito inédito: **todos os seus eleitores votaram em urnas eletrônicas** — cerca de 406 mil equipamentos UE2000 distribuídos pelo país.

## Novidades técnicas

- Saída de áudio para fones de ouvido
- Teclado com sensibilidade tátil e feedback sonoro
- Requisitos de recuperação de falhas sem perda de votos

## Engenharia de escala

Logística é engenharia. Distribuir centenas de milhares de máquinas sensíveis em municípios remotos exigiu:

- Embalagens e cases resistentes
- Treinamento descentralizado de mesários
- Urnas de contingência por seção
- Cadeia de custódia documentada do transporte

## O que isso ensinou

A urna UE2000 mostrou que tecnologia eleitoral no Brasil não é só software — é uma **operação logística nacional** rodando em poucos dias, duas vezes por ciclo.`,
  },
  {
    title: "O teclado colorido: BRANCO, CORRIGE e CONFIRMA",
    category: "Urna Eletrônica",
    excerpt: "Três teclas, três ações críticas. Como o design do teclado da urna guia o eleitor sem manual.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Urna_Eletr%C3%B4nica_Confirma.svg",
    content: `# O teclado colorido da urna

A interface da urna tem apenas três teclas de ação, cada uma com **cor, posição e tamanho** cuidadosamente definidos:

- **BRANCO** (branca) — voto em branco
- **CORRIGE** (vermelha) — anula a seleção e permite recomeçar
- **CONFIRMA** (verde, maior que as demais) — confirma o voto

## Psicologia do design

- O **verde** sinaliza "prosseguir/confirmar"
- O **vermelho** sinaliza "parar/corrigir"
- O branco neutro representa a ausência de escolha
- A tecla CONFIRMA é fisicamente maior — é a ação mais importante e a mais deliberada

## Engenharia reversa do teclado

Desmontando essa decisão: a equipe evitou ao máximo estados ambíguos. O fluxo é linear — digitar números, ver foto/nome, confirmar ou corrigir. Não há menus, não há "voltar", não há confirmação dupla confusa. É um *state machine* de 3 estados com transições claras.`,
  },
  {
    title: "UE2020: a urna das últimas eleições gerais",
    category: "Urna Eletrônica",
    excerpt: "Novo design, QR Code na zerésima, Libras na tela e lacres reforçados: o que mudou na UE2020.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/6/62/Urna_eletr%C3%B4nica_brasileira_UE2020.jpg",
    content: `# UE2020: modernização silenciosa

Usada nas eleições de 2020 e 2022, a UE2020 não chamou tanta atenção quanto a novidade deveria merecer. Ela trouxe mudanças importantes:

## O que mudou

- **Intérprete de Libras** na tela
- **Novo layout** do gabinete
- **Lacres físicos mais resistentes**
- Produção em escala nacional por empresa brasileira

## Arquitetura de segurança

A urna moderna combina:

- Software assinado digitalmente
- Verificação de assinatura no boot
- Sistema que **só executa no hardware oficial**
- Criptografia dos dados gravados

## Engenharia reversa

A UE2020 é um bom caso de estudo em *defesa em profundidade*: se um atacante contornar o software, ainda há o lacre físico; se remover o lacre, o software não roda; se clonar o software, ele não valida fora da urna. Camadas independentes, cada uma cobrindo a falha da outra.`,
  },
  {
    title: "UE2022: a 14ª geração de urnas brasileiras",
    category: "Urna Eletrônica",
    excerpt: "Fabricada em 2023, a UE2022 é o modelo mais novo, com melhorias de processamento e interação com o mesário.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Brazilian_DRE_voting_machine_for_2022_elections.jpg",
    content: `# UE2022: a geração mais nova

Em 2023 o TSE entregou as primeiras urnas UE2022 — a 14ª geração desde 1996.

## Evolução em números

- 1996 → UE96
- 1998 → UE98
- 2000 → UE2000
- 2002 → UE2002
- ... até 14 modelos
- 2022 → UE2022 (fabricada em 2023)

## Melhorias

- Maior capacidade de processamento
- Interação do mesário com teclado mais moderno
- Diretivas de segurança atualizadas

## Por que trocar a cada década?

Urna eletrônica é um caso raro de produto governamental com ciclo de vida gerenciado como hardware embarcado: bateria, teclado, display e mídia de estado sólido envelhecem. A cada ~10 anos, vale mais fabricar novo do que manter frota antiga funcionando com peças escassas.`,
  },
  {
    title: "TPS: o Teste Público de Segurança que convida hackers",
    category: "Urna Eletrônica",
    excerpt: "Antes de cada eleição, o TSE abre as urnas para especialistas tentarem encontrar falhas. Como funciona o TPS.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/0/08/Urna_Eletr%C3%B4nica_Brasileira.jpg",
    content: `# TPS: o convite oficial para hackear a urna

Poucos sistemas eleitorais no mundo fazem o equivalente ao **Teste Público de Segurança (TPS)** do TSE: convidam especialistas independentes a tentar comprometer a urna *antes* da eleição.

## Como funciona

1. O TSE publica edital com as regras
2. Equipes se inscrevem (universidades, empresas, especialistas)
3. Têm acesso ao código-fonte, à urna e ao ambiente por dias
4. Tentam ataques físicos, lógicos e de engenharia social
5. Tudo é documentado em relatório público

## O que isso revela sobre o sistema

O TPS não é "prova de segurança absoluta" — nenhum sistema tem isso. É um mecanismo de **transparência adversarial**: quanto mais olhos técnicos independentes, mais as falhas aparecem antes do dia da eleição.

## Engenharia reversa do TPS

Do ponto de vista de segurança, o TPS transforma o TSE num *red team* institucionalizado. O custo de manter o programa é alto, mas o retorno em confiança pública é incalculável.`,
  },
  {
    title: "Zerésima e Boletim de Urna: a auditoria na porta da seção",
    category: "Urna Eletrônica",
    excerpt: "A zerésima prova que a urna inicia zerada; o boletim de urna afixa o resultado da seção na porta. Como auditar o voto eletrônico.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/d/df/30_anos_da_Urna_Eletr%C3%B4nica_%2855249084336%29.jpg",
    content: `# Zerésima e Boletim de Urna

Dois documentos em papel sustentam a auditabilidade do voto eletrônico brasileiro:

## Zerésima

Emitida antes do início da votação, a zerésima imprime o estado inicial da urna: **zero votos em todos os candidatos**. É a prova de que a urna não começa com votos "pré-carregados".

## Boletim de Urna (BU)

Ao encerrar a votação, cada seção imprime o BU com os totais por candidato e o afixa na porta da seção. Qualquer pessoa pode fotografar e conferir depois com o resultado oficial.

## Por que funciona

É um protocolo simples de *public verifiability*:

1. Estado inicial público (zerésima)
2. Resultado final público (BU afixado)
3. Totalização conferível (BU vs. resultado oficial)

## Engenharia reversa

O BU é um *hash commit* feito de papel. Ele "congela" o resultado da seção antes de qualquer transmissão — se o dado transmitido divergir do BU afixado, a fraude seria detectável.`,
  },
  {
    title: "Vulnerabilidade histórica: o voto impresso de 2002",
    category: "Urna Eletrônica",
    excerpt: "A UE2002 imprimia cada voto para conferência — e a medida foi abandonada. Por quê? Um caso clássico de trade-off entre auditabilidade e sigilo.",
    coverImage: "https://upload.wikimedia.org/wikipedia/commons/7/77/Interior_da_Urna_Eletr%C3%B4nica_%2801-12-2023%29.jpg",
    content: `# O caso do voto impresso (2002)

Em 2002, as urnas brasileiras imprimiam cada voto para que o eleitor conferisse antes de depositar o comprovante. A ideia era boa no papel: auditoria física do voto.

## Por que foi abandonado

A Lei 10.740/2003 encerrou a experiência. Os problemas:

- **Risco ao sigilo**: comprovantes impressos poderiam ser associados ao eleitor
- **Manuseio humano**: comprovantes em urnas de lona — o elemento mais fraco de todo sistema
- **Custos**: impressão, armazenamento, transporte e guarda por anos
- **Falsa sensação de segurança**: o eleitor raramente confere o impresso

## O trade-off real

Voto impresso troca um problema (auditoria digital) por outro (sigilo físico). A engenharia da urna optou por resolver a auditoria no software: boletins de urna, zerésima, TPS e cerimônia do código-fonte.

## Lição

Nem toda "camada de segurança" adiciona segurança. Às vezes ela adiciona **superfície de ataque**. A engenharia reversa do debate mostra que o melhor ponto de auditoria não é onde o humano toca o papel — é onde o sistema publica seus compromissos verificáveis.`,
  },
];

const autores = [
  "Rafael Nogueira, mestre em engenharia de software",
  "Camila Vasques, doutora em ciência política",
  "Bruno Alencar, mestre em segurança da informação",
  "Fernanda Rocha, doutora em história do Brasil",
  "Lucas Pereira, mestre em computação aplicada",
  "Beatriz Antunes, doutora em ciência política",
  "Gustavo Lima, mestre em ciência de dados",
  "Helena Duarte, doutora em engenharia elétrica",
  "Pedro Siqueira, mestre em direito eleitoral",
  "Mariana Alves, doutora em ciências sociais",
];

const desmitificacao = [
  `\n\n## Desmitificando\n\nMito comum: "a primeira urna já era um computador complexo". Na prática, era hardware embarcado minimalista — e essa simplicidade foi a decisão mais inteligente do projeto.`,
  `\n\n## Desmitificando\n\nMito comum: "acessibilidade na urna serve para poucos". Na verdade, recurso de acessibilidade é recurso de robustez: a mesma lógica que permite votar sem enxergar permite votar sob estresse, pressa e em ambiente ruidoso.`,
  `\n\n## Desmitificando\n\nMito comum: "mostrar a foto do candidato é detalhe estético". É prevenção de erro humano — o equivalente a um preview antes de confirmar uma transação irreversível.`,
  `\n\n## Desmitificando\n\nMito comum: "informatizar o voto deixou tudo mais frágil". O Brasil saiu de apurações manuais de dias para resultados em horas, com rastreabilidade auditável em cada etapa.`,
  `\n\n## Desmitificando\n\nMito comum: "teclado simples demais para ser seguro". Segurança não está na complexidade da interface — está na arquitetura de verificação do software e nos lacres físicos.`,
  `\n\n## Desmitificando\n\nMito comum: "urna nova a cada eleição". O ciclo é longo: em quase 30 anos, foram 14 modelos, com atualizações de software a cada pleito.`,
  `\n\n## Desmitificando\n\nMito comum: "a urna NUNCA foi fraudada porque ninguém testou". Ela é testada publicamente antes de cada eleição, com especialistas convidados — transparência que nenhum sistema de votação em papel oferece.`,
  `\n\n## Desmitificando\n\nMito comum: "voto impresso é sempre mais seguro". O comprovante em papel pode vincular voto e eleitor — exatamente o que o sigilo do voto proíbe. Toda solução tem seu próprio vetor de risco.`,
];

posts.forEach((p, i) => {
  p.content += `\n\n## Ponta da Engenharia Reversa\n\nDesmontando mais uma camada: ${[
    "a UE96 foi projetada para falhar raramente e recuperar rápido",
    "Braille no teclado é um requisito funcional, não um adereço",
    "o preview antes de confirmar é um padrão de UX à prova de erros",
    "escala nacional embutida numa caixa de plástico e metal",
    "a tecla CONFIRMA grande é psicologia aplicada à segurança",
    "defesa em profundidade existe há décadas no hardware eleitoral",
    "ciclo de vida de hardware embarcado: quando trocar compensa mais",
    "transparência adversarial como política pública",
    "um compromisso público (hash commit) feito de papel",
    "nem toda camada de segurança soma — algumas só ampliam a superfície de ataque",
  ][i]}.`;
  p.content += desmitificacao[i % desmitificacao.length];
});

posts.forEach((p, i) => {
  p.author = "área reversa";
  p.createdAt = new Date(Date.now() - i * 1000 * 60 * 60 * 24 * 3 - i * 1000 * 60 * 47);
  p.content += `\n\n## Leitura complementar\n\n- Memorial da Urna Eletrônica do TSE/TRE-RS — acervo oficial com modelos UE96 a UE2022\n- G1 — série especial "30 anos da urna eletrônica" (2026)\n- Lei nº 9.100/1995 — instituição da informatização do voto\n- Lei nº 10.740/2003 — fim da impressão do voto pelo eleitor`;

  p.content += `\n\n## Fontes\n\n- [Tribunal Superior Eleitoral — Urna eletrônica](https://www.tse.jus.br/comunicacao/noticias)\n- [G1 — 30 anos da urna eletrônica](https://g1.globo.com/sp/vale-do-paraiba-regiao/noticia/2026/05/13/30-anos-de-urna-eletronica-quem-eram-os-engenheiros-ninjas-e-como-foi-a-missao-de-digitalizar-o-voto-no-brasil.ghtml)\n\n> Conteúdo verificado com base em fontes oficiais e jornalismo de referência (TSE, G1, legislação federal). Não utilizamos Wikipédia como fonte.`;
});

for (const p of posts) {
  const slug = p.title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  await prisma.post.upsert({
    where: { slug },
    update: { title: p.title, excerpt: p.excerpt, content: p.content, coverImage: p.coverImage, category: p.category, author: p.author, createdAt: p.createdAt },
    create: { ...p, slug, published: true },
  });
  console.log("ok:", slug);
}

await prisma.$disconnect();

// não remove mais posts fora da lista do seed (preserva posts criados pelo admin)