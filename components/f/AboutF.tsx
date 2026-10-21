"use client";
import { about } from "@/lib/content";
import { useContent } from "@/components/e/content";
import { Heading, Label, Reveal } from "./ui";

/** Who the group is, in a few lines, and its figures. */
export default function AboutF() {
  const { figures } = useContent();
  return (
    <section id="about" className="bg-[var(--f-cream)] py-24 md:py-32">
      <div className="f-wrap grid gap-10 md:grid-cols-[1fr_1.15fr] md:gap-16">
        <Reveal>
          <Label>About the group</Label>
          <Heading text="From a yarn trade to *four* businesses." className="mt-6 text-[length:clamp(36px,4.6vw,64px)] text-[var(--f-navy)]" />
        </Reveal>
        <Reveal delay={0.1} className="md:pt-12">
          <p className="text-[16px] leading-[1.8] text-[var(--f-ink)]/75 md:text-[17px]">{about.lead}</p>
          <p className="f-display mt-6 text-[length:clamp(22px,2.2vw,28px)] italic leading-snug text-[var(--f-navy)]">{about.closing}</p>
        </Reveal>
      </div>
      <div className="f-wrap mt-16 grid grid-cols-2 gap-x-6 gap-y-10 md:mt-20 md:grid-cols-4">
        {figures.map((f, i) => (
          <Reveal key={f.label} delay={i * 0.06} className="border-t border-[var(--f-navy)]/15 pt-5">
            <p className="f-display text-[length:clamp(48px,5vw,72px)] leading-none text-[var(--f-navy)]">
              {f.value}
              {f.suffix && <span className="text-[var(--f-gold)]">{f.suffix}</span>}
            </p>
            <p className="f-label mt-4 text-[var(--f-mute)]">{f.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
