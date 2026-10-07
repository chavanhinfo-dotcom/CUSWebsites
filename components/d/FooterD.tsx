"use client";
import { motion } from "framer-motion";
import { company, presence } from "@/lib/content";
import { scrollToHash } from "@/lib/lenis";
import { RevealLines } from "./FeaturesD";

const ease = [0.25, 1, 0.5, 1] as const;
const cells = [
  { href: "#businesses", label: "Our Businesses" },
  { href: "#journey", label: "Our Journey" },
  { href: "#presence", label: "Our Presence" },
];

function Arrow() {
  return (
    <span className="relative block h-8 w-6 overflow-hidden text-brass">
      {[0, 1].map((k) => (
        <svg
          key={k}
          viewBox="0 0 23 32"
          className={`absolute inset-0 h-8 w-6 transition-transform duration-500 ease-[cubic-bezier(.25,1,.5,1)] ${k ? "-translate-x-full group-hover:translate-x-0" : "group-hover:translate-x-full"}`}
        >
          <path d="M3 16h15M11 7l8 9-8 9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        </svg>
      ))}
    </span>
  );
}

export default function FooterD() {
  const districts = presence.flatMap((s) => s.districts.map((d) => d.name)).join(", ");
  return (
    <footer id="contact" data-header="dark" className="bg-d-dark text-white">
      <div className="px-5 pb-24 pt-28 md:px-10 md:pt-[160px]">
        <h2 className="max-w-[1200px] text-[clamp(44px,6.4vw,96px)] font-medium leading-[0.95] tracking-[-0.055em]">
          <RevealLines lines={["Visit a showroom near you.", "Six decades of trust,", "one visit away."]} />
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-8 max-w-xl text-[18px] leading-[1.45] text-white/60"
        >
          Head office in {company.hq}. Serving {districts}.
        </motion.p>
        <button
          onClick={() => scrollToHash("#presence")}
          className="mt-10 inline-flex h-12 items-center rounded-full bg-white px-6 text-[13px] font-semibold uppercase tracking-[0.04em] text-d-dark transition-colors hover:bg-d-alt"
        >
          Find a showroom
        </button>
      </div>

      <nav className="grid border-y border-white/15 md:grid-cols-3">
        {cells.map((c) => (
          <a
            key={c.href}
            href={c.href}
            onClick={(e) => {
              e.preventDefault();
              scrollToHash(c.href);
            }}
            className="group flex items-center justify-between border-b border-white/15 px-5 py-14 transition-colors duration-500 hover:bg-white/[0.04] md:border-b-0 md:border-r md:px-12 md:py-20 md:last:border-r-0"
          >
            <span className="text-[clamp(28px,2.6vw,36px)] font-medium tracking-[-0.04em]">{c.label}</span>
            <Arrow />
          </a>
        ))}
      </nav>

      <div className="px-5 pt-12 md:px-12">
        <motion.svg
          viewBox="0 0 1000 170"
          className="h-auto w-full"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease }}
          aria-label={company.name}
        >
          <text x="0" y="150" textLength="1000" lengthAdjust="spacingAndGlyphs" fontSize="200" fontWeight="700" fill="#fcfcfc" letterSpacing="-8">
            CHAVAN
          </text>
        </motion.svg>
        <div className="flex flex-col gap-3 py-8 text-[14px] text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {company.name}. {company.motto}</p>
          <p className="flex gap-6">
            <span className="text-white">Since {company.since}</span>
            <span>Brand names are trademarks of their respective owners</span>
            <span>Photography: Unsplash</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
