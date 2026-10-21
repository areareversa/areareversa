import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "área reversa — engenharia reversa de narrativas e políticas públicas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem de cada post, gerada no servidor.
 *
 * Serve dois lugares ao mesmo tempo: o og:image que o Google e o WhatsApp leem,
 * e a capa que aparece dentro do artigo. Por isso a proporção é 1200x630 e o
 * texto fica longe da borda — o WhatsApp recorta o card, e o texto cortado
 * fica pior que texto nenhum.
 */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } }).catch(() => null);

  const title = post?.title ?? "área reversa";
  const category = post?.category ?? "área reversa";

  // Título longo precisa de corpo menor, senão o card estoura a altura.
  const tamanho = title.length > 62 ? 48 : title.length > 42 ? 56 : 64;
  const alturaLinha = Math.round(tamanho * 1.12);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f0f12",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* filete lateral: a marca do site em uma linha */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 10,
            background: "#a855f7",
            display: "flex",
          }}
        />

        {/* categoria */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              border: "2px solid #a855f7",
              color: "#c084fc",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              padding: "10px 20px",
              borderRadius: 999,
              display: "flex",
            }}
          >
            {category}
          </div>
        </div>

        {/* título */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#ffffff",
            fontSize: tamanho,
            fontWeight: 700,
            lineHeight: `${alturaLinha}px`,
            letterSpacing: -1.5,
            maxWidth: 960,
          }}
        >
          {title}
        </div>

        {/* assinatura */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #2a2a30",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", color: "#a1a1aa", fontSize: 24 }}>
            engenharia reversa de narrativas
          </div>
          <div style={{ display: "flex", color: "#52525b", fontSize: 24 }}>
            área reversa
          </div>
        </div>
      </div>
    ),
    size
  );
}

