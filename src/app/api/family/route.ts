import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parentMobile = searchParams.get("parentMobile");

  if (!parentMobile || !/^[6-9]\d{9}$/.test(parentMobile)) {
    return NextResponse.json({ error: "Invalid parent mobile number" }, { status: 400 });
  }

  const parent = await prisma.customer.findUnique({
    where: { mobile: parentMobile },
    include: {
      familyMembers: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          mobile: true,
          name: true,
          points: true,
          tier: true,
          scanCount: true,
        },
      },
    },
  });

  if (!parent) {
    return NextResponse.json([]);
  }

  return NextResponse.json(parent.familyMembers);
}
