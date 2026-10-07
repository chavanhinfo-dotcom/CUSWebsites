import type { Metadata } from "next";
import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "Chavan Udyog Samuh | Six Decades of Moving Forward",
  description:
    "Chavan Udyog Samuh: home appliances, two-wheelers, passenger cars and commercial vehicles across Maharashtra and Karnataka since 1960.",
};

export default function OptionELayout({ children }: { children: React.ReactNode }) {
  return <div className={`${archivo.variable} min-h-screen bg-x-white font-x text-x-ink antialiased`}>{children}</div>;
}
