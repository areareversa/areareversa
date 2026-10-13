import { prisma } from "./prisma";
import { publishedFilter } from "./posts";
import { site } from "./site";

/**
 * llms.txt — o site em texto, para agentes.
 *
 * Especificação: https://llmstxt.org/
 *
 * A ideia é simples: páginas web são feitas para gente (navegação, ads,
 * JavaScript) e converter isso de volta para texto é caro e impreciso. O
 * llms.txt dá um índice enxuto e previsível, gerado a partir do banco — post
 * novo aparece sozinho, sem ninguém editar arquivo.
 *
 * Vai em /llms.txt (índice) e /llms-full.txt (todo o conteúdo).
 */

export type LlmPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  createdAt: string;
  content: string;
};

/** Remove do markdown o que é ruído de leitura para um agente. */
function cleanMarkdown(md: string): string {
  return md
    .replace(/^---[\s\S]*?---\s*/m, "") // frontmatter, se houver
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // imagens: só o texto em volta importa
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "[$1]($2)") // links ficam
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function getPostsForLlm(): Promise<LlmPost[]> {
  const posts = await prisma.post
    .findMany({
      where: publishedFilter(),
      orderBy: { createdAt: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        tags: true,
        content: true,
        createdAt: true,
      },
    })
    .catch(() => []);

  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    tags: p.tags,
    content: cleanMarkdown(p.content),
    createdAt: p.createdAt.toISOString().slice(0, 10),
  }));
}

function escapePipes(s: string): string {
  return s.replace(/\|/g, "\\|");
}

function link(p: LlmPost, base: string, suffix = ""): string {
  return `- [${escapePipes(p.title)}](${base}/blog/${p.slug}${suffix}): ${escapePipes(
    p.excerpt
  )} _(${p.category}, ${p.createdAt})_`;
}

/** /llms.txt — índice enxuto, cabe tranquilo em contexto. */
export async function buildLlmsTxt(): Promise<string> {
  const base = site.url;
  const posts = await getPostsForLlm();

  const byCategory = new Map<string, LlmPost[]>();
  for (const p of posts) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category)!.push(p);
  }

  const out: string[] = [];

  out.push(`# ${site.name}`);
  out.push("");
  out.push(
    `> ${site.description} Publica análises sobre como discursos, Ideias e políticas públicas ` +
      `são construídos por trás — o método é engenharia reversa: olhar o código, ` +
      `mostrar a engrenagem, desfazer o eufemismo. Texto em português brasileiro.`
  );
  out.push("");
  // A spec diz que as seções de interpretação vão sem heading; só as listas de
  // arquivos usam H2.
  out.push(
    "**Como usar:** este arquivo é um índice, não o conteúdo. Para o texto de um post,",
    "peça o `.md` da página ou use o arquivo único:",
    "",
    `- Texto integral de todos os posts: \`${base}/llms-full.txt\``,
    `- Versão markdown de um post: \`${base}/blog/<slug>.md\` (mesma URL, extensão trocada)`,
    `- Feed RSS: \`${base}/rss.xml\``,
    "",
    `Postado em ${new Date().toISOString().slice(0, 10)} · ${posts.length} posts publicados.`,
    "O texto é em português brasileiro; posts não traduzidos são respondidos em pt-BR."
  );
  out.push("");

  for (const [category, group] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
    out.push(`## ${category}`);
    out.push("");
    out.push(...group.map((p) => link(p, base, ".md")));
    out.push("");
  }

  out.push("## Seções do site");
  out.push("");
  out.push(
    `- [${base}/blog](${base}/blog): Todos os posts, do mais recente ao mais antigo.`,
    `- [${base}/podcast](${base}/podcast): Versões em áudio dos textos, em canal próprio.`,
    `- [${base}/sobre](${base}/sobre): O que o projeto é e qual é o método.`,
    `- [RSS](${base}/rss.xml): Assinatura padrão de qualquer leitor de feed.`,
    `- [Mapa do site](${base}/sitemap.xml): Todas as URLs públicas.`
  );
  out.push("");

  out.push("## Canais");
  out.push("");
  out.push(
    `- [YouTube](${site.links.youtube}): Vídeos longos.`,
    `- [Spotify](${site.links.spotify}): Podcast.`,
    `- [Instagram](${site.links.instagram}) · [TikTok](${site.links.tiktok}) · [Facebook](${site.links.facebook}) · [Pinterest](${site.links.pinterest}): Cortes e materiais republicados.`
  );
  out.push("");

  out.push("## Optional");
  out.push("");
  out.push(
    `- [${base}/llms-full.txt](${base}/llms-full.txt): O conteúdo integral de todos os posts em um arquivo só. Use quando precisar citar ou comparar vários textos de uma vez.`,
    `- [${base}/rss.xml](${base}/rss.xml): Mesmo conteúdo em XML, para leitores de feed.`
  );
  out.push("");

  return out.join("\n");
}

/** /llms-full.txt — todo o conteúdo, um arquivo só. */
export async function buildLlmsFullTxt(): Promise<string> {
  const base = site.url;
  const posts = await getPostsForLlm();

  const out: string[] = [];
  out.push(`# ${site.name} — conteúdo completo`);
  out.push("");
  out.push(
    `> ${site.description} ${posts.length} posts. Índice enxuto em ` +
      `[${base}/llms.txt](${base}/llms.txt).`
  );
  out.push("");
  out.push(
    posts
      .map(
        (p) =>
          `## ${p.title}\n\n` +
          `${p.excerpt}\n\n` +
          `URL: ${base}/blog/${p.slug}\n` +
          `Categoria: ${p.category}` +
          `${p.tags.length ? ` · Tags: ${p.tags.join(", ")}` : ""}\n` +
          `Publicado: ${p.createdAt}\n\n` +
          p.content
      )
      .join("\n\n---\n\n"),
    ""
  );

  return out.join("\n");
}

/** Versão markdown de um post isolado (para /blog/[slug].md). */
export async function buildPostMarkdown(slug: string): Promise<string | null> {
  const base = site.url;
  const post = await getPostsForLlm().then((all) => all.find((p) => p.slug === slug));
  if (!post) return null;

  return [
    `# ${post.title}`,
    "",
    post.excerpt,
    "",
    `URL: ${base}/blog/${post.slug}`,
    `Categoria: ${post.category}${post.tags.length ? ` · Tags: ${post.tags.join(", ")}` : ""}`,
    `Publicado: ${post.createdAt}`,
    "",
    "---",
    "",
    post.content,
    "",
  ].join("\n");
}