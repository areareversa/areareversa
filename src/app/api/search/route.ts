import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishedFilter } from "@/lib/posts";

export const dynamic = "force-dynamic";

type Term = { kind: "phrase"; words: string[] } | { kind: "word"; text: string };

/**
 * Separa a busca em termos, honrando as frases entre aspas.
 *
 * As aspas precisam ser retiradas ANTES do split por espaco, senao a frase
 * `caixa preta` entre aspas vira os tokens `caixa` e `preta`, que nao casam
 * com o formato de frase e viram lixo.
 */
function parseQuery(q: string): Term[] {
  const terms: Term[] = [];

  for (const m of q.matchAll(/"([^"]+)"/g)) {
    const words = m[1].split(/\s+/).filter(Boolean);
    if (words.length) terms.push({ kind: "phrase", words });
  }

  const rest = q.replace(/"[^"]*"/g, " ");
  for (const raw of rest.split(/\s+/)) {
    if (raw) terms.push({ kind: "word", text: raw });
  }

  return terms;
}

/**
 * Monta uma tsquery para to_tsquery.
 *
 * Usa to_tsquery e não websearch_to_tsquery porque o segundo descarta o
 * operador de prefixo ":*" em silêncio: "orcam:*" vira "orcam" e a busca por
 * palavra incompleta simplesmente não funciona.
 *
 * A indexação usa 'simple' + unaccent (o stemmer 'portuguese' diverge entre
 * indexar e consultar em quase toda palavra), então compensamos com prefixo.
 *
 * Cada termo vira duas variantes alternadas — normal e sem cedilha — porque o
 * índice guarda as duas: "orçamento" indexa "orcamento" e "oramento", então
 * "oramento", "orcamento" e "orçamento" precisam achar o mesmo post.
 */
function buildTsQuery(q: string): string {
  const lex = (w: string) => `'${w.replace(/'/g, "''")}'`;

  const variants = (word: string): string => {
    const semCedilha = word.replace(/ç/g, "").replace(/Ç/g, "");
    return semCedilha === word ? `${lex(word)}:*` : `${lex(word)}:* | ${lex(semCedilha)}:*`;
  };

  const positive: string[] = [];
  const negative: string[] = [];
  let pendingOr = false;

  for (const term of parseQuery(q)) {
    const raw = term.kind === "phrase" ? term.words.join(" ") : term.text;

    const isNegative = raw.startsWith("-");
    const clean = (isNegative ? raw.slice(1) : raw).replace(/[^\p{L}\p{N}\s]/gu, "");
    if (!clean.trim()) continue;

    if (/^(ou|or)$/i.test(clean.trim())) {
      pendingOr = true;
      continue;
    }

    let node: string;
    if (term.kind === "phrase") {
      node = term.words
        .filter((w) => /^[\p{L}\p{N}]+$/u.test(w))
        .map((w) => lex(w))
        .join(" & ");
      if (!node) continue;
    } else if (/^[\p{L}\p{N}]+$/u.test(clean)) {
      node = variants(clean);
    } else {
      // palavra com espaço vira vários termos conectados por AND
      const words = clean.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;
      node = words.map((w) => variants(w)).join(" & ");
    }

    if (isNegative) {
      negative.push(node);
      pendingOr = false;
      continue;
    }

    if (pendingOr && positive.length > 0) {
      positive.push(`${node} | ${positive.pop()}`);
    } else {
      positive.push(node);
    }
    pendingOr = false;
  }

  if (positive.length === 0) return "";

  let query = positive.join(" & ");
  if (negative.length > 0) query = `${query} & !(${negative.join(" | ")})`;
  return query;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const slugs = (searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length > 0) {
    const posts = await prisma.post.findMany({
      where: { ...publishedFilter(), slug: { in: slugs } },
      select: { slug: true, title: true, excerpt: true, category: true },
    });
    return NextResponse.json({ posts });
  }

  const query = buildTsQuery(q);
  if (!query) {
    return NextResponse.json({ posts: [] });
  }

  let posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    rank: number;
  }>;

  try {
    posts = await prisma.$queryRaw`
      SELECT
        p.slug,
        p.title,
        p.excerpt,
        p.category,
        ts_rank_cd(
          p."searchVector"::tsvector,
          to_tsquery('simple', unaccent(${query}))
        ) AS rank
      FROM posts p
      WHERE p.published = true
        AND (p."publishAt" IS NULL OR p."publishAt" <= NOW())
        AND p."searchVector"::tsvector @@ to_tsquery('simple', unaccent(${query}))
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT 8
    `;
  } catch {
    // consulta malformada não pode derrubar a busca
    return NextResponse.json({ posts: [] });
  }

  return NextResponse.json({ posts });
}
