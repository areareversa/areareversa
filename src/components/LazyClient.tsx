"use client";

import dynamic from "next/dynamic";

/**
 * Componentes que não precisam entrar no primeiro carregamento.
 *
 * `IdleMount` sozinho não resolvia: ele adia a renderização, mas o import
 * estático continua puxando o código para o pacote inicial — os 639 KB
 * permaneciam. É o `next/dynamic` que cria um arquivo separado e só o baixa
 * quando o componente é realmente montado (aqui, quando o navegador fica
 * ocioso).
 *
 * Todos abaixo são exclusivamente de navegador, então `ssr: false` é seguro:
 * nada disso precisa aparecer no HTML inicial.
 */

export const LazyPlayer = dynamic(
  () => import("@/components/PersistentPlayer").then((m) => m.PersistentPlayer),
  { ssr: false }
);

export const LazyTracker = dynamic(() => import("@/components/Tracker").then((m) => m.Tracker), {
  ssr: false,
});

export const LazyWebVitals = dynamic(
  () => import("@/components/WebVitals").then((m) => m.WebVitals),
  { ssr: false }
);

export const LazyCookieConsent = dynamic(
  () => import("@/components/CookieConsent").then((m) => m.CookieConsent),
  { ssr: false }
);