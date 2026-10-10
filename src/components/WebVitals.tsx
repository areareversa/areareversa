"use client";

import { useEffect } from "react";

export function WebVitals() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("web-vitals").then(({ onCLS, onLCP, onINP, onFCP, onTTFB }) => {
      const path = window.location.pathname;
      const report = (metric: { name: string; value: number }) => {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vital", path, target: `${metric.name}=${Math.round(metric.value)}` }),
          keepalive: true,
        }).catch(() => {});
      };
      onCLS(report);
      onLCP(report);
      onINP(report);
      onFCP(report);
      onTTFB(report);
    });
  }, []);

  return null;
}
