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

  const posts = await prisma.post.findMany({
    where: {
      AND: [
        publishedFilter(),
        ...(q ? [{ OR: [{ title: { contains: q, mode: "insensitive" as const } }, { excerpt: { contains: q, mode: "insensitive" as const } }] }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { slug: true, title: true, excerpt: true, category: true },
  });
  return NextResponse.json({ posts });
}
