"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import { markIntroDone, resetIntro } from "@/lib/intro";
import { getLenis } from "@/lib/lenis";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "@/components/e/logo";
import { useContent } from "@/components/e/content";

// the medallion's drawing (a 440 × 440 box): the outer gold ring, the ring the engraving runs along, the fine
// inner ring, and the ivory medallion itself
const V = 440, C = V / 2;
const R_OUTER = 214, R_TEXT = 192, R_INNER = 170, R_MEDAL = 150;
const TEXT_LEN = 2 * Math.PI * R_TEXT - 6;
// (positions worked out with sine and cosine are rounded: the server's and the browser's last decimal places
// can differ, and the page's HTML must match what the browser draws)
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const L_OUTER = 2 * Math.PI * R_OUTER, L_INNER = 2 * Math.PI * R_INNER;
const OPEN_AT = 2950; // ms from the first paint: the medallion has built itself (in CSS, see h.css)
const WORD_DELAY = 1.5, WORD_STEP = 0.15; // s: the motto's words

/**
 * The opening, "the medallion": on midnight navy, gold rings draw themselves around an ivory medallion that
 * holds the logo exactly as supplied; the group's name settles around the ring like an engraving, a glint of
 * light runs once round the rim and the motto appears beneath, word by word. All of that is CSS, so it plays
 * from the very first paint. Then the medallion becomes a window: the page opens outward through a circle
 * with a glowing gold rim, like an aperture.
 */
