// MSG91 OTP integration (India). Set MSG91_AUTHKEY in .env to go live.
// With no key (local dev), the OTP is printed to the server console instead of sent.
const AUTHKEY = process.env.MSG91_AUTHKEY;
const SENDER = process.env.MSG91_SENDER_ID || "BISLRI";
const TEMPLATE = process.env.MSG91_DLT_TEMPLATE_ID;

export async function sendOtpSms(mobile: string, code: string) {
  if (!AUTHKEY) {
    console.log(`\n  📲  [DEV OTP] +91 ${mobile}  ->  ${code}\n`);
    return { dev: true };
  }
  // MSG91 Flow API — requires a DLT-approved template containing a {{otp}} variable.
  const res = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: AUTHKEY },
    body: JSON.stringify({
      template_id: TEMPLATE,
      sender: SENDER,
      short_url: "0",
      recipients: [{ mobiles: `91${mobile}`, otp: code }],
    }),
  });
  if (!res.ok) throw new Error(`MSG91 error ${res.status}: ${await res.text()}`);
  return res.json();
}
