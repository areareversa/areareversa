import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "área reversa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f0f12",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <div style={{ color: "#a855f7", fontSize: 28, marginBottom: 24, textTransform: "uppercase", letterSpacing: 4 }}>
          {post?.category ?? "área reversa"}
        </div>
        <div style={{ color: "white", fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>
          {post?.title ?? "área reversa"}
        </div>
        <div style={{ color: "#d4d4d8", fontSize: 26, marginTop: 24 }}>Desmontando narrativas.</div>
      </div>
    ),
    size
  );
}
