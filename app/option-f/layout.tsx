import type { Metadata } from "next";
import { Bodoni_Moda, Plus_Jakarta_Sans } from "next/font/google";
import "./f.css";

// Option F: "The golden thread". A high-contrast Bodoni for display, Plus Jakarta Sans for everything else.
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-bodoni" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "Chavan Udyog Samuh | Legacy. Growth. Trust.",
  description:
    "Chavan Udyog Samuh, Solapur: home appliances, two-wheelers, passenger cars and commercial vehicles across Maharashtra and Karnataka since 1960.",
};

export default function OptionFLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${bodoni.variable} ${jakarta.variable} f-root min-h-screen antialiased`}>{children}</div>;
}
