export function publishedFilter(now: Date = new Date()) {
  return {
    published: true,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

export function isVisible(post: { published: boolean; publishAt: Date | null }, now: Date = new Date()) {
  return post.published && (!post.publishAt || post.publishAt <= now);
}

/**
 * Converte o locale da URL no sufixo das colunas de tradução.
 *
 * `en-US` → `en`, `es-ES` → `es`, `pt-BR` → null (português é o original).
 * As colunas se chamam `title_en` / `title_es`, sem o país: o público é um só
 * por idioma, e hífen em nome de coluna só complica a query.
 */
export function translationSuffix(locale: string): "en" | "es" | null {
  const lang = locale.split("-")[0].toLowerCase();
  return lang === "en" || lang === "es" ? lang : null;
}

/**
 * Resolve título, resumo e conteúdo no idioma pedido, com queda para o
 * português quando a tradução ainda não existe.
 *
 * O fallback não é silencioso por acaso: um post publicado hoje aparece em
 * /en-US e /es-ES desde o primeiro minuto — só em português até alguém traduzir
 * no admin. Melhor mostrar o original do que uma página vazia.
 *
 * Lê `titleEn` / `titleEs` (nome que o Prisma expõe), não o nome da coluna
 * (`title_en`): o `@map` do schema traduz um no outro, e usar o nome errado faz
 * o campo vir sempre `undefined` — foi o que segurou a primeira versão disto.
 */
export function localizePost<T extends Record<string, any>>(post: T, locale: string) {
  const s = translationSuffix(locale);
  if (!s) return post;
  const key = s === "en" ? "En" : "Es";
  const t = post[`title${key}`];
  const e = post[`excerpt${key}`];
  const c = post[`content${key}`];
  return {
    ...post,
    title: t || post.title,
    excerpt: e || post.excerpt,
    content: c || post.content,
  };
}
