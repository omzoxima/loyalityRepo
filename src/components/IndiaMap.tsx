"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { rupees, tierColor, tierLabel } from "./ui";

export interface MapFilters {
  tier: string;
  city: string;
  pincode: string;
  timeframe: string;
}

interface IndiaMapProps {
  onSelect: (id: string) => void;
  filters: MapFilters;
  onLoadedData?: (customers: any[]) => void;
}

export default function IndiaMap({ onSelect, filters, onLoadedData }: IndiaMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  // Keep a mutable ref of onLoadedData to avoid dependency re-triggering of fetch
  const onLoadedDataRef = useRef(onLoadedData);
  useEffect(() => {
    onLoadedDataRef.current = onLoadedData;
  }, [onLoadedData]);

  // 1. Initialize Map
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView([22.5, 79], 4.6);
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersGroupRef.current = null;
    };
  }, []);

  // 2. Fetch Customer Data once
  useEffect(() => {
    let active = true;
    fetch("/api/admin/map")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!active) return;
        setCustomers(data);

        if (onLoadedDataRef.current) {
          onLoadedDataRef.current(data);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // 3. Render and filter markers on customers/filters change
  useEffect(() => {
    const map = mapRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Calculate timeframe thresholds
    const now = Date.now();
    let timeframeThreshold = 0;
    if (filters.timeframe === "TODAY") {
      timeframeThreshold = now - 24 * 60 * 60 * 1000;
    } else if (filters.timeframe === "7DAYS") {
      timeframeThreshold = now - 7 * 24 * 60 * 60 * 1000;
    } else if (filters.timeframe === "30DAYS") {
      timeframeThreshold = now - 30 * 24 * 60 * 60 * 1000;
    }

    customers.forEach((c) => {
      if (c.lat == null || c.lng == null) return;

      // 1. Tier / Flagged filter
      if (filters.tier !== "ALL") {
        if (filters.tier === "FLAGGED") {
          if (!c.isFlagged) return;
        } else {
          if (c.tier !== filters.tier) return;
        }
      }

      // 2. City filter
      if (filters.city !== "ALL" && c.city !== filters.city) return;

      // 3. Pincode filter
      if (filters.pincode !== "ALL" && c.pinCode !== filters.pincode) return;

      // 4. Timeframe filter (compare latest activity against threshold)
      if (filters.timeframe !== "ALL") {
        const latestActivity = c.scans?.[0]?.createdAt
          ? new Date(c.scans[0].createdAt).getTime()
          : new Date(c.createdAt).getTime();
        if (latestActivity < timeframeThreshold) return;
      }

      // Create and add custom circle marker
      const m = L.circleMarker([c.lat, c.lng], {
        radius: 4 + c.totalSpend / 90000,
        color: "#fff",
        weight: 1.4,
        fillColor: c.isFlagged ? "#e11d48" : tierColor(c.tier),
        fillOpacity: 0.82,
      }).addTo(group);

      m.bindTooltip(
        `<b>${c.name}</b><br>${c.city ?? ""} · ${tierLabel(c.tier)}<br>Spend: ${rupees(c.totalSpend)}<br>${c.scanCount} scans`,
        { direction: "top" }
      );
      m.on("click", () => onSelect(c.id));
    });
  }, [customers, filters, onSelect]);

  return <div ref={ref} className="h-[480px] rounded-2xl overflow-hidden bg-slate-200" />;
}
