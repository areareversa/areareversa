import { publishedFilter, isVisible } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);
  
  if (!post || !isVisible(post)) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const [related, comments] = await Promise.all([
    prisma.post
      .findMany({
        where: { ...publishedFilter(), category: post.category, NOT: { id: post.id } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { slug: true, title: true, excerpt: true, category: true, author: true, createdAt: true, coverImage: true, views: true, content: true },
      })
      .catch(() => []),
    prisma.comment
      .findMany({ where: { postId: post.id, hidden: false }, orderBy: { createdAt: "desc" } })
      .catch(() => []),
  ]);

  return Response.json({
    post: {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
    },
    comments,
    related,
  });
}