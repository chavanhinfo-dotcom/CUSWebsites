"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { about } from "@/lib/content";

export default function About() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Words light up as you read
        gsap.fromTo(
          ".about-word",
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: ".about-lead", start: "top 80%", end: "bottom 45%", scrub: true },
          },
        );
        // Images: clip reveal + inner parallax
        gsap.utils.toArray<HTMLElement>(".about-img").forEach((wrap, i) => {
          gsap.fromTo(
            wrap,
            { clipPath: "inset(100% 0 0 0)" },
            {
              clipPath: "inset(0% 0 0 0)",
              duration: 1.6,
              ease: "expo.inOut",
              delay: i * 0.15,
              scrollTrigger: { trigger: wrap, start: "top 85%" },
            },
          );
          gsap.fromTo(
            wrap.querySelector("img"),
            { yPercent: -12, scale: 1.2 },
            {
              yPercent: 12,
              ease: "none",
              scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
        gsap.from(".about-arrow", {
          scaleX: 0,
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: ".about-arrow", start: "top 85%" },
        });
        gsap.from(".about-closing", {
          y: 40,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: ".about-closing", start: "top 88%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={root} className="relative bg-cream px-4 py-24 text-ink md:px-10 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-12 md:grid-cols-12">
          <p className="eyebrow !text-ember md:col-span-3">About us</p>
          <p className="about-lead font-serif text-[clamp(1.6rem,3.4vw,3.1rem)] font-light leading-[1.18] tracking-tight md:col-span-9">
            {about.lead.split(" ").map((w, i) => (
              <span key={i} className="about-word">
                {w}{" "}
              </span>
            ))}
          </p>
        </div>

        <div className="mt-20 grid items-end gap-6 md:mt-32 md:grid-cols-12">
          <figure className="md:col-span-5">
            <div className="about-img aspect-[4/5] overflow-hidden rounded-sm">
              <img src="/images/yarn-threads.jpg" alt="Spools of coloured thread" className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 flex justify-between text-xs uppercase tracking-[0.2em] text-ink/60">
              <span>1960</span><span>Yarn & long cloth</span>
            </figcaption>
          </figure>

          <div className="flex items-center justify-center md:col-span-2 md:pb-24">
            <div className="about-arrow flex w-full origin-left items-center">
              <span className="h-px flex-1 bg-ink/40" />
              <span className="h-2 w-2 rotate-45 border-r border-t border-ink/60" />
            </div>
          </div>

          <figure className="md:col-span-5 md:-mb-24">
            <div className="about-img aspect-[4/5] overflow-hidden rounded-sm">
              <img src="/images/showroom-luxury.jpg" alt="Showroom floor with cars and scooters" className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 flex justify-between text-xs uppercase tracking-[0.2em] text-ink/60">
              <span>Today</span><span>Appliances to automobiles</span>
            </figcaption>
          </figure>
        </div>

        <p className="about-closing mt-24 max-w-2xl font-serif text-2xl italic leading-snug text-ink/80 md:mt-40 md:text-3xl">
          “{about.closing}”
        </p>
      </div>
    </section>
  );
}
