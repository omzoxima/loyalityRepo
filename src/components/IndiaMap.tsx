"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { rupees, tierColor, tierLabel } from "./ui";

export default function IndiaMap({ onSelect }: { onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let active = true;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView([22.5, 79], 4.6);
    mapRef.current = map;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
    }).addTo(map);

    fetch("/api/admin/map").then((r) => r.json()).then((customers: any[]) => {
      if (!active) return;
      customers.forEach((c) => {
        if (c.lat == null || c.lng == null) return;
        const m = L.circleMarker([c.lat, c.lng], {
          radius: 4 + c.totalSpend / 90000,
          color: "#fff", weight: 1.4,
          fillColor: c.isFlagged ? "#e11d48" : tierColor(c.tier), fillOpacity: 0.82,
        }).addTo(map);
        m.bindTooltip(
          `<b>${c.name}</b><br>${c.city ?? ""} · ${tierLabel(c.tier)}<br>Spend: ${rupees(c.totalSpend)}<br>${c.scanCount} scans`,
          { direction: "top" }
        );
        m.on("click", () => onSelect(c.id));
      });
    });

    return () => {
      active = false;
      map.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

  return <div ref={ref} className="h-[480px] rounded-2xl overflow-hidden bg-slate-200" />;
}
