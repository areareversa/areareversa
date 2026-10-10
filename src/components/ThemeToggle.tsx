"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const LABELS: Record<ThemeMode, string> = {
  light: "☀ claro",
  dark: "☾ escuro",
  system: "⚙ sistema",
};

const TITLES: Record<ThemeMode, string> = {
  light: "Modo escuro",
  dark: "Modo sistema",
  system: "Modo claro",
};

const QUERY = "(prefers-color-scheme: dark)";

export function ThemeToggle() {
  // Durante o SSR (e o primeiro render do cliente) ficamos em "system"/claro
  // para não tocar em localStorage nem em matchMedia antes do navegador existir.
  const [mode, setMode] = useState<ThemeMode>("system");
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ar_theme_v2") as ThemeMode | null;
    setMode(stored ?? "system");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const apply = (isDark: boolean) => {
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    };

    if (mode === "system") {
      const mq = window.matchMedia(QUERY);
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    apply(mode === "dark");
  }, [mode, mounted]);

  function cycle() {
    const next: ThemeMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    localStorage.setItem("ar_theme_v2", next);
    setMode(next);
  }

  return (
    <button
      onClick={cycle}
      aria-label={TITLES[mode]}
      title={TITLES[mode]}
      className="rounded-full border border-[#e5e7eb] px-3 py-1 text-xs transition hover:border-[#9333ea] dark:border-[#2a2a30]"
    >
      {LABELS[mode]}
      <span className="sr-only">{dark ? " (ativo)" : ""}</span>
    </button>
  );
}