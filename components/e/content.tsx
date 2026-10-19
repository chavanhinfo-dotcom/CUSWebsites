"use client";
// Option E's editable content: its shape, the built-in content (what the site ships with), the checks
// applied to anything read from the database, and the provider the sections read it from. The site renders
// the built-in content at once (and in the static HTML), fetches the live content as it loads, and holds its
// 3D builds (and the preloader) until that has arrived, or for at most a few seconds, so each scene is built
// once, with the live content. Edited on /option-e/admin.
import { createContext, useContext, useEffect, useState } from "react";
import { categoryMeta, company as baseCompany, faq as baseFaq, legacy, milestones as baseMilestones, presence, stats, type Category } from "@/lib/content";
import { holdBuilds, trackAsset } from "./loading";
import { fetchRows, supabaseReady, type Row } from "./supabase";

export type Milestone = { year: number; title: string; short: string; category: Category; image?: string };
export type Showroom = { name: string; since?: number; note: string; city?: string; address?: string; sales?: string; service?: string; site?: string };
export type Dealership = { brand: string; logo?: string; tag?: string; business: string; showrooms: Showroom[] };
export type Leader = { name: string; initials: string; role: string; text: string; photo?: string };
export type Generation = { generation: string; era: string; people: Leader[] };
export type Faq = { q: string; a: string };
export type Figure = { value: number; suffix: string; label: string };
export type Company = { name: string; tagline: string; since: number; hq: string; motto: string; address?: string; phone?: string; email?: string };
export type District = { name: string; state: string; lat: number; lon: number; hq: boolean };
// a photograph in the family gallery (`src` empty: a frame awaiting its photograph, in the built-in list)
export type Photo = { src?: string; caption: string; album: string; year?: number };
export type SiteContent = {
  milestones: Milestone[];
  dealerships: Dealership[];
  leadership: Generation[];
  gallery: Photo[];
  faq: Faq[];
  figures: Figure[];
  company: Company;
  districts: District[];
};
export const SECTION_KEYS = ["milestones", "dealerships", "leadership", "gallery", "faq", "figures", "company", "districts"] as const;
export const ALBUMS = ["Family", "Celebrations", "Milestones", "Showrooms", "Team", "Community"];
export type SectionKey = (typeof SECTION_KEYS)[number];
export const CATEGORIES = Object.keys(categoryMeta) as Category[];
export const MAX_FIGURES = 4;

// ---------------------------------------------------------------- built-in content

