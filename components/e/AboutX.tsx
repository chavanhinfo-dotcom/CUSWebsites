"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { about, company, milestones, stats } from "@/lib/content";
import { Eyebrow, Pill, ScrubText, ease } from "./ui";

const figures = [
  { value: stats[0].value, suffix: "+", label: "Years of trust" },
  { value: milestones.length, suffix: "", label: "Milestones since 1960" },
  { value: stats[2].value, suffix: "+", label: "Brand partnerships" },
  { value: stats[4].value, suffix: "", label: "Districts served" },
];

// Straight out of the highway's closing cloud: the statement, then the group's numbers.
export default function AboutX() {
  const thumb = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: thumb, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <>
      {/* compact: statement, story and numbers fit about one screen */}
      <section id="about" className="relative bg-x-white px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
          <h2 className="wide text-[clamp(32px,3.7vw,64px)] lg:whitespace-nowrap">
            <span className="block text-x-grey">We build trust.</span>
            <span className="block text-x-grey">We move people.</span>
            <span className="block">We own the</span>
            <span className="block">journey.</span>
          </h2>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <motion.div
                ref={thumb}
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease }}
                className="h-14 w-24 shrink-0 overflow-hidden rounded-md md:h-16 md:w-28"
              >
                <motion.img src="/images/bike-road.jpg" alt="" loading="lazy" decoding="async" style={{ y, scale: 1.3 }} className="h-full w-full object-cover" />
              </motion.div>
              <Eyebrow>About the group</Eyebrow>
            </div>
            <ScrubText text={about.lead} className="text-[clamp(16px,1.25vw,19px)] font-medium leading-[1.5]" />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-sm text-[14px] leading-relaxed text-x-mute">{about.closing}</p>
              <Pill href="#leadership">Our leadership</Pill>
            </div>
          </div>
        </div>

        {/* the group in four numbers */}
        <div className="mt-12 md:mt-16">
          <p className="micro mb-4 text-x-gold">Since {company.since} · {company.hq}</p>
          <dl className="grid grid-cols-2 border-y border-x-line md:grid-cols-4">
            {figures.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.8, delay: i * 0.08, ease }}
                className={`flex flex-col gap-2 px-4 py-5 md:flex-row md:items-end md:justify-between md:gap-3 md:px-6 md:py-6 ${i % 2 ? "border-l border-x-line" : ""} ${i === 2 ? "md:border-l md:border-x-line" : ""} ${i < 2 ? "border-b border-x-line md:border-b-0" : ""}`}
              >
                <dd className="wide text-[clamp(36px,3.6vw,60px)] !leading-[0.85] tabular-nums">
                  {f.value}
                  <span className="text-x-gold">{f.suffix}</span>
                </dd>
                <dt className="micro text-x-mute md:max-w-[96px] md:text-right">{f.label}</dt>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
