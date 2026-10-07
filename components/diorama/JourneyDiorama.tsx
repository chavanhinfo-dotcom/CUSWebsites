"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, reducedMotion } from "@/lib/gsap";
import { categoryMeta, milestones, type Category } from "@/lib/content";
import { mountDiorama, type DioramaController } from "./engine";

const VEHICLE_NAME: Record<Category, string> = {
  heritage: "Hand-cart of cloth",
  appliances: "Delivery van",
  "two-wheelers": "Scooter",
  cars: "Car",
  commercial: "Truck",
};

// Option C journey: a living 3D diorama where a day passes from 1960 (dawn) to 2025 (dusk).
export default function JourneyDiorama() {
  const root = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const controller = useRef<DioramaController | null>(null);
  const [active, setActive] = useState(0);
  const [tod, setTod] = useState("Dawn");
  const [fallback, setFallback] = useState(false);
  const listWrap = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(420);

  useEffect(() => {
    const el = listWrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPanelH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);

  useEffect(() => {
    if (reducedMotion()) {
      setFallback(true);
      return;
    }
    try {
      const ctl = mountDiorama({
        host: wrap.current!,
        pinEl: root.current!,
        mode: "cycle",
        viewOffset: 0.13,
        onActive: (i, label) => {
          setActive(i);
          setTod(label);
        },
        onProgress: (p) => gsap.set(".jd-fill", { scaleX: p }),
      });
      controller.current = ctl;
      return () => ctl.destroy();
    } catch {
      setFallback(true);
    }
  }, []);

  const jumpTo = (i: number) => controller.current?.jumpTo(i);

  const m = milestones[active];
  const ITEM = 46;
  const OPEN = 190;

  if (fallback) {
    return (
      <section id="journey" className="bg-ink px-4 py-24 md:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Our journey</p>
          <h2 className="mt-3 font-serif text-5xl font-light md:text-7xl">Six decades <em className="text-gold-2">on the road</em></h2>
          <ol className="mt-12 space-y-6 border-l-2 border-gold/40 pl-6">
            {milestones.map((x) => (
              <li key={x.year}>
                <span className="font-serif text-3xl text-gold-2">{x.year}</span>
                <p className="mt-1 text-cream/80">{x.title}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section id="journey" ref={root} className="relative h-[100svh] overflow-hidden bg-ink text-cream">
      <div ref={wrap} className="absolute inset-0" aria-hidden />

      {/* tilt-shift miniature blur + readability gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] backdrop-blur-[3px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%] backdrop-blur-[3px] [mask-image:linear-gradient(to_top,black,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/70 to-transparent md:hidden" aria-hidden />

      {/* Flow panel (desktop) */}
      <div className="absolute bottom-6 left-6 top-24 hidden w-[380px] flex-col rounded-[28px] border border-white/10 bg-ink/80 px-8 pb-6 pt-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl md:flex">
        <p className="eyebrow">Our journey</p>
        <h2 className="mt-3 font-serif text-5xl font-light leading-[1.02] tracking-tight">
          Six decades <em className="text-gold-2">on the road</em>
        </h2>
        <div ref={listWrap} className="relative mt-8 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]">
          <motion.ol
            className="relative"
            animate={{ y: panelH / 2 - (active * ITEM + OPEN / 2) }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            <span className="absolute bottom-0 left-[13px] top-0 w-px bg-white/15" aria-hidden />
            <motion.span
              className="absolute left-[13px] top-0 w-px origin-top bg-gold"
              animate={{ height: active * ITEM + 14 }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
              aria-hidden
            />
            {milestones.map((x, i) => {
              const on = i === active;
              return (
                <li key={x.year} style={{ height: on ? OPEN : ITEM }} className="relative transition-[height] duration-500">
                  <button onClick={() => jumpTo(i)} className="group flex w-full items-start gap-4 text-left" aria-label={`Go to ${x.year}: ${x.title}`}>
                    <span className={`relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition-colors duration-300 ${
                      on ? "border-gold bg-gold text-ink" : i < active ? "border-gold/60 bg-ink text-gold" : "border-white/25 bg-ink text-cream/50 group-hover:text-cream"
                    }`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm transition-colors ${on ? "text-cream" : "text-cream/45 group-hover:text-cream/80"}`}>
                        <span className={`mr-2 font-serif ${on ? "text-gold-2" : ""}`}>{x.year}</span>
                        {x.short}
                      </span>
                      <AnimatePresence>
                        {on && (
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                            className="mt-3 flex gap-3"
                          >
                            {x.image && <img src={x.image} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />}
                            <span>
                              <span className="block font-serif text-4xl font-light leading-none text-gold-2">{x.year}</span>
                              <span className="mt-2 block text-sm leading-snug text-cream/80">{x.title}</span>
                              <span className="mt-2 inline-block rounded-full bg-gold px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink">
                                {categoryMeta[x.category].label}
                              </span>
                            </span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ol>
        </div>
      </div>

      {/* Mobile header + card */}
      <div className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-24 md:hidden">
        <p className="eyebrow">Our journey</p>
        <h2 className="mt-2 font-serif text-4xl font-light leading-none">Six decades <em className="text-gold-2">on the road</em></h2>
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-6 md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={m.year}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            className="flex gap-3 rounded-2xl border border-gold/30 bg-ink/85 p-3 backdrop-blur-md"
          >
            {m.image && <img src={m.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />}
            <div>
              <p className="font-serif text-3xl font-light leading-none text-gold-2">{m.year}</p>
              <p className="mt-1 text-sm text-cream/85">{m.title}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-cream/45">Stop {active + 1} of {milestones.length}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom-right: time of day + progress */}
      <div className="pointer-events-none absolute bottom-6 right-6 hidden w-[360px] rounded-2xl border border-white/10 bg-ink/80 px-5 py-4 backdrop-blur-xl md:block">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cream/60">Now driving</p>
            <p className="font-serif text-xl">{VEHICLE_NAME[m.category]}</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={tod}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-full border border-white/20 bg-ink/60 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold-2 backdrop-blur"
            >
              {tod === "Dusk" ? "☾" : "☀"} {tod}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-cream/70">
          <span>1960</span>
          <span className="relative h-[2px] flex-1 bg-white/20">
            <span className="jd-fill absolute inset-0 origin-left scale-x-0 bg-gold" />
          </span>
          <span>2025</span>
        </div>
      </div>
    </section>
  );
}
