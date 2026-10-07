import type { Metadata } from "next";
import { Caveat, Instrument_Serif, Space_Grotesk } from "next/font/google";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk-b" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "Chavan Udyog Samuh | Legacy. Growth. Trust.",
};

export default function OptionBLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${instrument.variable} ${grotesk.variable} ${caveat.variable} paper-bg min-h-screen font-grotesk text-navy`}>
      {children}
    </div>
  );
}
