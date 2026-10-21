"use client";
import { districtsLine, headOffice, numberWord, statesOf, useContent, type District } from "@/components/e/content";
import { Heading, Label, Reveal } from "./ui";

// the distance between two districts along the ground, in km
const km = (a: District, b: District) => {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

/** Where the group works: one card per state, its districts, and how far each is from the head office. */
export default function PresenceF() {
  const { districts } = useContent();
  const hq = headOffice(districts);
  const states = statesOf(districts);
  if (!hq) return null;

  return (
    <section id="presence" className="bg-[var(--f-navy)] py-24 text-white md:py-32">
      <div className="f-wrap grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal>
          <Label light>Where we operate</Label>
          <Heading
            text={`Rooted in ${hq.name}, across *${numberWord(states.length).toLowerCase()}* ${states.length === 1 ? "state" : "states"}.`}
            className="mt-6 text-[length:clamp(36px,4.6vw,64px)]"
          />
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/65">{districtsLine(districts)}</p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2">
          {states.map((s, i) => (
            <Reveal key={s} delay={i * 0.08} className="rounded-[22px] border border-white/12 bg-white/[0.04] p-6 md:p-8">
              <p className="f-label text-[var(--f-gold-2)]">{s}</p>
              <ul className="mt-4">
                {districts
                  .filter((d) => d.state === s)
                  .map((d) => (
                    <li key={d.name} className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4 last:border-0">
                      <span className="f-display text-[28px]">{d.name}</span>
                      <span className={`text-[13px] ${d === hq ? "font-semibold text-[var(--f-gold-2)]" : "text-white/55"}`}>
                        {d === hq ? "Head office" : `${Math.round(km(hq, d))} km`}
                      </span>
                    </li>
                  ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
