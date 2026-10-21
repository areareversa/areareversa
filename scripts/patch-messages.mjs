/**
 * Alinha as chaves de tradução com o que o código realmente usa.
 *
 * O `getTranslations`/`useTranslations` do next-intl só reclama da chave
 * faltando em produção (em dev é um aviso). Foi assim que o site foi para o ar
 * com `MISSING_MESSAGE` derrubando as páginas de artigo com 500.
 *
 * Este script adiciona as chaves que faltavam nos três idiomas. Rode com
 * `node scripts/patch-messages.mjs` e depois `npx tsx tests/units.test.ts`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "messages");

const patches = {
  "pt-BR": {
    home: {
      play: "▶ Ouvir",
      noPosts: "Nenhum artigo encontrado",
      podcast: { openSpotify: "abrir no Spotify →" },
      newsletter: { subscribe: "Inscrever" },
    },
    blog: {
      latestPosts: "Últimos artigos",
      notFound: "Artigo não encontrado",
      webmentionEndpoint: "receber menções neste post",
    },
    podcast: {
      errorLoading: "Não consegui carregar os episódios",
      showingLastKnown: "Mostrando a última lista conhecida.",
    },
    common: { nav: { home: "Início", blog: "Blog" } },
  },
  "en-US": {
    home: {
      play: "▶ Listen",
      noPosts: "No posts found",
      podcast: { openSpotify: "open in Spotify →" },
      newsletter: { subscribe: "Subscribe" },
    },
    blog: {
      latestPosts: "Latest posts",
      notFound: "Post not found",
      webmentionEndpoint: "receive mentions for this post",
    },
    podcast: {
      errorLoading: "Couldn't load episodes",
      showingLastKnown: "Showing the last known list.",
    },
    common: { nav: { home: "Home", blog: "Blog" } },
  },
  "es-ES": {
    home: {
      play: "▶ Escuchar",
      noPosts: "No se encontraron artículos",
      podcast: { openSpotify: "abrir en Spotify →" },
      newsletter: { subscribe: "Suscribirse" },
    },
    blog: {
      latestPosts: "Últimos artículos",
      notFound: "Artículo no encontrado",
      webmentionEndpoint: "recibir menciones en esta publicación",
    },
    podcast: {
      errorLoading: "No se pudieron cargar los episodios",
      showingLastKnown: "Mostrando la última lista conocida.",
    },
    common: { nav: { home: "Inicio", blog: "Blog" } },
  },
};

/** Mescla `source` dentro de `target`, sem sobrescrever chave já existente. */
function merge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      target[k] = merge(target[k] && typeof target[k] === "object" ? target[k] : {}, v);
    } else if (!(k in target)) {
      target[k] = v;
    }
  }
  return target;
}

for (const [locale, patch] of Object.entries(patches)) {
  const file = join(dir, `${locale}.json`);
  const json = JSON.parse(readFileSync(file, "utf8"));
  merge(json, patch);
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`✓ ${locale}.json atualizado`);
}
