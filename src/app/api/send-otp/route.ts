import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAndSendOtp } from "@/lib/otp";

const schema = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });

  try {
    const { ttlSeconds } = await createAndSendOtp(parsed.data.mobile);
    return NextResponse.json({ sent: true, ttlSeconds });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not send OTP. Try again." }, { status: 502 });
  }
}
