"use client";
import { motion } from "framer-motion";
import { legacy } from "@/lib/content";
import { Eyebrow, Headline, ease } from "./ui";

// Three generations, set like testimonials: a monogram portrait, name and role on the left, their story large on the right.
export default function LeadershipX() {
  const people = legacy.flatMap((g) => g.people.map((p) => ({ ...p, generation: g.generation, era: g.era })));
  return (
    <section id="leadership" className="px-4 py-28 md:px-8 md:py-40">
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <Headline lines={["Led by", "three", "generations."]} grey={2} className="text-[clamp(40px,6vw,96px)]" />
        <div className="flex flex-col justify-end gap-5">
          <Eyebrow>Leadership</Eyebrow>
          <p className="max-w-md text-[17px] leading-relaxed text-x-mute">
            A vision that began with one trader in Solapur, carried forward by his sons and now by the next generation.
          </p>
        </div>
      </div>

      <div className="mt-20 border-t border-x-line">
        {people.map((p, i) => (
          <motion.article
            key={p.name}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease }}
            className="group grid gap-8 border-b border-x-line py-12 md:grid-cols-[300px_1fr] md:gap-16 md:py-16"
          >
            <div className="flex items-start gap-5">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden bg-x-ink text-white">
                <span className="wide text-[28px]">{p.initials}</span>
                <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-x-gold transition-transform duration-700 group-hover:scale-x-100" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold leading-tight">{p.name}</h3>
                <p className="micro mt-2 text-x-mute">{p.role}</p>
                <p className="micro mt-1 text-x-grey">{p.generation} · {p.era}</p>
              </div>
            </div>
            <p className="max-w-3xl text-[clamp(20px,2vw,30px)] font-medium leading-[1.3] tracking-[-0.01em]">
              <span className="text-x-grey">{String(i + 1).padStart(2, "0")} — </span>
              {p.text}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
