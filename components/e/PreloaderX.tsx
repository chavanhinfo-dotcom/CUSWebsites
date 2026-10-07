"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { markIntroDone, resetIntro } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";

// Black screen, the years count up beside the logo, then a horizon of light lifts the curtain.
export default function PreloaderX() {
  const root = useRef<HTMLDivElement>(null);
  const yr = useRef<HTMLSpanElement>(null);
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
    const c = { v: 1960 };
    const ctx = gsap.context(() => {
      gsap.timeline({
        onComplete: () => {
          document.documentElement.style.overflow = "";
          getLenis()?.start();
          setGone(true);
        },
      })
        .from(".px-in", { opacity: 0, y: 16, duration: 0.8, ease: "power3.out", stagger: 0.08 })
        .to(c, { v: 2025, duration: 1.8, ease: "power2.inOut", onUpdate: () => yr.current && (yr.current.textContent = String(Math.round(c.v))) }, 0.2)
        .to(".px-bar", { scaleX: 1, duration: 1.8, ease: "power2.inOut" }, 0.2)
        .to(".px-in", { opacity: 0, y: -12, duration: 0.45, ease: "power2.in", stagger: 0.04 }, "+=0.1")
        .to(".px-glow", { opacity: 1, scaleY: 1, duration: 0.6, ease: "power2.out" }, "-=0.1")
        .call(markIntroDone)
        .to(root.current, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.05");
    }, root);
    return () => {
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[100] bg-x-black text-white" aria-hidden>
      <div className="flex h-full flex-col items-center justify-center gap-8">
        <img src="/brand/logo-mark-light.png" alt="" className="px-in h-16 w-auto" />
        <span ref={yr} className="px-in wide text-[clamp(64px,10vw,140px)] tabular-nums">1960</span>
        <div className="px-in flex w-[min(360px,70vw)] items-center gap-4">
          <span className="micro text-white/50">Est.</span>
          <span className="relative h-px flex-1 bg-white/15">
            <span className="px-bar absolute inset-0 origin-left scale-x-0 bg-x-gold" />
          </span>
          <span className="micro text-white/50">Today</span>
        </div>
      </div>
      <div className="px-glow absolute inset-x-0 bottom-0 h-1/2 origin-bottom scale-y-50 bg-[radial-gradient(ellipse_at_bottom,rgba(201,162,74,0.55),rgba(11,40,89,0.35)_40%,transparent_70%)] opacity-0" />
    </div>
  );
}
