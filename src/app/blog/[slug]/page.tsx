import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Markdown } from "@/components/Markdown";

export const dynamic = "force-dynamic";

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
        <img src={post.coverImage} alt="" className="rounded-xl" />
      )}
      <Markdown>{post.content}</Markdown>
    </article>
  );
}
