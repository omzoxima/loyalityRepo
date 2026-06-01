# Bisleri Loyalty Program

QR-based consumer loyalty platform for Bisleri water jars. A customer scans the QR on a 10L/20L
jar, the page opens in their mobile browser (no app), they verify by OTP, and the purchase is
recorded with their GPS location for fraud prevention. The Bisleri ops team gets a real-time
admin dashboard with an India map, live scan feed, and city/pincode analytics.

Stack: **Next.js 14 (App Router, TypeScript) · PostgreSQL via Prisma · MSG91 for OTP SMS · Leaflet map · Recharts.**

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   - set DATABASE_URL to your Postgres instance
#   - leave MSG91_AUTHKEY empty for now (OTPs will print to the console)

# 3. Create the schema + seed demo data
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Then open:
- **Consumer flow:**  http://localhost:3000/scan?qr=JAR-00123&size=20L
- **Admin dashboard:** http://localhost:3000/admin  (login: `admin` / `bisleri123`)

In dev (no MSG91 key) the OTP is printed in the terminal running `npm run dev`, e.g.
`📲  [DEV OTP] +91 9812345678  ->  482913`.

---

## Consumer flow

1. **Enter mobile** (`/scan`) — the number is checked via `POST /api/check-number`.
   - Existing number → OTP sent → straight to verification.
   - New number → quick sign-up (name + auto-detected location), then OTP.
2. **Location** is captured with the browser Geolocation API and reverse-geocoded
   (area / city / pincode) via OpenStreetMap. If location is off, the user is prompted to enable it.
3. **OTP** verifies the number (`/api/verify-otp`) and returns a short-lived signed `scanToken`.
4. **Closure** (`/api/scan`) records the purchase, runs fraud checks, awards points, and updates the tier.

## Points & tiers (edit in `src/lib/points.ts`)

| Jar | Value | Points |
|-----|-------|--------|
| 20L | ₹80   | 10     |
| 10L | ₹50   | 6      |

Silver 0–199 · Gold 200–499 · Platinum 500+

## Fraud prevention (`src/lib/fraud.ts`)

- **Duplicate QR** — a physical code scanned more than once is flagged.
- **Supplier GPS** — scans inside a known distributor geofence (`DistributorZone`) are flagged.
- **Velocity** — 3+ scans from one customer within 30 minutes are flagged.

Flagged scans are recorded but **do not award points**, and surface in red on the dashboard.

---

## Going live with real SMS (MSG91)

1. Create an MSG91 account and complete **DLT registration** (mandatory in India for transactional SMS).
2. Create an OTP/transactional template containing an `{{otp}}` variable; note its **template ID**.
3. Set in `.env`: `MSG91_AUTHKEY`, `MSG91_SENDER_ID` (6-char DLT-approved header), `MSG91_DLT_TEMPLATE_ID`.

To swap providers (Twilio, AWS SNS, etc.) you only edit `src/lib/sms.ts` — nothing else changes.

---

## Project structure

```
prisma/schema.prisma        DB models (Customer, Scan, QrCode, OtpRequest, DistributorZone)
prisma/seed.ts              60 demo customers across 10 Indian cities
src/lib/                    prisma · points · otp · sms · fraud
src/app/api/                check-number · send-otp · verify-otp · scan · admin/*
src/app/scan/page.tsx       consumer mobile flow (state machine)
src/app/admin/              overview · scans · map · analytics (+ layout)
src/components/             IndiaMap (Leaflet) · ui (drawer, helpers)
src/middleware.ts           basic-auth for /admin and /api/admin
```

## QR code format

Each jar carries a unique URL: `https://loyalty.bisleri.com/scan?qr=JAR-00123&size=20L`.
QR codes are pre-printed and stored in the `QrCode` table; the seed creates 500.

## Notes

- Replace basic-auth with your SSO/JWT before production.
- Add rate limiting on `/api/send-otp` (e.g. max 3/number/hour) before going live.
- The India map uses free CARTO/OpenStreetMap tiles; for high traffic, use a keyed tile provider.
