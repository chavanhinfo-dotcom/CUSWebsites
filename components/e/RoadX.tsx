"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categoryMeta, milestones, type Category } from "@/lib/content";
import { Eyebrow } from "./ui";
import { Vehicle } from "./vehicles";

const glyph: Record<Category, React.ReactNode> = {
  heritage: <path d="M4 8h16M4 12h16M4 16h16M8 4v16M16 4v16" />,
  appliances: <path d="M7 3h10v18H7zM7 10h10M10 6v2M10 13v3" />,
  "two-wheelers": (<><circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" /><path d="M5.5 16.5 9 11h6l3.5 5.5" /></>),
  cars: (<><path d="M3 15v-3l2.5-5h13L21 12v3z" /><circle cx="7" cy="16.5" r="2" /><circle cx="17" cy="16.5" r="2" /></>),
  commercial: (<><path d="M2 5h12v10H2zM14 9h4.5L22 12.5V15h-8z" /><circle cx="6" cy="17" r="2" /><circle cx="18" cy="17" r="2" /></>),
};

type Geo = { W: number; H: number; x: number; y0: number; r: number; band: number; gap: number; top: number; road: number; d: string; marks: number[] };

function geometry(W: number, vh: number): Geo {
  const mobile = W < 768;
  const road = mobile ? 46 : 84;
  const x = mobile ? 40 : Math.round(W * 0.42);
  const y0 = Math.round(vh * 0.42);
  const r = mobile ? 90 : 220;
  const band = y0 + Math.round(vh * 0.32);
  const top = band + (mobile ? 360 : 260);
  const gap = mobile ? 230 : 300;
  const marks = milestones.map((_, i) => top + i * gap);
  const H = top + (milestones.length - 1) * gap + vh * 0.7;
  const d = `M ${-200} ${y0} H ${x - r} A ${r} ${r} 0 0 1 ${x} ${y0 + r} V ${H + 40}`;
  return { W, H, x, y0, r, band, gap, top, road, d, marks };
}

/**
 * The road (as in the reference's "reliability at every milestone"). The truck from the 3D scene
 * drives along a black band, takes the bend and heads down the page; each milestone lights up as
 * it passes, and the vehicle changes with the business it reaches.
 */
export default function RoadX() {
  const wrap = useRef<HTMLDivElement>(null);
  const car = useRef<HTMLDivElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [reached, setReached] = useState(-1);

  useEffect(() => {
    const el = wrap.current!;
    const measure = () => setGeo(geometry(el.clientWidth, window.innerHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!geo || !pathRef.current) return;
    const p = pathRef.current;
    const total = p.getTotalLength();
    const horiz = geo.x - geo.r + 200;
    const arc = (Math.PI * geo.r) / 2;
    // unroll the route so the vehicle sits on the 55% line of the screen once it is heading down
    const lengthAt = (y: number) => {
      if (y < geo.y0) return Math.max(0, horiz - (geo.y0 - y) * 1.1);
      if (y < geo.y0 + geo.r) return horiz + ((y - geo.y0) / geo.r) * arc;
      return horiz + arc + (y - geo.y0 - geo.r);
    };
    if (trail.current) trail.current.style.strokeDasharray = `${total} ${total}`;
    let raf = 0, cur = 0, last = -2, first = true;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const r = wrap.current!.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      const target = Math.min(total, lengthAt(window.innerHeight * 0.55 - r.top));
      cur = first ? target : cur + (target - cur) * 0.14;
      first = false;
      const a = p.getPointAtLength(cur);
      const b = p.getPointAtLength(Math.min(total, cur + 2));
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
      if (car.current) car.current.style.transform = `translate(${a.x}px, ${a.y}px) translate(-50%, -50%) rotate(${ang}deg)`;
      if (trail.current) trail.current.style.strokeDashoffset = `${total - cur}`;
      let k = -1;
      geo.marks.forEach((m, i) => {
        if (a.y >= m - 4) k = i;
      });
      if (k !== last) {
        last = k;
        setReached(k);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [geo]);

  const cat: Category = reached < 0 ? "commercial" : milestones[reached].category;
  const mobile = geo ? geo.W < 768 : false;

  return (
    <section id="journey" className="relative">
      <div ref={wrap} className="relative w-full overflow-hidden bg-x-white" style={{ height: geo?.H ?? 4800 }}>
        {geo && (
          <>
            <div className="absolute inset-x-0 top-0 bg-x-black" style={{ height: geo.band }} />

            {/* sticky heading on the left of the road */}
            <div className="absolute inset-x-0 bottom-0" style={{ top: geo.band }}>
              <div className={`sticky top-24 px-4 pt-14 md:px-8 ${mobile ? "pl-[90px]" : ""}`} style={mobile ? undefined : { width: geo.x - geo.road }}>
                <p className="wide text-[clamp(34px,4.4vw,76px)]">
                  <span className="block text-x-grey">Six decades.</span>
                  <span className="block">Milestone by</span>
                  <span className="block">milestone.</span>
                </p>
                <div className="mt-6 max-w-sm">
                  <Eyebrow>Our journey · 1960 – 2025</Eyebrow>
                  <p className="mt-4 text-[15px] leading-relaxed text-x-mute">
                    One road, sixteen milestones. Watch the vehicle change as the group grows from a yarn trade into four businesses.
                  </p>
                </div>
              </div>
            </div>

            <svg width={geo.W} height={geo.H} className="absolute left-0 top-0" aria-hidden>
              <path d={geo.d} fill="none" stroke="#2a2a2d" strokeWidth={geo.road + 6} />
              <path ref={pathRef} d={geo.d} fill="none" stroke="#111112" strokeWidth={geo.road} />
              <path d={geo.d} fill="none" stroke="#fafaf8" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="22 18" />
              <path ref={trail} d={geo.d} fill="none" stroke="#c9a24a" strokeWidth="3" strokeLinecap="round" />
              {geo.marks.map((m, i) => (
                <circle key={i} cx={geo.x} cy={m} r={mobile ? 7 : 9} fill={i <= reached ? "#c9a24a" : "#fafaf8"} stroke="#fafaf8" strokeWidth="2" style={{ transition: "fill .5s" }} />
              ))}
            </svg>

            {milestones.map((m, i) => {
              const on = i <= reached;
              return (
                <div
                  key={m.year}
                  className="absolute flex -translate-y-1/2 items-start gap-5"
                  style={{ top: geo.marks[i], left: geo.x + geo.road / 2 + (mobile ? 18 : 64), right: mobile ? 16 : 48 }}
                >
                  <svg viewBox="0 0 24 24" className={`mt-1 hidden h-7 w-7 shrink-0 fill-none stroke-[1.4] transition-colors duration-700 sm:block ${on ? "stroke-x-ink" : "stroke-x-grey"}`} strokeLinecap="round" strokeLinejoin="round">
                    {glyph[m.category]}
                  </svg>
                  <div className="min-w-0">
                    <p className={`micro transition-colors duration-500 ${on ? "text-x-gold" : "text-x-grey"}`}>
                      {String(i + 1).padStart(2, "0")} · {categoryMeta[m.category].label}
                    </p>
                    <p className={`wide mt-2 text-[clamp(30px,3.6vw,58px)] transition-colors duration-700 ${on ? "text-x-ink" : "text-[#dededa]"}`}>{m.year}</p>
                    <p className={`mt-2 max-w-md text-[15px] leading-snug transition-colors duration-700 md:text-[17px] ${on ? "text-x-ink" : "text-x-grey"}`}>{m.title}</p>
                  </div>
                </div>
              );
            })}

            <div ref={car} className="absolute left-0 top-0 z-10 will-change-transform" style={{ filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.45))" }}>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={cat}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: mobile ? 0.55 : 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <Vehicle cat={cat} />
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
