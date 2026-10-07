"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { presence } from "@/lib/content";

// Simple equirectangular projection over the region the group serves.
const BOUNDS = { lonMin: 75.2, lonMax: 76.6, latMin: 15.8, latMax: 18.6 };
const W = 600;
const H = 760;
const project = (lon: number, lat: number) => ({
  x: ((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin)) * W,
  y: ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * H,
});

const points = presence.flatMap((s) =>
  s.districts.map((d) => ({ ...d, state: s.state, ...project(d.lon, d.lat) })),
);
const hq = points.find((p) => "hq" in p && p.hq)!;
// Approximate Maharashtra–Karnataka border band south of Solapur
const borderY = project(0, 17.35).y;

export default function Presence() {
  const root = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ".presence-map", start: "top 70%" } });
        tl.from(".map-grid", { opacity: 0, duration: 1 })
          .from(".map-border", { opacity: 0, duration: 1.2 }, 0.2)
          .from(".map-state", { opacity: 0, y: 20, duration: 0.8, stagger: 0.15 }, 0.5)
          .from(".map-pin", { scale: 0, transformOrigin: "center", duration: 0.7, ease: "back.out(3)", stagger: 0.15 }, 0.8)
          .fromTo(
            ".map-route",
            { strokeDashoffset: (_i: number, el: Element) => (el as SVGPathElement).getTotalLength() },
            { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.2 },
            1.2,
          )
          .from(".map-label", { opacity: 0, x: -10, duration: 0.6, stagger: 0.1 }, 1.4);

        gsap.from(".presence-list li", {
          x: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".presence-list", start: "top 80%" },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="presence" ref={root} className="relative overflow-hidden bg-ink px-4 py-24 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1400px] items-center gap-16 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-6">Our presence</p>
          <h2 className="font-serif text-[clamp(2.4rem,5.5vw,5rem)] font-light leading-[1] tracking-tight">
            Two states. <br />
            <span className="italic text-gold-2">Four districts.</span>
          </h2>
          <p className="mt-6 max-w-md text-cream/65">
            Headquartered in Solapur, we serve customers across Maharashtra and Karnataka.
          </p>

          <ul className="presence-list mt-12 space-y-8">
            {presence.map((s) => (
              <li key={s.state}>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">{s.state}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {s.districts.map((d) => (
                    <button
                      key={d.name}
                      onMouseEnter={() => setHover(d.name)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(d.name)}
                      onBlur={() => setHover(null)}
                      className={`rounded-full border px-5 py-2.5 font-serif text-2xl transition-colors duration-300 ${
                        hover === d.name ? "border-gold bg-gold text-ink" : "border-white/15 text-cream"
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="presence-map relative mx-auto w-full max-w-[520px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of districts served in Maharashtra and Karnataka">
            <defs>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.4" fill="rgba(243,237,226,0.12)" />
              </pattern>
              <radialGradient id="glow">
                <stop offset="0%" stopColor="#c9a24a" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#c9a24a" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect className="map-grid" width={W} height={H} fill="url(#dots)" rx="24" />
            <circle cx={hq.x} cy={hq.y} r="200" fill="url(#glow)" className="map-grid" />

            <path
              className="map-border"
              d={`M0 ${borderY + 30} C 120 ${borderY - 20}, 200 ${borderY + 50}, 300 ${borderY} S 480 ${borderY - 40}, ${W} ${borderY + 10}`}
              fill="none"
              stroke="rgba(243,237,226,0.3)"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              style={{ strokeDashoffset: 0 }}
            />
            <text className="map-state" x="24" y={borderY - 30} fill="rgba(243,237,226,0.45)" fontSize="14" letterSpacing="6">
              MAHARASHTRA
            </text>
            <text className="map-state" x="24" y={borderY + 70} fill="rgba(243,237,226,0.45)" fontSize="14" letterSpacing="6">
              KARNATAKA
            </text>

            {points
              .filter((p) => p !== hq)
              .map((p) => {
                const mx = (hq.x + p.x) / 2 + (p.x < hq.x ? -60 : 60);
                const my = (hq.y + p.y) / 2;
                const d = `M${hq.x} ${hq.y} Q ${mx} ${my} ${p.x} ${p.y}`;
                return (
                  <path
                    key={p.name}
                    className="map-route"
                    d={d}
                    fill="none"
                    stroke={hover === p.name ? "#e6c87e" : "rgba(201,162,74,0.6)"}
                    strokeWidth={hover === p.name ? 2.5 : 1.5}
                    strokeDasharray="1000"
                    style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                  />
                );
              })}

            {points.map((p) => {
              const on = hover === p.name;
              return (
                <g key={p.name} onMouseEnter={() => setHover(p.name)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="#c9a24a" strokeWidth="1.5" className="pin-pulse" />
                  <g className="map-pin">
                    <circle cx={p.x} cy={p.y} r={on ? 11 : "hq" in p ? 9 : 7} fill={on ? "#e6c87e" : "#c9a24a"} style={{ transition: "r 0.3s, fill 0.3s" }} />
                    {"hq" in p && <circle cx={p.x} cy={p.y} r="3" fill="#0c0b09" />}
                  </g>
                  <text className="map-label" x={p.x + 20} y={p.y + 6} fill={on ? "#e6c87e" : "#f3ede2"} fontSize="22" fontFamily="var(--font-fraunces)">
                    {p.name}
                    {"hq" in p && (
                      <tspan fill="#8f877a" fontSize="12" dx="10" letterSpacing="3">HQ</tspan>
                    )}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
