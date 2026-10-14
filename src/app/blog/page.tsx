import { publishedFilter } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { BlogIndexClient } from "@/components/BlogIndexClient";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";
import { site } from "@/lib/site";

export const revalidate = 60;

const PAGE_SIZE = 9;

export const metadata = {
  alternates: { canonical: `${site.url}/blog` },
  title: "Blog",
  description: "Análises e desconstrução de narrativas — engenharia reversa de ideias, discursos e políticas.",
};

/**
 * Página estática de propósito.
 *
 * Ela não recebe mais `searchParams` do servidor: no App Router, aguardar
 * searchParams torna a rota dinâmica e a CDN passa a responder "no-store" —
 * era o que deixava /blog em ~290 ms em vez de ~30 ms.
 *
 * Busca, filtro por categoria e paginação já acontecem no cliente via
 * /api/blog. Quando a URL vier com ?categoria=... ou ?q=..., o BlogIndexClient
 * lê a query string no useEffect e busca os dados correspondentes. O efeito é
 * imperceptível e o custo fica fora do caminho crítico do primeiro carregamento.
 */
export default async function BlogIndex() {
  const [posts, total, grouped] = await Promise.all([
    prisma.post
      .findMany({
        where: publishedFilter(),
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        // Sem select, o Prisma traz content (o markdown inteiro) de cada post
        // e o HTML do /blog ia para 153 KB so para exibir o tempo de leitura.
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          coverImage: true,
          createdAt: true,
          author: true,
          readingMinutes: true,
        },
      })
      .catch(() => []),
    prisma.post.count({ where: publishedFilter() }).catch(() => 0),
    prisma.post
      .groupBy({
        by: ["category"],
        where: publishedFilter(),
        _count: { _all: true },
        orderBy: { category: "asc" },
      })
      .catch(() => []),
  ]);

  const breadcrumbs = [
    { name: "Início", url: site.url },
    { name: "Blog", url: `${site.url}/blog` },
  ];

  return (
    <>
      <StructuredDataBreadcrumb items={breadcrumbs} />
      <BlogIndexClient
        initialData={{
          posts,
          total,
          grouped,
          searchParams: {},
        }}
      />
    </>
  );
}