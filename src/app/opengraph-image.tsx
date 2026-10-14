import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const alt = "área reversa — engenharia reversa de narrativas e políticas públicas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem de compartilhamento da home.
 *
 * Sem og:image, um link do site no WhatsApp, Twitter ou Facebook aparece sem
 * imagem nenhuma. Esta é gerada no servidor pelo Next, então não custa um
 * arquivo no repositório.
 */
export default function OG() {
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
        <div
          style={{
            color: "#a855f7",
            fontSize: 26,
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 28,
          }}
        >
          Método · Contexto · Sem filtro
        </div>
        <div style={{ color: "white", fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>
          {site.name}
        </div>
        <div style={{ color: "#d4d4d8", fontSize: 32, marginTop: 20, maxWidth: 900 }}>
          Engenharia reversa de narrativas e políticas públicas
        </div>
        <div style={{ color: "#71717a", fontSize: 24, marginTop: 40 }}>
          urna eletrônica · orçamento público · fundo partidário
        </div>
      </div>
    ),
    size
  );
}