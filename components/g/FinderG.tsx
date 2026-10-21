"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { initialsOf, safeUrl, useContent, type Dealership } from "@/components/e/content";
import { GROUPS, SectionHead, ease, groupOf, type GroupId } from "./ui";

const firstYear = (d: Dealership) => {
  const ys = d.showrooms.map((s) => s.since).filter((y): y is number => typeof y === "number");
  return ys.length ? Math.min(...ys) : undefined;
};
const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, "")}`;
// everything a search can match: the brand, its business, its showrooms and where they are
const words = (d: Dealership) => [d.brand, d.tag, d.business, ...d.showrooms.flatMap((s) => [s.name, s.city, s.address, s.note])].filter(Boolean).join(" ").toLowerCase();

function Card({ d }: { d: Dealership }) {
  const since = firstYear(d);
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-14 min-w-14 max-w-[150px] place-items-center rounded-2xl border border-[var(--g-line)] bg-[var(--g-tile)] px-3">
          {d.logo ? <img src={d.logo} alt="" className="max-h-7 w-auto max-w-[118px] object-contain" /> : <span className="text-[16px] font-extrabold text-[var(--g-navy)]">{initialsOf(d.brand)}</span>}
        </span>
        {since && <span className="rounded-full bg-[var(--g-gold-soft)] px-3 py-1 text-[12px] font-bold text-[var(--g-gold-ink)]">Since {since}</span>}
      </div>
      <h3 className="mt-5 text-[20px] font-extrabold tracking-tight text-[var(--g-navy)]">{d.brand}</h3>
      <p className="mt-0.5 text-[13px] font-semibold text-[var(--g-mute)]">{d.business}</p>
      <ul className="mt-4 space-y-4 border-t border-[var(--g-line)] pt-4">
        {d.showrooms.map((s) => {
          const site = safeUrl(s.site);
          return (
            <li key={s.name} className="text-[14px] leading-relaxed">
              <p className="font-bold text-[var(--g-ink)]">
                {s.name}
                {s.city && <span className="font-medium text-[var(--g-mute)]"> · {s.city}</span>}
              </p>
              <p className="mt-0.5 text-[var(--g-ink)]/65">{s.note}</p>
              {s.address && <p className="mt-2 text-[13px] text-[var(--g-ink)]/75">{s.address}</p>}
              {(s.sales || s.service || site) && (
                <p className="mt-3 flex flex-wrap gap-2">
                  {s.sales && <a href={tel(s.sales)} className="rounded-full bg-[var(--g-navy)]/[0.06] px-3 py-1.5 text-[12px] font-bold text-[var(--g-navy)] hover:bg-[var(--g-navy)] hover:text-white">Sales · {s.sales}</a>}
                  {s.service && <a href={tel(s.service)} className="rounded-full bg-[var(--g-navy)]/[0.06] px-3 py-1.5 text-[12px] font-bold text-[var(--g-navy)] hover:bg-[var(--g-navy)] hover:text-white">Service · {s.service}</a>}
                  {site && <a href={site} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--g-gold-soft)] px-3 py-1.5 text-[12px] font-bold text-[var(--g-gold-ink)] hover:bg-[var(--g-gold)] hover:text-white">Website ↗</a>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * The showroom finder: every franchise of the group, narrowed by business (the tiles at the top of the page
 * open it on theirs) or by a search for a brand or a city, each with its showrooms and how to reach them.
 */
export default function FinderG() {
  const { dealerships } = useContent();
  const [group, setGroup] = useState<GroupId | "all">("all");
  const [q, setQ] = useState("");
  const all = useMemo(() => dealerships.map((d, i) => ({ d, i, g: groupOf(d.business), words: words(d) })), [dealerships]);
  const count = (id: GroupId | "all") => (id === "all" ? all.length : all.filter((x) => x.g === id).length);
  const query = q.trim().toLowerCase();
  const shown = all.filter((x) => (group === "all" || x.g === group) && (!query || x.words.includes(query)));

  useEffect(() => {
    const on = (e: Event) => {
      setGroup((e as CustomEvent<GroupId>).detail);
      setQ("");
    };
    window.addEventListener("g-pick", on);
    return () => window.removeEventListener("g-pick", on);
  }, []);

  const chips = [{ id: "all" as const, label: "All" }, ...GROUPS].filter((g) => g.id === "all" || count(g.id) > 0);
  return (
    <section id="showrooms" className="py-20 md:py-28">
      <div className="g-wrap">
        <SectionHead eyebrow="Showroom finder" title="Find the right showroom." text="Choose a business or search for a brand or a city: every franchise of the group, with its showrooms." />

        <div className="g-tile mt-10 flex flex-col gap-2.5 p-2.5 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Business" className="flex flex-wrap gap-1.5">
            {chips.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={group === g.id}
                onClick={() => setGroup(g.id)}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-bold transition-colors duration-300 ${group === g.id ? "bg-[var(--g-navy)] text-white" : "text-[var(--g-ink)]/70 hover:bg-[var(--g-navy)]/[0.05]"}`}
              >
                {g.label}
                <span className={`text-[12px] font-semibold ${group === g.id ? "text-white/60" : "text-[var(--g-mute)]"}`}>{count(g.id)}</span>
              </button>
            ))}
          </div>
          <label className="relative block md:w-[300px]">
            <span className="sr-only">Search for a brand or a city</span>
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--g-mute)]" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a brand or a city"
              className="h-11 w-full rounded-full bg-[var(--g-navy)]/[0.05] pl-11 pr-4 text-[14px] font-medium text-[var(--g-ink)] outline-none transition-shadow placeholder:text-[var(--g-mute)] focus:shadow-[0_0_0_2px_var(--g-gold)]"
            />
          </label>
        </div>

        <p aria-live="polite" className="mt-5 px-1 text-[13px] font-semibold text-[var(--g-mute)]">
          {shown.length === all.length ? `All ${all.length} franchises` : `${shown.length} of ${all.length} franchises`}
        </p>

        <MotionConfig reducedMotion="user">
          <motion.div layout className="mt-4 grid items-start gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map(({ d, i }) => (
                <motion.article
                  key={`${d.brand}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease }}
                  className="g-tile flex flex-col p-5 md:p-6"
                >
                  <Card d={d} />
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </MotionConfig>

        {!shown.length && (
          <div className="g-tile mt-4 flex flex-col items-center gap-4 px-6 py-14 text-center">
            <p className="text-[16px] font-semibold text-[var(--g-navy)]">No franchise matches “{q.trim()}”.</p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setGroup("all");
              }}
              className="rounded-full bg-[var(--g-navy)] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[var(--g-gold)]"
            >
              Show all franchises
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
