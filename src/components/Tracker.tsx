"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useScrollDepth } from "@/lib/gaEvents";

export function Tracker() {
  const pathname = usePathname();
  useScrollDepth();

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pageview", path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const m = href.match(/^\/blog\/([a-z0-9-]+)/i);
      if (m) {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "click", path: window.location.pathname, target: m[1] }),
          keepalive: true,
        }).catch(() => {});
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}