"use client";

import { PlayerProvider } from "@/lib/PlayerContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { ReactNode } from "react";

export function PlayerWrapper({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      {children}
      <PersistentPlayer />
    </PlayerProvider>
  );
}