import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";


const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Bisleri Loyalty",
  description: "Scan. Earn. Redeem.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-sans`}>{children}</body>
    </html>
  );
}
