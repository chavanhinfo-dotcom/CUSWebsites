"use client";
import { about, future } from "@/lib/content";
import { headOffice, numberWord, statesOf, useContent, type District } from "@/components/e/content";
import { Reveal, SectionHead } from "./ui";

// the distance between two districts along the ground, in km
const km = (a: District, b: District) => {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

/** The group in four tiles: its story, its promise, where it works, and what comes next. */
export default function AboutG() {
  const { company, districts } = useContent();
  const hq = headOffice(districts);
  const states = statesOf(districts);
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="g-wrap">
        <SectionHead eyebrow="About the group" title={`Built on trust since ${company.since}.`} />
        <div className="mt-10 grid gap-3 md:gap-4 lg:grid-cols-12">
          <Reveal className="g-tile p-7 md:p-10 lg:col-span-7">
            <p className="g-eyebrow">Our story</p>
            <p className="mt-5 text-[17px] leading-[1.75] text-[var(--g-ink)]/80 md:text-[19px]">{about.lead}</p>
          </Reveal>
          <Reveal delay={0.06} className="flex flex-col rounded-[28px] bg-[var(--g-navy)] p-7 text-white md:p-10 lg:col-span-5">
            <span className="text-[64px] font-extrabold leading-[0.6] text-[var(--g-gold)]" aria-hidden>
              “
            </span>
            <p className="mt-6 text-[22px] font-bold leading-snug tracking-tight md:text-[26px]">{about.closing}</p>
            <p className="mt-6 text-[13px] font-semibold text-white/60 lg:mt-auto lg:pt-8">{company.motto}</p>
          </Reveal>

          {hq && (
            <Reveal className="g-tile p-7 md:p-8 lg:col-span-5">
              <p className="g-eyebrow">Where we are</p>
              <h3 className="mt-3 text-[22px] font-extrabold tracking-tight text-[var(--g-navy)] md:text-[26px]">
                Rooted in {hq.name}, across {numberWord(states.length).toLowerCase()} {states.length === 1 ? "state" : "states"}.
              </h3>
              <div className="mt-6 space-y-5">
                {states.map((s) => (
                  <div key={s}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--g-mute)]">{s}</p>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {districts
                        .filter((d) => d.state === s)
                        .map((d) => (
                          <li key={d.name} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--g-bg)] px-4 py-3">
                            <span className="text-[15px] font-bold text-[var(--g-navy)]">{d.name}</span>
                            <span className={`text-[12px] font-bold ${d === hq ? "text-[var(--g-gold-ink)]" : "text-[var(--g-mute)]"}`}>{d === hq ? "Head office" : `${Math.round(km(hq, d))} km`}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
          <Reveal delay={0.06} className="g-tile flex flex-col p-7 md:p-10 lg:col-span-7">
            <p className="g-eyebrow">What comes next</p>
            <h3 className="mt-3 text-[22px] font-extrabold tracking-tight text-[var(--g-navy)] md:text-[26px]">{future.heading}</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--g-mute)] md:text-[16px]">{future.text}</p>
            <ul className="mt-6 flex flex-wrap gap-2 lg:mt-auto lg:pt-8">
              {future.pillars.map((p) => (
                <li key={p} className="rounded-full bg-[var(--g-gold-soft)] px-4 py-2 text-[13px] font-bold text-[var(--g-gold-ink)]">
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
