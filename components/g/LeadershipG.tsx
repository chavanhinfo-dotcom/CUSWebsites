"use client";
import { useState } from "react";
import { initialsOf, numberWord, safeUrl, useContent, type Leader } from "@/components/e/content";
import { Reveal, SectionHead } from "./ui";

// a portrait (or the person's monogram until a photograph is added)
function Portrait({ p }: { p: Leader }) {
  const src = safeUrl(p.photo);
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[var(--g-navy)] md:aspect-square md:h-auto md:w-full md:rounded-[22px]">
      {src && !failed ? (
        <img src={src} alt={p.name} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_25%,#0e3a7a,var(--g-navy)_65%)] text-[32px] font-extrabold tracking-[-0.04em] text-[var(--g-gold)] md:text-[64px]" aria-hidden>
          {p.initials || initialsOf(p.name)}
        </span>
      )}
    </div>
  );
}

/** The family that leads the group: one tile per person, marked with their generation. */
export default function LeadershipG() {
  const { leadership, company } = useContent();
  const people = leadership.flatMap((g) => g.people.map((p) => ({ p, g })));
  return (
    <section id="leadership" className="py-20 md:py-28">
      <div className="g-wrap">
        <SectionHead
          eyebrow="Leadership"
          title={`${numberWord(leadership.length)} generations, one family.`}
          text={`Led by the Chavan family since ${company.since}, each generation building on the trust the last one earned.`}
        />
        <div className="mt-10 grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {people.map(({ p, g }, i) => (
            <Reveal key={`${p.name}-${i}`} delay={(i % 4) * 0.06} className="g-tile flex gap-4 p-3 md:block md:p-3">
              <Portrait p={p} />
              <div className="min-w-0 py-1 md:px-3 md:pb-4 md:pt-5">
                <p className="inline-flex rounded-full bg-[var(--g-gold-soft)] px-3 py-1 text-[11px] font-bold text-[var(--g-gold-ink)]">{g.generation}</p>
                <h3 className="mt-3 text-[18px] font-extrabold leading-tight tracking-tight text-[var(--g-navy)] md:text-[20px]">{p.name}</h3>
                <p className="mt-1 text-[13px] font-bold text-[var(--g-mute)]">{p.role}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--g-ink)]/70">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
