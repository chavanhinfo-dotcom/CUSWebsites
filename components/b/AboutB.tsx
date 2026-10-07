"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { about, stats } from "@/lib/content";

// Phrases get a highlighter swipe as you scroll; numbers roll like an odometer.
const highlights = ["fastest-growing", "most diversified", "more than six decades", "small yarn trading business", "multi-sector enterprise"];

function marked(text: string) {
  const parts: (string | { h: string })[] = [];
  let rest = text;
  while (rest) {
    let idx = -1, hit = "";
    for (const h of highlights) {
      const i = rest.indexOf(h);
      if (i >= 0 && (idx < 0 || i < idx)) { idx = i; hit = h; }
    }
    if (idx < 0) { parts.push(rest); break; }
    parts.push(rest.slice(0, idx), { h: hit });
    rest = rest.slice(idx + hit.length);
  }
  return parts;
}

function Odometer({ value, suffix }: { value: number; suffix: string }) {
  const digits = String(value).split("");
  return (
    <span className="inline-flex font-display text-7xl leading-none md:text-8xl" aria-label={`${value}${suffix}`}>
      {digits.map((d, i) => (
        <span key={i} className="relative inline-block h-[1em] overflow-hidden" aria-hidden>
          <span className="odo-col flex flex-col" data-digit={d}>
            {Array.from({ length: 10 }, (_, n) => <span key={n} className="h-[1em]">{n}</span>)}
          </span>
        </span>
      ))}
      <span className="text-brass" aria-hidden>{suffix}</span>
    </span>
  );
}

export default function AboutB() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".marker").forEach((el) => {
          gsap.to(el, {
            "--mk": "100%",
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 80%", end: "top 55%", scrub: true },
          });
        });
        gsap.utils.toArray<HTMLElement>(".ab-photo").forEach((el, i) => {
          gsap.fromTo(el, { clipPath: "circle(0% at 50% 50%)", rotate: i ? 6 : -6 }, {
            clipPath: "circle(75% at 50% 50%)",
            rotate: i ? 2 : -3,
            duration: 1.6,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });
        gsap.utils.toArray<HTMLElement>(".odo-col").forEach((col, i) => {
          gsap.fromTo(col, { yPercent: 0 }, {
            yPercent: -10 * Number(col.dataset.digit),
            duration: 2 + i * 0.25,
            ease: "power4.out",
            scrollTrigger: { trigger: col, start: "top 90%" },
          });
        });
        gsap.from(".ab-stat", {
          y: 50,
          opacity: 0,
          rotate: (i: number) => (i % 2 ? 3 : -3),
          duration: 1,
          ease: "back.out(1.6)",
          stagger: 0.08,
          scrollTrigger: { trigger: ".ab-stats", start: "top 85%" },
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".marker", { "--mk": "100%" });
        gsap.utils.toArray<HTMLElement>(".odo-col").forEach((col) => gsap.set(col, { yPercent: -10 * Number(col.dataset.digit) }));
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={root} className="relative px-4 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="font-hand text-3xl text-brass">About us</p>
            <p className="mt-2 max-w-[240px] font-hand text-xl leading-tight text-navy/60">
              From one shop in Solapur to four businesses across two states.
            </p>
          </div>
          <div>
            <p className="font-display text-[clamp(2rem,4.2vw,3.8rem)] leading-[1.12]">
              {marked(about.lead).map((p, i) =>
                typeof p === "string" ? <span key={i}>{p}</span> : <span key={i} className="marker">{p.h}</span>,
              )}
            </p>

            <div className="mt-16 grid gap-8 sm:grid-cols-2">
              <figure className="ab-photo bg-white p-3 pb-12 shadow-[0_20px_40px_-15px_rgba(11,40,89,0.4)]">
                <img src="/images/yarn-threads.jpg" alt="Spools of thread" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="mt-3 font-hand text-2xl">where it began: yarn & long cloth</figcaption>
              </figure>
              <figure className="ab-photo bg-white p-3 pb-12 shadow-[0_20px_40px_-15px_rgba(11,40,89,0.4)] sm:mt-16">
                <img src="/images/showroom-luxury.jpg" alt="Vehicle showroom" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="mt-3 font-hand text-2xl">today: showrooms & service</figcaption>
              </figure>
            </div>

            <p className="mt-16 max-w-2xl border-l-4 border-brass pl-6 font-display text-3xl italic leading-snug">{about.closing}</p>
          </div>
        </div>

        <div className="ab-stats mt-24 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="ab-stat sketch-border bg-paper p-6 md:p-7">
              <Odometer value={s.value} suffix={s.suffix} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-navy/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
