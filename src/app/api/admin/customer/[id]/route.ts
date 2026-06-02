import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const c = await prisma.customer.findUnique({
    where: { id: params.id },
    include: { 
      scans: { orderBy: { createdAt: "desc" }, take: 20 },
      parent: { select: { id: true, name: true, mobile: true } },
      familyMembers: { select: { id: true, name: true, mobile: true, points: true, tier: true } }
    },
  });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: c.id, name: c.name,
    mobile: "+91 " + c.mobile.slice(0, 2) + "XXX " + c.mobile.slice(-5),
    city: c.city, area: c.area, pinCode: c.pinCode, tier: c.tier,
    points: c.points, totalSpend: c.totalSpend, scanCount: c.scanCount,
    isFlagged: c.isFlagged, joined: c.createdAt,
    parent: c.parent ? {
      id: c.parent.id,
      name: c.parent.name,
      mobile: "+91 " + c.parent.mobile.slice(0, 2) + "XXX " + c.parent.mobile.slice(-5)
    } : null,
    familyMembers: c.familyMembers.map((m) => ({
      id: m.id,
      name: m.name,
      mobile: "+91 " + m.mobile.slice(0, 2) + "XXX " + m.mobile.slice(-5),
      points: m.points,
      tier: m.tier
    })),
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
