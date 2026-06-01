"use client";
import { useEffect, useState, useCallback } from "react";
import { Box, CustomerDrawer, tierColor, ago } from "@/components/ui";

export default function Scans() {
  const [rows, setRows] = useState<any[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sel, setSel] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/scans?take=30${flaggedOnly ? "&flagged=1" : ""}`).then((r) => r.json()).then(setRows);
  }, [flaggedOnly]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div><h1 className="font-display text-2xl">Live Scans</h1><p className="text-slate-500 text-sm">Every verified purchase as it happens · auto-refreshes</p></div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="accent-bisleri" /> Flagged only
        </label>
      </div>
      <Box>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-slate-400 text-[11px] uppercase border-b border-slate-200">
              <th className="text-left py-2">Time</th><th className="text-left">Customer</th><th className="text-left">Mobile</th>
              <th className="text-left">City</th><th className="text-left">Pincode</th><th className="text-left">Jar</th><th className="text-left">Pts</th><th className="text-left">Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setSel(r.customerId)} className="border-b border-slate-50 hover:bg-bisleri-soft cursor-pointer">
                  <td className="py-2.5">{ago(r.time)}</td>
                  <td><span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: tierColor(r.tier) }} />{r.name}</td>
                  <td className="text-slate-500">{r.mobile}</td><td>{r.city}</td><td>{r.pinCode || "—"}</td><td>{r.jar}</td><td>+{r.points}</td>
                  <td>{r.status === "FLAGGED"
                    ? <span className="text-rose-600 text-xs font-bold">🚩 {r.flagReason}</span>
                    : <span className="text-green-600 text-xs font-bold">✓ Verified</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Box>
      <CustomerDrawer id={sel} onClose={() => setSel(null)} />
    </div>
  );
}
