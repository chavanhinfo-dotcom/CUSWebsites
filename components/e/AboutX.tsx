"use client";
import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useScroll, useTransform } from "framer-motion";
import { about, milestones, stats } from "@/lib/content";
import { Eyebrow, Pill, ScrubText, ease } from "./ui";

function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration: 2, ease });
    const un = mv.on("change", (v) => ref.current && (ref.current.textContent = `${Math.round(v).toLocaleString("en-IN")}${suffix}`));
    return () => { c.stop(); un(); };
  }, [inView, mv, to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

// The horizon glow carries the black hero into the white page, then the statement and the numbers.
export default function AboutX() {
  const thumb = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: thumb, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const figures = [
    { value: stats[0].value, suffix: "+", label: "Years of trust" },
    { value: milestones.length, suffix: "", label: "Milestones since 1960" },
    { value: stats[2].value, suffix: "+", label: "Brand partnerships" },
    { value: stats[4].value, suffix: "", label: "Districts served" },
  ];

  return (
    <>
      <section id="about" className="relative bg-x-white px-4 pb-28 pt-24 md:px-8 md:pb-40 md:pt-32">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <motion.div
              ref={thumb}
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              whileInView={{ clipPath: "inset(0 0% 0 0)" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease }}
              className="mb-8 h-28 w-44 overflow-hidden md:h-32 md:w-52"
            >
              <motion.img src="/images/bike-road.jpg" alt="" style={{ y, scale: 1.3 }} className="h-full w-full object-cover" />
            </motion.div>
            <h2 className="wide text-[clamp(40px,6vw,96px)]">
              <span className="block text-x-grey">We build trust.</span>
              <span className="block text-x-grey">We move people.</span>
              <span className="block">We own the</span>
              <span className="block">journey.</span>
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-8">
            <Eyebrow>About the group</Eyebrow>
            <ScrubText text={about.lead} className="text-[clamp(18px,1.5vw,22px)] font-medium leading-[1.45]" />
            <p className="text-[15px] leading-relaxed text-x-mute">{about.closing}</p>
            <div>
              <Pill href="#leadership">Our leadership</Pill>
            </div>
          </div>
        </div>

        <div className="mt-28 grid gap-x-10 md:mt-40 md:grid-cols-[1fr_1.4fr]">
          <p className="micro mb-10 text-x-mute md:mb-0 md:pt-6">From one trading shop, clarity emerges</p>
          <dl className="border-t border-x-line">
            {figures.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.9, delay: i * 0.05, ease }}
                className="flex items-end justify-between gap-6 border-b border-x-line py-6 md:py-8"
              >
                <dd className="wide text-[clamp(64px,9vw,150px)] !leading-[0.85] tabular-nums">
                  <Count to={f.value} suffix={f.suffix} />
                </dd>
                <dt className="micro max-w-[140px] pb-2 text-right text-x-mute">{f.label}</dt>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
