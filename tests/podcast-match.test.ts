import {
  normalizeTitle,
  tokenize,
  significantTokens,
  titlesMatch,
  matchEpisodes,
  resolveEpisode,
  episodeForPost,
  EPISODE_MODE,
} from "../src/lib/podcast-match";

let failed = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "v" : "X"} ${name}`);
  if (!cond) failed++;
}

// os quatro pares reais do feed contra os títulos que estão no banco
const EPISODIOS = [
  { title: "Ep. 04 - Super MEI: A Engenharia Reversa do Teto de R$ 140 Mil.mp3", pubDate: "Fri, 16 Oct 2026 10:21:05 GMT", audioUrl: "https://anchor.fm/a/4" },
  { title: "Ep. 03 - O Código Fonte da Rapina Engenharia Reversa no Centrão", pubDate: "Mon, 12 Oct 2026 22:53:11 GMT", audioUrl: "https://anchor.fm/a/3" },
  { title: "Ep. 02 - O Orçamento Secreto: A Caixa Preta da República", pubDate: "Mon, 12 Oct 2026 17:11:11 GMT", audioUrl: "https://anchor.fm/a/2" },
  { title: "Ep. 01 - Fundo Partidário: O Caixa 2 Legalizado que Financia a Oligarquia", pubDate: "Thu, 08 Oct 2026 10:52:34 GMT", audioUrl: "https://anchor.fm/a/1" },
];

const pares: [string, string][] = [
  ["Super MEI: A Engenharia Reversa do Teto de R$ 140 Mil", "Super MEI"],
  ['O Código Fonte da Rapina: Engenharia Reversa no "Centrão"', "Centrão"],
  ["O Orçamento Secreto: A Caixa Preta da República", "Orçamento Secreto"],
  ["Fundo Partidário: O Caixa 2 Legalizado que Financia a Oligarquia", "Fundo Partidário"],
];

console.log("--- normalizacao ---");
check("tira o prefixo de episodio", normalizeTitle("Ep. 04 - Super MEI: O Teto").startsWith("super mei o teto"));
check("tira o .mp3", !normalizeTitle("Ep. 04 - Super MEI.mp3").includes("mp3"));
check("tira acento e aspas", normalizeTitle('no "Centrão"') === "no centrao");
check("tira dois-pontos e virgula", normalizeTitle("Super MEI: A Engenharia, Inversa") === "super mei a engenharia inversa");

console.log("\n--- tokens ---");
check("descarta artigo e preposicao", !significantTokens("O Código Fonte da Rapina").includes("da"));
check("mantem palavra de conteudo", significantTokens("O Código Fonte da Rapina").includes("codigo"));
check("tokeniza em lista", tokenize("a b c").length === 3);

console.log("\n--- casamento real (4 pares) ---");
for (const [titulo, esperado] of pares) {
  const ep = episodeForPost(titulo, EPISODIOS);
  check(`"${esperado}" acha o episodio`, ep !== null);
  check(`"${esperado}" pega o numero certo`, (ep?.title ?? "").includes(esperado === "Super MEI" ? "Super MEI" : esperado === "Centrão" ? "Centrão" : esperado === "Orçamento Secreto" ? "Orçamento" : "Fundo Partidário") === true);
}

console.log("\n--- post sem episodio proprio cai no mais recente ---");
const semEpisode = [
  "UE96: a engenharia da primeira urna eletrônica do Brasil",
  "Teclado em Braille: acessibilidade como requisito de engenharia",
  "Fim da 6x1: A Engenharia Reversa da Emenda que o Congresso Promulgado",
  "A UE96: a engenharia da primeira urna eletrônica do Brasil",
];
for (const t of semEpisode) {
  const r = resolveEpisode(t, EPISODIOS);
  check(`tem episodio: "${t.slice(0, 34)}..."`, r !== null);
  check(`marcado como fallback: "${t.slice(0, 24)}..."`, r?.matched === false);
  check(`fallback e o mais novo: "${t.slice(0, 24)}..."`, (r?.episode.title ?? "").includes("Ep. 04"));
}

console.log("\n--- falso positivo ---");
check("titulo generico nao casa", !titlesMatch("Notícia do dia", "Ep. 01 - Fundo Partidário"));
check("frase curta nao casa", !titlesMatch("Super MEI", "Super MEI: A Engenharia Reversa do Teto"));
check("episodio sem audio e ignorado", matchEpisodes("Super MEI: A Engenharia Reversa do Teto de R$ 140 Mil", [{ title: "Ep. 04 - Super MEI: A Engenharia Reversa do Teto de R$ 140 Mil.mp3", audioUrl: undefined }]).length === 0);

console.log("\n--- modo ---");
check("modo e mais-recente", EPISODE_MODE === "mais-recente");
check("matchEpisodes ordena do mais novo", (matchEpisodes("Super MEI: A Engenharia Reversa do Teto de R$ 140 Mil", EPISODIOS)[0]?.title ?? "").includes("Ep. 04"));
check("com match, matched = true", resolveEpisode("Super MEI: A Engenharia Reversa do Teto de R$ 140 Mil", EPISODIOS)?.matched === true);
check("feed vazio nao quebra", episodeForPost("Super MEI: A Engenharia Reversa do Teto de R$ 140 Mil", []) === null);

console.log(failed ? `\n${failed} falha(s)` : "\ntudo certo");
process.exit(failed ? 1 : 0);