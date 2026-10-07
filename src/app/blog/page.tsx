import { publishedFilter } from "@/lib/posts";
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
      <h1 className="text-5xl font-bold tracking-[-0.04em]">blog</h1>

      <form action="/blog" method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="buscar por título ou resumo..."
          className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-2.5 text-sm outline-none focus:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c]"
        />
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        <button className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-sm font-semibold transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30]">buscar</button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link href={q ? `/blog?q=${encodeURIComponent(q)}` : "/blog"} className={`rounded-full border px-3 py-1.5 ${!categoria ? "border-[#9333ea] bg-[#9333ea]/10 text-[#9333ea]" : "border-[#e5e7eb] text-[#4b5563] dark:border-[#2a2a30] dark:text-[#d4d4d8]"}`}>
          todas
        </Link>
        {grouped.map((c) => (
          <Link
            key={c.category}
            href={`/blog?categoria=${encodeURIComponent(c.category)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full border px-3 py-1.5 ${categoria === c.category ? "border-[#9333ea] bg-[#9333ea]/10 text-[#9333ea]" : "border-[#e5e7eb] text-[#4b5563] dark:border-[#2a2a30] dark:text-[#d4d4d8]"}`}
          >
            {c.category} ({c._count._all})
          </Link>
        ))}
      </div>

      <PostGrid posts={posts} q={q} />

      {pages > 1 && (
        <nav aria-label="Paginação" className="flex items-center gap-4 text-sm">
          {page > 1 && <Link href={qs(String(page - 1))} className="text-[#9333ea] underline underline-offset-4">← anterior</Link>}
          <span className="text-[#9ca3af]">página {page} de {pages}</span>
          {page < pages && <Link href={qs(String(page + 1))} className="text-[#9333ea] underline underline-offset-4">próxima →</Link>}
        </nav>
      )}
    </div>
  );
}
