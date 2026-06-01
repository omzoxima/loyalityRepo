import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/) });

// Decides the branch: existing number -> straight to OTP; new -> sign-up first.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });

  const customer = await prisma.customer.findUnique({
    where: { mobile: parsed.data.mobile },
    select: { name: true },
  });

  return NextResponse.json({ exists: !!customer, name: customer?.name ?? null });
}
