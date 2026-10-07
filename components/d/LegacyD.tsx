"use client";
import { motion } from "framer-motion";
import { legacy } from "@/lib/content";
import { RevealLines } from "./FeaturesD";

const ease = [0.25, 1, 0.5, 1] as const;

// Three generations as an engineered table: era | people | what they built.
export default function LegacyD() {
  return (
    <section id="legacy" className="bg-d-muted px-5 py-28 md:px-10 md:py-[160px]">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <h2 className="text-[clamp(40px,5vw,72px)] font-medium leading-none tracking-[-0.05em]">
          <RevealLines lines={["One family.", "Three generations."]} />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
          className="self-end text-[18px] leading-[1.45] text-d-sub"
        >
          Founded in 1960 by Late Mr. Ambadas U. Chavan, carried forward by experienced veterans of the trading and service industries,
          and now positioned for a future-ready transformation by the next generation.
        </motion.p>
      </div>

      <div className="mt-20 border-t border-d-text/15">
        {legacy.map((g, i) => (
          <motion.div
            key={g.generation}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, delay: i * 0.08, ease }}
            className="group grid gap-6 border-b border-d-text/15 py-10 transition-colors duration-500 hover:bg-white md:grid-cols-[220px_1fr] md:px-6"
          >
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-d-sub">{String(i + 1).padStart(2, "0")} · {g.generation}</p>
              <p className="mt-2 text-[24px] font-medium tracking-[-0.03em]">{g.era}</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {g.people.map((p) => (
                <div key={p.name} className="flex gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-d-dark text-[15px] font-semibold text-white transition-transform duration-500 group-hover:-rotate-6">
                    {p.initials}
                  </span>
                  <div>
                    <h3 className="text-[22px] font-medium leading-tight tracking-[-0.02em]">{p.name}</h3>
                    <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.06em] text-brass">{p.role}</p>
                    <p className="mt-3 text-[16px] leading-[1.45] text-d-sub">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
