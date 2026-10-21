import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { publishedFilter } from "@/lib/posts";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";
import { site } from "@/lib/site";

export const revalidate = 60;

export const metadata = {
  title: "Tags",
  description: "Todas as tags dos posts: urna eletrônica, orçamento secreto, fundo partidário e mais.",
  alternates: { canonical: `${site.url}/tags` },
};

/**
 * Índice de tags.
 *
 * Só existia `/tag/[tag]`, que exige saber a tag de antemão — não havia como
 * chegar nelas navegando. Aqui as tags aparecem com a contagem de posts, para
 * o menu ter um destino que faça sentido.
 *
 * A contagem sai de um `groupBy` no Prisma em vez de trazer os posts e contar
 * no servidor: a tabela só tem as tags, e o post inteiro (markdown incluído)
 * nunca é lido para isso.
 */
export default async function TagsPage() {
  const grouped = await prisma.post
    .groupBy({
      by: ["tags"],
      where: publishedFilter(),
      _count: { _all: true },
    })
    .catch(() => []);

  // O groupBy devolve uma lista de arrays de tags (uma por combinação
  // existente). Desmembra e soma para cada tag individual.
  const counts = new Map<string, number>();
  for (const row of grouped) {
    for (const tag of row.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + row._count._all);
    }
  }
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));

  const breadcrumbs = [
    { name: "Início", url: site.url },
    { name: "Blog", url: `${site.url}/blog` },
    { name: "Tags", url: `${site.url}/tags` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <StructuredDataBreadcrumb items={breadcrumbs} />
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-bold tracking-[-0.04em]">tags</h1>
        <p className="text-[#4b5563] dark:text-[#d4d4d8]">
          {tags.length === 1 ? "1 tag" : `${tags.length} tags`} nos posts publicados.
        </p>
      </div>

      {tags.length === 0 && (
        <p className="text-[#4b5563] dark:text-[#d4d4d8]">Nenhuma tag ainda.</p>
      )}

      <ul className="flex flex-wrap gap-2">
        {tags.map(([tag, count]) => (
          <li key={tag}>
            <Link
              href={`/tag/${encodeURIComponent(tag)}`}
              className="flex items-center gap-2 rounded-full border border-[#e5e7eb] px-4 py-1.5 text-sm text-[#4b5563] transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] dark:text-[#d4d4d8]"
            >
              #{tag}
              <span className="text-xs text-[#9ca3af]">{count}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/blog" className="text-[#9333ea] underline underline-offset-4">
        ← voltar ao blog
      </Link>
    </div>
  );
}
