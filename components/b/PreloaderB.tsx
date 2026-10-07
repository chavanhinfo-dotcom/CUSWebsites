"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { markIntroDone, resetIntro } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";
import { company } from "@/lib/content";

// Logo blooms out of a circle, the motto types in, then the page splits open top/bottom.
export default function PreloaderB() {
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
      gsap.timeline({
        onComplete: () => {
          document.documentElement.style.overflow = "";
          getLenis()?.start();
          setGone(true);
        },
      })
        .fromTo(".plb-logo", { clipPath: "circle(0% at 50% 60%)", scale: 0.8 }, { clipPath: "circle(75% at 50% 60%)", scale: 1, duration: 1.3, ease: "expo.out" })
        .from(".plb-char", { opacity: 0, y: 8, duration: 0.04, stagger: 0.035, ease: "none" }, 0.6)
        .fromTo(".plb-line", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 0.7)
        .to(".plb-content", { scale: 0.9, opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.35")
        .call(markIntroDone, [], "-=0.1")
        .to(".plb-top", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.15")
        .to(".plb-bottom", { yPercent: 100, duration: 1, ease: "expo.inOut" }, "<");
    }, root);
    return () => {
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100]" aria-hidden>
      <div className="plb-top paper-bg absolute inset-x-0 top-0 h-1/2 border-b border-navy/10" />
      <div className="plb-bottom paper-bg absolute inset-x-0 bottom-0 h-1/2" />
      <div className="plb-content absolute inset-0 flex flex-col items-center justify-center gap-6">
        <img src="/brand/logo-mark.png" alt="" className="plb-logo w-44 md:w-56" style={{ clipPath: "circle(0% at 50% 60%)" }} />
        <p className="font-grotesk text-sm font-semibold uppercase tracking-[0.35em] text-brass md:text-base">
          {company.motto.split("").map((c, i) => (
            <span key={i} className="plb-char inline-block whitespace-pre">{c}</span>
          ))}
        </p>
        <span className="plb-line h-[2px] w-40 origin-left bg-navy" />
      </div>
    </div>
  );
}
