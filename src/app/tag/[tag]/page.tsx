import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostGrid } from "@/components/PostGrid";
import { publishedFilter } from "@/lib/posts";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";
import { site } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return { title: `#${tag}`, description: `Posts com a tag ${tag}.` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = await prisma.post
    .findMany({ where: { ...publishedFilter(), tags: { has: tag } }, orderBy: { createdAt: "desc" } })
    .catch(() => []);

  const breadcrumbs = [
    { name: "Início", url: site.url },
    { name: "Blog", url: `${site.url}/blog` },
    { name: `Tag: ${tag}`, url: `${site.url}/tag/${encodeURIComponent(tag)}` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <StructuredDataBreadcrumb items={breadcrumbs} />
      <h1 className="text-5xl font-bold tracking-[-0.04em]">#{tag}</h1>
      <PostGrid posts={posts} />
      {posts.length === 0 && <p className="text-[#4b5563] dark:text-[#d4d4d8]">Nenhum post com esta tag.</p>}
      <Link href="/blog" className="text-[#9333ea] underline underline-offset-4">← voltar ao blog</Link>
    </div>
  );
}
