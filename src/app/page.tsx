import Link from "next/link";

// Simple entry. In production the jar QR points to /scan?qr=JAR-00123&size=20L
export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center bg-bisleri-soft p-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl font-extrabold text-bisleri">Bisleri Loyalty</h1>
        <p className="text-slate-500 mt-3">QR-based rewards — every jar counts.</p>
        <div className="flex flex-col gap-3 mt-8">
          <Link href="/scan?qr=JAR-00123&size=20L" className="rounded-xl bg-bisleri text-white font-bold py-4">
            Simulate a jar scan (consumer)
          </Link>
          <Link href="/admin" className="rounded-xl bg-white border border-slate-200 text-bisleri font-bold py-4">
            Open admin dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
