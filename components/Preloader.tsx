"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { markIntroDone, resetIntro } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";

// Year counter rolls 1960 → 2025, then the curtain lifts.
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    resetIntro();
    if (reducedMotion()) {
      setGone(true);
      markIntroDone();
      return;
    }

    document.documentElement.style.overflow = "hidden";
    getLenis()?.stop();

    const counter = { y: 1960 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.style.overflow = "";
          getLenis()?.start();
          setGone(true);
        },
      });
      tl.fromTo(".pl-logo", { clipPath: "inset(100% 0 0 0)", y: 30 }, { clipPath: "inset(0% 0 0 0)", y: 0, duration: 1.1, ease: "expo.out" })
        .to(counter, {
          y: 2025,
          duration: 1.6,
          ease: "power3.inOut",
          onUpdate: () => {
            if (yearRef.current) yearRef.current.textContent = String(Math.round(counter.y));
          },
        }, 0.2)
        .to(".pl-bar", { scaleX: 1, duration: 1.6, ease: "power3.inOut" }, 0.2)
        .to(".pl-inner", { yPercent: -30, opacity: 0, duration: 0.7, ease: "power3.in" }, "+=0.15")
        .call(markIntroDone, [], "-=0.2")
        .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.35");
    }, root);

    return () => {
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
      style={{ clipPath: "inset(0 0 0% 0)" }}
      aria-hidden
    >
      <div className="pl-inner flex flex-col items-center gap-6 px-6 text-center">
        <img
          src="/brand/logo-full-light.png"
          alt="Chavan Udyog Samuh"
          className="pl-logo h-auto w-56 md:w-72"
          style={{ clipPath: "inset(100% 0 0 0)" }}
        />
        <span ref={yearRef} className="font-serif text-6xl tabular-nums text-cream md:text-8xl">
          1960
        </span>
        <div className="h-px w-48 overflow-hidden bg-white/10">
          <div className="pl-bar h-full w-full origin-left scale-x-0 bg-gold" />
        </div>
      </div>
    </div>
  );
}
