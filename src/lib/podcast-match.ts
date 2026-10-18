/**
 * Casamento entre post do blog e episódio do podcast.
 *
 * POR QUE EXISTE
 *   O feed (anchor.fm/s/118427fe8) traz episódios cujo título é, quase sempre,
 *   o título do post — com um prefixo de episódio e um sufixo de arquivo:
 *
 *     post     "O Código Fonte da Rapina: Engenharia Reversa no "Centrão""
 *     episódio "Ep. 03 - O Código Fonte da Rapina Engenharia Reversa no Centrão"
 *
 *   Igualdade literal reprova esse par. Por isso a comparação é feita sobre
 *   tokens normalizados, e não sobre string.
 *
 * A REGRA (deliberadamente estrita)
 *   Só entra no post o episódio cujo título é o título do post. Post sem
 *   episódio correspondente NÃO recebe bloco de áudio: sugerir que um
 *   episódio trata de um assunto que não trata é pior do que não sugerir nada.
 *
 *   Para mudar esse comportamento (ex.: cair no episódio mais recente quando
 *   não há correspondência), mexa em EPISODE_MODE. É a única linha que
 *   governa essa escolha, de propósito.
 *
 * POR QUE NÃO HÁ MAPA MANUAL AQUI
 *   Um mapa slug -> episódio funciona, mas apodrece: quando sai o episódio 05
 *   é preciso lembrar de editar o mapa. A comparação por token acompanha o feed
 *   sozinha. O ESCAPE_HATCH existe para quando a heurística errar — e aí o
 *   conserto é uma linha, sem refatorar.
 */

export type MatchableEpisode = {
  title: string;
  link?: string;
  pubDate?: string;
  audioUrl?: string;
  duration?: string;
  contentSnippet?: string;
  image?: string;
  guid?: string;
};

/**
 * "somente-correspondente" = só entra o episódio que é o post (regra do site).
 * "mais-recente"          = sem correspondência, entra o mais recente do canal.
 */
export type EpisodeMode = "somente-correspondente" | "mais-recente";
export const EPISODE_MODE: EpisodeMode = "mais-recente";

/**
 * Correções pontuais quando o feed e o post divergirem de um jeito que o token
 * não resolve. Chave: título normalizado do post. Valor: título do episódio.
 */
export const ESCAPE_HATCH: Record<string, string> = {};

/** Remove acentos, pontuação e as marcas que o feed acrescenta ao título. */
export function normalizeTitle(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // acentos
    .replace(/\.mp3$/i, "")
    .replace(/^\s*ep[.\s]*\d+\s*[-–—:]\s*/i, "") // "ep. 04 - " / "ep 4 – "
    .replace(/[^a-z0-9\s]/g, " ") // aspas, dois-pontos, vírgulas
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const n = normalizeTitle(input);
  return n ? n.split(" ") : [];
}

/**
 * Palavras que não carregam identidade: sem elas, "O" casa com qualquer
 * artigo e o casamento vira ruído.
 */
const STOPWORDS = new Set([
  "o", "a", "os", "as", "de", "do", "da", "dos", "das", "em", "no", "na", "nos",
  "nas", "por", "para", "com", "um", "uma", "e", "que", "ao", "aos", "da",
]);

export function significantTokens(input: string): string[] {
  return tokenize(input).filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Duas frases casam quando todos os tokens significativos de uma estão na
 * outra. Exige 3 tokens no mínimo: com menos que isso qualquer coincidência
 * vira falso positivo.
 *
 * A tolerância a 1 token existe para a diferença "X: Y" vs "X Y" (vírgula,
 * aspas, dois-pontos), que é o caso real do Centrão.
 */
export function titlesMatch(a: string, b: string, tolerance = 1): boolean {
  const ta = significantTokens(a);
  const tb = significantTokens(b);
  if (ta.length < 3 || tb.length < 3) return false;

  const setA = new Set(ta);
  const setB = new Set(tb);
  const contem = (menor: string[], maior: Set<string>) =>
    menor.filter((t) => !maior.has(t)).length;

  return contem(ta, setB) <= tolerance || contem(tb, setA) <= tolerance;
}

/**
 * Data do episódio em milissegundos.
 *
 * NÃO usar localeCompare para ordenar: pubDate vem em RFC-2822 ("Fri, 16 Oct
 * 2026..."), e comparação de string põe "Thu" à frente de "Fri" — a ordenação
 * ficaria por dia da semana, não por data. Foi o que os testes pegaram.
 */
function epTime(ep: MatchableEpisode): number {
  const t = ep.pubDate ? Date.parse(ep.pubDate) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

const maisNovoPrimeiro = (a: MatchableEpisode, b: MatchableEpisode) =>
  epTime(b) - epTime(a);

/** Todos os episódios que servem a este post — do mais novo para o mais velho. */
export function matchEpisodes(
  postTitle: string,
  episodes: MatchableEpisode[]
): MatchableEpisode[] {
  const chave = normalizeTitle(postTitle);
  const forcado = ESCAPE_HATCH[chave];

  return episodes
    .filter((ep) => ep.audioUrl)
    .filter((ep) => (forcado ? normalizeTitle(ep.title) === normalizeTitle(forcado) : titlesMatch(postTitle, ep.title)))
    .sort(maisNovoPrimeiro);
}

/**
 * O episódio do post, e se ele é mesmo o episódio deste post.
 *
 * Modo "mais-recente": quando não há correspondência de título, devolve o
 * episódio mais recente do canal — que na prática costuma ser o do artigo
 * seguinte ou o do artigo anterior, porque episódio e post saem juntos.
 *
 * O booleano `matched` existe para o texto do bloco não mentir: com fallback,
 * o cartão diz "episódio mais recente" e não "escute este artigo".
 */
export function resolveEpisode(
  postTitle: string,
  episodes: MatchableEpisode[]
): { episode: MatchableEpisode; matched: boolean } | null {
  const achados = matchEpisodes(postTitle, episodes);
  if (achados.length > 0) return { episode: achados[0], matched: true };

  if (EPISODE_MODE === "mais-recente") {
    const comAudio = episodes.filter((e) => e.audioUrl).sort(maisNovoPrimeiro);
    if (comAudio[0]) return { episode: comAudio[0], matched: false };
  }
  return null;
}

/** Atalho booleano, para quem só quer saber se o post tem episódio. */
export function episodeForPost(
  postTitle: string,
  episodes: MatchableEpisode[]
): MatchableEpisode | null {
  return resolveEpisode(postTitle, episodes)?.episode ?? null;
}