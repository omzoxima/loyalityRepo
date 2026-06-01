import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const flaggedOnly = req.nextUrl.searchParams.get("flagged") === "1";
  const take = Number(req.nextUrl.searchParams.get("take") ?? 25);

  const scans = await prisma.scan.findMany({
    where: flaggedOnly ? { status: "FLAGGED" } : {},
    orderBy: { createdAt: "desc" },
    take,
    include: { customer: { select: { name: true, mobile: true, tier: true } } },
  });

  return NextResponse.json(scans.map((s) => ({
    id: s.id,
    customerId: s.customerId,
    time: s.createdAt,
    name: s.customer.name,
    mobile: "+91 " + s.customer.mobile.slice(0, 2) + "XXX " + s.customer.mobile.slice(-5),
    tier: s.customer.tier,
    city: s.city,
    pinCode: s.pinCode,
    jar: s.jarSize === "TWENTYL" ? "20L" : "10L",
    points: s.points,
    status: s.status,
    flagReason: s.flagReason,
  })));
}
