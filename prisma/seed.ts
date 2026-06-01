import { PrismaClient, JarSize, ScanStatus } from "@prisma/client";
import { tierFor } from "../src/lib/points";
import crypto from "crypto";

const prisma = new PrismaClient();

const CITIES = [
  { city: "Mumbai", area: "Bandra West", pin: "400050", lat: 19.0596, lng: 72.8295 },
  { city: "Mumbai", area: "Powai", pin: "400076", lat: 19.1176, lng: 72.906 },
  { city: "New Delhi", area: "Greater Kailash", pin: "110048", lat: 28.5494, lng: 77.2425 },
  { city: "New Delhi", area: "Saket", pin: "110017", lat: 28.5245, lng: 77.2066 },
  { city: "Bengaluru", area: "Koramangala", pin: "560034", lat: 12.9352, lng: 77.6245 },
  { city: "Chennai", area: "Thiruvanmiyur", pin: "600041", lat: 12.983, lng: 80.259 },
  { city: "Pune", area: "Baner", pin: "411045", lat: 18.559, lng: 73.776 },
  { city: "Hyderabad", area: "Gachibowli", pin: "500032", lat: 17.44, lng: 78.348 },
  { city: "Kolkata", area: "Salt Lake", pin: "700091", lat: 22.58, lng: 88.417 },
  { city: "Jaipur", area: "Malviya Nagar", pin: "302017", lat: 26.857, lng: 75.81 },
];

const NAMES = [
  "Ananya Sharma", "Rohan Mehta", "Priya Nair", "Arjun Reddy", "Sneha Iyer",
  "Vikram Singh", "Kavya Rao", "Aditya Joshi", "Neha Gupta", "Karan Malhotra",
  "Divya Menon", "Sanjay Patel", "Fatima Khan", "Rahul Verma", "Meera Pillai",
];

const rnd = (a: number, b: number) => Math.floor(Math.random() * (b - a) + a);
const PAISE = { TWENTYL: 8000, TENL: 5000 } as const; // ₹80 / ₹50
const PTS = { TWENTYL: 10, TENL: 6 } as const;

async function main() {
  await prisma.admin.deleteMany();
  await prisma.scan.deleteMany();
  await prisma.otpRequest.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.distributorZone.deleteMany();
  await prisma.customer.deleteMany();

  // Distributor geofences (fraud zones)
  await prisma.distributorZone.createMany({
    data: [
      { name: "DL-07 Depot", lat: 28.61, lng: 77.21, radiusM: 200 },
      { name: "MH-03 Depot", lat: 19.07, lng: 72.87, radiusM: 200 },
    ],
  });

  // Pre-print 500 QR codes
  const qrData = Array.from({ length: 500 }, (_, i) => ({
    code: `JAR-${String(i + 1).padStart(5, "0")}`,
    jarSize: Math.random() < 0.64 ? JarSize.TWENTYL : JarSize.TENL,
    batchId: "BATCH-2026-Q2",
  }));
  await prisma.qrCode.createMany({ data: qrData });

  // Customers + scan history
  for (let i = 0; i < 60; i++) {
    const loc = CITIES[rnd(0, CITIES.length)];
    const name = NAMES[rnd(0, NAMES.length)];
    const mobile = `9${rnd(100000000, 999999999)}`;
    const scanCount = rnd(3, 60);

    let totalSpend = 0;
    let points = 0;
    const scans: any[] = [];
    for (let s = 0; s < scanCount; s++) {
      const big = Math.random() < 0.64;
      const jar = big ? JarSize.TWENTYL : JarSize.TENL;
      const value = big ? PAISE.TWENTYL : PAISE.TENL;
      const pts = big ? PTS.TWENTYL : PTS.TENL;
      totalSpend += value;
      points += pts;
      const flagged = Math.random() < 0.04;
      scans.push({
        qrCode: `JAR-${String(rnd(1, 500)).padStart(5, "0")}`,
        jarSize: jar,
        value,
        points: pts,
        lat: loc.lat + (Math.random() - 0.5) * 0.05,
        lng: loc.lng + (Math.random() - 0.5) * 0.05,
        pinCode: loc.pin,
        city: loc.city,
        status: flagged ? ScanStatus.FLAGGED : ScanStatus.VERIFIED,
        flagReason: flagged ? "Velocity anomaly" : null,
        createdAt: new Date(Date.now() - rnd(0, 60) * 86400000),
      });
    }

    await prisma.customer.create({
      data: {
        mobile,
        name,
        pinCode: loc.pin,
        city: loc.city,
        area: loc.area,
        lat: loc.lat,
        lng: loc.lng,
        points,
        totalSpend,
        tier: tierFor(points),
        scanCount,
        isFlagged: Math.random() < 0.08,
        scans: { create: scans },
      },
    });
  }

  // Seed default admin user (username: admin / password: bisleri123)
  const adminPasswordHash = crypto.createHash("sha256").update("bisleri123").digest("hex");
  await prisma.admin.create({
    data: {
      username: "admin",
      passwordHash: adminPasswordHash,
      name: "Bisleri Admin",
    },
  });

  console.log("✅ Seed complete: 1 admin, 60 customers, 500 QR codes, 2 distributor zones");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
