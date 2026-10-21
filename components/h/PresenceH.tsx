"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { headOffice, numberWord, statesOf, useContent, type District } from "@/components/e/content";

const C = 300; // the dial's centre (in a 600 × 600 drawing)
const FACE = 262; // the face's radius
const rad = Math.PI / 180;
// the distance (km) and the compass bearing (degrees from north, clockwise) from one district to another
const km = (a: District, b: District) => {
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const bearing = (a: District, b: District) => {
  const y = Math.sin((b.lon - a.lon) * rad) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lon - a.lon) * rad);
  return (Math.atan2(y, x) / rad + 360) % 360;
};
const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const compass = (deg: number) => POINTS[Math.round(deg / 22.5) % 16];

/**
 * Where the group works, as the face of a watch: the head office at the centre, each district placed at its
 * true bearing and distance, rings every 50 km, and a gold hand that sweeps from one district to the next (or
 * to the one chosen in the list). The bezel turns a little as the page is scrolled.
 */
export default function PresenceH() {
  const { districts } = useContent();
  const root = useRef<HTMLElement>(null);
  const hq = headOffice(districts);
  const others = hq ? districts.filter((d) => d !== hq) : [];
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const [angle, setAngle] = useState(0);
  const key = districts.map((d) => d.name).join("|");

  // the hand sweeps from district to district on its own, unless one is being pointed at
  useEffect(() => {
    if (held || others.length < 2 || reducedMotion()) return;
    const t = setInterval(() => setAt((a) => (a + 1) % others.length), 2800);
    return () => clearInterval(t);
  }, [held, others.length]);

  // (the hand takes the shorter way round)
  const target = hq && others[at] ? bearing(hq, others[at]) : 0;
  useEffect(() => {
    setAngle((cur) => {
      const d = ((((target - cur) % 360) + 540) % 360) - 180;
      return cur + d;
    });
  }, [target]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".pr-head > *", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".pr-head", start: "top 85%" } });
        gsap.from(".pr-row", { x: -30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".pr-list", start: "top 85%" } });
        gsap
          .timeline({ scrollTrigger: { trigger: ".pr-dial", start: "top 75%" } })
          .from(".pr-tick", { opacity: 0, duration: 0.6, stagger: 0.012 })
          .from(".pr-ring", { scale: 0.4, opacity: 0, svgOrigin: `${C} ${C}`, duration: 1.2, ease: "expo.out", stagger: 0.1 }, 0.2)
          .from(".pr-dot", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(3)", stagger: 0.12 }, 0.7)
          .from(".pr-hand", { opacity: 0, duration: 0.8 }, 0.9);
        gsap.to(".pr-bezel", { rotation: 45, svgOrigin: `${C} ${C}`, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [key]);

  if (!hq) return null;
  const states = statesOf(districts);
  const far = Math.max(60, ...others.map((d) => km(hq, d))) * 1.18;
  const scale = (FACE - 28) / far;
  const rings: number[] = [];
  for (let r = 50; r < far; r += 50) rings.push(r);
  const pos = (d: District) => {
    const b = bearing(hq, d) * rad, r = km(hq, d) * scale;
    return { x: C + r * Math.sin(b), y: C - r * Math.cos(b) };
  };
  const point = (i: number) => {
    setHeld(true);
    setAt(i);
  };

  return (
    <section id="presence" ref={root} className="relative overflow-hidden bg-[var(--h-navy)] py-24 text-[var(--h-pearl)] md:py-36">
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-[var(--h-gold)]/[0.06] blur-3xl" aria-hidden />
      <div className="h-wrap relative grid items-center gap-16 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <div className="pr-head">
            <p className="h-eyebrow">Our presence</p>
            <h2 className="h-serif mt-5 text-[clamp(2.6rem,5vw,4.8rem)] leading-[1]">
              Rooted in {hq.name}. <span className="block italic text-[var(--h-gold-2)]">Reaching {numberWord(states.length).toLowerCase()} {states.length === 1 ? "state" : "states"}.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--h-pearl)]/65 md:text-[16px]">
              Every showroom within an easy drive of the head office in {hq.name}, across {states.join(" and ")}.
            </p>
          </div>
          <ul className="pr-list mt-12 border-t border-white/10" onMouseLeave={() => setHeld(false)}>
            <li className="pr-row flex items-baseline justify-between gap-4 border-b border-white/10 py-4">
              <span className="h-serif text-[1.9rem] leading-none">{hq.name}</span>
              <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--h-gold)]">Head office · {hq.state}</span>
            </li>
            {others.map((d, i) => (
              <li key={d.name} className="pr-row border-b border-white/10">
                <button type="button" onMouseEnter={() => point(i)} onFocus={() => point(i)} onClick={() => point(i)} className="group flex w-full items-baseline justify-between gap-4 py-4 text-left">
                  <span className={`h-serif text-[1.9rem] leading-none transition-colors duration-500 ${i === at ? "text-[var(--h-gold-2)]" : "text-[var(--h-pearl)]/80 group-hover:text-[var(--h-pearl)]"}`}>{d.name}</span>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--h-pearl)]/50">
                    {Math.round(km(hq, d))} km · {compass(bearing(hq, d))} · {d.state}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pr-dial relative mx-auto w-full max-w-[580px]">
          <svg viewBox="0 0 600 600" className="h-auto w-full" role="img" aria-label={`The districts around ${hq.name}: ${others.map((d) => `${d.name}, ${Math.round(km(hq, d))} km ${compass(bearing(hq, d))}`).join("; ")}`}>
            <defs>
              <radialGradient id="pr-face" cx="50%" cy="42%" r="60%">
                <stop offset="0" stopColor="#16336c" />
                <stop offset="1" stopColor="#071634" />
              </radialGradient>
              <linearGradient id="pr-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f0d9a6" />
                <stop offset="0.5" stopColor="#c9a45c" />
                <stop offset="1" stopColor="#8c6a22" />
              </linearGradient>
            </defs>
            {/* the case and its turning bezel */}
            <circle cx={C} cy={C} r={296} fill="none" stroke="url(#pr-gold)" strokeWidth="3" />
            <g className="pr-bezel">
              <circle cx={C} cy={C} r={290} fill="#081a3c" stroke="rgba(201,164,92,0.35)" />
              {Array.from({ length: 60 }, (_, i) => {
                const a = i * 6 * rad, long = i % 5 === 0;
                const r1 = 284, r2 = long ? 268 : 276;
                return <line key={i} className="pr-tick" x1={C + r1 * Math.sin(a)} y1={C - r1 * Math.cos(a)} x2={C + r2 * Math.sin(a)} y2={C - r2 * Math.cos(a)} stroke={long ? "#c9a45c" : "rgba(241,234,217,0.28)"} strokeWidth={long ? 2 : 1} />;
              })}
            </g>
            {/* the face */}
            <circle cx={C} cy={C} r={FACE} fill="url(#pr-face)" stroke="rgba(201,164,92,0.25)" />
            {(["N", "E", "S", "W"] as const).map((l, i) => {
              const a = i * 90 * rad, r = FACE - 24;
              return (
                <text key={l} x={C + r * Math.sin(a)} y={C - r * Math.cos(a) + 7} textAnchor="middle" fill="#e4c98f" fontSize="20" fontFamily="var(--font-cormorant)" fontStyle="italic">
                  {l}
                </text>
              );
            })}
            {rings.map((r) => (
              <g key={r} className="pr-ring">
                <circle cx={C} cy={C} r={r * scale} fill="none" stroke="rgba(241,234,217,0.12)" strokeDasharray="2 5" />
                <text x={C + r * scale * Math.SQRT1_2 + 4} y={C - r * scale * Math.SQRT1_2 - 4} fill="rgba(241,234,217,0.4)" fontSize="11" letterSpacing="1.5" fontFamily="var(--font-manrope)">
                  {r} KM
                </text>
              </g>
            ))}
            {/* the hand */}
            <g className="pr-hand" style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C}px`, transition: "transform 1.2s cubic-bezier(0.65,0,0.35,1)" }}>
              {/* (a solid stroke: a gradient sized to a straight line's empty box would draw nothing) */}
              <line x1={C} y1={C + 26} x2={C} y2={C - (FACE - 46)} stroke="#e4c98f" strokeWidth="2.2" strokeLinecap="round" />
              <path d={`M ${C} ${C - (FACE - 34)} l -6 14 l 12 0 z`} fill="#e4c98f" />
              <circle cx={C} cy={C + 26} r="5" fill="none" stroke="#c9a45c" strokeWidth="1.5" />
            </g>
            {/* the districts */}
            {others.map((d, i) => {
              const p = pos(d), on = i === at, left = p.x > C;
              return (
                <g key={d.name} className="pr-dot cursor-pointer" onMouseEnter={() => point(i)} onMouseLeave={() => setHeld(false)}>
                  <circle cx={p.x} cy={p.y} r={on ? 9 : 6} fill={on ? "#e4c98f" : "#f1ead9"} stroke="#081a3c" strokeWidth="2.5" style={{ transition: "r 0.4s, fill 0.4s" }} />
                  <text x={p.x + (left ? 16 : -16)} y={p.y + 7} textAnchor={left ? "start" : "end"} fill={on ? "#e4c98f" : "#f1ead9"} fontSize="22" fontFamily="var(--font-cormorant)" style={{ transition: "fill 0.4s" }}>
                    {d.name}
                  </text>
                </g>
              );
            })}
            {/* the head office, at the centre */}
            <circle className="h-pulse" cx={C} cy={C} r="10" fill="#c9a45c" fillOpacity="0.5" />
            <circle cx={C} cy={C} r="9" fill="url(#pr-gold)" stroke="#081a3c" strokeWidth="2" />
            {/* (on a small plate, so the hand passing beneath never crosses the name) */}
            <rect x={C - (hq.name.length * 8.6 + 28) / 2} y={C + 36} width={hq.name.length * 8.6 + 28} height="24" rx="12" fill="#0b1f45" stroke="rgba(201,164,92,0.45)" />
            <text x={C} y={C + 52} textAnchor="middle" fill="#e4c98f" fontSize="11" letterSpacing="3" fontFamily="var(--font-manrope)">
              {hq.name.toUpperCase()}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