// the group's dealerships: only facts from the company profile (add addresses, phones and websites as they
// are confirmed; empty fields are not shown). Logos are in /public/brands
const DEALERSHIPS: Dealership[] = [
  { brand: "Samsung", logo: "/brands/samsung.svg", business: "Home appliances", showrooms: [
    { name: "Samsung Exclusive Plaza", since: 2005, note: "Bespoke AI refrigerators, washers, ovens, dishwashers and vacuums." },
  ] },
  { brand: "Hero MotoCorp", logo: "/brands/hero.svg", business: "Two-wheelers", showrooms: [
    { name: "Hero MotoCorp dealership", since: 2007, note: "Opened as a Hero Honda dealership. Splendor+ and the full Hero range." },
  ] },
  { brand: "Hero Premia", logo: "/brands/hero.svg", tag: "Premia", business: "Premium two-wheelers", showrooms: [
    { name: "Hero MotoCorp Premia", since: 2025, note: "Hero's premium showroom format for its larger motorcycles and scooters." },
  ] },
  { brand: "Harley-Davidson", logo: "/brands/harley.svg", business: "Premium motorcycles", showrooms: [
    { name: "Harley-Davidson", note: "Harley-Davidson X440 and the Harley-Davidson range, through Hero MotoCorp." },
  ] },
  { brand: "VIDA", logo: "/brands/vida.png", business: "Electric scooters", showrooms: [
    { name: "VIDA", note: "VIDA electric scooters, Hero MotoCorp's electric brand." },
  ] },
  { brand: "Royal Enfield", logo: "/brands/royalenfield.svg", business: "Motorcycles", showrooms: [
    { name: "Royal Enfield dealership", since: 2015, note: "Bullet 350, Classic 350 and the Royal Enfield range." },
  ] },
  { brand: "Ather Electric", logo: "/brands/ather.png", business: "Electric scooters", showrooms: [
    { name: "Ather Electric dealership", since: 2023, note: "Ather Rizta and the 450 series electric scooters." },
  ] },
  { brand: "Kinetic Honda", business: "Two-wheelers", showrooms: [
    { name: "Kinetic Engineering & Kinetic Honda", since: 1990, note: "The group's first two-wheeler dealership." },
  ] },
  { brand: "Maruti Suzuki Arena", logo: "/brands/maruti.svg", tag: "Arena", business: "Passenger cars", showrooms: [
    { name: "Maruti Suzuki Arena", since: 2010, note: "Opened as a Maruti Suzuki dealership; upgraded to the Arena format in 2019. Swift and the Arena range." },
  ] },
  { brand: "Nexa", logo: "/brands/nexa.png", business: "Premium cars", showrooms: [
    { name: "Nexa", since: 2016, note: "Grand Vitara and Maruti Suzuki's premium Nexa range." },
    { name: "Nexa Bijapur", since: 2022, city: "Bijapur, Karnataka", note: "The group's Nexa showroom in Karnataka." },
  ] },
  { brand: "Tata Commercial", logo: "/brands/tatamotors.svg", tag: "Commercial", business: "Commercial vehicles", showrooms: [
    { name: "Tata Commercial SCV", since: 2013, note: "Small commercial vehicles: Tata Ace and the SCV range." },
    { name: "Tata Commercial · Full range", since: 2016, note: "Light pickups to heavy-duty trucks, including the Tata Signa." },
  ] },
  { brand: "Maruti Commercial", logo: "/brands/maruti.svg", tag: "Commercial", business: "Commercial vehicles", showrooms: [
    { name: "Maruti Suzuki Commercial", since: 2017, note: "Super Carry and Maruti Suzuki's commercial range." },
  ] },
];

export const DEFAULT_CONTENT: SiteContent = {
  milestones: baseMilestones.map((m) => ({ ...m })),
  dealerships: DEALERSHIPS,
  leadership: legacy.map((g) => ({ generation: g.generation, era: g.era, people: g.people.map((p) => ({ ...p })) })),
  // the frames the family's photographs will fill (added on the admin page, which replaces this list)
  gallery: [
    { caption: "The Chavan family", album: "Family" },
    { caption: "Where it began", album: "Family", year: 1960 },
    { caption: "Three generations together", album: "Family" },
    { caption: "Showroom openings", album: "Milestones" },
    { caption: "Festivals and celebrations", album: "Celebrations" },
    { caption: "Our people across the showrooms", album: "Team" },
    { caption: "Moments with our customers", album: "Showrooms" },
  ],
  faq: baseFaq.map((f) => ({ ...f })),
  figures: [
    { value: stats[0].value, suffix: "+", label: "Years of trust" },
    { value: baseMilestones.length, suffix: "", label: "Milestones since 1960" },
    { value: stats[2].value, suffix: "+", label: "Brand partnerships" },
    { value: stats[4].value, suffix: "", label: "Districts served" },
  ],
  company: { ...baseCompany },
  districts: presence.flatMap((s) => s.districts.map((d) => ({ name: d.name, state: s.state, lat: d.lat, lon: d.lon, hq: "hq" in d && Boolean(d.hq) }))),
};

