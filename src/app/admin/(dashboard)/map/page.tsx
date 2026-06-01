"use client";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { Box, CustomerDrawer } from "@/components/ui";
import { MapFilters } from "@/components/IndiaMap";

// Leaflet must be client-only (no SSR)
const IndiaMap = dynamic(() => import("@/components/IndiaMap"), {
  ssr: false,
  loading: () => <div className="h-[480px] rounded-2xl bg-slate-200 grid place-items-center text-slate-500">Loading map…</div>,
});

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full" style={{ background: color }} />
    {label}
  </span>
);

const FilterSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="relative min-w-[130px]">
    <select
      value={value}
      onChange={onChange}
      className="w-full pl-3.5 pr-8 py-2 border-[1.5px] border-slate-200 rounded-lg bg-white font-semibold text-slate-600 focus:outline-none focus:border-bisleri focus:ring-1 focus:ring-bisleri cursor-pointer appearance-none text-sm transition hover:border-slate-300"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

export default function MapPage() {
  const [sel, setSel] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filters, setFilters] = useState<MapFilters>({
    tier: "ALL",
    city: "ALL",
    pincode: "ALL",
    timeframe: "30DAYS", // Default to "Last 30 days" matching the initial user state
  });

  // Unique cities computed from all loaded customers
  const citiesOptions = useMemo(() => {
    const uniqueCities = Array.from(new Set(customers.map((c) => c.city).filter(Boolean))).sort() as string[];
    return [
      { value: "ALL", label: "All cities" },
      ...uniqueCities.map((city) => ({ value: city, label: city })),
    ];
  }, [customers]);

  // Unique pincodes computed from customers in the currently selected city (or all if no city is chosen)
  const pincodesOptions = useMemo(() => {
    const relevantCustomers = filters.city === "ALL"
      ? customers
      : customers.filter((c) => c.city === filters.city);
    const uniquePincodes = Array.from(new Set(relevantCustomers.map((c) => c.pinCode).filter(Boolean))).sort() as string[];
    return [
      { value: "ALL", label: "All pincodes" },
      ...uniquePincodes.map((pin) => ({ value: pin, label: pin })),
    ];
  }, [customers, filters.city]);

  // Handle city changes - dynamically adjusting pincode selection to maintain consistency
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCity = e.target.value;
    const relevantCustomers = nextCity === "ALL"
      ? customers
      : customers.filter((c) => c.city === nextCity);
    const nextPincodes = Array.from(new Set(relevantCustomers.map((c) => c.pinCode).filter(Boolean))).sort() as string[];

    // If current selected pincode is not in the next list of pincodes, reset pincode filter
    const nextPincode = nextPincodes.includes(filters.pincode) ? filters.pincode : "ALL";

    setFilters((prev) => ({
      ...prev,
      city: nextCity,
      pincode: nextPincode,
    }));
  };

  const tierOptions = [
    { value: "ALL", label: "All tiers" },
    { value: "PLATINUM", label: "Platinum" },
    { value: "GOLD", label: "Gold" },
    { value: "SILVER", label: "Silver" },
    { value: "FLAGGED", label: "Flagged" },
  ];

  const timeframeOptions = [
    { value: "ALL", label: "All time" },
    { value: "TODAY", label: "Today" },
    { value: "7DAYS", label: "Last 7 days" },
    { value: "30DAYS", label: "Last 30 days" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl">India Customer Map</h1>
        <p className="text-slate-500 text-sm">Each dot is a customer · colour = tier · size = total spend · click for details</p>
      </div>
      <Box>
        <div className="flex gap-2.5 flex-wrap mb-4">
          <FilterSelect
            value={filters.tier}
            onChange={(e) => setFilters((prev) => ({ ...prev, tier: e.target.value }))}
            options={tierOptions}
          />
          <FilterSelect
            value={filters.city}
            onChange={handleCityChange}
            options={citiesOptions}
          />
          <FilterSelect
            value={filters.pincode}
            onChange={(e) => setFilters((prev) => ({ ...prev, pincode: e.target.value }))}
            options={pincodesOptions}
          />
          <FilterSelect
            value={filters.timeframe}
            onChange={(e) => setFilters((prev) => ({ ...prev, timeframe: e.target.value }))}
            options={timeframeOptions}
          />
        </div>
        <IndiaMap onSelect={setSel} filters={filters} onLoadedData={setCustomers} />
        <div className="flex gap-[18px] flex-wrap mt-3.5 text-xs font-semibold text-slate-500">
          <Legend color="#7C4DFF" label="Platinum" />
          <Legend color="#E0A100" label="Gold" />
          <Legend color="#90A4AE" label="Silver" />
          <Legend color="#e11d48" label="Flagged" />
          <span>○ larger dot = higher spend</span>
        </div>
      </Box>
      <CustomerDrawer id={sel} onClose={() => setSel(null)} />
    </div>
  );
}
