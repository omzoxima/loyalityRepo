import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JarSize } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkToken } from "@/lib/otp";
import { jarRule, tierFor, nextTier } from "@/lib/points";
import { checkFraud } from "@/lib/fraud";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  scanToken: z.string().min(10),
  qrCode: z.string().min(1),                  // strictly require a QR code
  jarSize: z.enum(["TENL", "TWENTYL"]),
  name: z.string().min(1).optional(),       // required only for new customers
  lat: z.number().optional(),
  lng: z.number().optional(),
  pinCode: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request. A valid QR code scan is required." }, { status: 400 });
  const d = parsed.data;

  // Must have a valid, recent OTP verification
  if (!checkToken(d.scanToken, d.mobile))
    return NextResponse.json({ error: "Verification expired. Please verify again." }, { status: 401 });

  // Strictly check if the QR code is registered in our database
  const qrRecord = await prisma.qrCode.findUnique({ where: { code: d.qrCode } });
  if (!qrRecord) {
    return NextResponse.json({ error: "Invalid or unregistered QR code. Please scan an authentic Bisleri QR code." }, { status: 400 });
  }

  // Find or create the customer
  let customer = await prisma.customer.findUnique({ where: { mobile: d.mobile } });
  if (!customer) {
    if (!d.name) return NextResponse.json({ error: "Name required for new customer" }, { status: 400 });
    customer = await prisma.customer.create({
      data: {
        mobile: d.mobile, name: d.name, pinCode: d.pinCode, city: d.city, area: d.area,
        lat: d.lat, lng: d.lng,
      },
    });
  }

  const rule = jarRule(d.jarSize as JarSize);
  const flagReason = await checkFraud({ qrCode: d.qrCode, lat: d.lat, lng: d.lng, customerId: customer.id });

  // Strictly block duplicate scans for the same customer
  if (flagReason && flagReason.includes("Duplicate QR")) {
    return NextResponse.json({ 
      error: "You have already scanned this QR code. Each QR code can only be claimed once per customer." 
    }, { status: 400 });
  }

  const status = flagReason ? "FLAGGED" : "VERIFIED";


  // Record the scan with detailed area info
  await prisma.scan.create({
    data: {
      customerId: customer.id, qrCode: d.qrCode, jarSize: d.jarSize as JarSize,
      value: rule.valuePaise, points: rule.points, lat: d.lat, lng: d.lng,
      pinCode: d.pinCode, city: d.city, area: d.area, status, flagReason,
    },
  });

  await prisma.qrCode.update({
    where: { code: d.qrCode },
    data: { scanCount: { increment: 1 } },
  });


  // Award points only on clean scans; flagged scans are recorded but not rewarded
  let updated = customer;
  if (status === "VERIFIED") {
    const points = customer.points + rule.points;
    updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        points, totalSpend: { increment: rule.valuePaise },
        scanCount: { increment: 1 }, tier: tierFor(points),
      },
    });
  } else {
    await prisma.customer.update({ where: { id: customer.id }, data: { isFlagged: true } });
  }

  return NextResponse.json({
    ok: status === "VERIFIED",
    flagged: status === "FLAGGED",
    flagReason,
    pointsEarned: status === "VERIFIED" ? rule.points : 0,
    totalPoints: updated.points,
    tier: updated.tier,
    next: nextTier(updated.points),
    jarLabel: rule.label,
  });
}
