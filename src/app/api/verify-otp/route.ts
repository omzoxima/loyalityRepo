import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  code: z.string().regex(/^\d{4,6}$/),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await verifyOtp(parsed.data.mobile, parsed.data.code);
  if (!result.ok) return NextResponse.json({ verified: false, error: result.reason }, { status: 401 });

  // scanToken proves verification and is required by /api/scan
  return NextResponse.json({ verified: true, scanToken: result.scanToken });
}
