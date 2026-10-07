"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { presence } from "@/lib/content";
import { RevealLines } from "./FeaturesD";

const ease = [0.25, 1, 0.5, 1] as const;

// Halftone dot map: dots swell around the four districts we serve.
const BOUNDS = { lonMin: 75.15, lonMax: 76.65, latMin: 15.75, latMax: 18.65 };
const W = 520, H = 640, STEP = 13;
const proj = (lon: number, lat: number) => ({
  x: ((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin)) * W,
  y: ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * H,
});
const points = presence.flatMap((s) => s.districts.map((d) => ({ ...d, state: s.state, ...proj(d.lon, d.lat) })));
const borderY = proj(0, 17.35).y;
const grid: { x: number; y: number; r: number; near: number; d: number }[] = [];
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    let best = Infinity, near = -1;
    points.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < best) { best = d; near = i; }
    });
    const swell = Math.max(0, 1 - best / 110);
    grid.push({ x, y, r: 1.3 + swell * 3.6, near: swell > 0.15 ? near : -1, d: best });
  }
}

export default function PresenceD() {
  const [hover, setHover] = useState<string | null>(null);
  const map = useRef<SVGSVGElement>(null);
  const seen = useInView(map, { once: true, margin: "-80px" });
  return (
    <section id="presence" className="bg-d-alt px-5 py-28 md:px-10 md:py-[160px]">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div>
          <h2 className="text-[clamp(40px,5vw,72px)] font-medium leading-none tracking-[-0.05em]">
            <RevealLines lines={["Two states.", "Four districts.", "One standard."]} />
          </h2>
          <p className="mt-8 max-w-md text-[18px] leading-[1.45] text-d-sub">
            Headquartered in Solapur, we serve customers across Maharashtra and Karnataka.
          </p>
          <div className="mt-14 border-t border-d-text/15">
            {points.map((p, i) => (
              <motion.button
                key={p.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.07, ease }}
                onMouseEnter={() => setHover(p.name)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.name)}
                onBlur={() => setHover(null)}
                className="group grid w-full grid-cols-[48px_1fr_auto] items-center border-b border-d-text/15 py-5 text-left"
              >
                <span className="text-[14px] font-medium text-d-sub">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[clamp(24px,2.4vw,32px)] font-medium tracking-[-0.03em] transition-transform duration-500 ease-[cubic-bezier(.25,1,.5,1)] group-hover:translate-x-2">
                  {p.name}
                </span>
                <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-d-sub">
                  {"hq" in p && p.hq ? (
                    <span className="mr-2 rounded-full bg-d-dark px-2.5 py-1 text-white md:mr-3 md:px-3">
                      <span className="md:hidden">HQ</span>
                      <span className="hidden md:inline">Head office</span>
                    </span>
                  ) : null}
                  {p.state}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <svg ref={map} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Dot map of the districts we serve">
            {grid.map((g, i) => {
              const on = g.near >= 0 && hover === points[g.near].name;
              return (
                <circle
                  key={i}
                  cx={g.x}
                  cy={g.y}
                  fill={g.near >= 0 ? (on ? "#c9a24a" : "#0b2859") : "#9db7c9"}
                  opacity={g.near >= 0 ? 0.25 + (g.r - 1.3) / 4.5 : 0.5}
                  style={{
                    r: seen ? (on ? g.r * 1.45 : g.r) : 0,
                    transition: `r 0.8s cubic-bezier(.25,1,.5,1) ${on ? 0 : Math.min(1.2, g.d / 260)}s, fill 0.4s`,
                  }}
                />
              );
            })}
            <line x1="0" x2={W} y1={borderY} y2={borderY + 14} stroke="#050c22" strokeOpacity="0.25" strokeDasharray="4 6" />
            <text x="12" y={borderY - 12} fontSize="11" letterSpacing="3" fill="#050c22" opacity="0.5">MAHARASHTRA</text>
            <text x="12" y={borderY + 34} fontSize="11" letterSpacing="3" fill="#050c22" opacity="0.5">KARNATAKA</text>
            {points.map((p) => (
              <g key={p.name}>
                <circle cx={p.x} cy={p.y} r="7" fill="#050c22" />
                <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#050c22" className="pin-pulse" />
                <rect x={p.x + 14} y={p.y - 15} rx="8" width={p.name.length * 9 + 20} height="30" fill="#fcfcfc" />
                <text x={p.x + 24} y={p.y + 5} fontSize="15" fontWeight="600" fill="#050c22">{p.name}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
