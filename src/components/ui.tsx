"use client";
import { useEffect, useState } from "react";

export const rupees = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
export const tierColor = (t: string) => t === "PLATINUM" ? "#7C4DFF" : t === "GOLD" ? "#E0A100" : "#90A4AE";
export const tierLabel = (t: string) => t === "PLATINUM" ? "Platinum" : t === "GOLD" ? "Gold" : "Silver";
export const ago = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export function Box({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      {(title || right) && (
        <div className="flex justify-between items-center mb-3">
          {title && <h3 className="font-display text-base font-bold">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function CustomerDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!id) { setData(null); return; }
    fetch(`/api/admin/customer/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-slate-900/40 z-40 transition ${id ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
      <div className={`fixed top-0 right-0 h-screen w-[430px] max-w-[92vw] bg-white z-50 shadow-2xl overflow-y-auto p-6 transition-transform
        ${id ? "translate-x-0" : "translate-x-full"}`}>
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 rounded-lg border border-slate-200 text-slate-500">✕</button>
        {!data ? <p className="text-slate-400 mt-10">Loading…</p> : (
          <>
            <div className="flex gap-3.5 items-center mb-4">
              <div className="w-14 h-14 rounded-2xl grid place-items-center text-white font-display font-extrabold text-2xl"
                style={{ background: "linear-gradient(135deg,#0057A8,#19C3E6)" }}>{data.name[0]}</div>
              <div>
                <h2 className="font-display text-xl">{data.name}</h2>
                <p className="text-slate-500 text-sm">{tierLabel(data.tier)} · {data.area || data.city} {data.isFlagged && "· 🚩 flagged"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 my-4">
              {[["Total spend", rupees(data.totalSpend)], ["Points", data.points], ["Scans", data.scanCount]].map(([l, v]) => (
                <div key={l as string} className="bg-[#eef4f9] rounded-xl p-3 text-center">
                  <b className="font-display text-lg block">{v as any}</b><small className="text-slate-500 text-[11px]">{l}</small>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mb-3">📍 {data.pinCode || "—"} · joined {new Date(data.joined).toLocaleDateString("en-IN")}</p>
            <Box title="Purchase history">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-400 text-[11px] uppercase"><th className="text-left py-1.5">Date</th><th className="text-left">Jar</th><th className="text-left">Value</th><th className="text-left">Pts</th></tr></thead>
                <tbody>
                  {data.history.map((h: any, i: number) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-2">{new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td>{h.jar}</td><td>{rupees(h.value)}</td>
                      <td>{h.status === "FLAGGED" ? <span className="text-rose-600">🚩</span> : `+${h.points}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <button onClick={async () => { await fetch(`/api/admin/customer/${id}`, { method: "PATCH", body: JSON.stringify({ flagged: !data.isFlagged }) }); onClose(); }}
              className="w-full mt-4 rounded-xl py-3.5 font-extrabold bg-rose-50 text-rose-600">
              {data.isFlagged ? "✓ Unflag this customer" : "🚩 Flag this customer"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
