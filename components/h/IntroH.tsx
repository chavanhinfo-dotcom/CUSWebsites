"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { about, verticals } from "@/lib/content";
import { districtsLine, headOffice, joinList, numberWord, statesOf, useContent } from "@/components/e/content";

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
        gsap.from(".gr-close > *", { y: 40, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".gr-close", start: "top 82%" } });
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

      {/* ---- the promise ---- */}
      <div className="gr-close h-wrap border-t border-[var(--h-ink)]/10 pb-28 pt-20 text-center md:pb-36 md:pt-28">
        <span className="h-serif block text-[5rem] leading-[0.5] text-[var(--h-gold-deep)]" aria-hidden>
          “
        </span>
        <p className="h-serif mx-auto mt-8 max-w-[26ch] text-[clamp(1.9rem,3.4vw,3.2rem)] italic leading-[1.2] text-[var(--h-brand)]">{about.closing}</p>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--h-gold-deep)]">{company.motto}</p>
      </div>
    </section>
  );
}
