"use client";
import { motion } from "framer-motion";
import { numberWord, safeUrl, useContent, type Dealership } from "@/components/e/content";
import { Heading, Label, Reveal, ease } from "./ui";

// a picture for each franchise: its product cut out (cut: shown whole on a plain ground) or a photograph.
// Matched on the brand's name, so franchises added on the admin page find one too (else by their business)
const PICTURES: [RegExp, string, boolean][] = [
  [/samsung/i, "/models/samsung-lineup.webp", true],
  [/premia|harley/i, "/models/harley-x440-side.webp", true],
  [/enfield/i, "/models/royal-enfield-bullet-350-side.webp", true],
  [/ather/i, "/models/ather-450-side.webp", true],
  [/kinetic/i, "/models/kinetic-honda-zx-side.webp", true],
  [/nexa/i, "/images/showroom-luxury.jpg", false],
  [/tata/i, "/models/tata-yodha-side.webp", true],
  [/maruti.*commercial/i, "/models/maruti-super-carry-side.webp", true],
  [/hero/i, "/models/hero-splendor-plus-side.webp", true],
  [/arena|maruti/i, "/models/maruti-brezza-side.webp", true],
];
const BY_BUSINESS: [RegExp, string][] = [
  [/appliance/i, "/images/appliance-fridge.jpg"],
  [/commercial|truck/i, "/images/truck-red.jpg"],
  [/scooter|electric/i, "/images/scooter-blue.jpg"],
  [/wheeler|motorcycle|bike/i, "/images/bike-road.jpg"],
  [/car/i, "/images/hero-showroom.jpg"],
];
function pictureOf(d: Dealership) {
  const hit = PICTURES.find(([re]) => re.test(`${d.brand} ${d.tag ?? ""}`));
  if (hit) return { src: hit[1], cut: hit[2] };
  return { src: BY_BUSINESS.find(([re]) => re.test(d.business))?.[1] ?? "/images/hero-showroom.jpg", cut: false };
}
const firstYear = (d: Dealership) => {
  const ys = d.showrooms.map((s) => s.since).filter((y): y is number => typeof y === "number");
  return ys.length ? Math.min(...ys) : undefined;
};
const tel = (s: string) => `tel:${s.replace(/[^\d+]/g, "")}`;

function Card({ d, i }: { d: Dealership; i: number }) {
  const pic = pictureOf(d);
  const since = firstYear(d);
  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.9, delay: (i % 3) * 0.08, ease }}
      className="group flex w-[82vw] max-w-[380px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border border-[var(--f-navy)]/10 bg-[var(--f-ivory)] shadow-[0_1px_2px_rgba(7,41,89,0.04)] transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(7,41,89,0.35)] md:w-auto md:max-w-none"
    >
      <div className={`relative aspect-[16/10] overflow-hidden ${pic.cut ? "bg-[radial-gradient(ellipse_at_50%_80%,#ffffff_35%,#f9f7f2)]" : "bg-[var(--f-deep)]"}`}>
        {pic.cut ? (
          <img src={pic.src} alt="" loading="lazy" className="absolute inset-x-[10%] bottom-[13%] h-[60%] w-[80%] object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
        ) : (
          <img src={pic.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
        )}
        {d.logo && (
          <span className="absolute left-4 top-4 grid h-9 place-items-center rounded-full bg-white px-3.5 shadow-[0_4px_14px_rgba(7,41,89,0.08)]">
            <img src={d.logo} alt="" className="h-4 w-auto max-w-[96px] object-contain" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <p className="f-label flex items-center justify-between gap-3 text-[var(--f-gold)]">
          <span>{d.business}</span>
          {since && <span className="text-[var(--f-mute)]">Since {since}</span>}
        </p>
        <h3 className="f-display mt-3 text-[30px] leading-tight text-[var(--f-navy)] md:text-[32px]">{d.brand}</h3>
        <div className="mt-4 space-y-4 border-t border-[var(--f-navy)]/10 pt-4">
          {d.showrooms.map((s) => {
            const site = safeUrl(s.site);
            return (
              <div key={s.name} className="text-[14px] leading-relaxed">
                {d.showrooms.length > 1 && (
                  <p className="font-semibold text-[var(--f-navy)]">
                    {s.name}
                    {s.city && <span className="font-normal text-[var(--f-mute)]"> · {s.city}</span>}
                  </p>
                )}
                <p className="text-[var(--f-ink)]/65">{s.note}</p>
                {(s.address || s.sales || s.service || site) && (
                  <div className="mt-2 space-y-1 text-[13px] text-[var(--f-ink)]/80">
                    {s.address && <p>{s.address}</p>}
                    {s.sales && <a className="block hover:text-[var(--f-gold)]" href={tel(s.sales)}>Sales · {s.sales}</a>}
                    {s.service && <a className="block hover:text-[var(--f-gold)]" href={tel(s.service)}>Service · {s.service}</a>}
                    {site && <a className="block font-semibold text-[var(--f-navy)] hover:text-[var(--f-gold)]" href={site} target="_blank" rel="noopener noreferrer">Visit the website ↗</a>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.article>
  );
}

/**
 * The franchises as a quiet grid of cards: each brand's product (or showroom), its mark, its business, the
 * year it opened, and its showrooms. On a phone the cards sit in one row that is swiped through.
 */
export default function FranchisesF() {
  const { dealerships } = useContent();
  return (
    <section id="franchises" className="bg-[var(--f-cream)] py-24 md:py-32">
      <div className="f-wrap">
        <Reveal className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-10">
          <div>
            <Label>Our franchises</Label>
            <Heading text={`${numberWord(dealerships.length)} franchises, all *family-run*.`} className="mt-6 text-[length:clamp(36px,4.6vw,64px)] text-[var(--f-navy)]" />
          </div>
          <p className="max-w-md text-[16px] leading-relaxed text-[var(--f-ink)]/70 md:justify-self-end">
            Authorised dealerships for the names that power India’s homes and roads.
          </p>
        </Reveal>
        <p className="f-label mt-10 flex items-center gap-3 text-[var(--f-mute)] md:hidden" aria-hidden>
          Swipe to see all {dealerships.length}
          <span className="h-px w-8 bg-[var(--f-gold)]" />
        </p>
        <div className="f-swipe -mx-5 mt-5 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:mx-0 md:mt-14 md:grid md:snap-none md:grid-cols-2 md:items-stretch md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-3">
          {dealerships.map((d, i) => (
            <Card key={`${d.brand}-${i}`} d={d} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
