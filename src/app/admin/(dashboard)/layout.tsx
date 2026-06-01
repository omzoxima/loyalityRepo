"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/scans", label: "Live Scans" },
  { href: "/admin/map", label: "India Map" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef4f9]">
      <div className="max-w-[1320px] mx-auto grid md:grid-cols-[230px_1fr] gap-6 p-6">
        <aside className="bg-[#0c1b2a] rounded-2xl p-5 text-slate-300 self-start md:sticky md:top-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center gap-2 font-display font-extrabold text-white text-lg mb-6">
              <span className="inline-block w-5 h-6 rounded-[50%] -rotate-6" style={{ background: "linear-gradient(160deg,#19C3E6,#0057A8)" }} />
              Bisleri<span className="text-[10px] font-sans text-slate-500 ml-1">OPS</span>
            </div>
            <nav className="flex flex-col gap-1">
              {items.map((it) => {
                const on = path === it.href;
                return (
                  <Link key={it.href} href={it.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition
                      ${on ? "bg-bisleri text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />{it.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 mt-8 px-3 py-2.5 rounded-xl font-bold text-sm bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white transition w-full text-center border border-rose-500/10 hover:border-transparent cursor-pointer"
          >
            <span>🚪 Logout</span>
          </button>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

