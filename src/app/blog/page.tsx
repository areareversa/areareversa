import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostGrid } from "@/components/PostGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
  description: "Análises e desconstrução de narrativas — engenharia reversa de ideias, discursos e políticas.",
};

const PAGE_SIZE = 9;

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; pagina?: string }>;
}) {
  const { categoria, q, pagina } = await searchParams;
  const page = Math.max(1, parseInt(pagina ?? "1", 10) || 1);

  const where = {
    published: true,
    ...(categoria ? { category: categoria } : {}),
    ...(q
      ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { excerpt: { contains: q, mode: "insensitive" as const } }] }
      : {}),
  };

  const [posts, total, grouped] = await Promise.all([
    prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }).catch(() => []),
    prisma.post.count({ where }).catch(() => 0),
    prisma.post.groupBy({ by: ["category"], where: { published: true }, _count: { _all: true }, orderBy: { category: "asc" } }).catch(() => []),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (extra: string) => {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (q) params.set("q", q);
    if (extra) params.set("pagina", extra);
    const s = params.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-5xl font-bold tracking-tighter">blog</h1>

      <form action="/blog" method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="buscar por título ou resumo..."
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm dark:border-neutral-700"
        />
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        <button className="rounded-lg border border-neutral-300 px-4 py-2 font-mono text-sm dark:border-neutral-700">buscar</button>
      </form>

      <div className="flex flex-wrap gap-3 font-mono text-xs">
        <Link href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"} className={`rounded-full border px-3 py-1 ${!categoria ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "border-neutral-300 dark:border-neutral-700"}`}>
          todas
        </Link>
        {grouped.map((c) => (
          <Link
            key={c.category}
            href={`/blog?categoria=${encodeURIComponent(c.category)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full border px-3 py-1 ${categoria === c.category ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "border-neutral-300 dark:border-neutral-700"}`}
          >
            {c.category} ({c._count._all})
          </Link>
        ))}
      </div>

      <PostGrid posts={posts} />

      {pages > 1 && (
        <nav aria-label="Paginação" className="flex items-center gap-4 font-mono text-sm">
          {page > 1 && <Link href={qs(String(page - 1))} className="underline underline-offset-4">← anterior</Link>}
          <span className="text-neutral-400">página {page} de {pages}</span>
          {page < pages && <Link href={qs(String(page + 1))} className="underline underline-offset-4">próxima →</Link>}
        </nav>
      )}
    </div>
  );
}
