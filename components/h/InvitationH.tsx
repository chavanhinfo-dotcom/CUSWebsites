"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useContent } from "@/components/e/content";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "@/components/e/logo";
import { Btn } from "./ui";

/**
 * The invitation: a showroom photograph across the screen, drifting slowly, and on it an ivory card (the
 * logo's own ground, so the logo shows exactly as supplied) set within a double gold rule, with where to find
 * the group and how to reach it.
 */
export default function InvitationH() {
  const { company, districts } = useContent();
  const root = useRef<HTMLElement>(null);
  const where = encodeURIComponent(company.address || `${company.name}, ${company.hq}`);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".iv-bg", { yPercent: -10, scale: 1.15 }, { yPercent: 10, scale: 1.05, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(".iv-card", { y: 80, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".iv-card", start: "top 85%" } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" ref={root} className="relative overflow-hidden bg-[var(--h-night)] px-4 py-24 md:py-36">
      <img src="/images/hero-showroom.jpg" alt="" loading="lazy" className="iv-bg absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[var(--h-night)]/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent,rgba(6,20,48,0.85))]" />

      <div className="iv-card relative mx-auto max-w-[760px] p-2.5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] md:p-3.5" style={{ backgroundColor: LOGO_GROUND }}>
        <div className="border border-[var(--h-gold)]/70 p-1">
          <div className="border border-[var(--h-gold)]/40 px-6 py-12 text-center text-[var(--h-ink)] md:px-14 md:py-16">
            <img src={LOGO_JPEG} alt={LOGO_ALT} loading="lazy" className="mx-auto h-auto w-40 md:w-48" />
            <p className="h-eyebrow h-dark mt-8 justify-center">An invitation</p>
            <h2 className="h-serif mt-4 text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.02] text-[var(--h-brand)]">
              Visit us at a showroom <span className="italic text-[var(--h-gold-deep)]">near you.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-[var(--h-ink)]/70">
              Head office in {company.address || company.hq}. Showrooms across {districts.map((d) => d.name).join(", ")}.
            </p>
            {(company.phone || company.email) && (
              <p className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] text-[var(--h-brand)]">
                {company.phone && (
                  <a href={`tel:${company.phone.replace(/[^\d+]/g, "")}`} className="underline decoration-[var(--h-gold)]/60 underline-offset-4 hover:text-[var(--h-gold-deep)]">
                    {company.phone}
                  </a>
                )}
                {company.email && (
                  <a href={`mailto:${company.email}`} className="underline decoration-[var(--h-gold)]/60 underline-offset-4 hover:text-[var(--h-gold-deep)]">
                    {company.email}
                  </a>
                )}
              </p>
            )}
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Btn href={`https://www.google.com/maps/search/?api=1&query=${where}`} tone="navy" external>
                Get directions <span aria-hidden>↗</span>
              </Btn>
              <Btn href="#showrooms" tone="light">
                Find a showroom
              </Btn>
            </div>
            <p className="h-serif mt-10 text-xl italic text-[var(--h-gold-deep)]">{company.motto}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
