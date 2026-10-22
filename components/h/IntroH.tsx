"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { about, verticals } from "@/lib/content";
import { districtsLine, headOffice, joinList, numberWord, statesOf, useContent } from "@/components/e/content";

// the group's vision, and the three values it names
const VISION =
  "To be the most trusted and cherished partner in our customers’ journey, redefining excellence with unmatched quality, unwavering integrity, and exceptional experiences that inspire loyalty and elevate lives.";
const VALUES = [
  { title: "Unmatched quality", text: "Redefining excellence in everything we offer." },
  { title: "Unwavering integrity", text: "Honouring the trust our customers place in us." },
  { title: "Exceptional experiences", text: "Moments that inspire loyalty and elevate lives." },
];

// the photograph that stands beside each chapter
const PICTURES = [
  { src: "/images/yarn-threads.jpg", alt: "Spools of coloured thread", caption: "Yarn & long cloth" },
  { src: "/images/hero-showroom.jpg", alt: "A car showroom", caption: "Four businesses" },
  { src: "/images/showroom-luxury.jpg", alt: "A showroom floor", caption: "Across two states" },
];
const NUMERALS = ["I", "II", "III"];

/**
 * The group, as an editorial chapter on a pearl sheet that rises over the landing: the statement and the
 * group's particulars beside its story; then three chapters (heritage, growth, today) read beside a framed
 * photograph that holds its place and changes with each; and the group's promise to close.
 */
