import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./g.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Chavan Udyog Samuh | Legacy. Growth. Trust.",
  description:
    "Chavan Udyog Samuh, Solapur since 1960: home appliances, two-wheelers, passenger cars and commercial vehicles. Find the right showroom for Samsung, Hero, Royal Enfield, Ather, Maruti Suzuki, Nexa, Tata and more.",
};

export default function OptionGLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${manrope.variable} g-root min-h-screen antialiased`}>{children}</div>;
}
