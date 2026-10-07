"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { company, navLinks, presence, verticals } from "@/lib/content";
import { scrollToHash } from "@/lib/lenis";

export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".ft-char", {
          yPercent: 100,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.03,
          scrollTrigger: { trigger: ".ft-word", start: "top 95%" },
        });
        gsap.from(".ft-logo", {
          y: 30,
          opacity: 0,
          scale: 0.92,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: ".ft-logo", start: "top 90%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };

  return (
    <footer id="contact" ref={root} className="relative overflow-hidden bg-cream text-ink">
      <div className="mx-auto max-w-[1400px] px-4 pt-24 md:px-10 md:pt-32">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <img src="/brand/logo-full.png" alt="Chavan Udyog Samuh: Legacy. Growth. Trust." className="ft-logo mb-12 h-auto w-44 md:w-52" />
            <p className="eyebrow !text-ember mb-6">Get in touch</p>
            <h2 className="font-serif text-[clamp(2.2rem,5vw,4.5rem)] font-light leading-[1] tracking-tight">
              Visit us at a showroom <span className="italic">near you.</span>
            </h2>
            <p className="mt-6 max-w-md text-ink/70">
              Head office in {company.hq}. Showrooms and service centres across{" "}
              {presence.flatMap((s) => s.districts.map((d) => d.name)).join(", ")}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:col-span-6 md:grid-cols-3">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-ink/50">Explore</p>
              <ul className="space-y-2">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={(e) => go(e, l.href)} className="transition-colors hover:text-ember">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-ink/50">Businesses</p>
              <ul className="space-y-2">
                {verticals.map((v) => (
                  <li key={v.id}>{v.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-ink/50">Regions</p>
              <ul className="space-y-2">
                {presence.map((s) => (
                  <li key={s.state}>{s.state}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="ft-word mt-24 select-none overflow-hidden font-serif text-[23vw] font-light leading-[0.85] tracking-[-0.04em] text-navy md:mt-32">
          {"Chavan".split("").map((c, i) => (
            <span key={i} className="ft-char inline-block">{c}</span>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-ink/15 py-6 text-xs text-ink/55 md:flex-row">
          <p>© {new Date().getFullYear()} {company.name}. {company.motto} Serving customers since {company.since}.</p>
          <p>Brand names are trademarks of their respective owners. Photography: Unsplash.</p>
        </div>
      </div>
    </footer>
  );
}
