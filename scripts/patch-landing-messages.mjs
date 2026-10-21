/**
 * Adiciona as chaves `home.landing.*` (usadas pela landing em pt-BR, en-US e
 * es-ES) nas três mensagens. Não sobrescreve chave existente.
 *
 * A landing traduzida passa a ter a mesma estrutura da portuguesa, então tudo
 * que a pt-BR escreve na mão vira chave aqui.
 */
import { readFileSync, writeFileSync } from "node:fs";

const landing = {
  "pt-BR": {
    badge: "Método · Contexto · Sem filtro",
    heroTitle: "Engenharia reversa de narrativas e políticas públicas",
    subtitle: "Engenharia reversa de ideias, discursos e políticas. De qualquer lado.",
    newsletterPlaceholder: "seu@email.com",
    newsletterButton: "Assinar",
    start: "Começar agora →",
    listenPodcast: "Ouvir o podcast",
    latestPodcast: "Último episódio do podcast",
    listenEpisode: "▶ Ouvir o episódio",
    openSpotify: "abrir no Spotify →",
    latestPosts: "Últimas do blog",
    readingMinutes: "{minutes} min de leitura",
    noPosts: "Em breve as primeiras postagens.",
    topPosts: "Mais lidas da semana",
    findUs: "Onde nos encontrar",
    share: "Compartilhe a área reversa",
    shareTitle: "área reversa — Desmontando narrativas",
    newsletterTitle: "Receba as análises por e-mail",
    newsletterDescription: "Sem spam. Só quando sair post novo.",
    ctaTitle: "Toda narrativa tem um código-fonte. Vamos desmontá-lo juntos.",
    ctaButton: "Explorar o blog →",
  },
  "en-US": {
    badge: "Method · Context · No filter",
    heroTitle: "Reverse engineering of narratives and public policy",
    subtitle: "Reverse engineering ideas, speeches, and policies. From any side.",
    newsletterPlaceholder: "your@email.com",
    newsletterButton: "Subscribe",
    start: "Start now →",
    listenPodcast: "Listen to the podcast",
    latestPodcast: "Latest podcast episode",
    listenEpisode: "▶ Listen to the episode",
    openSpotify: "open in Spotify →",
    latestPosts: "Latest from the blog",
    readingMinutes: "{minutes} min read",
    noPosts: "The first posts are coming soon.",
    topPosts: "Most read this week",
    findUs: "Where to find us",
    share: "Share área reversa",
    shareTitle: "área reversa — Dismantling narratives",
    newsletterTitle: "Get the analyses by email",
    newsletterDescription: "No spam. Only when a new post goes live.",
    ctaTitle: "Every narrative has a source code. Let's dismantle it together.",
    ctaButton: "Explore the blog →",
  },
  "es-ES": {
    badge: "Método · Contexto · Sin filtro",
    heroTitle: "Ingeniería inversa de narrativas y políticas públicas",
    subtitle: "Ingeniería inversa de ideas, discursos y políticas. De cualquier lado.",
    newsletterPlaceholder: "tu@email.com",
    newsletterButton: "Suscribirse",
    start: "Empezar ahora →",
    listenPodcast: "Escuchar el podcast",
    latestPodcast: "Último episodio del podcast",
    listenEpisode: "▶ Escuchar el episodio",
    openSpotify: "abrir en Spotify →",
    latestPosts: "Últimas del blog",
    readingMinutes: "{minutes} min de lectura",
    noPosts: "Pronto llegarán las primeras publicaciones.",
    topPosts: "Más leídas de la semana",
    findUs: "Dónde encontrarnos",
    share: "Comparte área reversa",
    shareTitle: "área reversa — Desmontando narrativas",
    newsletterTitle: "Recibe los análisis por correo",
    newsletterDescription: "Sin spam. Solo cuando salga un post nuevo.",
    ctaTitle: "Toda narrativa tiene un código fuente. Vamos a desmontarlo juntos.",
    ctaButton: "Explorar el blog →",
  },
};

for (const [locale, keys] of Object.entries(landing)) {
  const file = `messages/${locale}.json`;
  const json = JSON.parse(readFileSync(file, "utf8"));
  json.home = json.home ?? {};
  json.home.landing = { ...(json.home.landing ?? {}), ...keys };
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`✓ ${file} atualizado`);
}
