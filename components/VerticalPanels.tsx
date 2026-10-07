"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { verticals } from "@/lib/content";

type Theme = "paper" | "ink";

const UI = {
  paper: {
    section: "",
    kicker: "font-hand text-3xl text-brass",
    title: "font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-none",
    heading: <>Four ways we serve</>,
    hint: "font-hand text-2xl text-navy/60",
    panel: "rounded-[28px] border-[1.5px] border-navy",
    shadeOpen: "bg-gradient-to-t from-navy via-navy/40 to-transparent",
    shadeShut: "bg-navy/75",
    text: "text-paper",
    index: "font-hand text-3xl text-brass",
    meta: "font-hand text-2xl text-brass",
    name: "font-display text-5xl leading-none md:text-7xl",
    shutName: "font-display text-3xl md:text-4xl",
    body: "text-paper/85",
    chip: "bg-paper text-navy",
  },
  ink: {
    section: "bg-ink",
    kicker: "eyebrow mb-6 block",
    title: "font-serif font-light text-[clamp(2.4rem,6vw,5.5rem)] leading-[1] tracking-tight",
    heading: <>Four sectors. <span className="italic text-gold-2">One promise.</span></>,
    hint: "text-sm text-cream/50",
    panel: "rounded-3xl border border-white/10",
    shadeOpen: "bg-gradient-to-t from-ink via-ink/45 to-ink/5",
    shadeShut: "bg-ink/80",
    text: "text-cream",
    index: "font-serif text-3xl font-light text-gold",
    meta: "eyebrow",
    name: "font-serif font-light text-5xl leading-none tracking-tight md:text-7xl",
    shutName: "font-serif font-light text-3xl md:text-4xl",
    body: "text-cream/75",
    chip: "border border-white/15 bg-white/10 text-cream backdrop-blur-md",
  },
} as const;

// Expanding panels: hover (desktop) or tap (mobile) opens a business.
export default function VerticalPanels({ theme = "paper" }: { theme?: Theme }) {
  const ui = UI[theme];
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".vp-panel", {
          y: 120, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.1,
          scrollTrigger: { trigger: ".vp-row", start: "top 80%" },
        });
        gsap.from(".vp-head > *", {
          y: 50, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: ".vp-head", start: "top 85%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="businesses" ref={root} className={`relative px-4 py-24 md:px-10 md:py-32 ${ui.section}`}>
      <div className="mx-auto max-w-[1400px]">
        <div className="vp-head mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className={ui.kicker}>Our business verticals</p>
            <h2 className={ui.title}>{ui.heading}</h2>
          </div>
          <p className={ui.hint}>Hover or tap a panel to open it</p>
        </div>

        <div className="vp-row flex flex-col gap-3 md:h-[72vh] md:min-h-[540px] md:flex-row">
          {verticals.map((v, i) => {
            const isOpen = open === i;
            return (
              <article
                key={v.id}
                onMouseEnter={() => setOpen(i)}
                onClick={() => setOpen(i)}
                data-cursor={isOpen ? "" : "Open"}
                className={`vp-panel group relative cursor-pointer overflow-hidden transition-[flex-grow,height] duration-700 ease-[cubic-bezier(.22,1,.36,1)] md:basis-0 ${ui.panel} ${
                  isOpen ? "h-[480px] md:h-auto md:grow-[4]" : "h-24 md:h-auto md:grow"
                }`}
              >
                <img
                  src={v.image}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${isOpen ? "scale-100 grayscale-0" : "scale-110 grayscale"}`}
                />
                <div className={`absolute inset-0 transition-colors duration-700 ${isOpen ? ui.shadeOpen : ui.shadeShut}`} />

                <div className={`absolute inset-0 flex items-center gap-4 px-6 transition-opacity duration-300 md:flex-col md:justify-between md:px-0 md:py-8 ${ui.text} ${isOpen ? "opacity-0" : "opacity-100"}`}>
                  <span className={ui.index}>{v.index}</span>
                  <span className={`md:rotate-180 md:[writing-mode:vertical-rl] ${ui.shutName}`}>{v.title}</span>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={`absolute inset-x-0 bottom-0 p-6 md:p-10 ${ui.text}`}
                    >
                      <p className={`mb-3 ${ui.meta}`}>{v.index} · Since {v.since}</p>
                      <h3 className={ui.name}>{v.title}</h3>
                      <p className={`mt-4 max-w-lg ${ui.body}`}>{v.summary}</p>
                      <ul className="mt-6 flex flex-wrap gap-2">
                        {v.brands.map((b, j) => (
                          <motion.li
                            key={b}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + j * 0.07, type: "spring", stiffness: 300, damping: 18 }}
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${ui.chip}`}
                          >
                            {b}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
