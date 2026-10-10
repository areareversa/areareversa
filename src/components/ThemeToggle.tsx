"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("ar_theme_v2") as ThemeMode) || "system";
  });
  
  const [resolvedDark, setResolvedDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("ar_theme_v2") as ThemeMode | null;
    if (stored) setMode(stored);
    
    const updateDark = () => {
      const dark = mode === "system" 
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : mode === "dark";
      setResolvedDark(dark);
      document.documentElement.classList.toggle("dark", dark);
    };
    
    updateDark();
    
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const dark = e.matches;
        setResolvedDark(dark);
        document.documentElement.classList.toggle("dark", dark);
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [mode]);

  function cycle() {
    const next: ThemeMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    localStorage.setItem("ar_theme_v2", next);
    setMode(next);
  }

  if (!mounted) {
    return (
      <button
        className="rounded-full border border-[#e5e7eb] px-3 py-1 text-xs transition hover:border-[#9333ea] dark:border-[#2a2a30]"
        disabled
      >
        ⚙ sistema
      </button>
    );
  }

  const labels: Record<ThemeMode, string> = {
    light: "☀ claro",
    dark: "☾ escuro",
    system: "⚙ sistema",
  };

  const titleLabels: Record<ThemeMode, string> = {
    light: "Modo escuro",
    dark: "Modo sistema",
    system: "Modo claro",
  };

  return (
    <button
      onClick={cycle}
      aria-label={titleLabels[mode]}
      className="rounded-full border border-[#e5e7eb] px-3 py-1 text-xs transition hover:border-[#9333ea] dark:border-[#2a2a30]"
      title={titleLabels[mode]}
    >
      {labels[mode]}
    </button>
  );
}