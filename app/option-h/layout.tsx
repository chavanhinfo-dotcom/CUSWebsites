import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./h.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant" });

export const metadata: Metadata = {
  title: "Chavan Udyog Samuh | Legacy. Growth. Trust.",
  description:
    "Chavan Udyog Samuh, Solapur since 1960: home appliances, two-wheelers, passenger cars and commercial vehicles across Maharashtra and Karnataka, led by three generations of one family.",
};

export default function OptionHLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${cormorant.variable} h-root min-h-screen antialiased`}>{children}</div>;
}
