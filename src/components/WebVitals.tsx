"use client";

import { useEffect } from "react";

export function WebVitals() {
  useEffect(() => {
    import("web-vitals").then(({ onCLS, onLCP, onINP, onFCP, onTTFB }) => {
      const report = (metric: { name: string; value: number }) => {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vital", path: window.location.pathname, target: `${metric.name}=${Math.round(metric.value)}` }),
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
