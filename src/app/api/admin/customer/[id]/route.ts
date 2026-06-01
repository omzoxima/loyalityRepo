import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const c = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { scans: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: c.id, name: c.name,
    mobile: "+91 " + c.mobile.slice(0, 2) + "XXX " + c.mobile.slice(-5),
    city: c.city, area: c.area, pinCode: c.pinCode, tier: c.tier,
    points: c.points, totalSpend: c.totalSpend, scanCount: c.scanCount,
    isFlagged: c.isFlagged, joined: c.createdAt,
    history: c.scans.map((s) => ({
      date: s.createdAt, jar: s.jarSize === "TWENTYL" ? "20L" : "10L",
      value: s.value, points: s.points, status: s.status,
    })),
  });
}

// Flag / unflag a customer
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { flagged } = await req.json().catch(() => ({ flagged: true }));
  const c = await prisma.customer.update({ where: { id: params.id }, data: { isFlagged: !!flagged } });
  return NextResponse.json({ ok: true, isFlagged: c.isFlagged });
}
