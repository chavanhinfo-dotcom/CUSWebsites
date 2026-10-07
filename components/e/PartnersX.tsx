"use client";
import { motion } from "framer-motion";
import { Eyebrow, Headline, ease } from "./ui";

const groups = [
  { label: "Home appliances", brands: ["Samsung Exclusive Plaza"] },
  { label: "Two-wheelers", brands: ["Hero MotoCorp", "Hero Premia", "Royal Enfield", "Ather Electric", "Kinetic Honda"] },
  { label: "Passenger cars", brands: ["Maruti Suzuki Arena", "Nexa"] },
  { label: "Commercial vehicles", brands: ["Tata Commercial", "Tata SCV", "Maruti Commercial"] },
];

// A dashed partner grid (brand names set as type; manufacturers' logos need their permission).
export default function PartnersX() {
  return (
    <section id="partners" className="bg-[#f2f2ef] px-4 py-28 md:px-8 md:py-40">
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <Headline lines={["Trusted by", "the brands", "India drives."]} grey={2} className="text-[clamp(40px,6vw,96px)]" />
        <div className="flex flex-col justify-end gap-5">
          <Eyebrow>Our partners</Eyebrow>
          <p className="max-w-md text-[17px] leading-relaxed text-x-mute">
            Authorised dealerships and showrooms across every business we run.
          </p>
        </div>
      </div>

      <div className="mt-20 space-y-14">
        {groups.map((g) => (
          <div key={g.label} className="grid gap-4 md:grid-cols-[200px_1fr]">
            <p className="micro pt-3 text-x-mute">{g.label}</p>
            <div className="grid grid-cols-2 border-l border-t border-dashed border-[#cfcfca] sm:grid-cols-3 lg:grid-cols-5">
              {g.brands.map((b, i) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease }}
                  className="group grid aspect-[2/1] place-items-center border-b border-r border-dashed border-[#cfcfca] px-4 text-center transition-colors duration-500 hover:bg-x-ink"
                >
                  <span className="wide text-[clamp(12px,1.1vw,16px)] !leading-[1.15] text-x-ink transition-colors duration-500 group-hover:text-white">{b}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
