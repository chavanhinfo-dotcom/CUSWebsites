import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

// Absolute URLs for social previews: Vercel provides the deployment host at build time.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Client demo: keep it out of search engines until the real launch
  robots: { index: false, follow: false },
  title: "Chavan Udyog Samuh | Serving Solapur Since 1960",
  description:
    "Chavan Udyog Samuh is Solapur's diversified business group: home appliances, two-wheelers, passenger cars and commercial vehicles across Maharashtra and Karnataka since 1960.",
  openGraph: {
    title: "Chavan Udyog Samuh",
    description: "Six decades of trust. Appliances, two-wheelers, cars and commercial vehicles.",
    images: ["/brand/logo-full.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0b09",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
