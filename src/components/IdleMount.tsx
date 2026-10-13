"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renderiza os filhos só depois que o navegador ficar ocioso.
 *
 * O site carregava player, analytics e medição de performance em toda rota,
 * mesmo em quem so ia ler um texto. Isso e JS que atrasa o primeiro
 * aparecimento da pagina sem trazer nada para quem nao interage.
 *
 * requestIdleCallback avisa quando o navegador parou de trabalhar no que era
 * urgente — o texto já apareceu, então o resto entra sem atrapalhar. Em
 * navegadores sem esse recurso caímos no setTimeout, com um atraso pequeno.
 */
export function IdleMount({
  children,
  fallback = null,
  timeout = 2000,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  timeout?: number;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setOn(true), { timeout });
      return () => w.cancelIdleCallback?.(id);
    }

    // rede de segurança: se o idle demorar mais que o timeout, carrega assim mesmo
    const t = setTimeout(() => setOn(true), 400);
    return () => clearTimeout(t);
  }, [timeout]);

  return <>{on ? children : fallback}</>;
}