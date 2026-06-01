"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Box, CustomerDrawer } from "@/components/ui";

// Leaflet must be client-only (no SSR)
const IndiaMap = dynamic(() => import("@/components/IndiaMap"), {
  ssr: false,
  loading: () => <div className="h-[480px] rounded-2xl bg-slate-200 grid place-items-center text-slate-500">Loading map…</div>,
});

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: color }} />{label}</span>
);

export default function MapPage() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="font-display text-2xl">India Customer Map</h1>
        <p className="text-slate-500 text-sm">Each dot is a customer · colour = tier · size = total spend · click for details</p></div>
      <Box>
        <div className="flex gap-2.5 flex-wrap mb-4 text-sm font-semibold text-slate-600">
          {["All tiers ▾", "All cities ▾", "All pincodes ▾", "Last 30 days ▾"].map((f) => (
            <span key={f} className="px-3.5 py-2 border-[1.5px] border-slate-200 rounded-lg bg-white">{f}</span>
          ))}
        </div>
        <IndiaMap onSelect={setSel} />
        <div className="flex gap-[18px] flex-wrap mt-3.5 text-xs font-semibold text-slate-500">
          <Legend color="#7C4DFF" label="Platinum" /><Legend color="#E0A100" label="Gold" />
          <Legend color="#90A4AE" label="Silver" /><Legend color="#e11d48" label="Flagged" />
          <span>○ larger dot = higher spend</span>
        </div>
      </Box>
      <CustomerDrawer id={sel} onClose={() => setSel(null)} />
    </div>
  );
}
