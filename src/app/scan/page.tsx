"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Screen = "mobile" | "newuser" | "otp" | "success";
type Geo = { lat?: number; lng?: number; label: string; pinCode?: string; city?: string; area?: string };

function jarFromParam(p: string | null) {
  return p === "10L" ? { code: "TENL", label: "10L" } : { code: "TWENTYL", label: "20L" };
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex items-center gap-2 font-display font-extrabold text-xl ${dark ? "text-bisleri" : "text-white"}`}>
      <span className="inline-block w-5 h-6 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] -rotate-6"
        style={{ background: "linear-gradient(160deg,#19C3E6,#0057A8)", boxShadow: "inset -3px -4px 8px rgba(0,0,0,.18)" }} />
      Bisleri
    </div>
  );
}

function Flow() {
  const params = useSearchParams();
  const jar = jarFromParam(params.get("size"));
  const qr = params.get("qr") ?? undefined;

  const [screen, setScreen] = useState<Screen>("mobile");
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(true);
  const [otp, setOtp] = useState("");
  const [geo, setGeo] = useState<Geo>({ label: "Detecting location…" });
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [scanToken, setScanToken] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Family Account states & handlers
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMobile, setFamilyMobile] = useState("");
  const [familyOtp, setFamilyOtp] = useState("");
  const [familyStep, setFamilyStep] = useState<"idle" | "otp">("idle");
  const [familyErr, setFamilyErr] = useState("");
  const [familyBusy, setFamilyBusy] = useState(false);

  useEffect(() => {
    if (screen === "success" && mobile) {
      fetch(`/api/family?parentMobile=${mobile}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setFamilyMembers(data);
        })
        .catch(console.error);
    }
  }, [screen, mobile]);

  const onAddFamilySendOtp = async () => {
    setFamilyErr("");
    if (!/^[6-9]\d{9}$/.test(familyMobile)) return setFamilyErr("Enter a valid 10-digit mobile number");
    if (familyMobile === mobile) return setFamilyErr("You cannot link your own number");
    setFamilyBusy(true);
    try {
      await api("/api/send-otp", { mobile: familyMobile });
      setFamilyStep("otp");
    } catch (e: any) {
      setFamilyErr(e.message);
    } finally {
      setFamilyBusy(false);
    }
  };

  const onAddFamilyVerify = async () => {
    setFamilyErr("");
    if (!/^\d{4,6}$/.test(familyOtp)) return setFamilyErr("Enter verification code");
    setFamilyBusy(true);
    try {
      const v = await api("/api/verify-otp", { mobile: familyMobile, code: familyOtp });
      const addRes = await fetch("/api/family/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentMobile: mobile,
          familyMobile: familyMobile,
          scanToken: v.scanToken
        })
      });
      const j = await addRes.json();
      if (!addRes.ok) throw new Error(j.error || "Could not link family member");
      
      // Update local family list
      setFamilyMembers((prev) => [j.member, ...prev]);
      setFamilyMobile("");
      setFamilyOtp("");
      setFamilyStep("idle");
    } catch (e: any) {
      setFamilyErr(e.message);
    } finally {
      setFamilyBusy(false);
    }
  };

  const onRemoveFamily = async (famMob: string) => {
    setFamilyErr("");
    if (!confirm("Are you sure you want to unlink this family member?")) return;
    try {
      const r = await fetch("/api/family/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentMobile: mobile, familyMobile: famMob })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not unlink member");
      setFamilyMembers((prev) => prev.filter((m) => m.mobile !== famMob));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const detectLocation = () => {
    setGeoBlocked(false);
    setGeo({ label: "Detecting location…" });
    if (!navigator.geolocation) { setGeo({ label: "Location unavailable" }); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = "Location captured", pinCode, city, area;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const j = await r.json();
          pinCode = j.address?.postcode;
          city = j.address?.city || j.address?.town || j.address?.state_district;
          
          // Combine detailed OpenStreetMap parameters to get a proper local address
          const localParts = [
            j.address?.road,
            j.address?.neighbourhood,
            j.address?.suburb,
            j.address?.village,
            j.address?.hamlet
          ].filter(Boolean);
          
          area = localParts.join(", ");
          if (!area) area = j.address?.city_district || j.address?.county || "Local Area";
          
          label = "📍 " + [area, city].filter(Boolean).join(", ") + (pinCode ? ` · ${pinCode}` : "");
        } catch {}
        setGeo({ lat, lng, label, pinCode, city, area });
      },
      () => { setGeoBlocked(true); setGeo({ label: "Location off" }); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const api = async (path: string, body: any) => {
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Something went wrong");
    return j;
  };

  // Step 1 — check number, branch
  const onContinue = async () => {
    setErr("");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setErr("Enter a valid 10-digit mobile number");
    setBusy(true);
    try {
      const { exists } = await api("/api/check-number", { mobile });
      if (exists) {
        await api("/api/send-otp", { mobile });
        setScreen("otp");
      } else {
        if (!qr) {
          // Block registration for non-QR direct logins
          return setErr("This mobile number is not registered. Please scan a Bisleri jar QR code to register and earn rewards.");
        }
        setScreen("newuser");
        detectLocation();
      }
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  // Step 2 — new user save -> send OTP
  const onSave = async () => {
    setErr("");
    if (!name.trim()) return setErr("Please enter your name");
    if (!agree) return setErr("Please accept the terms to continue");
    setBusy(true);
    try { await api("/api/send-otp", { mobile }); setScreen("otp"); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  // Step 3 — verify OTP then record the scan or load profile (closure)
  const onConfirm = async () => {
    setErr("");
    if (!/^\d{4,6}$/.test(otp)) return setErr("Enter the OTP");
    setBusy(true);
    try {
      const v = await api("/api/verify-otp", { mobile, code: otp });
      if (!qr) {
        // Direct login success: load verified profile data directly to dashboard
        if (!v.exists || !v.customer) {
          throw new Error("Account details not found. Please register first.");
        }
        setScanToken(v.scanToken);
        setResult({
          isDashboardOnly: true,
          totalPoints: v.customer.points,
          tier: v.customer.tier,
          flagged: v.customer.isFlagged,
          flagReason: v.customer.isFlagged ? "Flagged profile" : null,
          pointsEarned: 0,
          parentName: v.customer.parentName,
          parentPoints: v.customer.parentPoints,
          scansHistory: v.customer.scansHistory,
        });
        setScreen("success");
      } else {
        // Standard scan flow
        const res = await api("/api/scan", {
          mobile, scanToken: v.scanToken, qrCode: qr, jarSize: jar.code,
          name: name || undefined, lat: geo.lat, lng: geo.lng,
          pinCode: geo.pinCode, city: geo.city, area: geo.area,
        });
        setScanToken(v.scanToken); setResult(res); setScreen("success");
      }
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-[#faf8f3] flex flex-col max-w-md mx-auto">
      {/* ---------- 1 MOBILE ---------- */}
      {screen === "mobile" && (
        <div className="fade-in flex flex-col min-h-screen">
          <div className="px-6 pt-12 pb-7 text-white relative overflow-hidden"
            style={{ background: qr ? "linear-gradient(160deg,#0057A8,#003a72)" : "linear-gradient(160deg,#007A3E,#004D26)" }}>
            <Logo />
            {qr ? (
              <>
                <div className="font-display text-2xl font-bold mt-4 leading-tight">Every drop counts.<br />Every jar rewards.</div>
                <div className="text-sm opacity-80 mt-2">Scan • Earn • Redeem</div>
              </>
            ) : (
              <>
                <div className="font-display text-2xl font-bold mt-4 leading-tight">Member Loyalty<br />Dashboard Portal</div>
                <div className="text-sm opacity-80 mt-2">View points, scans, &amp; family accounts</div>
              </>
            )}
          </div>
          <div className="p-6 flex flex-col gap-4 flex-1">
            {qr ? (
              <div className="flex items-center gap-3 bg-bisleri-soft border border-cyan-100 rounded-2xl p-3">
                <span className="w-9 h-11 rounded-md flex-none" style={{ background: "linear-gradient(#19C3E6,#0057A8)" }} />
                <b className="text-sm">{jar.label} Jar detected</b>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-3 text-green-800">
                <span className="w-9 h-11 rounded-md flex-none bg-green-600 flex items-center justify-center text-white text-lg font-bold">👤</span>
                <b className="text-sm">Direct Member Dashboard Access</b>
              </div>
            )}
            <label className="font-bold text-slate-800">Mobile Number</label>
            <div className="flex gap-2">
              <div className="px-4 grid place-items-center border-[1.5px] border-slate-200 rounded-xl bg-slate-100 font-bold">+91</div>
              <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric" placeholder="9XXXXXXXXX"
                className="flex-1 px-4 py-3.5 border-[1.5px] border-slate-200 rounded-xl bg-white outline-none focus:border-bisleri" />
            </div>
            <small className="text-slate-500 -mt-2">We'll check if you're already registered</small>
            {err && <p className="text-rose-600 text-sm">{err}</p>}
            <div className="flex-1" />
            <button disabled={busy} onClick={onContinue}
              className="rounded-xl bg-bisleri text-white font-extrabold py-4 disabled:opacity-60">
              {busy ? "Checking…" : "Continue →"}
            </button>
            <p className="text-xs text-slate-500 text-center">Existing number → OTP · New number → quick sign-up</p>
          </div>
        </div>
      )}

      {/* ---------- 2 NEW USER ---------- */}
      {screen === "newuser" && (
        <div className="fade-in flex flex-col min-h-screen relative">
          <div className="flex justify-between items-center px-5 pt-5 pb-3 border-b border-[#efece4]">
            <Logo dark />
            <span className="text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1"><b className="text-slate-800">{jar.label} Jar</b></span>
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            <p className="text-sm text-slate-500 -mb-1">New number — let's set up your account.</p>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-800">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                className="px-4 py-3.5 border-[1.5px] border-[#e3e0d7] rounded-xl bg-white outline-none focus:border-bisleri" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-800">➤ Current Location</label>
              <div className="flex gap-2">
                <div className={`flex-1 flex items-center gap-2 px-4 py-3.5 rounded-xl border-[1.5px] text-sm font-semibold
                  ${geo.lat ? "border-green-200 bg-green-50 text-green-700" : "border-[#e3e0d7] bg-slate-100 text-slate-500"}`}>
                  {!geo.lat && !geoBlocked && <span className="spin" />}{geo.label}
                </div>
                <button onClick={detectLocation} className="w-12 border-[1.5px] border-[#e3e0d7] rounded-xl bg-white text-bisleri text-lg">↻</button>
              </div>
              <small className="text-slate-500">🔒 Used to prevent fraud</small>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 w-[18px] h-[18px] accent-bisleri" />
              <span>I agree to the <a className="text-bisleri font-bold">Terms &amp; Conditions</a> and <a className="text-bisleri font-bold">Privacy Policy</a></span>
            </label>
            {geoBlocked && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
                ❌ <b>Location access is required.</b> Bisleri requires location verification to confirm the purchase &amp; prevent fraud. You must enable location access in your browser/device settings to proceed.
                <button onClick={detectLocation} className="block mt-2 text-rose-700 font-extrabold hover:underline">🔄 Try Enabling Location</button>
              </div>
            )}
            {err && <p className="text-rose-600 text-sm">{err}</p>}
            <div className="flex-1" />
            <button 
              disabled={busy || !geo.lat || geoBlocked} 
              onClick={onSave} 
              className="rounded-xl bg-bisleri text-white font-extrabold py-4 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {!geo.lat && !geoBlocked 
                ? "⌛ Detecting Location…" 
                : geoBlocked 
                ? "🔒 Location Access Required" 
                : busy 
                ? "Saving…" 
                : "Save & Send OTP →"}
            </button>
            <p className="text-xs text-slate-500 text-center">Having trouble? <a className="text-bisleri font-bold">Contact Support</a></p>
          </div>
        </div>
      )}

      {/* ---------- 3 OTP ---------- */}
      {screen === "otp" && (
        <div className="fade-in flex flex-col min-h-screen">
          <div className="px-6 pt-11 pb-6 text-white" style={{ background: "linear-gradient(160deg,#0057A8,#003a72)" }}>
            <Logo />
            <div className="font-display text-xl font-bold mt-3">Verify your number</div>
            <div className="text-sm opacity-80">OTP sent to +91 {mobile.slice(0, 2)}XXX {mobile.slice(-5)}</div>
          </div>
          <div className="p-6 flex flex-col gap-4 flex-1">
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric" placeholder="Enter OTP" autoFocus
              className="text-center text-2xl font-extrabold tracking-[0.5em] py-4 border-[1.5px] border-slate-200 rounded-xl bg-white outline-none focus:border-bisleri text-bisleri" />
            <small className="text-slate-500 text-center">In dev mode, the OTP prints to your server console.</small>
            {err && <p className="text-rose-600 text-sm text-center">{err}</p>}
            <button disabled={busy} onClick={onConfirm} className="rounded-xl bg-bisleri text-white font-extrabold py-4 disabled:opacity-60">
              {busy ? "Confirming…" : qr ? "Confirm Purchase" : "Login to Dashboard →"}
            </button>
            <div className="flex-1" />
          </div>
        </div>
      )}

      {/* ---------- 4 SUCCESS ---------- */}
      {screen === "success" && result && (
        <div className="fade-in flex flex-col min-h-screen pb-6">
          {result.isDashboardOnly ? (
            <div className="text-center px-6 pt-12 pb-7 text-white" style={{ background: "linear-gradient(160deg,#0057A8,#003a72)" }}>
              <div className="w-[70px] h-[70px] rounded-full bg-white/20 grid place-items-center mx-auto mb-3 text-4xl">👤</div>
              <h2 className="font-display text-2xl font-bold">Member Profile Dashboard</h2>
              <p className="opacity-90 text-sm mt-1">Manage your family links &amp; rewards</p>
            </div>
          ) : (
            <div className="text-center px-6 pt-12 pb-7 text-white" style={{ background: result.flagged && result.flagReason?.includes("Duplicate") ? "linear-gradient(160deg,#D97706,#B45309)" : "linear-gradient(160deg,#0a8f4d,#0a7a5e)" }}>
              <div className="w-[70px] h-[70px] rounded-full bg-white/20 grid place-items-center mx-auto mb-3 text-4xl">
                {result.flagged && result.flagReason?.includes("Duplicate") ? "ℹ️" : "✓"}
              </div>
              <h2 className="font-display text-2xl font-bold">
                {result.flagged && result.flagReason?.includes("Duplicate") 
                  ? "Duplicate Scan Claimed" 
                  : result.flagged 
                  ? "Scan Received" 
                  : `You received ${result.pointsEarned} points!`}
              </h2>
              <p className="opacity-90 text-sm mt-1">
                {result.flagged && result.flagReason?.includes("Duplicate") 
                  ? "Already scanned QR code" 
                  : `${jar.label} Jar · ${result.flagged ? "under review" : "Points credited to your account"}`}
              </p>
            </div>
          )}
          <div className="-mt-4 mx-4 bg-white rounded-2xl shadow-xl p-5 relative z-10">
            <div className="font-display text-4xl font-extrabold text-bisleri leading-none">
              {result.totalPoints} <span className="text-sm text-slate-500 font-semibold">total points</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-tier-gold px-3 py-1.5 rounded-full text-xs font-extrabold mt-2">
              {result.tier === "PLATINUM" ? "💎 Platinum" : result.tier === "GOLD" ? "🥇 Gold" : "🥈 Silver"} Member
            </div>
            {result.next && (
              <>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden my-3">
                  <div className="h-full rounded-full" style={{ width: "62%", background: "linear-gradient(90deg,#19C3E6,#0057A8)" }} />
                </div>
                <div className="text-xs text-slate-500 font-bold">{result.next.remaining} pts to {result.next.name}</div>
              </>
            )}
          </div>
          {result.flagged && (
            <div className="mx-4 mt-3 text-xs rounded-xl p-3 bg-amber-50 border border-amber-200 text-amber-800">
              {result.flagReason?.includes("Duplicate") ? (
                <span>⚠️ <b>Points not credited.</b> You cannot get points because you have already claimed points for this QR code.</span>
              ) : (
                <span>🚩 This scan was flagged ({result.flagReason}) and is pending review. Points are awarded once verified.</span>
              )}
            </div>
          )}

          {/* Dynamic WhatsApp Share with exact points and jar detail */}
          <a
            className="bg-green-500 text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-extrabold text-sm mx-4 mt-4 shadow-sm hover:bg-green-600 transition"
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `I just scanned a Bisleri ${jar.label} jar and received ${result.pointsEarned} loyalty points! 💧`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Share on WhatsApp
          </a>

          {/* Dynamic Customer Scan History List */}
          {result.scansHistory && result.scansHistory.length > 0 && (
            <div className="mx-4 mt-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>My Scan History</span>
                <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                  {result.scansHistory.length} scan{result.scansHistory.length > 1 ? "s" : ""}
                </span>
              </h3>
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {result.scansHistory.map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center bg-[#fdfdfc] border border-slate-100 rounded-xl p-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-700">{s.jar} Jar Scan</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(s.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} · {s.qrCode}
                      </div>
                    </div>
                    <div className="text-right">
                      {s.status === "FLAGGED" ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          🚩 Review
                        </span>
                      ) : (
                        <span className="font-extrabold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          +{s.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Point Pooling Banner if linked family member */}
          {result.parentPoints !== null && result.parentName !== null && (
            <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 font-semibold flex flex-col gap-1 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold">
                <span>👨‍👩‍👧‍👦 Family Point Pooling Active</span>
              </div>
              <p className="text-amber-700 leading-normal font-medium">
                This scan's points were also pooled directly to your family parent account: <b>{result.parentName}</b>.
              </p>
              <div className="mt-1 bg-white/60 rounded px-2.5 py-1 self-start font-bold">
                Total Parent Points: <span className="text-amber-900 font-extrabold">{result.parentPoints} pts</span>
              </div>
            </div>
          )}

          {/* 👨‍👩‍👧‍👦 Family Accounts Dashboard - Render only if this is a parent customer (no parentName in result) */}
          {result.parentPoints === null && (
            <div className="mx-4 mt-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-display text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>👨‍👩‍👧‍👦 Family Accounts (Point Pooling)</span>
                <span className="text-[10px] font-extrabold text-bisleri bg-bisleri-soft rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                  {familyMembers.length} linked
                </span>
              </h3>
              
              <p className="text-xs text-slate-500 mb-4">
                Link family numbers so their loyalty scan points pool directly into both accounts.
              </p>

            {/* List of members */}
            {familyMembers.length > 0 ? (
              <div className="flex flex-col gap-2 mb-4">
                {familyMembers.map((m) => (
                  <div key={m.id} className="flex justify-between items-center bg-[#fdfdfc] border border-slate-100 rounded-xl p-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-700">{m.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        +91 {m.mobile.slice(0, 2)}XXX {m.mobile.slice(-5)} · {m.tier} member
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-bisleri bg-bisleri-soft px-2 py-0.5 rounded-full">
                        {m.points} pts
                      </span>
                      <button 
                        onClick={() => onRemoveFamily(m.mobile)}
                        className="text-slate-400 hover:text-rose-600 font-bold px-1.5 py-0.5 text-[11px] rounded hover:bg-rose-50 transition"
                        title="Remove family member"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 mb-4 text-xs text-slate-400">
                No family members linked yet.
              </div>
            )}

            {/* Add Member Form */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <h4 className="text-xs font-bold text-slate-700 mb-2.5">Add Family Member</h4>
              {familyStep === "idle" ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <div className="px-3 grid place-items-center border-[1.5px] border-slate-200 rounded-lg bg-slate-100 font-bold text-xs">+91</div>
                    <input 
                      value={familyMobile} 
                      onChange={(e) => setFamilyMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Family mobile number"
                      inputMode="numeric"
                      className="flex-1 px-3 py-2 border-[1.5px] border-slate-200 rounded-lg bg-white outline-none focus:border-bisleri text-xs" 
                    />
                  </div>
                  <button 
                    disabled={familyBusy}
                    onClick={onAddFamilySendOtp}
                    className="bg-bisleri text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-60"
                  >
                    {familyBusy ? "Sending…" : "Link"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-bisleri-soft border border-cyan-100 rounded-xl p-3.5">
                  <p className="text-[10px] text-slate-500 font-semibold mb-1">
                    Enter the 6-digit verification code sent to +91 {familyMobile}
                  </p>
                  <div className="flex gap-2">
                    <input 
                      value={familyOtp} 
                      onChange={(e) => setFamilyOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter verification code"
                      inputMode="numeric"
                      className="flex-1 px-3 py-2 border-[1.5px] border-cyan-200 rounded-lg bg-white outline-none focus:border-bisleri text-xs text-center font-bold tracking-[0.2em]" 
                    />
                    <button 
                      disabled={familyBusy}
                      onClick={onAddFamilyVerify}
                      className="bg-bisleri text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-60"
                    >
                      {familyBusy ? "Verifying…" : "Confirm"}
                    </button>
                    <button 
                      onClick={() => { setFamilyStep("idle"); setFamilyOtp(""); }}
                      className="bg-white border border-slate-200 text-slate-500 font-bold px-3 py-2 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {familyErr && <p className="text-rose-600 text-[11px] mt-1.5 font-semibold">{familyErr}</p>}
            </div>
          </div>
        )}

          <div className="px-4 mt-4">
            <button
              onClick={() => location.reload()}
              className="w-full rounded-xl bg-slate-100 text-bisleri font-extrabold py-4 shadow-sm hover:bg-slate-200 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ScanPage() {
  return <Suspense fallback={<div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>}><Flow /></Suspense>;
}
