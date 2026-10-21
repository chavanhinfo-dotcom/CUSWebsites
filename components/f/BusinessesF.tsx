"use client";
import { verticals } from "@/lib/content";
import { numberWord } from "@/components/e/content";
import { Heading, Label, Reveal } from "./ui";

/** The four businesses as four cards: a photograph, the year it began, what it does, and its names. */
export default function BusinessesF() {
  return (
    <section id="businesses" className="bg-[var(--f-navy)] py-24 text-white md:py-32">
      <div className="f-wrap">
        <Reveal className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-10">
          <div>
            <Label light>What we do</Label>
            <Heading text={`${numberWord(verticals.length)} businesses, built on *trust*.`} className="mt-6 text-[length:clamp(36px,4.6vw,64px)]" />
          </div>
          <p className="max-w-md text-[16px] leading-relaxed text-white/65 md:justify-self-end">
            Sales, service and distribution across home appliances, two-wheelers, passenger cars and commercial vehicles.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6">
          {verticals.map((v, i) => (
            <Reveal key={v.id} delay={(i % 2) * 0.08} className="group h-full overflow-hidden rounded-[22px] bg-[var(--f-ivory)] text-[var(--f-ink)]">
              <article aria-labelledby={`bf-${v.id}`}>
                <div className="aspect-[16/9] overflow-hidden bg-[var(--f-deep)]">
                  <img src={v.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
                </div>
                <div className="p-6 md:p-8">
                  <p className="flex items-baseline justify-between gap-4">
                    <span className="f-display text-[24px] italic text-[var(--f-gold)]">{v.index}</span>
                    <span className="f-label text-[var(--f-mute)]">Since {v.since}</span>
                  </p>
                  <h3 id={`bf-${v.id}`} className="f-display mt-3 text-[length:clamp(30px,3vw,40px)] text-[var(--f-navy)]">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--f-ink)]/70">{v.summary}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {v.brands.map((b) => (
                      <li key={b} className="rounded-full border border-[var(--f-navy)]/15 px-3 py-1 text-[12px] text-[var(--f-ink)]/75">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
