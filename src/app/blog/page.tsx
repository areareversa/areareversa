import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostGrid } from "@/components/PostGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
  description: "Análises e desconstrução de narrativas — engenharia reversa de ideias, discursos e políticas.",
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const posts = await prisma.post
    .findMany({
      where: { published: true, ...(categoria ? { category: categoria } : {}) },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const categories = await prisma.post
    .findMany({ where: { published: true }, select: { category: true }, distinct: ["category"] })
    .catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-tight">blog</h1>
      <div className="flex flex-wrap gap-3 font-mono text-xs">
        <Link href="/blog" className={`rounded-full border px-3 py-1 ${!categoria ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "border-neutral-300 dark:border-neutral-700"}`}>
          todas
        </Link>
        {categories.map((c) => (
          <Link
            key={c.category}
            href={`/blog?categoria=${encodeURIComponent(c.category)}`}
            className={`rounded-full border px-3 py-1 ${categoria === c.category ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" : "border-neutral-300 dark:border-neutral-700"}`}
          >
            {c.category}
          </Link>
        ))}
      </div>
      <PostGrid posts={posts} />
    </div>
  );
}
