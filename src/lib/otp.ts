import crypto from "crypto";
import { prisma } from "./prisma";
import { sendOtpSms } from "./sms";

const SECRET = process.env.OTP_SECRET || "dev-secret";
const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const hash = (code: string, mobile: string) =>
  crypto.createHmac("sha256", SECRET).update(`${mobile}:${code}`).digest("hex");

export async function createAndSendOtp(mobile: string) {
  const code = String(crypto.randomInt(100000, 999999));
  await prisma.otpRequest.create({
    data: { mobile, codeHash: hash(code, mobile), expiresAt: new Date(Date.now() + TTL_MS) },
  });
  await sendOtpSms(mobile, code); // in dev (no MSG91 key) this prints to the server console
  return { ttlSeconds: TTL_MS / 1000 };
}

export async function verifyOtp(mobile: string, code: string) {
  const rec = await prisma.otpRequest.findFirst({
    where: { mobile, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!rec) return { ok: false, reason: "OTP expired or not found" };
  if (rec.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "Too many attempts" };

  if (rec.codeHash !== hash(code, mobile)) {
    await prisma.otpRequest.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "Incorrect code" };
  }
  await prisma.otpRequest.update({ where: { id: rec.id }, data: { consumed: true } });
  return { ok: true, scanToken: signToken(mobile) };
}

// Short-lived signed token proving the number was just verified. Required by /api/scan.
export function signToken(mobile: string) {
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${mobile}.${exp}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function checkToken(token: string, mobile: string) {
  try {
    const [m, exp, sig] = Buffer.from(token, "base64url").toString().split(".");
    if (m !== mobile || Number(exp) < Date.now()) return false;
    const good = crypto.createHmac("sha256", SECRET).update(`${m}.${exp}`).digest("hex");
    return good === sig;
  } catch {
    return false;
  }
}
