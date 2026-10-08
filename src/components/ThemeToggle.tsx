"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("ar_theme_v2");
    const isDark = saved ? saved === "dark" : true;
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ar_theme_v2", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Modo claro" : "Modo escuro"}
      className="rounded-full border border-[#e5e7eb] px-3 py-1 text-xs transition hover:border-[#9333ea] dark:border-[#2a2a30]"
    >
      {dark ? "☀ claro" : "☾ escuro"}
    </button>
  );
}
