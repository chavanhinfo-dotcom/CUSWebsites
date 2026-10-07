"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { scrollToHash } from "@/lib/lenis";
import { company, heroSlides } from "@/lib/content";
import SplitText from "./SplitText";

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", (self) => {
        gsap.set(".hero-char", { yPercent: 115 });
        gsap.set(".hero-fade", { opacity: 0, y: 24 });
        gsap.set(".hero-media", { scale: 1.25 });

        // self.add keeps the timeline in this context; otherwise GSAP files it under the
        // preloader's context (whose callback fires this) and reverts it when the preloader unmounts.
        const stop = onIntroDone(() => self.add(() => {
          gsap.timeline()
            .to(".hero-media", { scale: 1, duration: 2.4, ease: "expo.out" }, 0)
            .to(".hero-char", { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.025 }, 0.1)
            .to(".hero-fade", { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1 }, 0.6);
        }));

        // Scroll-out: media sinks and zooms, copy lifts and fades
        gsap.to(".hero-parallax", {
          yPercent: 25,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-content", {
          yPercent: -40,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: true },
        });
        return () => stop();
      });

      // Mouse parallax on pointer devices
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const xTo = gsap.quickTo(".hero-tilt", "x", { duration: 1.2, ease: "power3" });
        const yTo = gsap.quickTo(".hero-tilt", "y", { duration: 1.2, ease: "power3" });
        const move = (e: PointerEvent) => {
          xTo((e.clientX / window.innerWidth - 0.5) * -30);
          yTo((e.clientY / window.innerHeight - 0.5) * -20);
        };
        window.addEventListener("pointermove", move);
        return () => window.removeEventListener("pointermove", move);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={root} className="relative h-[100svh] min-h-[600px] overflow-hidden bg-ink">
      <div className="hero-parallax absolute inset-0">
        <div className="hero-media absolute inset-0">
          <div className="hero-tilt absolute -inset-8">
            <AnimatePresence initial={false}>
              <motion.img
                key={heroSlides[slide].src}
                src={heroSlides[slide].src}
                alt=""
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 1.6, ease: "easeInOut" }, scale: { duration: 7, ease: "linear" } }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/15 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/10 to-transparent" />
      </div>

      <div className="hero-content relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-4 pb-16 md:px-10 md:pb-20">
        <p className="hero-fade eyebrow mb-6">{company.tagline}</p>
        <h1 className="font-serif text-[clamp(3rem,11vw,10.5rem)] font-light leading-[0.9] tracking-[-0.03em]">
          <SplitText text="Six decades" by="char" itemClass="hero-char" />
          <br />
          <span className="italic text-gold-2">
            <SplitText text="of trust." by="char" itemClass="hero-char" />
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="hero-fade max-w-md text-base text-cream/75 md:text-lg">
            From a yarn trade in 1960 to appliances, two-wheelers, cars and commercial vehicles,
            serving Maharashtra and Karnataka.
          </p>

          <div className="hero-fade flex items-center gap-6">
            <div className="flex gap-2">
              {heroSlides.map((s, i) => (
                <button
                  key={s.src}
                  onClick={() => setSlide(i)}
                  aria-label={`Show ${s.label}`}
                  className="relative h-0.5 w-10 overflow-hidden bg-white/20"
                >
                  {i === slide && (
                    <motion.span
                      layoutId="hero-progress"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 5.5, ease: "linear" }}
                      className="absolute inset-0 origin-left bg-gold"
                    />
                  )}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={slide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="w-44 text-xs uppercase tracking-[0.25em] text-cream/70"
              >
                {heroSlides[slide].label}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={() => scrollToHash("#about")}
          className="hero-fade absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 md:right-10 md:flex"
          aria-label="Scroll to about"
        >
          <span className="text-[10px] uppercase tracking-[0.35em] text-cream/60 [writing-mode:vertical-rl]">
            Scroll
          </span>
          <span className="relative h-16 w-px overflow-hidden bg-white/20">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-gold"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </button>
      </div>

      <span className="pointer-events-none absolute -right-6 top-24 select-none font-serif text-[22vw] font-light leading-none text-outline md:top-16">
        {company.since}
      </span>
    </section>
  );
}
