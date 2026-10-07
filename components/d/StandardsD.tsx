"use client";
import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate, useScroll, useTransform } from "framer-motion";
import { about, stats } from "@/lib/content";
import { scrollToHash } from "@/lib/lenis";
import { RevealLines } from "./FeaturesD";

const ease = [0.25, 1, 0.5, 1] as const;

function Count({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration: 1.8, ease });
    const un = mv.on("change", (v) => ref.current && (ref.current.textContent = String(Math.round(v))));
    return () => { c.stop(); un(); };
  }, [inView, mv, to]);
  return <span ref={ref}>{to}</span>;
}

// Photo + statement (the "standards" block), followed by the numbers row.
export default function StandardsD() {
  const img = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: img, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section className="bg-d-bg px-5 pb-28 md:px-10 md:pb-[160px]">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <motion.div
          ref={img}
          initial={{ clipPath: "inset(12% 12% 12% 12% round 12px)", opacity: 0.4 }}
          whileInView={{ clipPath: "inset(0% 0% 0% 0% round 12px)", opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.4, ease }}
          className="aspect-[4/3] overflow-hidden rounded-xl"
        >
          <motion.img src="/images/showroom-luxury.jpg" alt="Showroom floor with cars and scooters" style={{ y, scale: 1.18 }} className="h-full w-full object-cover" />
        </motion.div>
        <div>
          <h2 className="text-[clamp(40px,5vw,72px)] font-medium leading-none tracking-[-0.05em]">
            <RevealLines lines={["Six decades of", "service across", "every showroom."]} />
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="mt-10 max-w-xl text-[18px] leading-[1.45] text-d-sub"
          >
            {about.lead} {about.closing}
          </motion.p>
          <button
            onClick={() => scrollToHash("#presence")}
            className="group mt-10 inline-flex h-12 items-center gap-3 overflow-hidden rounded-full bg-d-dark px-6 text-[13px] font-semibold uppercase tracking-[0.04em] text-white"
          >
            Explore our presence
            <span className="relative block h-4 w-4 overflow-hidden">
              <span className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(.25,1,.5,1)] group-hover:translate-x-full">→</span>
              <span className="absolute inset-0 -translate-x-full text-brass transition-transform duration-500 ease-[cubic-bezier(.25,1,.5,1)] group-hover:translate-x-0">→</span>
            </span>
          </button>
        </div>
      </div>

      <dl className="mt-28 grid grid-cols-2 border-t border-d-line md:mt-40 md:grid-cols-5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.08, ease }}
            className="border-b border-d-line py-8 pr-4 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"
          >
            <dd className="text-[clamp(56px,6vw,96px)] font-medium leading-none tracking-[-0.06em]">
              <Count to={s.value} />
              <span className="text-brass">{s.suffix}</span>
            </dd>
            <dt className="mt-3 text-[13px] font-medium uppercase tracking-[0.06em] text-d-sub">{s.label}</dt>
          </motion.div>
        ))}
      </dl>
    </section>
  );
}
