"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type FocusModeContextType = {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (enabled: boolean) => void;
};

const FocusModeContext = createContext<FocusModeContextType | null>(null);

export function useFocusMode() {
  const ctx = useContext(FocusModeContext);
  if (!ctx) throw new Error("useFocusMode must be used within FocusModeProvider");
  return ctx;
}

const STORAGE_KEY = "ar_focus_mode_v1";

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add("focus-mode");
      document.documentElement.classList.add("focus-mode");
    } else {
      document.body.classList.remove("focus-mode");
      document.documentElement.classList.remove("focus-mode");
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(isFocusMode));
    } catch {}
  }, [isFocusMode]);

  const toggleFocusMode = () => setIsFocusMode((prev) => !prev);
  const setFocusMode = (enabled: boolean) => setIsFocusMode(enabled);

  return (
    <FocusModeContext.Provider value={{ isFocusMode, toggleFocusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export function FocusModeToggle() {
  const { isFocusMode, toggleFocusMode } = useFocusMode();

  return (
    <button
      onClick={toggleFocusMode}
      aria-label={isFocusMode ? "Sair do modo foco" : "Entrar no modo foco"}
      aria-pressed={isFocusMode}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        isFocusMode
          ? "border-[#9333ea] bg-[#9333ea]/10 text-[#9333ea]"
          : "border-[#e5e7eb] text-[#4b5563] hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] dark:text-[#d4d4d8]"
      }`}
      title={isFocusMode ? "Sair do modo foco" : "Modo foco (oculta header, footer, sidebar)"}
    >
      {isFocusMode ? "✕ Sair do foco" : "🔍 Modo foco"}
    </button>
  );
}