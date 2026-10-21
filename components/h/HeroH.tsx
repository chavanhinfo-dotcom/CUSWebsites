"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { verticals } from "@/lib/content";
import { joinList, numberWord, statesOf, useContent } from "@/components/e/content";

// the photograph each business opens with
const PHOTO: Record<string, string> = {
  appliances: "/images/appliance-kitchen.jpg",
  "two-wheelers": "/images/bike-riders.jpg",
  cars: "/images/showroom-luxury.jpg",
  commercial: "/images/truck-street.jpg",
};
const CHAPTER_MS = 6000;
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The landing, "the arch": on midnight navy, a tall arched window in a double gold frame stands on a fine gold
 * horizon line, the four businesses passing slowly inside it, the words set either side ("Legacy," and "in
 * motion."). It rises into view inside the opening's circle. Scrolling opens the arch out to the whole screen
 * while the words part to the sides, and the line that introduces the businesses arrives over the picture.
 */
export default function HeroH() {
  const { company, districts } = useContent();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const zoom = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const closing = useRef<HTMLDivElement>(null);
  const api = useRef<{ state: { r: number; p: number }; render: () => void } | null>(null);
  const [at, setAt] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const off = onIntroDone(() => setReady(true));
    return () => void off();
  }, []);

  // the businesses take their turn in the arch
  useEffect(() => {
    if (!ready || reducedMotion()) return;
    const t = setTimeout(() => setAt((a) => (a + 1) % verticals.length), CHAPTER_MS);
    return () => clearTimeout(t);
  }, [at, ready]);

  // the arch: rising into view, then opening out to the whole screen as the page is scrolled
  useEffect(() => {
    const st = stage.current!, fr = frame.current!, m = media.current!;
    const reduce = reducedMotion();
    const state = { r: reduce ? 1 : 0, p: 0 };
    let box = { t: 0, r: 0, b: 0, l: 0, w: 0, h: 0 };
    const measure = () => {
      const a = st.getBoundingClientRect(), f = fr.getBoundingClientRect();
      box = { t: f.top - a.top, r: a.right - f.right, b: a.bottom - f.bottom, l: f.left - a.left, w: f.width, h: f.height };
    };
    const q = (s: string) => st.querySelectorAll<HTMLElement>(s);
    const render = () => {
      const p = state.p;
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const k = 1 - e;
      // (before the opening has finished, the arch is closed from the top; it rises up into place)
      const top = box.t + (1 - state.r) * box.h;
      const R = (box.w / 2) * k;
      m.style.clipPath = `inset(${top * k}px ${box.r * k}px ${box.b * k}px ${box.l * k}px round ${R}px ${R}px 0px 0px)`;
      if (zoom.current) zoom.current.style.transform = `scale(${1.16 - 0.12 * e - 0.08 * (1 - state.r)})`;
      if (shade.current) shade.current.style.opacity = String(0.1 + e * 0.55);
      const away = Math.max(0, 1 - e * 1.9);
      q(".ha-left").forEach((el) => (el.style.transform = `translate3d(${-e * 22}vw, 0, 0)`));
      q(".ha-right").forEach((el) => (el.style.transform = `translate3d(${e * 22}vw, 0, 0)`));
      q(".ha-fade").forEach((el) => {
        el.style.opacity = String(away);
        el.style.pointerEvents = away < 0.3 ? "none" : "";
      });
      if (dim.current) dim.current.style.opacity = String(Math.min(1, Math.max(0, (p - 0.4) / 0.35)));
      if (closing.current) {
        const c = Math.min(1, Math.max(0, (p - 0.55) / 0.33));
        closing.current.style.opacity = String(c);
        closing.current.style.transform = `translate3d(0, ${(1 - c) * 40}px, 0)`;
      }
    };
    api.current = { state, render };
    measure();
    render();
    if (reduce) return;
    const trigger = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        state.p = self.progress;
        render();
      },
      onRefresh: (self) => {
        measure();
        state.p = self.progress;
        render();
      },
    });
    return () => trigger.kill();
  }, []);

  // as the opening hands over: the arch rises into place, the horizon draws, the words rise
  useEffect(() => {
    const a = api.current;
    if (!ready || !a) return;
    const ctx = gsap.context(() => {
      if (a.state.r < 1) gsap.to(a.state, { r: 1, duration: 1.9, delay: 0.15, ease: "expo.inOut", onUpdate: a.render });
      gsap.fromTo(".ha-line", { scaleX: 0 }, { scaleX: 1, duration: 1.8, delay: 0.3, ease: "expo.inOut" });
      gsap.fromTo(".ha-outline", { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 1.6, delay: 0.7, ease: "expo.out" });
    }, stage);
    return () => ctx.revert();
  }, [ready]);

  const v = verticals[at];
  const rise = (d: number) => ({ initial: { y: "110%" }, animate: ready ? { y: "0%" } : { y: "110%" }, transition: { duration: 1.4, delay: d, ease } });
  const fade = (d: number) => ({ initial: { opacity: 0, y: 16 }, animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }, transition: { duration: 1.1, delay: d, ease } });

  return (
    <section id="top" ref={section} className="relative isolate h-[220vh] bg-[var(--h-night)] motion-reduce:h-auto motion-reduce:pb-10 md:motion-reduce:pb-14">
      <div ref={stage} className="sticky top-0 h-svh min-h-[500px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_55%,#14316a_0%,#0a1d40_48%,#050f26_100%)]">
        {/* the picture, seen through the arch (and, once scrolled, across the whole screen) */}
        <div ref={media} className="absolute inset-0 bg-[var(--h-night)]" style={{ clipPath: "inset(100% 0 0 0)" }}>
          <div ref={zoom} className="absolute inset-0 will-change-transform">
            {verticals.map((c, i) => (
              <img
                key={c.id}
                src={PHOTO[c.id] ?? c.image}
                alt=""
                aria-hidden={i !== at}
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: i === at ? 1 : 0, transform: `scale(${i === at ? 1.06 : 1.14})`, transition: "opacity 1.8s cubic-bezier(0.22,1,0.36,1), transform 7s cubic-bezier(0.16,1,0.3,1)" }}
              />
            ))}
          </div>
          <div ref={shade} className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,20,48,0.35),rgba(6,20,48,0.15)_40%,rgba(6,20,48,0.85))]" />
          {/* (deepens under the closing line, so it reads over any photograph) */}
          <div ref={dim} className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,20,48,0.72),rgba(6,20,48,0.5))] opacity-0" />
        </div>

        {/* the composition */}
        <div className="relative z-10 flex h-full flex-col pb-6 pt-[92px] md:pb-8 md:pt-[104px]">
          <div className="ha-fade h-wrap flex items-start justify-between gap-6">
            <motion.p {...fade(0.5)} className="h-eyebrow">
              {company.name}
            </motion.p>
            <motion.p {...fade(0.6)} className="hidden text-right text-[11px] uppercase tracking-[0.3em] text-[var(--h-pearl)]/55 sm:block">
              Est. {company.since} · {joinList(statesOf(districts))}
            </motion.p>
          </div>

          {/* (on a wide screen this stands at the foot of the screen; on a phone, in the middle of it) */}
          <div className="flex min-h-0 flex-1 flex-col justify-center lg:justify-end">
            <div className="h-wrap grid grid-cols-1 items-end justify-items-center gap-x-[clamp(20px,3vw,56px)] pt-4 lg:grid-cols-[1fr_auto_1fr]">
              <h1 className="sr-only">Legacy, in motion. {company.name}, since {company.since}.</h1>
              <span className="ha-left ha-fade hidden justify-self-end lg:block" aria-hidden>
                <span className="line-mask">
                  <motion.span {...rise(0.35)} className="h-serif inline-block text-[clamp(4.2rem,8vw,9.2rem)] leading-[1] text-[var(--h-pearl)]">
                    Legacy,
                  </motion.span>
                </span>
              </span>
  
              {/* where the arch stands (the picture beneath shows through it) */}
              <div ref={frame} className="relative h-[min(46svh,420px)] w-[min(62vw,260px)] rounded-t-full lg:aspect-[31/50] lg:h-[min(62svh,600px,calc(100svh-290px))] lg:w-auto">
                {/* (the scroll fades the wrapper; the opening brings the outlines in) */}
                <span className="ha-fade pointer-events-none absolute inset-0" aria-hidden>
                  <span className="ha-outline absolute inset-0 rounded-t-full border border-[var(--h-gold-2)]/70" />
                  <span className="ha-outline absolute -inset-[11px] rounded-t-full border border-[var(--h-gold)]/35" />
                </span>
                <div className="ha-fade absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(6,20,48,0.8)] to-transparent px-4 pb-5 pt-16 text-center">
                  <AnimatePresence mode="wait">
                    <motion.p key={at} initial={{ opacity: 0, y: 10 }} animate={{ opacity: ready ? 1 : 0, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.7, ease }} className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--h-pearl)]">
                      {v.title}
                      <span className="mt-1 block font-normal tracking-[0.24em] text-[var(--h-gold-2)]">Since {v.since}</span>
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
  
              <span className="ha-right ha-fade hidden justify-self-start lg:block" aria-hidden>
                <span className="line-mask">
                  <motion.span {...rise(0.5)} className="h-serif inline-block text-[clamp(4.2rem,8vw,9.2rem)] italic leading-[1] text-[var(--h-gold-2)]">
                    in motion.
                  </motion.span>
                </span>
              </span>
            </div>
  
            {/* the horizon the arch stands on */}
            <div className="ha-fade">
              <div className="ha-line mx-auto h-px w-full origin-center bg-[linear-gradient(90deg,transparent,rgba(228,201,143,0.7)_20%,rgba(228,201,143,0.7)_80%,transparent)]" />
            </div>
  
            {/* the words, on smaller screens */}
            <p className="ha-fade h-wrap mt-6 text-center lg:hidden" aria-hidden>
              <span className="line-mask">
                <motion.span {...rise(0.35)} className="h-serif inline-block text-[clamp(2.6rem,11vw,4.4rem)] leading-[0.95] text-[var(--h-pearl)]">
                  Legacy, <em className="text-[var(--h-gold-2)]">in motion.</em>
                </motion.span>
              </span>
            </p>
  
            {/* the businesses, each taking its turn in the arch (the current one timing itself in gold); the
                scroll fades the wrappers, the opening brings the rows in */}
            <div className="ha-fade">
              <motion.ol {...fade(0.9)} className="h-wrap mt-6 hidden grid-cols-4 gap-6 md:grid">
                {verticals.map((c, i) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setAt(i)} aria-current={i === at} className="group block w-full text-left">
                      <span className="relative block h-px overflow-hidden bg-white/15">{i === at && ready && <span key={at} className="absolute inset-0 origin-left animate-[h-bar_6s_linear_both] bg-[var(--h-gold)]" />}</span>
                      <span className="mt-3 flex items-baseline gap-3">
                        <span className="text-[10px] tracking-[0.2em] text-[var(--h-gold)]">{c.index}</span>
                        <span className={`h-serif text-[1.35rem] leading-none transition-colors duration-500 ${i === at ? "text-[var(--h-pearl)]" : "text-[var(--h-pearl)]/45 group-hover:text-[var(--h-pearl)]/80"}`}>{c.title}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ol>
              <motion.div {...fade(0.9)} className="mt-5 flex justify-center gap-2 md:hidden">
                {verticals.map((c, i) => (
                  <button key={c.id} type="button" onClick={() => setAt(i)} aria-label={`Show ${c.title}`} className="relative h-[2px] w-10 overflow-hidden bg-white/20">
                    {i === at && ready && <span key={at} className="absolute inset-0 origin-left animate-[h-bar_6s_linear_both] bg-[var(--h-gold)]" />}
                  </button>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* what the whole picture says */}
        <div ref={closing} className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center opacity-0">
          <p className="h-eyebrow">What we do</p>
          <p className="h-serif mt-6 text-[clamp(3rem,7.4vw,7.6rem)] leading-[0.95] text-[var(--h-pearl)]">
            {numberWord(verticals.length)} businesses.
            <br />
            <em className="text-[var(--h-gold-2)]">One family.</em>
          </p>
          <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.28em] text-[var(--h-pearl)]/75">
            {verticals.map((c) => (
              <span key={c.id}>{c.title}</span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
