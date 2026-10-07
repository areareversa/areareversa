"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export function CountriesMap({ counts }: { counts: [string, number][] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, { scrollWheelZoom: false, worldCopyJump: true }).setView([20, 0], 2);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 6,
      }).addTo(map);

      const totals = new Map(counts);
      try {
        const res = await fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson");
        const geo = await res.json();
        if (cancelled) return;
        L.geoJSON(geo, {
          style: (feature) => {
            const code = feature?.properties?.ISO_A2;
            const n = totals.get(code) ?? 0;
            return {
              color: "#2a2a30",
              weight: 1,
              fillColor: n > 0 ? "#9333ea" : "#17171c",
              fillOpacity: n > 0 ? Math.min(0.9, 0.35 + n / 10) : 0.6,
            };
          },
          onEachFeature: (feature, layer) => {
            const code = feature?.properties?.ISO_A2;
            const name = feature?.properties?.ADMIN ?? code;
            const n = totals.get(code) ?? 0;
            layer.bindTooltip(`${name}: ${n} acessos`);
          },
        }).addTo(map);
      } catch {}
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [counts]);

  return <div ref={ref} className="h-[360px] w-full overflow-hidden rounded-2xl border border-[#e5e7eb] dark:border-[#2a2a30]" />;
}
