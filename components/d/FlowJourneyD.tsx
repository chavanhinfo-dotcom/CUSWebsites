"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap, reducedMotion } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";
import { company, milestones, stopNotes } from "@/lib/content";
import { mountDiorama, type DioramaController } from "@/components/diorama/engine";

const INTRO = 0.1;
const ease = [0.25, 1, 0.5, 1] as const;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Hero headline over a monochrome 3D model of the group's journey, then a pinned
// numbered "flow" through all sixteen milestones (bottom left).
export default function FlowJourneyD() {
  const root = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const flow = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLButtonElement>(null);
  const controller = useRef<DioramaController | null>(null);
  const [active, setActive] = useState(0);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (reducedMotion()) {
      setFallback(true);
      return;
    }
    let ctl: DioramaController | null = null;
    try {
      ctl = mountDiorama({
        host: wrap.current!,
        pinEl: root.current!,
        mode: "mono",
        intro: INTRO,
        viewOffset: 0.06,
        onActive: (i) => setActive(i),
        onProgress: (p) => {
          const k = p / INTRO;
          if (hero.current) {
            hero.current.style.opacity = String(1 - smooth(0.05, 0.7, k));
            hero.current.style.transform = `translateY(${-k * 140}px)`;
          }
          if (flow.current) {
            const o = smooth(0.65, 1, k);
            flow.current.style.opacity = String(o);
            flow.current.style.transform = `translateY(${(1 - o) * 40}px)`;
            flow.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
          }
          if (cue.current) cue.current.style.visibility = k > 0.25 ? "hidden" : "visible";
          gsap.set(".fd-fill", { scaleX: p });
        },
      });
      controller.current = ctl;
    } catch {
      setFallback(true);
    }

    // Headline lines swing in from a tilted plane once the preloader is done
    const ctx = gsap.context(() => {
      gsap.set(".fd-line", { opacity: 0, rotationY: 55, rotationX: 30, xPercent: 18, transformPerspective: 1000, transformOrigin: "0% 50%" });
      gsap.set(".fd-sub", { opacity: 0, y: 20 });
    }, root);
    const stop = onIntroDone(() =>
      ctx.add(() => {
        gsap.timeline()
          .to(".fd-line", { opacity: 1, rotationY: 0, rotationX: 0, xPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.12 })
          .to(".fd-sub", { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08 }, 0.5);
      }),
    );
    return () => {
      stop();
      ctx.revert();
      ctl?.destroy();
    };
  }, []);

  const scrollOn = () => {
    const y = (root.current?.getBoundingClientRect().top ?? 0) + window.scrollY + window.innerHeight * 1.6;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  // a window of steps around the active one, like a moving index
  const from = Math.max(0, Math.min(active - 2, milestones.length - 5));
  const windowed = milestones.slice(from, from + 5).map((m, k) => ({ m, i: from + k }));

  if (fallback) {
    return (
      <section id="journey" className="bg-d-alt px-6 pb-24 pt-36 md:px-12">
        <h1 className="mx-auto max-w-4xl text-center text-[clamp(52px,8vw,96px)] font-medium leading-[0.9] tracking-[-0.06em]">Six Decades of Trust</h1>
        <ol className="mx-auto mt-16 max-w-3xl divide-y divide-d-text/10">
          {milestones.map((m, i) => (
            <li key={m.year} className="grid grid-cols-[60px_80px_1fr] gap-4 py-4">
              <span className="text-sm text-d-sub">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-medium">{m.year}</span>
              <span>{m.title}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section id="journey" ref={root} data-header="clear" className="relative h-[100svh] overflow-hidden bg-d-alt">
      <div ref={wrap} className="absolute inset-0" aria-hidden />

      {/* Hero */}
      <div ref={hero} className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-28 text-center will-change-transform md:pt-32">
        <h1 className="text-[clamp(52px,8.4vw,112px)] font-medium leading-[0.9] tracking-[-0.06em]">
          <span className="fd-line block">Six Decades</span>
          <span className="fd-line block">of Trust</span>
        </h1>
        <p className="fd-sub mt-8 text-[clamp(17px,1.6vw,22px)] font-medium">{company.motto}</p>
        <p className="fd-sub mt-1 max-w-xl text-[clamp(16px,1.4vw,20px)] leading-snug text-d-text/80">
          {company.tagline}. Serving customers across Maharashtra and Karnataka since {company.since}.
        </p>
      </div>
      <button
        ref={cue}
        onClick={scrollOn}
        className="fd-sub absolute bottom-8 left-1/2 -translate-x-1/2 border-b border-d-text pb-1 text-[13px] font-medium uppercase tracking-[0.06em]"
        style={{ opacity: 0 }}
      >
        Scroll to discover our journey
      </button>

      {/* soft fade behind the flow index for legibility */}
      <div className="pointer-events-none absolute bottom-0 left-0 hidden h-[60%] w-[55%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(217,232,241,0.96)_0%,rgba(217,232,241,0.75)_35%,rgba(217,232,241,0)_70%)] md:block" aria-hidden />

      {/* Flow index */}
      <div ref={flow} className="absolute bottom-6 left-4 right-4 opacity-0 md:bottom-12 md:left-12 md:right-auto md:w-[560px]" style={{ pointerEvents: "none" }}>
        <div className="rounded-2xl bg-d-alt/80 p-4 backdrop-blur-md md:bg-transparent md:p-0 md:backdrop-blur-none">
          <ol>
            {windowed.map(({ m, i }) => {
              const on = i === active;
              return (
                <motion.li key={m.year} layout transition={{ duration: 0.6, ease }} className="relative">
                  <button onClick={() => controller.current?.jumpTo(i)} className="grid w-full grid-cols-[48px_1fr] items-center gap-5 py-1.5 text-left md:gap-7">
                    <motion.span
                      layout
                      className={`grid place-items-center text-[14px] font-medium ${on ? "h-12 w-12 rounded-xl bg-white shadow-[0_8px_24px_-12px_rgba(5,12,34,0.4)]" : "h-8 w-12"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </motion.span>
                    <motion.span layout className={on ? "text-[clamp(20px,2vw,26px)] font-medium tracking-[-0.02em]" : "text-[15px] font-medium text-d-text/80 hover:text-d-text"}>
                      {on && <span className="mr-3 text-brass">{m.year}</span>}
                      {m.short}
                    </motion.span>
                  </button>
                  {on && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.5, ease }}
                      className="relative mb-3 ml-[23px] mt-3 border-l border-d-text/15 pl-[44px] md:pl-[52px]"
                    >
                      <motion.span
                        className="absolute -left-px top-0 w-px bg-d-text"
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 1.2, ease }}
                      />
                      <p className="text-[17px] leading-[1.45] text-d-sub md:text-[18px]">
                        <span className="text-d-text">{m.title}.</span> {stopNotes[m.category]}
                      </p>
                    </motion.div>
                  )}
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* progress, bottom right */}
      <div className="pointer-events-none absolute bottom-12 right-12 hidden w-56 items-center gap-3 text-[12px] font-medium text-d-text/70 md:flex">
        <span>{company.since}</span>
        <span className="relative h-px flex-1 bg-d-text/15">
          <span className="fd-fill absolute inset-0 origin-left scale-x-0 bg-d-text" />
        </span>
        <span>2025</span>
      </div>
    </section>
  );
}
