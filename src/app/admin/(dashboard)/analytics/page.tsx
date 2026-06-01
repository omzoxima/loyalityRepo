"use client";
import { useEffect, useState } from "react";
import { Box, CustomerDrawer, rupees, tierColor } from "@/components/ui";

export default function Analytics() {
  const [geo, setGeo] = useState<any>(null);
  const [map, setMap] = useState<any[]>([]);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pincodes").then((r) => r.json()).then(setGeo);
    fetch("/api/admin/map").then((r) => r.json()).then(setMap);
  }, []);

  const leaders = [...map].sort((a, b) => b.points - a.points).slice(0, 8);

  return (
    <div className="flex flex-col gap-[18px]">
      <div><h1 className="font-display text-2xl">Analytics</h1><p className="text-slate-500 text-sm">Trends, distributions & geography</p></div>

      <div className="grid md:grid-cols-2 gap-[18px]">
        <Box title="Top customers by points">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-400 text-[11px] uppercase border-b border-slate-200"><th className="text-left py-2">#</th><th className="text-left">Customer</th><th className="text-left">City</th><th className="text-left">Points</th></tr></thead>
            <tbody>
              {leaders.map((c, i) => (
                <tr key={c.id} onClick={() => setSel(c.id)} className="border-b border-slate-50 hover:bg-bisleri-soft cursor-pointer">
                  <td className="py-2.5 font-bold">{i + 1}</td>
                  <td><span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: tierColor(c.tier) }} />{c.name}</td>
                  <td>{c.city}</td><td className="font-bold">{c.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <Box title="City-wise performance">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-400 text-[11px] uppercase border-b border-slate-200"><th className="text-left py-2">City</th><th className="text-left">Customers</th><th className="text-left">Total Spend</th><th className="text-left">Avg</th></tr></thead>
            <tbody>
              {(geo?.cities ?? []).map((c: any) => (
                <tr key={c.city} className="border-b border-slate-50">
                  <td className="py-2.5 font-bold">{c.city}</td><td>{c.customers}</td><td>{rupees(c.spend)}</td><td>{rupees(c.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </div>

      <Box title="Pincode-wise performance">
        <table className="w-full text-sm">
          <thead><tr className="text-slate-400 text-[11px] uppercase border-b border-slate-200">
            <th className="text-left py-2">Pincode</th><th className="text-left">City</th><th className="text-left">Customers</th><th className="text-left">Scans</th><th className="text-left">Total Spend</th></tr></thead>
          <tbody>
            {(geo?.pincodes ?? []).map((p: any) => (
              <tr key={p.pincode} className="border-b border-slate-50">
                <td className="py-2.5 font-bold">{p.pincode}</td><td>{p.city}</td><td>{p.customers}</td><td>{p.scans}</td><td>{rupees(p.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <CustomerDrawer id={sel} onClose={() => setSel(null)} />
    </div>
  );
}
