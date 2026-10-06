import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Markdown } from "@/components/Markdown";
import { ShareButtons } from "@/components/ShareButtons";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post) return { title: "não encontrado" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/blog/${post.slug}`,
      type: "article",
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  if (!post || !post.published) notFound();

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <p className="font-mono text-xs text-neutral-400">
        {new Date(post.createdAt).toLocaleDateString("pt-BR")} · {post.category}
      </p>
      <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          className="aspect-video w-full rounded-xl object-cover"
        />
      )}
      <Markdown>{post.content}</Markdown>
      <ShareButtons title={post.title} url={`${site.url}/blog/${post.slug}`} />
    </article>
  );
}