// ---------------------------------------------------------------- checks on what is read back

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
const opt = (v: unknown, max = 2000) => text(v, max) || undefined;
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const list = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : []);
/** A link or picture address the site will use: a site path or a web address, nothing else. */
export const safeUrl = (v: unknown) => {
  const s = text(v, 1000);
  return s && (/^https?:\/\//i.test(s) || (s.startsWith("/") && !s.startsWith("//"))) ? s : undefined;
};

/** Initials from a name, skipping honorifics ("Late Mr. Ambadas U. Chavan" → "AC"). */
export function initialsOf(name: string) {
  const words = name.replace(/[^\p{L}\s.]/gu, " ").split(/\s+/).filter((w) => w && !/^(late|mr|mrs|ms|dr|shri|smt)\.?$/i.test(w));
  const parts = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return parts.map((w) => w[0]).join("").toUpperCase().slice(0, 3) || "·";
}

export function cleanMilestones(v: unknown): Milestone[] | null {
  const seen = new Set<number>();
  const out = list(v)
    .map((m) => ({
      year: Math.round(num(m.year) ?? NaN),
      title: text(m.title, 160),
      short: text(m.short, 60) || text(m.title, 60),
      category: (CATEGORIES.includes(m.category as Category) ? m.category : "heritage") as Category,
      image: safeUrl(m.image),
    }))
    .filter((m) => m.year >= 1800 && m.year <= 2200 && m.title && !seen.has(m.year) && seen.add(m.year))
    .sort((a, b) => a.year - b.year);
  return out.length >= 2 ? out : null; // (the journey needs at least two stops)
}

export function cleanDealerships(v: unknown): Dealership[] | null {
  const out = list(v)
    .map((d) => ({
      brand: text(d.brand, 80),
      logo: safeUrl(d.logo),
      tag: opt(d.tag, 30),
      business: text(d.business, 80),
      showrooms: list(d.showrooms)
        .map((s) => ({
          name: text(s.name, 120),
          since: num(s.since) !== undefined ? Math.round(num(s.since)!) : undefined,
          note: text(s.note, 600),
          city: opt(s.city, 80),
          address: opt(s.address, 300),
          sales: opt(s.sales, 40),
          service: opt(s.service, 40),
          site: safeUrl(s.site),
        }))
        .filter((s) => s.name),
    }))
    .filter((d) => d.brand && d.showrooms.length);
  return out.length ? out : null;
}

export function cleanLeadership(v: unknown): Generation[] | null {
  const out = list(v)
    .map((g) => ({
      generation: text(g.generation, 60),
      era: text(g.era, 60),
      people: list(g.people)
        .map((p) => {
          const name = text(p.name, 100);
          return { name, initials: text(p.initials, 3).toUpperCase() || initialsOf(name), role: text(p.role, 80), text: text(p.text, 800), photo: safeUrl(p.photo) };
        })
        .filter((p) => p.name),
    }))
    .filter((g) => g.generation && g.people.length);
  return out.length ? out : null;
}

export function cleanFaq(v: unknown): Faq[] | null {
  const out = list(v).map((f) => ({ q: text(f.q, 300), a: text(f.a, 2000) })).filter((f) => f.q && f.a);
  return out.length ? out : null;
}

export function cleanFigures(v: unknown): Figure[] | null {
  const out = list(v)
    .map((f) => ({ value: num(f.value) ?? NaN, suffix: text(f.suffix, 4), label: text(f.label, 60) }))
    .filter((f) => Number.isFinite(f.value) && f.label)
    .slice(0, MAX_FIGURES);
  return out.length ? out : null;
}

export function cleanCompany(v: unknown): Company | null {
  if (!isObj(v)) return null;
  const d = DEFAULT_CONTENT.company;
  const since = num(v.since);
  return {
    name: text(v.name, 120) || d.name,
    tagline: text(v.tagline, 160) || d.tagline,
    since: since !== undefined && since >= 1800 && since <= 2200 ? Math.round(since) : d.since,
    hq: text(v.hq, 120) || d.hq,
    motto: text(v.motto, 120) || d.motto,
    address: opt(v.address, 300),
    phone: opt(v.phone, 40),
    email: opt(v.email, 120),
  };
}

export function cleanDistricts(v: unknown): District[] | null {
  const out = list(v)
    .map((d) => ({ name: text(d.name, 60), state: text(d.state, 60), lat: num(d.lat) ?? NaN, lon: num(d.lon) ?? NaN, hq: d.hq === true }))
    .filter((d) => d.name && d.state && Math.abs(d.lat) <= 90 && Math.abs(d.lon) <= 180);
  if (!out.length) return null;
  // exactly one head office: the first one marked, or else the first district
  const hq = Math.max(0, out.findIndex((d) => d.hq));
  return out.map((d, i) => ({ ...d, hq: i === hq }));
}

export function cleanGallery(v: unknown): Photo[] | null {
  const out = list(v)
    .map((p) => {
      const year = num(p.year);
      return { src: safeUrl(p.src), caption: text(p.caption, 160), album: text(p.album, 40) || "Family", year: year !== undefined && year >= 1800 && year <= 2200 ? Math.round(year) : undefined };
    })
    .filter((p) => p.src); // (saved photographs only: every one needs its picture)
  return out.length ? out : null;
}

export const CLEAN: { [K in SectionKey]: (v: unknown) => SiteContent[K] | null } = {
  gallery: cleanGallery,
  milestones: cleanMilestones,
  dealerships: cleanDealerships,
  leadership: cleanLeadership,
  faq: cleanFaq,
  figures: cleanFigures,
  company: cleanCompany,
  districts: cleanDistricts,
};

/** The built-in content with each section that is saved (and passes its checks) put in its place. */
export function mergeContent(rows: Row[]): SiteContent {
  const out: SiteContent = { ...DEFAULT_CONTENT };
  for (const r of rows) {
    if (!(SECTION_KEYS as readonly string[]).includes(r.key)) continue;
    const key = r.key as SectionKey;
    const v = CLEAN[key](r.value);
    if (v) (out as Record<SectionKey, unknown>)[key] = v;
  }
  return out;
}

// ---------------------------------------------------------------- wording drawn from the content

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
export const numberWord = (n: number) => WORDS[n] ?? String(n);
export const joinList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
export const statesOf = (d: District[]) => [...new Set(d.map((x) => x.state))];
export const headOffice = (d: District[]) => d.find((x) => x.hq) ?? d[0];
/** "Solapur and Dharashiv in Maharashtra; Bijapur and Bagalkot in Karnataka." */
export const districtsLine = (d: District[]) => `${statesOf(d).map((s) => `${joinList(d.filter((x) => x.state === s).map((x) => x.name))} in ${s}`).join("; ")}.`;

// ---------------------------------------------------------------- the provider

const Ctx = createContext<SiteContent>(DEFAULT_CONTENT);
export const useContent = () => useContext(Ctx);

// one fetch per page load, started before the sections queue their 3D builds (which it holds back)
let live: Promise<SiteContent | null> | null = null;
let release: (() => void) | null = null;
let arrived: (() => void) | null = null;
function startLive() {
  if (live || typeof window === "undefined") return live;
  if (!supabaseReady) return (live = Promise.resolve(null));
  release = holdBuilds();
  arrived = trackAsset();
  // (a slow or unreachable database never holds the opening up for long: the built-in content is used)
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 2500));
  live = Promise.race([fetchRows().then(mergeContent), timeout]).catch(() => null);
  return live;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [ready, setReady] = useState(false);
  startLive();
  useEffect(() => {
    let alive = true;
    (startLive() ?? Promise.resolve(null)).then((c) => {
      if (!alive) return;
      if (c) setContent(c);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // (this runs after the commit in which the sections took the live content and queued their builds)
    release?.();
    arrived?.();
    release = arrived = null;
  }, [ready]);
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}
