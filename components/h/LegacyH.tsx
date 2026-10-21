"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { initialsOf, numberWord, safeUrl, useContent, type Leader } from "@/components/e/content";

// an arched portrait (or the person's monogram until a photograph is added)
function Arch({ p }: { p: Leader }) {
  const src = safeUrl(p.photo);
  const [failed, setFailed] = useState(false);
  return (
    <div className="lg-arch relative aspect-[3/4] overflow-hidden rounded-t-full bg-[var(--h-brand)]">
      {src && !failed ? (
        <img src={src} alt={p.name} onError={() => setFailed(true)} className="lg-img absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="lg-img h-serif absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_30%,#163a7a,var(--h-brand)_55%,#041a3d)] text-[clamp(3rem,6vw,5rem)] italic text-[var(--h-gold-2)]" aria-hidden>
          {p.initials || initialsOf(p.name)}
        </span>
      )}
      <span className="pointer-events-none absolute inset-2.5 rounded-t-full border border-[var(--h-gold-2)]/45" aria-hidden />
    </div>
  );
}

/**
 * The family that leads the group, in arched frames, one generation after another along a gold line that
 * draws itself across as the section is read; each portrait opens from below as it arrives.
 */
export default function LegacyH() {
  const { leadership, company } = useContent();
  const root = useRef<HTMLElement>(null);
  const key = leadership.map((g) => g.generation + g.people.length).join("|");

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".lg-head > *", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".lg-head", start: "top 85%" } });
        gsap.fromTo(".lg-line", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".lg-tree", start: "top 80%", end: "top 25%", scrub: true } });
        gsap.utils.toArray<HTMLElement>(".lg-person").forEach((el, i) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
          tl.fromTo(el.querySelector(".lg-arch"), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.5, ease: "expo.inOut", delay: (i % 4) * 0.08 })
            .fromTo(el.querySelector(".lg-img"), { scale: 1.3 }, { scale: 1, duration: 2, ease: "expo.out" }, "<")
            .from(el.querySelectorAll(".lg-text > *"), { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.07 }, "-=1.2");
        });
        gsap.from(".lg-node", { scale: 0, duration: 0.7, ease: "back.out(2.5)", stagger: 0.15, scrollTrigger: { trigger: ".lg-tree", start: "top 70%" } });
      });
    }, root);
    return () => ctx.revert();
  }, [key]);

  return (
    <section id="legacy" ref={root} className="bg-[var(--h-pearl)] py-24 text-[var(--h-ink)] md:py-36">
      <div className="h-wrap">
        <div className="lg-head grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <p className="h-eyebrow h-dark">Our legacy</p>
            <h2 className="h-serif mt-5 text-[clamp(2.6rem,5vw,4.8rem)] leading-[1] text-[var(--h-brand)]">
              {numberWord(leadership.length)} generations. <span className="italic text-[var(--h-gold-deep)]">One name.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--h-mute)] md:justify-self-end md:text-[16px]">
            Led by the Chavan family since {company.since}, each generation building on the trust the last one earned.
          </p>
        </div>

        <div className="lg-tree relative mt-16 md:mt-24">
          <span className="lg-line absolute inset-x-0 top-[7px] hidden h-px origin-left bg-gradient-to-r from-[var(--h-gold-deep)] via-[var(--h-gold)] to-[var(--h-gold-deep)]/30 lg:block" aria-hidden />
          {/* (one column per person across the generations, so every arch is the same size) */}
          <div
            className="flex flex-col gap-16 lg:grid lg:grid-cols-[repeat(var(--people),minmax(0,1fr))] lg:gap-8"
            style={{ ["--people" as string]: leadership.reduce((n, g) => n + g.people.length, 0) }}
          >
            {leadership.map((g) => (
              <div key={g.generation} className="min-w-0" style={{ gridColumn: `span ${g.people.length}` }}>
                <div className="relative lg:pt-8">
                  <span className="lg-node absolute left-0 top-0 hidden h-[15px] w-[15px] rounded-full border-2 border-[var(--h-gold)] bg-[var(--h-pearl)] lg:block" aria-hidden />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--h-mute)]">{g.generation}</p>
                  <p className="h-serif mt-1 text-[1.6rem] italic text-[var(--h-gold-deep)]">{g.era}</p>
                </div>
                <div className="mt-7 grid gap-6 lg:gap-8" style={{ gridTemplateColumns: `repeat(${g.people.length}, minmax(0, 1fr))` }}>
                  {g.people.map((p) => (
                    <article key={p.name} className={`lg-person ${g.people.length === 1 ? "max-w-[300px] lg:max-w-none" : ""}`}>
                      <Arch p={p} />
                      <div className="lg-text mt-6">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--h-gold-deep)]">{p.role}</p>
                        <h3 className="h-serif mt-2 text-[clamp(1.5rem,2vw,1.9rem)] leading-tight text-[var(--h-brand)]">{p.name}</h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-[var(--h-ink)]/70">{p.text}</p>
                      </div>
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
