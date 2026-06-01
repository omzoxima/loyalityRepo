const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

export async function sendOtpSms(mobile: string, code: string) {
  // 1. If Twilio credentials are set, deliver via Twilio REST API
  if (TWILIO_SID && TWILIO_TOKEN && TWILIO_PHONE) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
    
    // Ensure the phone number has the international country prefix +91 for India
    const to = mobile.startsWith("+") ? mobile : `+91${mobile}`;
    
    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", TWILIO_PHONE);
    params.append("Body", `Your Bisleri Loyalty OTP code is: ${code}. Valid for 5 minutes.`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Twilio SMS error ${res.status}: ${errText}`);
    }
    return res.json();
  }

  // 2. Fallback: Local Dev Mode (prints OTP to terminal console)
  console.log(`\n  📲  [DEV OTP] +91 ${mobile}  ->  ${code}\n`);
  return { dev: true };
}
