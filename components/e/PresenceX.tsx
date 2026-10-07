"use client";
import { motion } from "framer-motion";
import { company, presence } from "@/lib/content";
import { Eyebrow, Headline, Pill, ease } from "./ui";

// A glow carries the page from white into black, then the districts are listed like a dispatch board.
export default function PresenceX() {
  const rows = presence.flatMap((s) => s.districts.map((d) => ({ ...d, state: s.state })));
  return (
    <>
      <div className="h-[45vh] bg-[radial-gradient(130%_85%_at_50%_100%,#0a0a0b_30%,#1d2fb8_52%,rgba(42,63,216,0.35)_70%,#f2f2ef_88%)]" aria-hidden />
      <section id="presence" className="bg-x-black px-4 pb-28 text-white md:px-8 md:pb-40">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <Headline lines={["Where", "we operate."]} grey={1} light className="text-[clamp(40px,6vw,96px)]" />
          <div className="flex flex-col justify-end gap-5">
            <Eyebrow light>Our presence</Eyebrow>
            <p className="max-w-md text-[17px] leading-relaxed text-white/60">
              Headquartered in {company.hq}, serving customers across Maharashtra and Karnataka.
            </p>
            <div><Pill href="#contact" dark>Visit a showroom</Pill></div>
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_340px]">
          <ul className="border-t border-white/12">
            {rows.map((r, i) => (
              <motion.li
                key={r.name}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.8, delay: i * 0.07, ease }}
                className="group grid grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-white/12 py-6 transition-colors duration-500 hover:bg-white/[0.03] md:grid-cols-[160px_1fr_auto]"
              >
                <span className="micro text-white/40">
                  {String(i + 1).padStart(2, "0")}
                  <span className="hidden md:inline"> · {r.state}</span>
                </span>
                <span className="wide text-[clamp(28px,3.4vw,52px)] transition-transform duration-500 group-hover:translate-x-2">{r.name}</span>
                <span className={`micro rounded-full px-3 py-1.5 ${"hq" in r && r.hq ? "bg-x-gold text-x-ink" : "border border-white/20 text-white/60"}`}>
                  {"hq" in r && r.hq ? "Head office" : r.state === "Karnataka" ? "KA" : "MH"}
                </span>
              </motion.li>
            ))}
          </ul>
          <motion.div
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            whileInView={{ clipPath: "inset(0% 0 0 0)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.3, ease }}
            className="relative hidden aspect-[3/4] overflow-hidden lg:block"
          >
            <img src="/images/showroom-luxury.jpg" alt="Showroom floor" className="h-full w-full object-cover grayscale transition-[filter] duration-700 hover:grayscale-0" />
            <p className="micro absolute bottom-4 left-4 text-white">Est. {company.since} · {company.hq}</p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
