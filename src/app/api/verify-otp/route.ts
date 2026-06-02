import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  code: z.string().regex(/^\d{4,6}$/),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await verifyOtp(parsed.data.mobile, parsed.data.code);
  if (!result.ok) return NextResponse.json({ verified: false, error: result.reason }, { status: 401 });

  // Query customer details to check if they exist and load profile data for standalone login
  const customer = await prisma.customer.findUnique({
    where: { mobile: parsed.data.mobile },
    include: {
      scans: { orderBy: { createdAt: "desc" }, take: 10 },
      parent: { select: { id: true, name: true, mobile: true, points: true } },
      familyMembers: { select: { id: true, name: true, mobile: true, points: true, tier: true } },
    }
  });

  return NextResponse.json({
    verified: true,
    scanToken: result.scanToken,
    exists: !!customer,
    customer: customer ? {
      name: customer.name,
      points: customer.points,
      tier: customer.tier,
      isFlagged: customer.isFlagged,
      parentName: customer.parent?.name ?? null,
      parentPoints: customer.parent?.points ?? null,
      scansHistory: customer.scans.map((s) => ({
        id: s.id,
        date: s.createdAt,
        jar: s.jarSize === "TWENTYL" ? "20L" : "10L",
        points: s.points,
        status: s.status,
        qrCode: s.qrCode,
      }))
    } : null
  });
}
