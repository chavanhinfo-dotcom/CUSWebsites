"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { legacy } from "@/lib/content";

export default function Legacy() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".legacy-title .line-mask > span", {
          yPercent: 110,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".legacy-title", start: "top 80%" },
        });
        // The lineage thread draws as you scroll
        gsap.fromTo(
          ".legacy-thread",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: ".legacy-tree", start: "top 70%", end: "bottom 70%", scrub: true },
          },
        );
        gsap.utils.toArray<HTMLElement>(".legacy-gen").forEach((gen) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: gen, start: "top 75%" } });
          tl.from(gen.querySelector(".legacy-node"), { scale: 0, duration: 0.6, ease: "back.out(2)" })
            .from(gen.querySelectorAll(".legacy-meta"), { x: -30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from(gen.querySelectorAll(".legacy-card"), { y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12 }, "-=0.6")
            .from(gen.querySelectorAll(".legacy-avatar"), { rotate: -90, scale: 0.4, duration: 1, ease: "expo.out", stagger: 0.12 }, "<");
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="legacy" ref={root} className="relative overflow-hidden bg-ink px-4 py-24 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <p className="eyebrow mb-6">Our legacy</p>
        <h2 className="legacy-title max-w-4xl font-serif text-[clamp(2.4rem,6vw,5.5rem)] font-light leading-[1] tracking-tight">
          <span className="line-mask"><span className="inline-block">One vision,</span></span>{" "}
          <span className="line-mask"><span className="inline-block italic text-gold-2">three generations.</span></span>
        </h2>

        <div className="legacy-tree relative mt-20 md:mt-28">
          <div className="absolute bottom-0 left-[15px] top-0 w-px bg-white/10 md:left-[calc(25%+15px)]">
            <div className="legacy-thread h-full w-full origin-top bg-gradient-to-b from-gold via-gold-2 to-gold/20" />
          </div>

          <div className="space-y-20 md:space-y-28">
            {legacy.map((gen) => (
              <div key={gen.generation} className="legacy-gen relative grid gap-8 pl-12 md:grid-cols-4 md:pl-0">
                <div className="legacy-meta md:pr-16 md:text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">{gen.generation}</p>
                  <p className="mt-2 font-serif text-3xl text-gold-2 md:text-4xl">{gen.era}</p>
                </div>
                <span className="legacy-node absolute left-[8px] top-2 h-4 w-4 rounded-full border-2 border-gold bg-ink md:left-[calc(25%+8px)]" />
                <div className={`grid gap-6 md:col-span-3 md:pl-16 ${gen.people.length > 1 ? "md:grid-cols-2" : "md:max-w-2xl"}`}>
                  {gen.people.map((p) => (
                    <article
                      key={p.name}
                      className="legacy-card group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-2 p-7 transition-colors duration-500 hover:border-gold/40 md:p-9"
                    >
                      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gold/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
                      <div className="flex items-center gap-5">
                        <span className="legacy-avatar grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-2 to-gold font-serif text-xl text-ink">
                          {p.initials}
                        </span>
                        <div>
                          <h3 className="font-serif text-2xl leading-tight">{p.name}</h3>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold">{p.role}</p>
                        </div>
                      </div>
                      <p className="mt-6 leading-relaxed text-cream/70">{p.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
