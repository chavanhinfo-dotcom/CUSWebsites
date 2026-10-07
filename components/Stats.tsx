"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { stats } from "@/lib/content";

export default function Stats() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".stat-num").forEach((el) => {
          const end = Number(el.dataset.value);
          const obj = { v: 0 };
          el.textContent = "0";
          gsap.to(obj, {
            v: end,
            duration: 2,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => (el.textContent = String(Math.round(obj.v))),
          });
        });
        gsap.from(".stat-item", {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 85%" },
        });
        gsap.from(".stat-rule", {
          scaleX: 0,
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 85%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative bg-ink px-4 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="stat-rule mb-12 h-px origin-left bg-gradient-to-r from-gold/70 via-gold/20 to-transparent" />
        <dl className="grid grid-cols-2 gap-y-12 md:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <dd className="font-serif text-6xl font-light tabular-nums text-cream md:text-7xl">
                <span className="stat-num" data-value={s.value}>
                  {s.value}
                </span>
                <span className="text-gold">{s.suffix}</span>
              </dd>
              <dt className="mt-3 text-xs uppercase tracking-[0.25em] text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
