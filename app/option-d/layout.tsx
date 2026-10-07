import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-intertight" });

export const metadata: Metadata = {
  title: "Chavan Udyog Samuh | Six Decades of Trust",
};

export default function OptionDLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${interTight.variable} min-h-screen bg-d-bg font-d text-d-text antialiased`}>{children}</div>;
}
