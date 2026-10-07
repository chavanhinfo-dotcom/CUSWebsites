"use client";
import { motion } from "framer-motion";
import { verticals } from "@/lib/content";
import IsoVoxel from "./IsoVoxel";

const ease = [0.25, 1, 0.5, 1] as const;

/** Lines slide up out of a mask. The parent watches the viewport (a masked child never "intersects"). */
export function RevealLines({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <motion.span
      className={`block ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span className="block" variants={{ hidden: { y: "105%" }, show: { y: 0, transition: { duration: 1.1, ease } } }}>
            {l}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

// Big statement + four columns, one per business, each with an isometric voxel icon.
export default function FeaturesD() {
  return (
    <section id="businesses" className="bg-d-bg px-5 py-28 md:px-10 md:py-[160px]">
      <h2 className="max-w-[1000px] text-[clamp(40px,5.2vw,72px)] font-medium leading-none tracking-[-0.05em]">
        <RevealLines lines={["Four businesses, one promise:", "service trusted since 1960."]} />
      </h2>

      <div className="mt-20 grid border-d-line sm:grid-cols-2 md:mt-28 lg:grid-cols-4 lg:border-l">
        {verticals.map((v, i) => (
          <motion.article
            key={v.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: i * 0.1, ease }}
            className="group border-b border-d-line px-1 pb-10 pt-6 sm:px-6 lg:border-b-0 lg:border-r"
          >
            <div className="flex h-[120px] items-end transition-transform duration-500 ease-[cubic-bezier(.25,1,.5,1)] group-hover:-translate-y-2">
              <IsoVoxel kind={v.id as "appliances"} size={v.id === "commercial" || v.id === "cars" ? 112 : 96} />
            </div>
            <p className="mt-8 text-[13px] font-medium uppercase tracking-[0.06em] text-d-sub">{v.index} · Since {v.since}</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.03em]">{v.title}</h3>
            <p className="mt-4 text-[17px] leading-[1.45] text-d-sub">{v.summary}</p>
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {v.brands.map((b) => (
                <li key={b} className="rounded-full border border-d-line px-3 py-1 text-[12px] font-medium text-d-text/80 transition-colors group-hover:border-d-text/25">
                  {b}
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
