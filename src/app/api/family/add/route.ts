import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkToken } from "@/lib/otp";

const schema = z.object({
  parentMobile: z.string().regex(/^[6-9]\d{9}$/),
  familyMobile: z.string().regex(/^[6-9]\d{9}$/),
  scanToken: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
  const d = parsed.data;

  // Prevent self-linking
  if (d.parentMobile === d.familyMobile) {
    return NextResponse.json({ error: "You cannot add your own number as a family member" }, { status: 400 });
  }

  // Verify that familyMobile's OTP was verified successfully via the token
  if (!checkToken(d.scanToken, d.familyMobile)) {
    return NextResponse.json({ error: "Family number verification expired or invalid. Please verify again." }, { status: 401 });
  }

  // Find parent customer
  const parent = await prisma.customer.findUnique({ where: { mobile: d.parentMobile } });
  if (!parent) {
    return NextResponse.json({ error: "Parent customer account not found. Please scan and register first." }, { status: 404 });
  }

  // Find or create the family customer
  let familyCustomer = await prisma.customer.findUnique({ where: { mobile: d.familyMobile } });
  if (!familyCustomer) {
    familyCustomer = await prisma.customer.create({
      data: {
        mobile: d.familyMobile,
        name: `Family of ${parent.name}`,
        points: 0,
        parentId: parent.id,
      },
    });
  } else {
    // If they already exist, update parent link
    familyCustomer = await prisma.customer.update({
      where: { id: familyCustomer.id },
      data: { parentId: parent.id },
    });
  }

  return NextResponse.json({
    ok: true,
    member: {
      id: familyCustomer.id,
      name: familyCustomer.name,
      mobile: familyCustomer.mobile,
      points: familyCustomer.points,
      tier: familyCustomer.tier,
      scanCount: familyCustomer.scanCount,
    },
  });
}
