"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollToHash } from "@/lib/lenis";
import { numberWord, safeUrl, useContent, type Dealership } from "@/components/e/content";

const ease = [0.22, 1, 0.36, 1] as const;
// marques per row, by screen width (the chosen marque's showrooms open under its row)
const columns = (w: number) => (w < 640 ? 2 : w < 1024 ? 3 : 6);
const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, "")}`;

/**
 * "The marques we represent", chosen as in option E's "Select a dealership": a grid of the group's brand marks;
 * choosing one frames it in gold and opens a panel beneath its row with that marque's showrooms (empty fields
 * are not shown) and where to go next; choosing it again closes it. Brands and showrooms are edited on the
 * admin page; a brand without a logo is set as a wordmark.
 */
export default function ShowroomsH() {
  const { dealerships } = useContent();
  const root = useRef<HTMLElement>(null);
  // nothing is open until a marque is chosen; choosing it again closes it
  const [sel, setSel] = useState<number | null>(null);
  const [cols, setCols] = useState(6);

  useEffect(() => {
    const fit = () => setCols(columns(window.innerWidth));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".sr-head > *", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".sr-head", start: "top 85%" } });
        gsap.from(".sr-mark", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.04, scrollTrigger: { trigger: ".sr-grid", start: "top 85%" } });
      });
    }, root);
    return () => ctx.revert();
  }, [dealerships.length]);

  // (opening or closing a panel changes the page's height: the scroll positions below are measured again)
  const remeasure = () => ScrollTrigger.refresh();

  const rows: Dealership[][] = [];
  for (let i = 0; i < dealerships.length; i += cols) rows.push(dealerships.slice(i, i + cols));
  const selRow = sel === null ? -1 : Math.floor(sel / cols);
  const f = sel === null ? null : dealerships[sel] ?? null;

  const panel = f && (
    <motion.div key={`panel-${selRow}`} id="marque-panel" role="tabpanel" aria-label={`${f.brand} showrooms`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.6, ease }} onAnimationComplete={remeasure} className="overflow-hidden">
      <div className="my-3 rounded-[24px] border border-[var(--h-gold)]/35 bg-[var(--h-pearl)] p-4 md:my-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={f.brand} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 px-1 md:mb-7">
              <p className="h-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-none text-[var(--h-brand)]">
                {f.brand}
                {f.tag && !f.brand.toLowerCase().includes(f.tag.toLowerCase()) && <span className="ml-3 italic text-[var(--h-gold-deep)]">{f.tag}</span>}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--h-gold-deep)]">
                {f.business} · {f.showrooms.length} {f.showrooms.length === 1 ? "showroom" : "showrooms"}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              {f.showrooms.map((s, si) => {
                const site = safeUrl(s.site);
                return (
                  <article key={`${si}-${s.name}`} className="flex flex-col justify-between rounded-[18px] border border-[var(--h-ink)]/10 bg-[var(--h-ivory)] p-5 shadow-[0_18px_40px_-30px_rgba(7,41,89,0.5)] md:p-7">
                    <div>
                      <h3 className="h-serif text-[1.65rem] leading-tight text-[var(--h-brand)]">{s.name}</h3>
                      {s.address && <p className="mt-2 text-[15px] font-semibold text-[var(--h-ink)]">{s.address}</p>}
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--h-gold-deep)]">
                        {s.since ? `Since ${s.since} · ` : ""}
                        {s.city ? `${s.city} · ` : ""}
                        {f.business}
                      </p>
                      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[var(--h-ink)]/65">{s.note}</p>
                      {(s.sales || s.service) && (
                        <ul className="mt-4 space-y-1 text-[15px] font-semibold text-[var(--h-ink)]">
                          {s.sales && (
                            <li>
                              Sales:{" "}
                              <a href={tel(s.sales)} className="underline decoration-[var(--h-gold)]/60 underline-offset-4 hover:text-[var(--h-gold-deep)]">
                                {s.sales}
                              </a>
                            </li>
                          )}
                          {s.service && (
                            <li>
                              Service / parts:{" "}
                              <a href={tel(s.service)} className="underline decoration-[var(--h-gold)]/60 underline-offset-4 hover:text-[var(--h-gold-deep)]">
                                {s.service}
                              </a>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-x-6 gap-y-2 border-t border-[var(--h-ink)]/[0.08] pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--h-brand)]">
                      {site && (
                        <a href={site} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--h-gold-deep)]">
                          Visit site ↗
                        </a>
                      )}
                      <a href="#presence" className="hover:text-[var(--h-gold-deep)]">
                        Find us
                      </a>
                      <a href="#contact" className="hover:text-[var(--h-gold-deep)]">
                        Enquire
                      </a>
                      <a href="#contact" className="hover:text-[var(--h-gold-deep)]">
                        Schedule service
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:mt-8">
              <a href="#houses" className="rounded-full bg-[var(--h-brand)] px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-[var(--h-gold)] hover:text-[var(--h-night)]">
                Explore all {f.business.toLowerCase()}
              </a>
              <a href="#contact" className="rounded-full border border-[var(--h-ink)]/25 px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--h-ink)] transition-colors duration-500 hover:border-[var(--h-gold)] hover:bg-[var(--h-gold)] hover:text-[var(--h-night)]">
                Enquire about {f.brand}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <section
      id="showrooms"
      ref={root}
      className="bg-[var(--h-ivory)] py-24 text-[var(--h-ink)] md:py-36"
      onClick={(e) => {
        // in-page links glide there with the page's smooth scroll
        const href = (e.target as HTMLElement).closest("a")?.getAttribute("href");
        if (href?.startsWith("#")) {
          e.preventDefault();
          scrollToHash(href);
        }
      }}
    >
      <div className="h-wrap">
        <div className="sr-head grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <p className="h-eyebrow h-dark">Explore our brands</p>
            <h2 className="h-serif mt-5 text-[clamp(2.6rem,5vw,4.8rem)] leading-[1] text-[var(--h-brand)]">
              The marques <span className="italic text-[var(--h-gold-deep)]">we represent.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-[var(--h-mute)] md:justify-self-end md:text-[16px]">
            {numberWord(dealerships.length)} authorised franchises, every one of them run by the family. Choose a marque to see its showrooms.
          </p>
        </div>

        <div role="tablist" aria-label="Brands" className="sr-grid mt-14 border-y border-[var(--h-gold-deep)]/20 md:mt-20">
          {rows.map((row, r) => (
            <div key={r} className={r ? "border-t border-[var(--h-gold-deep)]/15" : ""}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {row.map((x) => {
                  const i = dealerships.indexOf(x);
                  const on = i === sel;
                  return (
                    <button
                      key={`${i}-${x.brand}`}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="marque-panel"
                      aria-expanded={on}
                      aria-label={x.tag && !x.brand.toLowerCase().includes(x.tag.toLowerCase()) ? `${x.brand} ${x.tag}` : x.brand}
                      onClick={() => setSel(on ? null : i)}
                      className="sr-mark group relative flex h-28 flex-col items-center justify-center gap-2 px-3 md:h-32"
                    >
                      {/* the frame that marks the chosen marque, with a small pointer down to its showrooms */}
                      <span className={`pointer-events-none absolute inset-2 rounded-[16px] border transition-all duration-500 ${on ? "border-[var(--h-gold)] bg-[var(--h-pearl)] shadow-[0_14px_30px_-20px_rgba(148,112,31,0.7)]" : "border-transparent group-hover:border-[var(--h-gold-deep)]/20"}`} aria-hidden />
                      <span className={`pointer-events-none absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[var(--h-gold)] bg-[var(--h-pearl)] transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0"}`} aria-hidden />
                      {x.logo ? (
                        <img src={x.logo} alt="" loading="lazy" className={`relative max-h-9 max-w-[74%] object-contain transition-all duration-500 md:max-h-11 ${on ? "opacity-100" : "opacity-80 group-hover:scale-105 group-hover:opacity-100"}`} />
                      ) : (
                        <span className={`h-serif relative text-center text-[clamp(1.15rem,1.6vw,1.45rem)] leading-[1.05] transition-colors duration-500 ${on ? "text-[var(--h-brand)]" : "text-[var(--h-ink)]/75 group-hover:text-[var(--h-brand)]"}`}>{x.brand}</span>
                      )}
                      {x.tag && <span className="relative text-[9px] font-semibold uppercase tracking-[0.26em] text-[var(--h-gold-deep)]">{x.tag}</span>}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence initial={false} onExitComplete={remeasure}>
                {r === selRow && panel}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
