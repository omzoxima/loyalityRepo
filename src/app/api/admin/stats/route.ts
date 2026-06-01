import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export async function GET() {
  const today = startOfDay();
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const [scansToday, customers, newToday, flagged, revenueAgg, jarSplit, last14] = await Promise.all([
    prisma.scan.count({ where: { createdAt: { gte: today } } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: today } } }),
    prisma.scan.count({ where: { status: "FLAGGED", createdAt: { gte: weekAgo } } }),
    prisma.scan.aggregate({ _sum: { value: true }, where: { status: "VERIFIED", createdAt: { gte: weekAgo } } }),
    prisma.scan.groupBy({ by: ["jarSize"], _count: true }),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
      FROM "Scan" WHERE "createdAt" > NOW() - INTERVAL '14 days'
      GROUP BY day ORDER BY day ASC`,
  ]);

  const big = jarSplit.find((j) => j.jarSize === "TWENTYL")?._count ?? 0;
  const small = jarSplit.find((j) => j.jarSize === "TENL")?._count ?? 0;
  const total = big + small || 1;

  return NextResponse.json({
    scansToday, customers, newToday, flagged,
    revenuePaise: revenueAgg._sum.value ?? 0,
    jar: { big, small, bigPct: Math.round((big / total) * 100) },
    daily: last14.map((r) => ({ day: r.day, count: Number(r.count) })),
  });
}
