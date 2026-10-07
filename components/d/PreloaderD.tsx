"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { markIntroDone, resetIntro } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";

// Logo mark inside two slowly turning orbits, then the whole screen dissolves.
export default function PreloaderD() {
  const root = useRef<HTMLDivElement>(null);
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
    const ctx = gsap.context(() => {
      gsap.to(".pd-orbit-a", { rotate: 360, duration: 14, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
      gsap.fromTo(".pd-orbit-b", { attr: { rx: 120 } }, { attr: { rx: 300 }, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.timeline({
        onComplete: () => {
          document.documentElement.style.overflow = "";
          getLenis()?.start();
          setGone(true);
        },
      })
        .fromTo(".pd-mark", { scale: 0.6, opacity: 0, rotate: -90 }, { scale: 1, opacity: 1, rotate: 0, duration: 1.1, ease: "expo.out" })
        .fromTo(".pd-orbits", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "expo.out" }, 0)
        .fromTo(".pd-bar", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power2.inOut" }, 0.3)
        .to(".pd-mark", { scale: 1.15, duration: 0.35, ease: "power2.in" }, "+=0.15")
        .to(".pd-orbits", { scale: 2.4, opacity: 0, duration: 0.9, ease: "expo.in" }, "<")
        .call(markIntroDone, [], "-=0.25")
        .to(root.current, { opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.2");
    }, root);
    return () => {
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[100] grid place-items-center bg-d-alt" aria-hidden>
      <svg className="pd-orbits absolute h-[70vmin] w-[120vmin] max-w-none" viewBox="-460 -260 920 520">
        <ellipse className="pd-orbit-a" cx="0" cy="0" rx="440" ry="235" fill="none" stroke="#9db7c9" strokeWidth="1" />
        <ellipse className="pd-orbit-b" cx="0" cy="0" rx="230" ry="235" fill="none" stroke="#9db7c9" strokeWidth="1" />
      </svg>
      <div className="relative flex flex-col items-center gap-6">
        <img src="/brand/logo-mark.png" alt="" className="pd-mark w-28 md:w-36" />
        <span className="h-px w-32 overflow-hidden bg-d-text/15">
          <span className="pd-bar block h-full w-full origin-left bg-d-text" />
        </span>
      </div>
    </div>
  );
}
