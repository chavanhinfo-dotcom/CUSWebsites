"use client";
import { motion } from "framer-motion";
import { joinList, statesOf, useContent } from "./content";
import { Eyebrow, Headline, Pill, ease } from "./ui";

// the states' vehicle-registration codes, shown against each district (others: their first two letters)
const CODES: Record<string, string> = {
  Maharashtra: "MH", Karnataka: "KA", Goa: "GA", Gujarat: "GJ", Telangana: "TS", "Andhra Pradesh": "AP", "Madhya Pradesh": "MP",
  "Tamil Nadu": "TN", Kerala: "KL", Rajasthan: "RJ", Delhi: "DL", "Uttar Pradesh": "UP",
};
const code = (state: string) => CODES[state] ?? state.slice(0, 2).toUpperCase();

// Straight on from the journey's black, the districts are listed like a dispatch board; then a glow carries
// the page from black back into white (for the leadership below).
export default function PresenceX() {
  const { company, districts: rows } = useContent();
  return (
    <>
      <section id="presence" className="bg-x-black px-4 pb-28 pt-28 text-white md:px-8 md:pb-40 md:pt-40">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <Headline lines={["Where", "we operate."]} grey={1} light className="text-[clamp(40px,6vw,96px)]" />
          <div className="flex flex-col justify-end gap-5">
            <Eyebrow light>Our presence</Eyebrow>
            <p className="max-w-md text-[17px] leading-relaxed text-white/60">
              Headquartered in {company.hq}, serving customers across {joinList(statesOf(rows))}.
            </p>
            <div><Pill href="#contact" dark>Visit a showroom</Pill></div>
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_340px]">
          <ul className="border-t border-white/12">
            {rows.map((r, i) => (
              <motion.li
                key={`${i}-${r.name}`}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.8, delay: i * 0.07, ease }}
                className="group grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-white/12 py-6 transition-colors duration-500 hover:bg-white/[0.03] sm:grid-cols-[48px_1fr_auto] sm:gap-4 md:grid-cols-[160px_1fr_auto]"
              >
                <span className="micro text-white/40">
                  {String(i + 1).padStart(2, "0")}
                  <span className="hidden md:inline"> · {r.state}</span>
                </span>
                {/* (on a phone the name scales with the screen, so a row never runs wider than it) */}
                <span className="wide min-w-0 break-words text-[clamp(20px,6.4vw,30px)] transition-transform duration-500 group-hover:translate-x-2 md:text-[clamp(28px,3.4vw,52px)]">{r.name}</span>
                <span className={`micro rounded-full px-3 py-1.5 ${r.hq ? "bg-x-gold text-x-ink" : "border border-white/20 text-white/60"}`}>
                  {r.hq ? (<><span className="sm:hidden">HQ</span><span className="hidden sm:inline">Head office</span></>) : code(r.state)}
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
            <img src="/images/showroom-luxury.jpg" alt="Showroom floor" loading="lazy" decoding="async" className="h-full w-full object-cover grayscale transition-[filter] duration-700 hover:grayscale-0" />
            <p className="micro absolute bottom-4 left-4 text-white">Est. {company.since} · {company.hq}</p>
          </motion.div>
        </div>
      </section>
      <div className="h-[45vh] bg-[radial-gradient(130%_85%_at_50%_0%,#0a0a0b_30%,#1d2fb8_52%,rgba(42,63,216,0.35)_70%,#fafaf8_88%)]" aria-hidden />
    </>
  );
}