export default function IntroH() {
  const { company, dealerships, districts, figures, leadership } = useContent();
  const root = useRef<HTMLElement>(null);
  const [at, setAt] = useState(0);
  const founder = leadership[0]?.people[0];
  const states = statesOf(districts);
  const hq = headOffice(districts);
  const key = figures.map((f) => f.value).join("|") + dealerships.length;

  // the chapter being read (across the middle of the screen)
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setAt(Number((e.target as HTMLElement).dataset.i))), { rootMargin: "-45% 0px -50% 0px" });
    root.current?.querySelectorAll(".gr-chapter").forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".gr-word", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.02, scrollTrigger: { trigger: ".gr-lede", start: "top 82%" } });
        gsap.from(".gr-rule", { scaleX: 0, duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".gr-rule", start: "top 90%" } });
        gsap.from(".gr-fact", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".gr-facts", start: "top 85%" } });
        gsap.from(".gr-story", { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".gr-story", start: "top 85%" } });
        gsap.fromTo(".gr-frame", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".gr-frame", start: "top 80%" } });
        gsap.utils.toArray<HTMLElement>(".gr-chapter").forEach((c) => {
          gsap.from(c.querySelectorAll(".gr-in"), { y: 36, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: c, start: "top 72%" } });
        });
        gsap.utils.toArray<HTMLElement>(".gr-num").forEach((el) => {
          const end = Number(el.dataset.value), obj = { v: 0 };
          el.textContent = "0";
          gsap.to(obj, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true }, onUpdate: () => void (el.textContent = String(Math.round(obj.v))) });
        });
        // the vision: its card rises, its words light up as they are read, its emblem turns, its values follow
        gsap.from(".gr-vision", { y: 70, opacity: 0, scale: 0.97, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".gr-vision", start: "top 88%" } });
        gsap.fromTo(".gr-vw", { opacity: 0.16 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: ".gr-vtext", start: "top 78%", end: "bottom 48%", scrub: true } });
        gsap.fromTo(".gr-emblem", { rotation: -60, scale: 0.7, opacity: 0 }, { rotation: 0, scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: ".gr-vision", start: "top 85%", end: "top 35%", scrub: true } });
        gsap.from(".gr-value", { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: ".gr-value", start: "top 90%" } });
      });
    }, root);
    return () => ctx.revert();
  }, [key]);

  const lede = `From a yarn trade in ${company.since} to ${numberWord(verticals.length).toLowerCase()} businesses and ${numberWord(dealerships.length).toLowerCase()} franchises, one family has grown with the communities it serves.`;
  const gold = new Set(["four", "businesses", "twelve", "franchises,"].concat([numberWord(verticals.length).toLowerCase(), numberWord(dealerships.length).toLowerCase()]));
  const facts = [
    ["Founded", `${company.since}`],
    ["Head office", company.hq],
    ["Present in", joinList(states)],
    ["Leadership", `${numberWord(leadership.length)} generations of the Chavan family`],
  ];

  const chapters = [
    {
      eyebrow: `${company.since} · Heritage`,
      title: (
        <>
          Founded on <em className="text-[var(--h-gold-deep)]">trade.</em>
        </>
      ),
      body: (
        <>
          {founder && (
            <p className="gr-in mt-7 text-[16px] leading-[1.85] text-[var(--h-ink)]/75 md:text-[17px]">
              <span className="font-semibold text-[var(--h-ink)]">{founder.name}</span> founded the group in {hq?.name ?? company.hq}. {founder.text}
            </p>
          )}
          <p className="gr-in mt-8 border-l border-[var(--h-gold-deep)]/50 pl-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--h-gold-deep)]">Yarn &amp; long cloth · {company.since}</p>
        </>
      ),
    },
    {
      eyebrow: `${verticals[0]?.since ?? ""} – ${verticals[verticals.length - 1]?.since ?? ""} · Growth`,
      title: (
        <>
          {numberWord(verticals.length)} businesses, <em className="text-[var(--h-gold-deep)]">built one by one.</em>
        </>
      ),
      body: (
        <ol className="gr-in mt-8 border-t border-[var(--h-ink)]/12">
          {verticals.map((v) => (
            <li key={v.id} className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4 border-b border-[var(--h-ink)]/12 py-4 md:grid-cols-[5.5rem_1fr]">
              <span className="h-serif text-[1.9rem] leading-none text-[var(--h-gold-deep)]">{v.since}</span>
              <span>
                <span className="h-serif block text-[1.5rem] leading-tight text-[var(--h-brand)]">{v.title}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[var(--h-mute)]">{v.brands.slice(0, 3).join(" · ")}</span>
              </span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      eyebrow: "Today",
      title: (
        <>
          Trusted across <em className="text-[var(--h-gold-deep)]">{numberWord(states.length).toLowerCase()} {states.length === 1 ? "state" : "states"}.</em>
        </>
      ),
      body: (
        <>
          <div className="gr-in mt-8 grid grid-cols-2 border-t border-[var(--h-ink)]/12">
            {figures.slice(0, 4).map((f, i) => (
              <div key={f.label} className={`border-b border-[var(--h-ink)]/12 py-6 ${i % 2 ? "pl-6" : "border-r pr-6"}`}>
                <p className="h-serif text-[clamp(2.8rem,4.4vw,4rem)] leading-none text-[var(--h-brand)]">
                  <span className="gr-num" data-value={f.value}>
                    {f.value}
                  </span>
                  <span className="text-[var(--h-gold-deep)]">{f.suffix}</span>
                </p>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--h-mute)]">{f.label}</p>
              </div>
            ))}
          </div>
          <p className="gr-in mt-7 text-[15px] leading-relaxed text-[var(--h-ink)]/70">{districtsLine(districts)}</p>
        </>
      ),
    },
  ];

  return (
    <section id="about" ref={root} className="relative z-10 -mt-10 rounded-t-[40px] bg-[var(--h-pearl)] text-[var(--h-ink)] md:-mt-14 md:rounded-t-[56px]">
      {/* ---- the statement, the particulars, the story ---- */}
      <div className="h-wrap pb-20 pt-24 md:pb-28 md:pt-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-8">
            <p className="h-eyebrow h-dark">The group</p>
            <h2 className="gr-lede h-serif mt-8 max-w-[22ch] text-[clamp(2.3rem,4.6vw,4.5rem)] leading-[1.08] text-[var(--h-brand)]" aria-label={lede}>
              {lede.split(" ").map((w, i) => (
                <span key={i} className="line-mask" aria-hidden>
                  <span className={`gr-word inline-block ${gold.has(w.toLowerCase()) ? "italic text-[var(--h-gold-deep)]" : ""}`}>{w}&nbsp;</span>
                </span>
              ))}
            </h2>
          </div>
          {/* the group's motto, set as a seal */}
          <div className="gr-fact hidden justify-self-end lg:col-span-4 lg:block">
            <div className="border border-[var(--h-gold-deep)]/40 p-1.5">
              <div className="border border-[var(--h-gold-deep)]/25 px-10 py-9 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--h-mute)]">Since {company.since}</p>
                <ul className="h-serif mt-5 space-y-1 text-[2.2rem] italic leading-[1.15] text-[var(--h-brand)]">
                  {company.motto
                    .split(/\.\s*/)
                    .filter(Boolean)
                    .map((w) => (
                      <li key={w}>{w}.</li>
                    ))}
                </ul>
                <span className="mx-auto mt-5 block h-px w-10 bg-[var(--h-gold-deep)]/60" aria-hidden />
              </div>
            </div>
          </div>
        </div>
        <div className="gr-rule mt-14 h-px origin-left bg-gradient-to-r from-[var(--h-gold-deep)] via-[var(--h-gold-deep)]/40 to-transparent md:mt-20" />
        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <dl className="gr-facts grid grid-cols-2 gap-x-6 gap-y-8 lg:col-span-5 lg:grid-cols-1 lg:gap-y-6">
            {facts.map(([k, v]) => (
              <div key={k} className="gr-fact lg:grid lg:grid-cols-[9rem_1fr] lg:items-baseline lg:gap-6">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--h-gold-deep)]">{k}</dt>
                <dd className="h-serif mt-2 text-[1.45rem] leading-snug text-[var(--h-brand)] lg:mt-0">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="gr-story text-[17px] leading-[1.9] text-[var(--h-ink)]/75 lg:col-span-6 lg:col-start-7 md:text-[18px]">{about.lead}</p>
        </div>
      </div>

      {/* ---- three chapters beside a photograph that holds its place ---- */}
      <div className="h-wrap grid gap-10 pb-24 lg:grid-cols-12 lg:gap-10 md:pb-32">
        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-[104px] h-[calc(100svh-150px)] max-h-[720px]">
            <div className="gr-frame relative h-full overflow-hidden bg-[var(--h-night)]">
              {PICTURES.map((p, i) => (
                <img
                  key={p.src}
                  src={p.src}
                  alt={i === at ? p.alt : ""}
                  aria-hidden={i !== at}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: i === at ? 1 : 0, transform: `scale(${i === at ? 1.02 : 1.1})`, transition: "opacity 1.2s cubic-bezier(0.22,1,0.36,1), transform 2.4s cubic-bezier(0.22,1,0.36,1)" }}
                />
              ))}
              <span className="pointer-events-none absolute inset-3 border border-white/45" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[rgba(6,20,48,0.75)] to-transparent px-7 pb-6 pt-20 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em]">{PICTURES[at]?.caption}</p>
                <p className="h-serif text-[1.4rem] italic text-[var(--h-gold-2)]">
                  {NUMERALS[at]} <span className="text-white/50">/ {NUMERALS[NUMERALS.length - 1]}</span>
                </p>
              </div>
            </div>
            {/* the chapters, as a fine index beneath the picture */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {chapters.map((c, i) => (
                <span key={i} className="relative h-px overflow-hidden bg-[var(--h-ink)]/15">
                  <span className={`absolute inset-0 origin-left bg-[var(--h-gold-deep)] transition-transform duration-700 ${i <= at ? "scale-x-100" : "scale-x-0"}`} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {chapters.map((c, i) => (
            <article key={i} data-i={i} className="gr-chapter flex flex-col justify-center py-10 lg:min-h-[78svh] lg:py-16">
              {/* (on smaller screens, each chapter carries its own photograph) */}
              <div className="gr-in relative mb-8 aspect-[4/3] overflow-hidden lg:hidden">
                <img src={PICTURES[i].src} alt={PICTURES[i].alt} loading="lazy" className="h-full w-full object-cover" />
                <span className="pointer-events-none absolute inset-2.5 border border-white/45" aria-hidden />
              </div>
              <p className="gr-in flex items-baseline gap-4">
                <span className="h-serif text-[2rem] italic leading-none text-[var(--h-gold-deep)]">{NUMERALS[i]}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--h-mute)]">{c.eyebrow}</span>
              </p>
              <h3 className="gr-in h-serif mt-5 text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[1.05] text-[var(--h-brand)]">{c.title}</h3>
              {c.body}
            </article>
          ))}
        </div>
      </div>

      {/* ---- the vision: where the story is going ---- */}
      <div id="vision" className="h-wrap pb-24 md:pb-32">
        <div className="gr-vision relative overflow-hidden rounded-[28px] bg-[radial-gradient(ellipse_at_85%_0%,#1a3a78_0%,#0a1d40_52%,#061430_100%)] px-6 py-14 text-[var(--h-pearl)] shadow-[0_50px_100px_-50px_rgba(6,20,48,0.9)] md:rounded-[36px] md:px-16 md:py-20">
          <span className="pointer-events-none absolute inset-2.5 rounded-[22px] border border-[var(--h-gold)]/35 md:inset-3.5 md:rounded-[28px]" aria-hidden />
          <span className="pointer-events-none absolute inset-[17px] rounded-[17px] border border-[var(--h-gold)]/15 md:inset-[22px] md:rounded-[22px]" aria-hidden />
          <span className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--h-gold)]/[0.08] blur-3xl" aria-hidden />

          <div className="relative grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
            {/* the emblem: a compass star in a ring, turning gently as it is read */}
            <div className="flex items-center gap-5 lg:flex-col lg:items-center lg:pt-2">
              <svg viewBox="0 0 100 100" className="gr-emblem h-20 w-20 shrink-0 md:h-28 md:w-28" aria-hidden>
                <circle cx="50" cy="50" r="47" fill="none" stroke="#c9a45c" strokeOpacity="0.55" strokeWidth="1" />
                <circle cx="50" cy="50" r="41" fill="none" stroke="#c9a45c" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="1.5 3" />
                <path d="M50 8 L56 44 L92 50 L56 56 L50 92 L44 56 L8 50 L44 44 Z" fill="#e4c98f" fillOpacity="0.92" />
                <path d="M50 22 L53 47 L78 50 L53 53 L50 78 L47 53 L22 50 L47 47 Z" fill="#061430" transform="rotate(45 50 50)" fillOpacity="0.55" />
                <path d="M50 26 L52.5 47.5 L74 50 L52.5 52.5 L50 74 L47.5 52.5 L26 50 L47.5 47.5 Z" fill="#c9a45c" transform="rotate(45 50 50)" />
                <circle cx="50" cy="50" r="3.4" fill="#061430" stroke="#e4c98f" strokeWidth="1.2" />
              </svg>
              {/* (the label's own style sets its display, so where it shows is set on a wrapper) */}
              <div className="lg:hidden">
                <p className="h-eyebrow">Our vision</p>
              </div>
            </div>

            <div>
              <div className="hidden lg:block">
                <p className="h-eyebrow">Our vision</p>
              </div>
              <p className="gr-vtext h-serif mt-0 text-[clamp(1.8rem,3.3vw,3.1rem)] leading-[1.22] lg:mt-6" aria-label={VISION}>
                {VISION.split(" ").map((w, k) => {
                  const lead = k >= 3 && k <= 7; // "most trusted and cherished partner"
                  const value = /^(unmatched|quality,|unwavering|integrity,|exceptional|experiences)$/i.test(w);
                  return (
                    <span key={k} className="gr-vw" aria-hidden>
                      <span className={lead ? "italic text-[var(--h-gold-2)]" : value ? "underline decoration-[var(--h-gold)]/60 decoration-1 underline-offset-[0.18em]" : ""}>{w}</span>{" "}
                    </span>
                  );
                })}
              </p>
            </div>
          </div>

          {/* the three values the vision names */}
          <div className="relative mt-12 grid gap-8 border-t border-white/10 pt-10 md:mt-16 md:grid-cols-3 md:gap-0 md:pt-12">
            {VALUES.map((v, k) => (
              <div key={v.title} className={`gr-value md:px-8 ${k ? "md:border-l md:border-white/10" : "md:pl-0"} ${k === VALUES.length - 1 ? "md:pr-0" : ""}`}>
                <p className="flex items-baseline gap-3">
                  <span className="h-serif text-[1.4rem] italic text-[var(--h-gold)]">{["I", "II", "III"][k]}</span>
                  <span className="h-px w-8 bg-[var(--h-gold)]/50" />
                </p>
                <h3 className="h-serif mt-3 text-[1.75rem] leading-tight md:text-[2rem]">{v.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--h-pearl)]/65">{v.text}</p>
              </div>
            ))}
          </div>

          {/* the promise it rests on */}
          <div className="gr-value relative mt-12 flex flex-col items-center gap-3 text-center md:mt-14">
            <span className="h-2 w-2 rotate-45 bg-[var(--h-gold)]" aria-hidden />
            <p className="h-serif max-w-[46ch] text-[1.15rem] italic leading-snug text-[var(--h-pearl)]/75 md:text-[1.3rem]">“{about.closing}”</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--h-gold-2)]">{company.motto}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
