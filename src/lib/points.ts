import { JarSize, Tier } from "@prisma/client";

// Reward + value rules (single source of truth — change here to retune the program)
export const JAR = {
  TWENTYL: { label: "20L", points: 10, valuePaise: 8000 }, // ₹80
  TENL: { label: "10L", points: 6, valuePaise: 5000 },     // ₹50
} as const;

export function jarRule(size: JarSize) {
  return size === "TWENTYL" ? JAR.TWENTYL : JAR.TENL;
}

// Tier thresholds (points)
export function tierFor(points: number): Tier {
  if (points >= 500) return "PLATINUM";
  if (points >= 200) return "GOLD";
  return "SILVER";
}

export function nextTier(points: number): { name: string; remaining: number } | null {
  if (points < 200) return { name: "Gold", remaining: 200 - points };
  if (points < 500) return { name: "Platinum", remaining: 500 - points };
  return null;
}

export const rupees = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