export default function PreloaderH() {
  const { company } = useContent();
  const root = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const rim = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const medal = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    resetIntro();
    if (reducedMotion()) {
      setGone(true);
      markIntroDone();
      return;
    }
    const html = document.documentElement;
    html.style.overflow = "hidden";
    getLenis()?.stop();
    const ctx = gsap.context(() => {});
    // how far the medallion's own (CSS) build has got: it began with the first paint (when the animations'
    // own clock cannot be read, from the first paint itself)
    const anim = medal.current?.getAnimations?.()[0];
    const fp = performance.getEntriesByName("first-paint")[0]?.startTime;
    const built = anim && anim.currentTime !== null ? Number(anim.currentTime) : fp !== undefined ? performance.now() - fp : 0;
    const timer = window.setTimeout(
      () =>
        ctx.add(() => {
          const size = stage.current!.offsetWidth;
          const r0 = (R_MEDAL / V) * size; // the medallion's radius on screen
          const far = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 40;
          const iris = { r: -2 };
          const setIris = () => {
            veil.current!.style.setProperty("--r", `${iris.r}px`);
            const d = Math.max(0, iris.r * 2);
            rim.current!.style.width = rim.current!.style.height = `${d}px`;
          };
          // (the parts animated in CSS are faded through their wrappers, which CSS leaves alone)
          gsap
            .timeline({
              onComplete: () => {
                html.style.overflow = "";
                getLenis()?.start();
                setGone(true);
                // (the page's scrollbar is back, so every scroll position is measured again)
                ScrollTrigger.refresh();
              },
            })
            .to([".pl-w-engrave", ".pl-w-motto", ".pl-w-detail"], { opacity: 0, duration: 0.5, ease: "power2.in" }, 0)
            .to(".pl-w-medal", { opacity: 0, scale: 1.04, duration: 0.55, ease: "power2.in" }, 0.05)
            .to(iris, { r: r0, duration: 0.55, ease: "power2.in", onUpdate: setIris }, 0.05)
            .set(rim.current, { opacity: 1 }, 0.45)
            .to(".pl-w-outer", { opacity: 0, duration: 0.3 }, 0.5)
            .call(markIntroDone, [], 0.55)
            .to(iris, { r: far, duration: 1.4, ease: "expo.inOut", onUpdate: setIris }, 0.6)
            .to(rim.current, { opacity: 0, duration: 0.55, ease: "power1.in" }, 1.4);
        }, root),
      Math.max(0, OPEN_AT - built),
    );
    return () => {
      clearTimeout(timer);
      ctx.revert();
      html.style.overflow = "";
    };
  }, []);

  if (gone) return null;
  const mask = "radial-gradient(circle at 50% 50%, transparent var(--r), #000 calc(var(--r) + 1px))";
  const words = company.motto.split(/\s+/).filter(Boolean);
  return (
    <div ref={root} className="fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {/* the midnight veil, through which the page opens */}
      <div
        ref={veil}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#15336e_0%,#0a1d40_45%,#040d22_100%)]"
        style={{ ["--r" as string]: "-2px", WebkitMaskImage: mask, maskImage: mask }}
      />
      {/* the aperture's glowing gold rim */}
      <div ref={rim} className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[#e4c98f] opacity-0 shadow-[0_0_40px_6px_rgba(201,164,92,0.45),inset_0_0_40px_6px_rgba(201,164,92,0.35)]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div ref={stage} className="relative aspect-square w-[min(78vw,58vh,440px)]">
          <svg viewBox={`0 0 ${V} ${V}`} className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="pl-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f3dfae" />
                <stop offset="0.5" stopColor="#c9a45c" />
                <stop offset="1" stopColor="#8c6a22" />
              </linearGradient>
              <path id="pl-text" d={`M ${C} ${C} m 0 ${-R_TEXT} a ${R_TEXT} ${R_TEXT} 0 1 1 0 ${2 * R_TEXT} a ${R_TEXT} ${R_TEXT} 0 1 1 0 ${-2 * R_TEXT}`} />
            </defs>
            {/* the rings (they start at twelve o'clock; the inner one draws the other way) */}
            <g className="pl-w-outer">
              <circle className="pl-outer" cx={C} cy={C} r={R_OUTER} transform={`rotate(-90 ${C} ${C})`} fill="none" stroke="url(#pl-gold)" strokeWidth="2" strokeDasharray={L_OUTER} style={{ ["--len" as string]: `${L_OUTER}px` }} />
            </g>
            <g className="pl-w-detail">
              <circle className="pl-inner-ring" cx={C} cy={C} r={R_INNER} transform={`rotate(-90 ${C} ${C})`} fill="none" stroke="#c9a45c" strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray={L_INNER} style={{ ["--len" as string]: `${-L_INNER}px` }} />
              <g className="pl-ticks pl-svg-part">
                {Array.from({ length: 72 }, (_, i) => {
                  const a = (i * 5 * Math.PI) / 180, long = i % 6 === 0;
                  const r1 = R_OUTER - 6, r2 = R_OUTER - (long ? 14 : 10);
                  return <line key={i} x1={r3(C + r1 * Math.sin(a))} y1={r3(C - r1 * Math.cos(a))} x2={r3(C + r2 * Math.sin(a))} y2={r3(C - r2 * Math.cos(a))} stroke="#c9a45c" strokeOpacity={long ? 0.9 : 0.35} strokeWidth={long ? 1.4 : 0.8} />;
                })}
              </g>
              {/* the glint: a short bright arc that runs once round the rim */}
              <circle className="pl-glint pl-svg-part" cx={C} cy={C} r={R_OUTER} fill="none" stroke="#fff6dc" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${L_OUTER * 0.06} ${L_OUTER}`} style={{ filter: "drop-shadow(0 0 6px rgba(255,236,190,0.9))" }} />
            </g>
            <g className="pl-w-engrave">
              <text className="pl-engrave pl-svg-part" fill="#e4c98f" fontSize="12.5" fontFamily="var(--font-manrope)" fontWeight="600">
                <textPath href="#pl-text" textLength={TEXT_LEN} lengthAdjust="spacing">
                  {`${company.name.toUpperCase()} · EST. ${company.since} · ${company.hq.toUpperCase()} · `}
                </textPath>
              </text>
            </g>
          </svg>
          {/* the medallion, on the logo's own ivory ground, the logo exactly as supplied */}
          <div className="pl-w-medal absolute" style={{ inset: `${((C - R_MEDAL) / V) * 100}%` }}>
            <div ref={medal} className="pl-medal absolute inset-0 rounded-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(201,164,92,0.6)]" style={{ backgroundColor: LOGO_GROUND }}>
              <span className="absolute inset-[5%] rounded-full border border-[#c9a45c]/45" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={LOGO_JPEG} alt={LOGO_ALT} fetchPriority="high" className="pl-logo h-auto w-[66%]" />
              </div>
            </div>
          </div>
        </div>
        <p className="pl-w-motto h-serif mt-8 flex gap-[0.6em] text-[clamp(1.25rem,2.4vw,1.7rem)] italic text-[#e4c98f] md:mt-10">
          {words.map((w, i) => (
            <span key={i} className="pl-word inline-block" style={{ animationDelay: `${WORD_DELAY + i * WORD_STEP}s` }}>
              {w.replace(/\.$/, "")}
              {i < words.length - 1 && <span className="ml-[0.6em] not-italic text-[#c9a45c]">·</span>}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
