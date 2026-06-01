"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Box, CustomerDrawer, rupees, tierColor, ago } from "@/components/ui";

export default function Overview() {
  const [s, setS] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setS);
    fetch("/api/admin/scans?take=6").then((r) => r.json()).then(setScans);
  }, []);

  const daily = (s?.daily ?? []).map((d: any) => ({ day: new Date(d.day).toLocaleDateString("en-IN", { weekday: "narrow" }), count: d.count }));

  const KPI = ({ label, val, delta, flag }: any) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-[18px] shadow-sm">
      <div className="text-[11.5px] font-bold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`font-display text-3xl font-extrabold mt-1.5 ${flag ? "text-rose-600" : ""}`}>{val}</div>
      {delta && <div className="text-xs font-bold mt-1 text-green-600">{delta}</div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div><h1 className="font-display text-2xl">Overview</h1><p className="text-slate-500 text-sm">Real-time loyalty performance across India</p></div>
        <span className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-600" />Live
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Scans Today" val={s?.scansToday ?? "—"} delta="▲ today" />
        <KPI label="Registered Customers" val={s?.customers?.toLocaleString("en-IN") ?? "—"} delta={`▲ ${s?.newToday ?? 0} new`} />
        <KPI label="Revenue Tracked" val={s ? rupees(s.revenuePaise) : "—"} delta="▲ this week" />
        <KPI label="Flagged Scans" val={s?.flagged ?? "—"} flag />
      </div>

      <div className="grid md:grid-cols-[1.4fr_1fr] gap-[18px]">
        <Box title="Scans — last 14 days">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}><XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip /><Bar dataKey="count" fill="#0057A8" radius={[5, 5, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Box>
        <Box title="Jar size split">
          <div className="flex items-center gap-5">
            <div className="w-[120px] h-[120px] rounded-full grid place-items-center relative"
              style={{ background: `conic-gradient(#0057A8 0 ${s?.jar?.bigPct ?? 64}%, #19C3E6 ${s?.jar?.bigPct ?? 64}% 100%)` }}>
              <div className="w-[78px] h-[78px] rounded-full bg-white grid place-items-center font-display text-lg">{s?.jar?.bigPct ?? 64}%</div>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2 font-semibold"><span className="w-3 h-3 rounded bg-bisleri" />20L Jars</div>
              <div className="flex items-center gap-2 font-semibold"><span className="w-3 h-3 rounded bg-bisleri-cyan" />10L Jars</div>
            </div>
          </div>
        </Box>
      </div>

      <Box title="Recent scans">
        <table className="w-full text-sm">
          <thead><tr className="text-slate-400 text-[11px] uppercase border-b border-slate-200">
            <th className="text-left py-2">Time</th><th className="text-left">Customer</th><th className="text-left">City</th><th className="text-left">Jar</th><th className="text-left">Pts</th><th className="text-left">Status</th></tr></thead>
          <tbody>
            {scans.map((r) => (
              <tr key={r.id} onClick={() => setSel(r.customerId)} className="border-b border-slate-50 hover:bg-bisleri-soft cursor-pointer">
                <td className="py-2.5">{ago(r.time)}</td>
                <td><span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: tierColor(r.tier) }} />{r.name}</td>
                <td>{r.city}</td><td>{r.jar}</td><td>+{r.points}</td>
                <td>{r.status === "FLAGGED"
                  ? <span className="text-rose-600 text-xs font-bold">🚩 {r.flagReason}</span>
                  : <span className="text-green-600 text-xs font-bold">✓ Verified</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <CustomerDrawer id={sel} onClose={() => setSel(null)} />
    </div>
  );
}
