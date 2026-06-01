"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Reset basic auth cache just in case the browser tries to send it
  useEffect(() => {
    // Attempting to access a non-existent URL with wrong basic auth credentials resets the browser's credentials cache.
    // However, since we deleted the WWW-Authenticate header, we are mostly safe.
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        // Redirect to admin overview page
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#050b14] px-4 py-12 overflow-hidden selection:bg-bisleri selection:text-white">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-bisleri to-bisleri-cyan filter blur-[130px] opacity-20 animate-pulse pointer-events-none" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-bisleri-cyan to-bisleri-deep filter blur-[130px] opacity-20 animate-pulse pointer-events-none" style={{ animationDuration: "12s" }} />

      <div className="w-full max-w-[440px] z-10 fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-bisleri-cyan to-bisleri shadow-[0_0_20px_rgba(0,87,168,0.3)] mb-4 animate-bounce" style={{ animationDuration: "3s" }}>
            <span className="w-6 h-7 rounded-[50%] -rotate-6 bg-white flex-shrink-0" style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)" }} />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            Bisleri <span className="bg-gradient-to-r from-bisleri-cyan to-bisleri-light bg-clip-text text-transparent">OPS</span>
          </h1>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold">
            Administrative Control Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
              <span className="text-base">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Username Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  placeholder="Enter administrator username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-bisleri-cyan rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-bisleri-cyan transition-all duration-300 shadow-inner group-hover:border-white/20"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-bisleri-cyan rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-bisleri-cyan transition-all duration-300 shadow-inner group-hover:border-white/20"
                />
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 my-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-950 border-white/10 text-bisleri focus:ring-bisleri-cyan w-4 h-4 accent-bisleri-cyan"
                />
                Remember me
              </label>
              <span className="text-slate-500 hover:text-slate-400 transition cursor-pointer">
                Trouble logging in?
              </span>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-[#0057A8] to-[#19C3E6] disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition duration-300 hover:shadow-[0_0_25px_rgba(25,195,230,0.45)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="spin border-top-color-white" style={{ borderColor: "#ffffff66", borderTopColor: "#fff" }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-[11px] font-semibold mt-8">
          Bisleri Loyalty Security System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
