"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { joinList, numberWord, statesOf, useContent, type Dealership } from "@/components/e/content";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "@/components/e/logo";
import { qrMatrix } from "./qr";

// ------------------------------------------------------------------ the bands

type Vehicle = { src: string; alt: string; ratio: number; h: number };
type Band = { id: string; label: string; match: (d: Dealership) => boolean; panel: string; light: boolean; scene: "dusk" | "showroom"; vehicles: Vehicle[] };

// the brand families, in the order of the page; each franchise goes in the first family it matches (so ones
// added on the admin page find their place), and a family with no franchises is left out
const isHero = (d: Dealership) => /hero|premia|harley|vida/i.test(`${d.brand} ${d.tag ?? ""}`);
const BANDS: Band[] = [
  {
    id: "commercial", label: "Commercial vehicles", match: (d) => /commercial|truck/i.test(d.business), panel: "#0c2c66", light: true, scene: "dusk",
    vehicles: [
      { src: "/models/tata-yodha-side.webp", alt: "Tata Yodha pickup", ratio: 564 / 204, h: 0.5 },
      { src: "/models/maruti-super-carry-side.webp", alt: "Maruti Suzuki Super Carry", ratio: 656 / 327, h: 0.56 },
    ],
  },
  {
    id: "cars", label: "Passenger cars", match: (d) => /car/i.test(d.business), panel: "#14161b", light: true, scene: "dusk",
    vehicles: [
      { src: "/models/maruti-victoris-side.webp", alt: "Maruti Suzuki Victoris", ratio: 1215 / 491, h: 0.52 },
      { src: "/models/maruti-brezza-side.webp", alt: "Maruti Suzuki Brezza", ratio: 1056 / 474, h: 0.52 },
    ],
  },
  {
    id: "hero", label: "Two-wheelers", match: isHero, panel: "#c8102e", light: true, scene: "dusk",
    vehicles: [
      { src: "/models/harley-x440-side.webp", alt: "Harley-Davidson X440", ratio: 839 / 480, h: 0.6 },
      { src: "/models/hero-splendor-plus-side.webp", alt: "Hero Splendor+", ratio: 833 / 509, h: 0.6 },
    ],
  },
  {
    id: "motorcycles", label: "Motorcycles & electric", match: (d) => /wheeler|motorcycle|scooter|electric/i.test(d.business), panel: "#ffffff", light: false, scene: "dusk",
    vehicles: [
      { src: "/models/royal-enfield-bullet-350-side.webp", alt: "Royal Enfield Bullet 350", ratio: 824 / 518, h: 0.6 },
      { src: "/models/ather-450-side.webp", alt: "Ather 450", ratio: 715 / 530, h: 0.6 },
    ],
  },
  {
    id: "appliances", label: "Home appliances", match: (d) => /appliance/i.test(d.business), panel: "#1428a0", light: true, scene: "showroom",
    vehicles: [{ src: "/models/samsung-lineup.webp", alt: "Samsung appliances", ratio: 479 / 190, h: 0.66 }],
  },
];

// the dusk the vehicles stand in: sky to horizon, a city's outline, the road; or a bright showroom floor
const SCENE = {
  dusk: "linear-gradient(180deg,#1d2f57 0%,#4a4a62 34%,#a77a5a 62%,#e7b77d 77%,#2f3038 77.4%,#25262d 100%)",
  showroom: "linear-gradient(180deg,#fbf8f2 0%,#f1e9dc 74%,#d8ccb7 74.4%,#ebe3d5 100%)",
};
function Skyline() {
  // a fixed, generated city outline (the same on every render)
  const rects: [number, number, number][] = [];
  let x = 0, seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  while (x < 1000) {
    const w = 14 + rnd() * 34, h = 18 + rnd() * 70;
    rects.push([x, w, h]);
    x += w + rnd() * 6;
  }
  return (
    <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[22.6%] h-[34%] w-full" aria-hidden>
      {rects.map(([rx, w, h], i) => (
        <rect key={i} x={rx} y={100 - h} width={w} height={h} fill="rgba(24,30,52,0.42)" />
      ))}
    </svg>
  );
}

