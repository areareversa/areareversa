"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useScrollDepth } from "@/lib/gaEvents";

export function Tracker() {
  const pathname = usePathname();
  useScrollDepth();

  useEffect(() => {
    function getDeviceType(): string {
      if (typeof navigator === "undefined") return "desktop";
      const ua = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
      if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
      return "desktop";
    }
    
    function getReferrer(): string {
      if (typeof document === "undefined") return "";
      return document.referrer || "";
    }
    
    const device = getDeviceType();
    const referrer = getReferrer();
    
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "pageview", 
        path: pathname,
        device,
        referrer,
      }),
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
          body: JSON.stringify({ 
            type: "click", 
            path: typeof window !== "undefined" ? window.location.pathname : "", 
            target: m[1] 
          }),
          keepalive: true,
        }).catch(() => {});
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}