"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { markIntroDone, resetIntro } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";
import { loadProgress, releaseDeferred, whenLoaded } from "./loading";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "./logo";

const START = 1960;
const MIN_MS = 1400; // the count never runs faster than this, even on a fast connection
const MAX_MS = 9000; // and the curtain lifts by this point even if something never finishes loading

// The group's logo exactly as supplied, on its own ground, with the years counting up beneath it; then a
// horizon of light lifts the curtain. The count and bar follow real loading progress (the opening scene
// built, its Earth textures loaded; the scenes further down are built afterwards), so the page is ready when
// it is revealed; it eases towards its target every frame, so a busy moment never makes it jump.
export default function PreloaderX() {
  const root = useRef<HTMLDivElement>(null);
  const yr = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    resetIntro();
    if (reducedMotion()) {
      setGone(true);
      markIntroDone();
      releaseDeferred();
      return;
    }
    let release = 0;
    document.documentElement.style.overflow = "hidden";
    getLenis()?.stop();
    // counts up to the visitor's current year (read in the browser, so a static build never goes stale)
    const year = new Date().getFullYear();
    const t0 = performance.now();
    let loaded = false;
    let shown = 0;
    let exiting = false;
    const stopWait = whenLoaded(() => (loaded = true));
    const cap = setTimeout(() => (loaded = true), MAX_MS);

    const ctx = gsap.context(() => {
      gsap.from(".px-in", { opacity: 0, y: 16, duration: 0.8, ease: "power3.out", stagger: 0.08 });
    }, root);

    const exit = () =>
      ctx.add(() => {
        gsap
          .timeline({
            onComplete: () => {
              document.documentElement.style.overflow = "";
              getLenis()?.start();
              setGone(true);
            },
          })
          .to(".px-in", { opacity: 0, y: -12, duration: 0.45, ease: "power2.in", stagger: 0.04 }, 0.15)
          .to(".px-glow", { opacity: 1, scaleY: 1, duration: 0.6, ease: "power2.out" }, "-=0.1")
          .call(() => {
            markIntroDone();
            // the scenes further down are built once the opening's reveal has played (so it stays smooth)
            release = window.setTimeout(releaseDeferred, 2200);
          })
          .to(root.current, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.05");
      });

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const time = Math.min(1, (now - t0) / MIN_MS);
      const target = Math.min(time, loaded ? 1 : Math.min(0.96, 0.15 + loadProgress() * 0.81));
      // eases by elapsed time, not per frame, so it keeps pace even when frames are slow
      shown += (target - shown) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - shown) < 0.004) shown = target;
      const e = shown * shown * (3 - 2 * shown);
      if (yr.current) yr.current.textContent = String(Math.round(START + (year - START) * e));
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (!exiting && loaded && shown >= 1) {
        exiting = true;
        gsap.ticker.remove(tick);
        exit();
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      stopWait();
      clearTimeout(cap);
      if (release) clearTimeout(release);
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[100] text-x-ink" style={{ backgroundColor: LOGO_GROUND }} aria-hidden>
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 md:gap-8">
        {/* (decoded with the page itself: it is the first thing seen) */}
        <img src={LOGO_JPEG} alt={LOGO_ALT} fetchPriority="high" decoding="sync" className="px-in h-auto w-[min(300px,62vw)] md:w-[340px]" />
        <span ref={yr} className="px-in wide text-[clamp(44px,7vw,92px)] tabular-nums">{START}</span>
        <div className="px-in flex w-[min(360px,70vw)] items-center gap-4">
          <span className="micro text-x-mute">Est.</span>
          <span className="relative h-px flex-1 bg-black/10">
            <span ref={bar} className="px-bar absolute inset-0 origin-left scale-x-0 bg-x-gold" />
          </span>
          <span className="micro text-x-mute">Today</span>
        </div>
      </div>
      <div className="px-glow absolute inset-x-0 bottom-0 h-1/2 origin-bottom scale-y-50 bg-[radial-gradient(ellipse_at_bottom,rgba(201,162,74,0.45),rgba(11,40,89,0.18)_40%,transparent_70%)] opacity-0" />
    </div>
  );
}