// the width of each brand mark for its height (as drawn in /public/brands); others are given 4
const MARK: Record<string, number> = {
  "/brands/samsung.svg": 6.53, "/brands/hero.svg": 3.09, "/brands/harley.svg": 1.23, "/brands/vida.png": 4.96, "/brands/royalenfield.svg": 2.71,
  "/brands/ather.png": 3.07, "/brands/maruti.svg": 9.07, "/brands/nexa.png": 4.42, "/brands/tatamotors.svg": 8.78,
};

const firstYear = (list: Dealership[]) => {
  const ys = list.flatMap((d) => d.showrooms.map((s) => s.since)).filter((y): y is number => typeof y === "number");
  return ys.length ? Math.min(...ys) : undefined;
};

// ------------------------------------------------------------------ the strength bar

const Icon = ({ kind }: { kind: "badge" | "shield" | "pin" | "star" }) => (
  <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="#e4c98f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {kind === "badge" && (
      <>
        <path d="M20 4l4.2 3 5.2-.4 1.6 5 4.2 3-1.8 4.9 1.8 4.9-4.2 3-1.6 5-5.2-.4L20 36l-4.2-3-5.2.4-1.6-5-4.2-3 1.8-4.9-1.8-4.9 4.2-3 1.6-5 5.2.4z" />
        <circle cx="20" cy="20" r="8.5" />
      </>
    )}
    {kind === "shield" && (
      <>
        <path d="M20 4l12 4.5v9c0 8-5.4 13.8-12 16.5C13.4 31.3 8 25.5 8 17.5v-9z" />
        <path d="M14.5 19.5l4 4 7.5-8" />
      </>
    )}
    {kind === "pin" && (
      <>
        <path d="M20 35s-10-9.5-10-17.5a10 10 0 0120 0C30 25.5 20 35 20 35z" />
        <circle cx="20" cy="17.5" r="3.8" />
      </>
    )}
    {kind === "star" && (
      <>
        <circle cx="20" cy="20" r="15" />
        <path d="M20 11.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
      </>
    )}
  </svg>
);

/** A QR code (drawn as one SVG path, on white with its quiet zone). */
function QR({ text, className = "" }: { text: string; className?: string }) {
  const d = useMemo(() => {
    if (!text) return "";
    const m = qrMatrix(text);
    let s = "";
    m.forEach((row, y) => row.forEach((on, x) => on && (s += `M${x + 2} ${y + 2}h1v1h-1z`)));
    return `${m.length + 4}|${s}`;
  }, [text]);
  const [n, path] = d ? d.split("|") : ["25", ""];
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className={`bg-white ${className}`} shapeRendering="crispEdges" role="img" aria-label={text ? `QR code: ${text}` : "QR code"}>
      {path && <path d={path} fill="#072959" />}
    </svg>
  );
}

// ------------------------------------------------------------------ the page

/**
 * The group on one page, set as a magazine advertisement: the logo (exactly as supplied) and the group's line
 * above; then a band for each family of brands, its marks on a slanted panel of colour and its vehicles at dusk
 * beside it; and beneath, the group's strengths and a code to scan for this site.
 */
