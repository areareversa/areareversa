"use client";

import { PlayerProvider } from "@/lib/PlayerContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { PlayerErrorBoundary } from "@/components/ErrorBoundary";
import { ReactNode } from "react";

export function PlayerWrapper({ children }: { children: ReactNode }) {
  return (
    <PlayerErrorBoundary>
      <PlayerProvider>
        {children}
        <PersistentPlayer />
      </PlayerProvider>
    </PlayerErrorBoundary>
  );
}