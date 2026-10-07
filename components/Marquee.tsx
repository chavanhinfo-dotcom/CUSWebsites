"use client";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { brands } from "@/lib/content";

// Infinite brand ribbon that speeds up with scroll velocity.
export default function Marquee() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const loop = gsap.to(".mq-track", { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = Math.min(Math.abs(self.getVelocity()) / 250, 8);
            gsap.to(loop, {
              timeScale: 1 + boost,
              duration: 0.2,
              overwrite: true,
              onComplete: () => void gsap.to(loop, { timeScale: 1, duration: 1.2, ease: "power2.out" }),
            });
          },
        });
        return () => st.kill();
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const row = [...brands, ...brands];

  return (
    <section ref={root} aria-label="Brand partners" className="relative overflow-hidden border-y border-white/10 bg-ink-2 py-8 md:py-10">
      <div className="mq-track flex w-max gap-12 whitespace-nowrap">
        {row.map((b, i) => (
          <span key={i} className="flex items-center gap-12 font-serif text-4xl font-light text-cream/80 md:text-6xl">
            <span className={i % 2 ? "italic text-gold-2" : ""}>{b}</span>
            <span className="text-2xl text-gold">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
