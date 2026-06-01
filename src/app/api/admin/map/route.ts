import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Customer points for the India map. colour=tier, size=spend.
export async function GET() {
  const customers = await prisma.customer.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    select: {
      id: true, name: true, city: true, pinCode: true, lat: true, lng: true,
      totalSpend: true, points: true, tier: true, isFlagged: true, scanCount: true,
      createdAt: true,
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  return NextResponse.json(customers);
}
