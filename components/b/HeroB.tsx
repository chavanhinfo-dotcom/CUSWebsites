"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { scrollToHash } from "@/lib/lenis";
import { company } from "@/lib/content";

const polaroids = [
  { src: "/images/yarn-spools.jpg", caption: "1960 · yarn", x: "4%", y: "6%", r: -8 },
  { src: "/images/appliance-fridge.jpg", caption: "appliances", x: "50%", y: "0%", r: 6 },
  { src: "/images/bike-enfield.jpg", caption: "two-wheelers", x: "0%", y: "50%", r: 5 },
  { src: "/images/hero-showroom.jpg", caption: "cars", x: "44%", y: "44%", r: -5 },
  { src: "/images/truck-rural.jpg", caption: "commercial", x: "24%", y: "26%", r: 2 },
];

export default function HeroB() {
  const root = useRef<HTMLElement>(null);
  const board = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", (self) => {
        gsap.set(".hb-word", { rotateX: -90, opacity: 0, transformOrigin: "50% 100% -40px" });
        gsap.set(".hb-fade", { opacity: 0, y: 20 });
        gsap.set(".hb-card", { y: 500, opacity: 0, rotate: (i: number) => (i % 2 ? 40 : -40) });
        gsap.set(".hb-draw", { strokeDashoffset: (_i: number, el: Element) => (el as SVGPathElement).getTotalLength() });

        const stop = onIntroDone(() => self.add(() => {
          gsap.timeline()
            .to(".hb-word", { rotateX: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.12 })
            .to(".hb-card", { y: 0, opacity: 1, rotate: (i: number) => polaroids[i].r, duration: 1.4, ease: "expo.out", stagger: 0.08 }, 0.2)
            .to(".hb-draw", { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.25 }, 0.9)
            .to(".hb-fade", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 1);
        }));

        gsap.to(".hb-board", {
          yPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hb-text", {
          yPercent: 20,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        return () => stop();
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={root} className="relative min-h-[100svh] overflow-hidden px-4 pb-16 pt-28 md:px-10 md:pt-32">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:min-h-[calc(100svh-10rem)] lg:grid-cols-[1.05fr_1fr]">
        <div className="hb-text relative z-10">
          <p className="hb-fade mb-6 inline-flex items-center gap-3 rounded-full border-[1.5px] border-navy px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brass" /> Solapur · Since {company.since}
          </p>

          <h1 className="font-display text-[clamp(4rem,11vw,10rem)] leading-[0.86] tracking-tight [perspective:800px]">
            <span className="hb-word block">Legacy.</span>
            <span className="hb-word relative inline-block italic text-brass">
              Growth.
              <svg className="pointer-events-none absolute -inset-x-[8%] -inset-y-[18%] h-[136%] w-[116%]" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden>
                <path className="hb-draw" d="M150 8 C 60 6, 8 30, 12 62 C 16 100, 120 116, 200 108 C 270 100, 296 70, 284 42 C 270 14, 190 4, 120 12" fill="none" stroke="#0b2859" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1000" />
              </svg>
            </span>
            <span className="hb-word relative block w-fit">
              Trust.
              <svg className="pointer-events-none absolute -bottom-2 left-0 h-5 w-full" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden>
                <path className="hb-draw" d="M4 12 C 80 4, 160 18, 296 6" fill="none" stroke="#c99a2e" strokeWidth="5" strokeLinecap="round" strokeDasharray="1000" />
              </svg>
            </span>
          </h1>

          <p className="hb-fade mt-8 max-w-md text-lg text-navy/75">
            {company.name}: six decades of serving Solapur, growing from a yarn trade into appliances,
            two-wheelers, cars and commercial vehicles.
          </p>

          <div className="hb-fade mt-8 flex flex-wrap items-center gap-5">
            <button
              onClick={() => scrollToHash("#journey")}
              className="group relative overflow-hidden rounded-full bg-navy px-7 py-4 font-semibold text-paper shadow-[4px_4px_0_#c99a2e] transition-transform active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span className="relative z-10">Take the journey →</span>
              <span className="absolute inset-0 origin-left scale-x-0 bg-brass transition-transform duration-500 group-hover:scale-x-100" />
            </button>
            <span className="font-hand text-2xl text-navy/70">↙ or drag the photos around</span>
          </div>
        </div>

        <div ref={board} className="hb-board relative h-[460px] md:h-[600px]">
          {polaroids.map((p, i) => (
            <motion.figure
              key={p.src}
              drag
              dragConstraints={board}
              dragElastic={0.25}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
              whileDrag={{ scale: 1.1, zIndex: 30, cursor: "grabbing" }}
              data-cursor="Drag"
              className="hb-card absolute w-[46%] cursor-grab bg-white p-2.5 pb-10 shadow-[0_18px_40px_-12px_rgba(11,40,89,0.45)] md:w-[42%] md:p-3 md:pb-12"
              style={{ left: p.x, top: p.y, zIndex: i }}
            >
              <img src={p.src} alt="" draggable={false} className="aspect-[4/3] w-full object-cover" />
              <figcaption className="absolute bottom-2 left-3 font-hand text-xl text-navy md:bottom-3 md:text-2xl">{p.caption}</figcaption>
              <span className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-[-4deg] bg-brass/40" aria-hidden />
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
