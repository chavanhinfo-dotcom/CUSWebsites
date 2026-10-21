"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categoryMeta, stopNotes } from "@/lib/content";
import { useContent } from "@/components/e/content";
import { Reveal, SectionHead } from "./ui";

/**
 * The journey as a year picker: every year the group took a step, in a row; the chosen one shows its
 * photograph and what happened. The arrows (and the arrow keys) step through them.
 */
export default function JourneyG() {
  const { milestones, company } = useContent();
  const list = [...milestones].sort((a, b) => a.year - b.year);
  const [at, setAt] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const i = Math.min(at, list.length - 1);
  const cur = list[i];
  const go = (d: number) => setAt((a) => Math.min(list.length - 1, Math.max(0, a + d)));

  // the chosen year is kept in view within its row (the page itself does not move)
  useEffect(() => {
    const r = rail.current, b = r?.querySelector<HTMLElement>(`[data-i="${i}"]`);
    if (r && b) r.scrollTo({ left: b.offsetLeft - r.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
  }, [i]);

  if (!cur) return null;
  const arrow = "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--g-navy)]/[0.06] text-[var(--g-navy)] transition-colors hover:bg-[var(--g-navy)] hover:text-white disabled:pointer-events-none disabled:opacity-30";
  return (
    <section id="journey" className="py-20 md:py-28">
      <div className="g-wrap">
        <SectionHead eyebrow="The journey" title={`${new Date().getFullYear() - company.since} years, year by year.`} text="Choose a year to see the step the group took then." />
        <Reveal className="g-tile mt-10 p-2.5 md:p-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Earlier year" className={`hidden md:grid ${arrow}`}>
              ←
            </button>
            <div ref={rail} role="tablist" aria-label="Years" className="g-row relative flex flex-1 gap-1.5 overflow-x-auto px-3 [mask-image:linear-gradient(to_right,transparent,#000_28px,#000_calc(100%-28px),transparent)]">
              {list.map((m, n) => (
                <button
                  key={`${m.year}-${m.title}`}
                  id={`g-yr-${n}`}
                  data-i={n}
                  type="button"
                  role="tab"
                  aria-selected={n === i}
                  aria-controls="g-year"
                  tabIndex={n === i ? 0 : -1}
                  onClick={() => setAt(n)}
                  onKeyDown={(e) => {
                    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                    if (!d) return;
                    e.preventDefault();
                    const t = Math.min(list.length - 1, Math.max(0, n + d));
                    setAt(t);
                    document.getElementById(`g-yr-${t}`)?.focus();
                  }}
                  className={`h-11 shrink-0 rounded-full px-4 text-[14px] font-bold tabular-nums transition-colors duration-300 ${n === i ? "bg-[var(--g-navy)] text-white" : "text-[var(--g-ink)]/55 hover:bg-[var(--g-navy)]/[0.05] hover:text-[var(--g-navy)]"}`}
                >
                  {m.year}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => go(1)} disabled={i === list.length - 1} aria-label="Later year" className={`hidden md:grid ${arrow}`}>
              →
            </button>
          </div>

          <div id="g-year" role="tabpanel" aria-labelledby={`g-yr-${i}`} className="mt-2.5 overflow-hidden rounded-[22px] bg-[var(--g-bg)] md:mt-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid md:grid-cols-[1.1fr_1fr]">
                <div className="relative aspect-[16/10] bg-[var(--g-navy)] md:aspect-auto md:min-h-[400px]">
                  <img src={cur.image || categoryMeta[cur.category]?.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="flex flex-col p-6 md:p-10">
                  <p className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[var(--g-gold-soft)] px-3 py-1 text-[12px] font-bold text-[var(--g-gold-ink)]">{categoryMeta[cur.category]?.label}</span>
                    <span className="text-[13px] font-semibold text-[var(--g-mute)]">
                      Step {i + 1} of {list.length}
                    </span>
                  </p>
                  <p className="mt-5 text-[length:clamp(56px,7vw,100px)] font-extrabold leading-none tracking-[-0.05em] text-[var(--g-gold)]">{cur.year}</p>
                  <h3 className="mt-3 text-[22px] font-extrabold leading-tight tracking-tight text-[var(--g-navy)] md:text-[28px]">{cur.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--g-mute)]">{stopNotes[cur.category]}</p>
                  <div className="mt-6 flex gap-2 md:mt-auto md:pt-8">
                    <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Earlier year" className={arrow}>
                      ←
                    </button>
                    <button type="button" onClick={() => go(1)} disabled={i === list.length - 1} aria-label="Later year" className={arrow}>
                      →
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
