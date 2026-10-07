import Link from "next/link";
import { site } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let posts: { slug: string; title: string; excerpt: string; createdAt: Date }[] = [];
  let categories: string[] = [];
  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { slug: true, title: true, excerpt: true, createdAt: true },
    });
    const grouped = await prisma.post.groupBy({
      by: ["category"],
      where: { published: true },
      _count: { _all: true },
      orderBy: { category: "asc" },
    });
    categories = grouped.map((g) => g.category);
  } catch {}

  return (
    <div className="flex flex-col gap-24">
      <section className="flex flex-col items-start gap-6 pt-10">
        <p className="rounded-full border border-[#9333ea]/40 bg-[#9333ea]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#a855f7]">
          Método · Contexto · Sem filtro
        </p>
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-7xl">
          {site.tagline}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
          Engenharia reversa de ideias, discursos e políticas. De qualquer lado.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/blog"
            className="rounded-[14px] bg-[#0f0f12] px-6 py-3.5 text-base font-semibold text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-[#0f0f12]"
          >
            Começar agora →
          </Link>
          <Link
            href="/podcast"
            className="rounded-full border border-[#e5e7eb] px-6 py-3 text-base font-semibold transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30]"
          >
            Ouvir o podcast
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/blog?categoria=${encodeURIComponent(c)}`}
                className="rounded-full border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-1.5 text-sm text-[#4b5563] transition hover:border-[#9333ea]/60 hover:text-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c] dark:text-[#d4d4d8]"
              >
                {c}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Últimas do blog</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_#0f172a1f] dark:border-[#2a2a30] dark:bg-[#17171c] dark:hover:shadow-[0_8px_24px_#00000066]"
            >
              <h3 className="text-lg font-semibold leading-snug tracking-tight">{p.title}</h3>
              <p className="text-sm text-[#4b5563] dark:text-[#d4d4d8]">{p.excerpt}</p>
            </Link>
          ))}
          {posts.length === 0 && <p className="text-[#4b5563] dark:text-[#d4d4d8]">Em breve as primeiras postagens.</p>}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Onde nos encontrar</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(site.links).map(([k, v]) => (
            <a
              key={k}
              href={v}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-5 py-3 text-sm font-semibold transition hover:border-[#9333ea]/60 hover:text-[#9333ea] dark:border-[#ac4bff4d] dark:bg-[#17171c]"
            >
              {k}
            </a>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start gap-6 rounded-3xl border border-[#9333ea]/40 bg-[#9333ea]/5 p-10">
        <h2 className="max-w-2xl text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Toda narrativa tem um código-fonte. Vamos desmontá-lo juntos.
        </h2>
        <Link
          href="/blog"
          className="rounded-[14px] bg-[#0f0f12] px-6 py-3.5 text-base font-semibold text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-[#0f0f12]"
        >
          Explorar o blog →
        </Link>
      </section>
    </div>
  );
}
