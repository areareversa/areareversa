import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishedFilter } from "@/lib/posts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const slugs = (searchParams.get("slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  if (slugs.length > 0) {
    const posts = await prisma.post.findMany({ where: { ...publishedFilter(), slug: { in: slugs } }, select: { slug: true, title: true, excerpt: true, category: true } });
    return NextResponse.json({ posts });
  }

  if (!q) {
    return NextResponse.json({ posts: [] });
  }

  // Use PostgreSQL full-text search with websearch_to_tsquery for natural language queries
  // Supports: "termo1 termo2" (OR), '"exato"' (phrase), -excluir (NOT), termo1 OR termo2
  const query = q
    .replace(/"/g, "") // Remove quotes for phrase search - websearch handles it
    .trim();

  const posts = await prisma.$queryRaw`
    SELECT 
      p.slug, 
      p.title, 
      p.excerpt, 
      p.category,
      ts_rank_cd(p."searchVector", websearch_to_tsquery('portuguese', ${query})) AS rank
    FROM posts p
    WHERE p.published = true 
      AND (p."publishAt" IS NULL OR p."publishAt" <= NOW())
      AND p."searchVector" @@ websearch_to_tsquery('portuguese', ${query})
    ORDER BY rank DESC, p."createdAt" DESC
    LIMIT 8
  `;

  return NextResponse.json({ posts: posts as Array<{ slug: string; title: string; excerpt: string; category: string; rank: number }> });
}