"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { legacy } from "@/lib/content";

// A hand-drawn family tree: branches ink themselves in as you scroll.
const people = legacy.flatMap((g) => g.people.map((p) => ({ ...p, generation: g.generation, era: g.era })));
// Desktop positions (% of the tree box): founder top, two sons middle, next generation bottom
const pos = [
  { x: 50, y: 0 },
  { x: 20, y: 34 },
  { x: 80, y: 34 },
  { x: 50, y: 70 },
];

export default function LegacyB() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".lb-title > *", {
          y: 60, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1,
          scrollTrigger: { trigger: ".lb-title", start: "top 80%" },
        });
        gsap.utils.toArray<SVGPathElement>(".lb-branch").forEach((p) => {
          const len = p.getTotalLength();
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: { trigger: ".lb-tree", start: "top 65%", end: "bottom 75%", scrub: true },
          });
        });
        gsap.utils.toArray<HTMLElement>(".lb-card").forEach((card, i) => {
          gsap.from(card, {
            scale: 0.6, opacity: 0, rotate: i % 2 ? 10 : -10,
            duration: 1, ease: "back.out(1.8)",
            scrollTrigger: { trigger: card, start: "top 85%" },
          });
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const card = (p: (typeof people)[number], i: number) => (
    <article key={p.name} className={`lb-card relative w-[270px] max-w-full bg-white p-4 shadow-[0_18px_40px_-15px_rgba(11,40,89,0.45)] ${i % 2 ? "rotate-2" : "-rotate-2"}`}>
      <span className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-3 bg-brass/40" aria-hidden />
      <div className="grid aspect-[5/4] place-items-center bg-[repeating-linear-gradient(-45deg,#ebe3d3_0_6px,#f6f1e7_6px_12px)]">
        <span className="font-display text-6xl text-navy">{p.initials}</span>
      </div>
      <p className="mt-3 font-hand text-xl text-brass">{p.generation} · {p.era}</p>
      <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy/70">{p.text}</p>
    </article>
  );

  return (
    <section id="legacy" ref={root} className="relative bg-paper-2/60 px-4 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <div className="lb-title text-center">
          <p className="font-hand text-3xl text-brass">Our legacy</p>
          <h2 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-none">The Chavan family tree</h2>
          <p className="mx-auto mt-4 max-w-xl text-navy/70">
            Founded in 1960 by Late Mr. Ambadas U. Chavan; carried forward by his sons; now led into the future by the next generation.
          </p>
        </div>

        {/* Desktop tree */}
        <div className="lb-tree relative mt-16 hidden h-[1500px] md:block">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path className="lb-branch" d="M50 25 C 50 31, 20 28, 20 34" fill="none" stroke="#0b2859" strokeWidth="0.2" strokeLinecap="round" />
            <path className="lb-branch" d="M50 25 C 50 31, 80 28, 80 34" fill="none" stroke="#0b2859" strokeWidth="0.2" strokeLinecap="round" />
            <path className="lb-branch" d="M20 60 C 20 67, 50 64, 50 70" fill="none" stroke="#c99a2e" strokeWidth="0.3" strokeLinecap="round" />
          </svg>
          {people.map((p, i) => (
            <div key={p.name} className="absolute flex -translate-x-1/2 justify-center" style={{ left: `${pos[i].x}%`, top: `${pos[i].y}%` }}>
              {card(p, i)}
            </div>
          ))}
          <p className="absolute left-[27%] top-[66%] font-hand text-2xl text-brass">father → son</p>
        </div>

        {/* Mobile list */}
        <div className="mt-14 flex flex-col items-center gap-12 md:hidden">
          {people.map((p, i) => card(p, i))}
        </div>
      </div>
    </section>
  );
}
