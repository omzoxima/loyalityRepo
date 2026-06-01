const SECRET = process.env.OTP_SECRET || "dev-secret";
const ADMIN_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper to calculate SHA-256 hash using global Web Crypto API (fully supported in both Node and Edge)
async function getSha256Signature(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${payload}:${SECRET}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function signAdminToken(username: string): Promise<string> {
  const exp = Date.now() + ADMIN_SESSION_TTL;
  const payload = `${username}.${exp}`;
  const sig = await getSha256Signature(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export async function checkAdminToken(token: string, username: string): Promise<boolean> {
  try {
    const [u, exp, sig] = Buffer.from(token, "base64url").toString().split(".");
    if (u !== username || Number(exp) < Date.now()) return false;
    const good = await getSha256Signature(`${u}.${exp}`);
    return good === sig;
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

