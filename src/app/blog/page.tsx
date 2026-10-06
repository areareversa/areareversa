import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function BlogIndex() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-tight">blog</h1>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((p) => (
          <li key={p.id} className="flex items-start gap-6 py-6">
            {p.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverImage} alt="" className="h-20 w-28 rounded-lg object-cover" />
            )}
            <div>
              <Link href={`/blog/${p.slug}`} className="text-xl font-semibold hover:underline underline-offset-4">
                {p.title}
              </Link>
              <p className="mt-1 text-sm text-neutral-500">{p.excerpt}</p>
              <p className="mt-1 font-mono text-xs text-neutral-400">
                {new Date(p.createdAt).toLocaleDateString("pt-BR")} · {p.category}
              </p>
            </div>
          </li>
        ))}
        {posts.length === 0 && <p className="py-4 text-neutral-500">Nenhuma postagem ainda.</p>}
      </ul>
    </div>
  );
}
