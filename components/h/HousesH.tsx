"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";
import { verticals } from "@/lib/content";
import { numberWord } from "@/components/e/content";

// each business's product, cut out of its studio picture; the car's and the truck's wheels are separate
// pictures centred on their true axles, so they turn as the vehicle drives in. px: the picture's size;
// width: its share of the stage
// case: shown in an ivory display case (the appliances' cut-out was made against white, so it stands on white)
type Product = { url: string; alt: string; px: [number, number]; width: number; enter: "drive" | "rise"; case?: boolean; wheels?: { url: string; cx: number; cy: number; size: number }[] };
const PRODUCTS: Record<string, Product> = {
  appliances: { url: "/models/samsung-lineup.webp", alt: "Samsung appliances", px: [479, 190], width: 0.84, enter: "rise", case: true },
  "two-wheelers": { url: "/models/royal-enfield-bullet-350-side.webp", alt: "Royal Enfield Bullet 350", px: [824, 518], width: 0.5, enter: "drive" },
  cars: {
    url: "/models/maruti-victoris-side.webp", alt: "Maruti Suzuki Victoris", px: [1215, 491], width: 0.84, enter: "drive",
    wheels: [
      { url: "/models/maruti-victoris-side-wheel-0.webp", cx: 238.31, cy: 386.73, size: 208 },
      { url: "/models/maruti-victoris-side-wheel-1.webp", cx: 1001.28, cy: 386.73, size: 205 },
    ],
  },
  commercial: {
    url: "/models/tata-yodha-side.webp", alt: "Tata Yodha pickup", px: [564, 204], width: 0.88, enter: "drive",
    wheels: [
      { url: "/models/tata-yodha-side-wheel-0.webp", cx: 136.83, cy: 165.12, size: 80 },
      { url: "/models/tata-yodha-side-wheel-1.webp", cx: 479.77, cy: 165.04, size: 80 },
    ],
  },
};

/**
 * "Our houses": the four businesses as showroom cards in a row that travels sideways as the page is scrolled
 * (it holds in place meanwhile). Each card pairs a photograph with a lit stage where the business's product
 * stands; as a card arrives its vehicle drives onto the stage, the wheels turning by the distance driven.
 */
