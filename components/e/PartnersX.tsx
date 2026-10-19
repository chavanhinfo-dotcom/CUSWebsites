"use client";
import { motion } from "framer-motion";
import { Eyebrow, Headline, ease } from "./ui";

// Brands and their best-known models (as sold through each dealership).
const groups = [
  { label: "Home appliances", brands: [{ b: "Samsung Exclusive Plaza", m: "Bespoke refrigerators · Neo QLED TVs · washers" }] },
  {
    label: "Two-wheelers",
    brands: [
      { b: "Hero MotoCorp", m: "Splendor+ · Xtreme 125R" },
      { b: "Hero Premia", m: "Karizma XMR · Mavrick 440" },
      { b: "Royal Enfield", m: "Classic 350 · Hunter 350" },
      { b: "Ather Electric", m: "Rizta · 450X" },
      { b: "Kinetic Honda", m: "Since 1990" },
    ],
  },
  {
    label: "Passenger cars",
    brands: [
      { b: "Maruti Suzuki Arena", m: "Swift · Brezza · Dzire" },
      { b: "Nexa", m: "Grand Vitara · Fronx · Baleno" },
    ],
  },
  {
    label: "Commercial vehicles",
    brands: [
      { b: "Tata SCV", m: "Ace · Intra" },
      { b: "Tata Commercial", m: "Signa · Ultra" },
      { b: "Maruti Commercial", m: "Super Carry" },
    ],
  },
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
              {g.brands.map(({ b, m }, i) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease }}
                  className="group grid aspect-[2/1] place-items-center border-b border-r border-dashed border-[#cfcfca] px-4 text-center transition-colors duration-500 hover:bg-x-ink"
                >
                  <span>
                    <span className="wide block text-[clamp(12px,1.1vw,16px)] !leading-[1.15] text-x-ink transition-colors duration-500 group-hover:text-white">{b}</span>
                    <span className="micro mt-2 block !text-[9px] text-x-mute transition-colors duration-500 group-hover:text-x-gold">{m}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
