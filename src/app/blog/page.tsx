import { publishedFilter } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";
import { site } from "@/lib/site";
import { BlogIndexClient } from "@/components/BlogIndexClient";

export const revalidate = 60;

const PAGE_SIZE = 9;

export const metadata = {
  title: "Blog",
  description: "Análises e desconstrução de narrativas — engenharia reversa de ideias, discursos e políticas.",
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; pagina?: string }>;
}) {
  const { categoria, q, pagina } = await searchParams;
  const page = Math.max(1, parseInt(pagina ?? "1", 10) || 1);

  const where = {
    ...publishedFilter(),
    ...(categoria ? { category: categoria } : {}),
    ...(q
      ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { excerpt: { contains: q, mode: "insensitive" as const } }] }
      : {}),
  };

  const [posts, total, grouped] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }).catch(() => []),
    prisma.post.count({ where }).catch(() => 0),
    prisma.post.groupBy({ by: ["category"], where: publishedFilter(), _count: { _all: true }, orderBy: { category: "asc" } }).catch(() => []),
  ]);

  const initialData = {
    posts,
    total,
    grouped,
    searchParams: { categoria, q, pagina: String(page) },
  };

  return (
    <BlogIndexClient initialData={initialData} />
  );
}