export default function HousesH() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => setStill(reducedMotion()), []);

  useEffect(() => {
    if (still) return;
    const tr = track.current!;
    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth);
      let shown = -1;
      const move = gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin.current,
          pin: true,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            const i = Math.round(self.progress * (verticals.length - 1));
            if (i !== shown && count.current) {
              shown = i;
              count.current.textContent = String(i + 1).padStart(2, "0");
            }
          },
        },
      });
      gsap.utils.toArray<HTMLElement>(".hs-card").forEach((card) => {
        const stage = card.querySelector<HTMLElement>(".hs-stage")!;
        const prod = card.querySelector<HTMLElement>(".hs-prod");
        if (!prod) return;
        gsap.fromTo(card.querySelector(".hs-photo"), { scale: 1.25 }, { scale: 1.02, ease: "none", scrollTrigger: { trigger: card, containerAnimation: move, start: "left right", end: "right left", scrub: true } });
        if (prod.dataset.enter === "rise") {
          gsap.fromTo(prod, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 55%" } });
          return;
        }
        const travel = () => stage.offsetWidth * 0.75;
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, containerAnimation: move, start: "left 92%", end: "left 30%", scrub: 0.6, invalidateOnRefresh: true } });
        tl.fromTo(prod, { x: () => -travel() }, { x: 0, ease: "power2.out" }, 0);
        // the wheels turn by the distance driven (forward, so clockwise)
        prod.querySelectorAll<HTMLElement>(".hs-wheel").forEach((w) => {
          tl.fromTo(w, { rotation: 0 }, { rotation: () => (travel() / (Math.PI * w.offsetWidth)) * 360, ease: "power2.out" }, 0);
        });
      });
      gsap.from(".hs-head > *", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: root.current, start: "top 75%" } });
    }, root);
    return () => ctx.revert();
  }, [still]);

  return (
    <section id="houses" ref={root} className="relative bg-[var(--h-navy)] text-[var(--h-pearl)]">
      <div ref={pin} className={`relative flex flex-col overflow-hidden ${still ? "py-24" : "h-svh min-h-[480px]"}`}>
        <div className="hs-head h-wrap flex items-end justify-between gap-6 pt-[96px] md:pt-[110px] [@media(max-height:720px)]:pt-[84px]">
          <div>
            <p className="h-eyebrow">Our houses</p>
            <h2 className="h-serif mt-4 text-[length:clamp(2.1rem,min(4.6vw,8svh),4.4rem)] leading-[1] [@media(max-height:720px)]:mt-2">
              {numberWord(verticals.length)} businesses, <span className="italic text-[var(--h-gold-2)]">one standard.</span>
            </h2>
          </div>
          {!still && (
            <div className="hidden shrink-0 items-center gap-4 text-[11px] tracking-[0.24em] text-[var(--h-pearl)]/60 md:flex">
              <span ref={count} className="h-serif text-3xl tracking-normal text-[var(--h-gold-2)]">
                01
              </span>
              <span>/ {String(verticals.length).padStart(2, "0")}</span>
              <span className="relative h-px w-28 overflow-hidden bg-white/15">
                <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-[var(--h-gold)]" />
              </span>
            </div>
          )}
        </div>

        <div
          ref={track}
          className={`flex gap-5 md:gap-7 ${still ? "h-wrap mt-12 flex-col" : "mt-6 min-h-0 flex-1 items-center pb-6 pl-5 pr-[8vw] will-change-transform md:mt-8 md:pb-8 md:pl-12 xl:pl-[calc((100vw-1360px)/2+48px)]"}`}
        >
          {verticals.map((v) => {
            const p = PRODUCTS[v.id];
            return (
              <article
                key={v.id}
                className={`hs-card grid shrink-0 overflow-hidden rounded-[30px] border border-white/10 bg-[var(--h-night)] md:grid-cols-[1fr_1.08fr] md:grid-rows-1 ${still ? "w-full md:h-[480px]" : "h-full max-h-[600px] w-[86vw] grid-rows-[34%_1fr] md:max-h-[540px] md:w-[78vw] lg:w-[min(64vw,1000px)]"}`}
                aria-labelledby={`hs-${v.id}`}
              >
                <div className={`relative overflow-hidden ${still ? "min-h-[220px]" : "min-h-0"}`}>
                  <img src={v.image} alt="" loading="lazy" className="hs-photo absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--h-night)]/70 via-transparent to-[var(--h-night)]/30 md:bg-gradient-to-r md:from-transparent md:to-[var(--h-night)]/50" />
                  <span className="h-serif h-outline absolute left-5 top-3 text-[clamp(4.5rem,9vw,8.5rem)] leading-none md:left-7 md:top-5">{v.index}</span>
                </div>
                <div className="hs-stage relative flex min-h-0 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_50%_100%,rgba(201,164,92,0.22),transparent_60%),linear-gradient(180deg,#10285a,#071634)] p-6 md:p-9 [@media(max-height:720px)]:md:p-7">
                  <p className="h-eyebrow">Since {v.since}</p>
                  <h3 id={`hs-${v.id}`} className="h-serif mt-3 text-[clamp(2.2rem,3.6vw,3.6rem)] leading-[1]">
                    {v.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 max-w-md text-[14px] leading-relaxed text-[var(--h-pearl)]/70 md:text-[15px] [@media(max-height:720px)]:line-clamp-2">{v.summary}</p>
                  <ul className="mt-4 hidden flex-wrap gap-2 sm:flex [@media(max-height:760px)]:!hidden">
                    {v.brands.map((b) => (
                      <li key={b} className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium tracking-[0.04em] text-[var(--h-pearl)]/80">
                        {b}
                      </li>
                    ))}
                  </ul>
                  {p && (
                    // the product takes the room left on the stage, as wide as it may be and as tall as that room
                    // allows (in the units of the room itself, cqw and cqh)
                    <div className={`relative mt-3 flex-1 [container-type:size] ${still ? "min-h-[180px]" : "min-h-[72px]"}`}>
                      <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--h-gold)]/60 to-transparent" aria-hidden />
                      <div
                        className="absolute bottom-[5px] left-1/2 -translate-x-1/2"
                        style={{ width: `min(${p.width * 100}cqw, calc((100cqh - ${p.case ? 32 : 12}px) * ${p.px[0] / p.px[1]} + ${p.case ? 32 : 0}px))` }}
                      >
                        <div className={`hs-prod relative will-change-transform ${p.case ? "rounded-[18px] bg-[radial-gradient(ellipse_at_50%_90%,#ffffff,#f1ece2)] px-4 pb-2 pt-4 ring-1 ring-[var(--h-gold)]/50" : ""}`} data-enter={p.enter}>
                          {!p.case && <span className="absolute inset-x-[8%] -bottom-[4%] h-[12%] rounded-[50%] bg-black/70 blur-md" aria-hidden />}
                          <img src={p.url} alt={p.alt} loading="lazy" className="relative block h-auto w-full" />
                          {p.wheels?.map((w) => (
                            <img
                              key={w.url}
                              src={w.url}
                              alt=""
                              loading="lazy"
                              className="hs-wheel absolute"
                              style={{ left: `${((w.cx - w.size / 2) / p.px[0]) * 100}%`, top: `${((w.cy - w.size / 2) / p.px[1]) * 100}%`, width: `${(w.size / p.px[0]) * 100}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
