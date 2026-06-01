import { prisma } from "./prisma";

const distM = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export interface FraudInput {
  qrCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  customerId: string;
}

// Returns a flag reason string if the scan looks fraudulent, else null.
export async function checkFraud(input: FraudInput): Promise<string | null> {
  // 1) Duplicate physical QR — a code should normally be scanned once.
  if (input.qrCode) {
    const qr = await prisma.qrCode.findUnique({ where: { code: input.qrCode } });
    if (qr && qr.scanCount >= 1) return `Duplicate QR (scanned ${qr.scanCount + 1}×)`;
  }

  // 2) Inside a known distributor / supplier geofence.
  if (input.lat != null && input.lng != null) {
    const zones = await prisma.distributorZone.findMany();
    for (const z of zones) {
      if (distM(input.lat, input.lng, z.lat, z.lng) <= z.radiusM)
        return `Supplier GPS (${z.name})`;
    }
  }

  // 3) Velocity — too many scans from this customer in a short window.
  const recent = await prisma.scan.count({
    where: { customerId: input.customerId, createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) } },
  });
  if (recent >= 3) return "Velocity anomaly (3+ scans / 30 min)";

  return null;
}
