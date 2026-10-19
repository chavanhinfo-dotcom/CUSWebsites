"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { scrollToHash } from "@/lib/lenis";
import { useContent, type Dealership } from "./content";
import { ease } from "./ui";

/**
 * "Select a dealership" (after herbchambers.com): a grid of the group's brand logos; choosing one boxes it
 * and opens a panel under its row with that brand's showrooms (empty fields are not shown). The brands and
 * showrooms are edited on the admin page (built-in list: content.tsx); a brand without a logo is set as a
 * wordmark.
 */

// logos per row, by screen width (the selected brand's panel opens under its row)
const columns = (w: number) => (w < 640 ? 2 : w < 1024 ? 3 : 6);

export default function DealersX() {
  const { dealerships: FRANCHISES } = useContent();
  // nothing is open until a logo is chosen; choosing it again closes it
  const [sel, setSel] = useState<number | null>(null);
  const [cols, setCols] = useState(5);
  useEffect(() => {
    const fit = () => setCols(columns(window.innerWidth));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const rows: Dealership[][] = [];
  for (let i = 0; i < FRANCHISES.length; i += cols) rows.push(FRANCHISES.slice(i, i + cols));
  const selRow = sel === null ? -1 : Math.floor(sel / cols);
  const f = sel === null ? null : FRANCHISES[sel] ?? null;

  const panel = f && (
    <motion.div
      key={`panel-${selRow}`}
      id="dealer-panel"
      role="tabpanel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.5, ease }}
      className="overflow-hidden"
    >
      <div className="border border-x-black/15 bg-[#ececea] p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={f.brand} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}>
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {f.showrooms.map((s, si) => (
                <article key={`${si}-${s.name}`} className="flex flex-col justify-between border border-x-black/15 bg-white p-5 md:p-7">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#2a5bd7]">{s.name}</h3>
                    {s.address && <p className="mt-2 text-[15px] font-semibold">{s.address}</p>}
                    <p className="micro mt-2 text-x-gold">
                      {s.since ? `Since ${s.since} · ` : ""}{s.city ? `${s.city} · ` : ""}{f.business}
                    </p>
                    <p className="mt-3 max-w-md text-[14px] leading-relaxed text-x-mute">{s.note}</p>
                    {(s.sales || s.service) && (
                      <ul className="mt-4 space-y-1 text-[15px] font-semibold">
                        {s.sales && <li>Sales: <a href={`tel:${s.sales.replace(/[^\d+]/g, "")}`}>{s.sales}</a></li>}
                        {s.service && <li>Service/Parts: <a href={`tel:${s.service.replace(/[^\d+]/g, "")}`}>{s.service}</a></li>}
                      </ul>
                    )}
                  </div>
                  <div className="mt-6 flex flex-wrap justify-end gap-x-8 gap-y-2 text-[14px] font-semibold text-[#2a5bd7]">
                    {s.site && <a href={s.site} target="_blank" rel="noreferrer" className="hover:underline">Visit Site</a>}
                    <a href="#presence" className="hover:underline">Find Us</a>
                    <a href="#contact" className="hover:underline">Enquire</a>
                    <a href="#contact" className="hover:underline">Schedule Service</a>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#businesses" className="bg-x-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-x-gold hover:text-x-black">
                Explore all {f.business.toLowerCase()}
              </a>
              <a href="#contact" className="border border-x-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-x-black hover:text-white">
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
      id="dealerships"
      className="relative bg-x-white px-4 pb-16 pt-12 text-x-black md:px-8 md:pb-24 md:pt-16"
      onClick={(e) => {
        // in-page links glide there with the page's smooth scroll
        const href = (e.target as HTMLElement).closest("a")?.getAttribute("href");
        if (href?.startsWith("#")) {
          e.preventDefault();
          scrollToHash(href);
        }
      }}
    >
      <h2 className="text-center">
        <span className="wide inline-block bg-x-black px-4 py-2 text-[clamp(20px,2.4vw,34px)] text-white">Select a dealership</span>
      </h2>
      <p className="micro mt-4 text-center text-x-mute">Choose a brand to see its showrooms</p>

      <div role="tablist" aria-label="Brands" className="mx-auto mt-10 max-w-6xl">
        {rows.map((row, r) => (
          <div key={r}>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {row.map((x) => {
                const i = FRANCHISES.indexOf(x);
                const on = i === sel;
                return (
                  <button
                    key={`${i}-${x.brand}`}
                    role="tab"
                    aria-selected={on}
                    aria-controls="dealer-panel"
                    aria-label={x.brand}
                    aria-expanded={on}
                    onClick={() => setSel(on ? null : i)}
                    className={`group relative flex h-24 flex-col items-center justify-center gap-1.5 border-2 px-3 transition-colors duration-300 md:h-28 ${on ? "border-x-black" : "border-transparent hover:border-x-black/10"}`}
                  >
                    {x.logo ? (
                      <img
                        src={x.logo}
                        alt=""
                        className={`max-h-9 max-w-[78%] object-contain transition-transform duration-300 md:max-h-11 ${on ? "" : "group-hover:scale-105"}`}
                      />
                    ) : (
                      <span className="wide text-center text-[clamp(13px,1.2vw,17px)] !leading-[1.05] text-x-black/80">{x.brand}</span>
                    )}
                    {x.tag && <span className="micro !text-[9px] text-x-mute">{x.tag}</span>}
                  </button>
                );
              })}
            </div>
            <AnimatePresence initial={false}>{r === selRow && panel}</AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

