"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { future } from "@/lib/content";
import SplitText from "./SplitText";

export default function Future() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Image window opens up from a small frame to full bleed
        gsap.fromTo(
          ".future-frame",
          { clipPath: "inset(18% 22% 18% 22% round 24px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 80%", end: "top top", scrub: true },
          },
        );
        gsap.fromTo(".future-img", { scale: 1.3 }, {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        });
        gsap.from(".future-word", {
          yPercent: 110,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.05,
          scrollTrigger: { trigger: ".future-heading", start: "top 75%" },
        });
        gsap.from(".future-fade", {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".future-heading", start: "top 65%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative min-h-[110svh] overflow-hidden bg-ink">
      <div className="future-frame absolute inset-0 overflow-hidden">
        <img src="/images/bike-road.jpg" alt="" className="future-img h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/60" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[110svh] max-w-[1400px] flex-col justify-center px-4 py-24 md:px-10">
        <p className="future-fade eyebrow mb-8">Looking ahead</p>
        <h2 className="future-heading max-w-5xl font-serif text-[clamp(2.6rem,7vw,6.5rem)] font-light leading-[0.98] tracking-tight">
          <SplitText text={future.heading} itemClass="future-word" />
        </h2>
        <p className="future-fade mt-10 max-w-2xl text-lg leading-relaxed text-cream/75">{future.text}</p>
        <ul className="mt-12 flex flex-wrap gap-3">
          {future.pillars.map((p) => (
            <li key={p} className="future-fade rounded-full border border-gold/50 bg-ink/30 px-6 py-3 text-sm uppercase tracking-[0.2em] text-gold-2 backdrop-blur">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