export default function StrengthH() {
  const { company, dealerships, districts, figures } = useContent();
  const root = useRef<HTMLElement>(null);
  const [url, setUrl] = useState("");
  const states = statesOf(districts);
  const years = figures.find((f) => /year/i.test(f.label))?.value ?? new Date().getFullYear() - company.since;

  // the franchises, by family
  const bands = useMemo(() => {
    const left = [...dealerships];
    return BANDS.map((b) => {
      const mine = left.filter(b.match);
      mine.forEach((d) => left.splice(left.indexOf(d), 1));
      return { ...b, brands: mine };
    }).filter((b) => b.brands.length);
  }, [dealerships]);

  useEffect(() => setUrl(`${window.location.origin}${window.location.pathname}`), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".sg-head > *", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".sg-page", start: "top 80%" } });
        gsap.utils.toArray<HTMLElement>(".sg-band").forEach((b) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: b, start: "top 88%" } });
          tl.from(b.querySelector(".sg-panel"), { xPercent: -14, opacity: 0, duration: 1.1, ease: "expo.out" }).from(b.querySelectorAll(".sg-vehicle"), { x: 90, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.12 }, 0.1);
        });
        gsap.from(".sg-pillar", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".sg-strength", start: "top 88%" } });
      });
    }, root);
    return () => ctx.revert();
  }, [bands.length]);

  const pillars = [
    { icon: "badge" as const, title: `${years}+ Years of Excellence`, text: `Building trust since ${company.since}` },
    { icon: "shield" as const, title: "Trusted Mobility Partner", text: `${numberWord(dealerships.length)} authorised franchises` },
    { icon: "pin" as const, title: "Wide Network", text: `${numberWord(districts.length)} districts across ${joinList(states)}` },
    { icon: "star" as const, title: "Customer Excellence", text: "Service built on trust" },
  ];

  return (
    <section id="group" ref={root} className="bg-[var(--h-pearl)] py-16 md:py-24">
      <div className="h-wrap">
        <article className="sg-page overflow-hidden rounded-[6px] bg-white shadow-[0_50px_100px_-50px_rgba(7,41,89,0.55)] ring-1 ring-black/5" aria-label={`${company.name}: the group and its brands`}>
          {/* ---- the head of the page ---- */}
          <header className="relative overflow-hidden bg-[linear-gradient(180deg,#f6efe2_0%,#ede1ca_70%,#e2d1b2_100%)] px-6 pb-9 pt-9 md:px-12 md:pb-11 md:pt-12">
            <img src="/models/tata-yodha-side.webp" alt="" className="pointer-events-none absolute -bottom-3 right-[22%] hidden w-[42%] opacity-[0.14] mix-blend-multiply md:block" aria-hidden />
            <div className="sg-head relative grid gap-7 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
              <p className="h-serif max-w-[30ch] text-[clamp(1.6rem,2.9vw,2.6rem)] leading-[1.18] text-[var(--h-brand)]">
                Delivering trusted mobility and home solutions across <em className="text-[var(--h-gold-deep)]">commercial vehicles, passenger cars, two-wheelers and home appliances.</em>
              </p>
              <div className="flex flex-col items-start md:items-center">
                <span className="block overflow-hidden rounded-[10px] shadow-[0_10px_26px_-12px_rgba(7,41,89,0.5)] ring-1 ring-[var(--h-gold)]/40" style={{ backgroundColor: LOGO_GROUND }}>
                  <img src={LOGO_JPEG} alt={LOGO_ALT} className="block h-[96px] w-auto md:h-[118px]" />
                </span>
                <p className="mt-3 flex items-center gap-3 text-[11px] font-semibold tracking-[0.36em] text-[var(--h-brand)]/75">
                  <span className="h-px w-7 bg-[var(--h-gold-deep)]/70" />
                  SINCE {company.since}
                  <span className="h-px w-7 bg-[var(--h-gold-deep)]/70" />
                </p>
              </div>
            </div>
          </header>

          {/* ---- a band for each family of brands ---- */}
          {bands.map((b) => {
            const since = firstYear(b.brands);
            const ink = b.light ? "text-white" : "text-[var(--h-brand)]";
            return (
              <div key={b.id} className="sg-band relative flex flex-col overflow-hidden border-t border-white/40 md:block md:h-[clamp(178px,17vw,220px)]">
                {/* its panel of colour, slanted */}
                <div
                  className={`sg-panel relative z-10 px-6 pb-9 pt-6 [clip-path:polygon(0_0,100%_0,100%_84%,0_100%)] md:absolute md:inset-y-0 md:left-0 md:flex md:w-[47%] md:flex-col md:justify-center md:py-0 md:pl-12 md:pr-[9%] md:[clip-path:polygon(0_0,100%_0,82%_100%,0_100%)] ${ink}`}
                  style={{ background: b.panel }}
                >
                  <p className={`flex items-baseline justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] ${b.light ? "text-white/75" : "text-[var(--h-gold-deep)]"}`}>
                    <span>{b.label}</span>
                    {since && <span className="h-serif text-[15px] normal-case italic tracking-normal">Since {since}</span>}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {b.brands.map((d) => (
                      <li key={d.brand} className={`grid h-9 place-items-center rounded-[8px] bg-white px-3 ${b.light ? "" : "ring-1 ring-[var(--h-brand)]/12"}`}>
                        {/* (each mark sized by its own shape: some are drawn without a size, and would otherwise collapse) */}
                        {d.logo ? <img src={d.logo} alt={d.brand} className="h-[18px] object-contain" style={{ width: `${Math.round(18 * (MARK[d.logo] ?? 4))}px` }} /> : <span className="text-[12px] font-bold tracking-[0.04em] text-[var(--h-brand)]">{d.brand}</span>}
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-3 text-[13px] leading-snug ${b.light ? "text-white/85" : "text-[var(--h-ink)]/75"}`}>{b.brands.map((d) => d.brand).join(" · ")}</p>
                </div>
                {/* its vehicles, at dusk (or the appliances on a showroom floor) */}
                <div className="relative -mt-[12%] h-[170px] md:absolute md:inset-0 md:mt-0 md:h-auto" style={{ background: SCENE[b.scene] }}>
                  {b.scene === "dusk" && <Skyline />}
                  <div className="absolute inset-x-[5%] bottom-[7%] top-[16%] flex items-end justify-center gap-[3%] md:left-[47%] md:right-[3%]">
                    {b.vehicles.map((v) => (
                      <img key={v.src} src={v.src} alt={v.alt} loading="lazy" className="sg-vehicle max-w-[48%] object-contain object-bottom drop-shadow-[0_10px_8px_rgba(0,0,0,0.45)]" style={{ height: `${v.h * 100}%`, width: "auto" }} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ---- the group's strengths ---- */}
          <footer className="sg-strength bg-[var(--h-brand)] px-6 pb-9 pt-8 text-white md:px-12 md:pb-10">
            <p className="flex items-center justify-center gap-4 text-center text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--h-gold-2)]">
              <span className="h-px w-10 bg-[var(--h-gold)]/70 md:w-20" />
              The {company.name} strength
              <span className="h-px w-10 bg-[var(--h-gold)]/70 md:w-20" />
            </p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:gap-0">
              {pillars.map((x, k) => (
                <div key={x.title} className={`sg-pillar flex flex-col items-center px-4 text-center ${k ? "lg:border-l lg:border-white/15" : ""}`}>
                  <Icon kind={x.icon} />
                  <p className="h-serif mt-3 text-[1.3rem] leading-tight">{x.title}</p>
                  <p className="mt-1.5 text-[12px] leading-snug text-white/65">{x.text}</p>
                </div>
              ))}
              <div className="sg-pillar flex items-center justify-center gap-4 sm:col-span-2 lg:col-span-1 lg:border-l lg:border-white/15 lg:pl-8">
                <p className="max-w-[9rem] text-right text-[12px] leading-snug text-white/75">
                  Scan to know more about <span className="text-white">{company.name}</span>
                </p>
                <div className="rounded-[8px] bg-white p-1.5 ring-1 ring-[var(--h-gold)]/50">
                  <QR text={url} className="block h-[84px] w-[84px]" />
                </div>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </section>
  );
}
