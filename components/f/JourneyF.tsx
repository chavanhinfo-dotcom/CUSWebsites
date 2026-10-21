"use client";
import { categoryMeta } from "@/lib/content";
import { useContent } from "@/components/e/content";
import { Heading, Label, Reveal } from "./ui";

/**
 * The journey as a plain timeline: every milestone in order down a fine gold line, the introduction held
 * beside it on wide screens.
 */
export default function JourneyF() {
  const { milestones, company } = useContent();
  const list = [...milestones].sort((a, b) => a.year - b.year);
  const years = new Date().getFullYear() - company.since;

  return (
    <section id="journey" className="bg-[var(--f-ivory)] py-24 md:py-32">
      <div className="f-wrap grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-36 lg:self-start">
          <Label>The journey</Label>
          <Heading text={`${years} years of *growth*.`} className="mt-6 text-[length:clamp(36px,4.6vw,64px)] text-[var(--f-navy)]" />
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--f-ink)]/70">
            From the first bolt of cloth in {company.since} to the newest showroom: every step the group has taken, in order.
          </p>
        </Reveal>
        <ol className="border-l border-[var(--f-gold)]/40 pl-8 md:pl-10">
          {list.map((m) => (
            <li key={`${m.year}-${m.title}`} className="relative pb-9 last:pb-0">
              <span className="absolute -left-[38px] top-[14px] h-[11px] w-[11px] rounded-full bg-[var(--f-gold)] ring-4 ring-[var(--f-ivory)] md:-left-[46px]" aria-hidden />
              <Reveal>
                <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="f-display text-[32px] italic text-[var(--f-gold)]">{m.year}</span>
                  <span className="f-label text-[var(--f-mute)]">{categoryMeta[m.category]?.label}</span>
                </p>
                <p className="mt-1 text-[16px] font-semibold leading-snug text-[var(--f-navy)] md:text-[17px]">{m.title}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
