"use client";

import { PlayerProvider } from "@/lib/PlayerContext";
import { LazyPlayer } from "@/components/LazyClient";
import { PlayerErrorBoundary } from "@/components/ErrorBoundary";
import { IdleMount } from "@/components/IdleMount";
import { ReactNode } from "react";

export function PlayerWrapper({ children }: { children: ReactNode }) {
  return (
    <PlayerErrorBoundary>
      <PlayerProvider>
        {children}
        {/*
          A barra do player so entra depois que o navegador ficar ocioso.
          Ela so aparece se houver episodio tocando — antes disso era JS
          carregado em toda pagina sem chance de ser usado.
        */}
        <IdleMount>
          <LazyPlayer />
        </IdleMount>
      </PlayerProvider>
    </PlayerErrorBoundary>
  );
}