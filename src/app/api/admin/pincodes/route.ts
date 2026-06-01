import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const byPin = await prisma.$queryRaw<any[]>`
    SELECT s."pinCode" AS pincode, MAX(s.city) AS city,
           COUNT(DISTINCT s."customerId")::int AS customers,
           COUNT(*)::int AS scans, SUM(s.value)::bigint AS spend
    FROM "Scan" s WHERE s."pinCode" IS NOT NULL AND s.status = 'VERIFIED'
    GROUP BY s."pinCode" ORDER BY spend DESC LIMIT 25`;

  const byCity = await prisma.$queryRaw<any[]>`
    SELECT s.city AS city, COUNT(DISTINCT s."customerId")::int AS customers,
           SUM(s.value)::bigint AS spend
    FROM "Scan" s WHERE s.city IS NOT NULL AND s.status = 'VERIFIED'
    GROUP BY s.city ORDER BY spend DESC`;

  const num = (v: any) => Number(v);
  return NextResponse.json({
    pincodes: byPin.map((r) => ({ ...r, spend: num(r.spend) })),
    cities: byCity.map((r) => ({ ...r, spend: num(r.spend), avg: Math.round(num(r.spend) / r.customers) })),
  });
}
