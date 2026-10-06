import Link from "next/link";
import { site } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let posts: { slug: string; title: string; excerpt: string; createdAt: Date }[] = [];
  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { slug: true, title: true, excerpt: true, createdAt: true },
    });
  } catch {}

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6 pt-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">Método • Contexto • Sem filtro</p>
        <h1 className="text-5xl font-bold tracking-tighter sm:text-7xl">{site.tagline}</h1>
        <p className="max-w-xl text-lg leading-relaxed text-neutral-500">
          Engenharia reversa de ideias, discursos e políticas. De qualquer lado.
        </p>
        <Link href="/blog" className="font-mono text-sm underline underline-offset-4">↓ ir para o blog</Link>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-mono text-sm uppercase tracking-widest text-neutral-400">Últimas do blog</h2>
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {posts.map((p) => (
            <li key={p.slug} className="py-4">
              <Link href={`/blog/${p.slug}`} className="text-xl font-semibold hover:underline underline-offset-4">
                {p.title}
              </Link>
              <p className="text-sm text-neutral-500">{p.excerpt}</p>
            </li>
          ))}
          {posts.length === 0 && <li className="py-4 text-neutral-500">Em breve as primeiras postagens.</li>}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-sm uppercase tracking-widest text-neutral-400">Onde nos encontrar</h2>
        <div className="flex flex-wrap gap-5 font-mono text-sm">
          {Object.entries(site.links).map(([k, v]) => (
            <a key={k} href={v} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-4 py-2 hover:bg-neutral-100 dark:border-[#44475a] dark:hover:bg-neutral-900">
              {k}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
