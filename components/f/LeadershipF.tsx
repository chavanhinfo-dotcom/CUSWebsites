"use client";
import { useState } from "react";
import { initialsOf, numberWord, safeUrl, useContent, type Leader } from "@/components/e/content";
import { Heading, Label, Reveal } from "./ui";

// a round portrait in a fine gold ring (or the person's monogram until a photograph is added)
function Portrait({ p }: { p: Leader }) {
  const src = safeUrl(p.photo);
  const [failed, setFailed] = useState(false);
  return (
    <div className="h-24 w-24 shrink-0 rounded-full border border-[var(--f-gold)]/60 p-1 md:h-28 md:w-28">
      {src && !failed ? (
        <img src={src} alt={p.name} onError={() => setFailed(true)} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="f-display grid h-full w-full place-items-center rounded-full bg-[var(--f-navy)] text-[34px] italic text-[var(--f-gold-2)] md:text-[40px]" aria-hidden>
          {p.initials || initialsOf(p.name)}
        </span>
      )}
    </div>
  );
}

/** The family that leads the group, one generation to a row. */
export default function LeadershipF() {
  const { leadership, company } = useContent();
  return (
    <section id="leadership" className="bg-[var(--f-ivory)] py-24 md:py-32">
      <div className="f-wrap">
        <Reveal className="max-w-2xl">
          <Label>Leadership</Label>
          <Heading text={`${numberWord(leadership.length)} generations, one *legacy*.`} className="mt-6 text-[length:clamp(36px,4.6vw,64px)] text-[var(--f-navy)]" />
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--f-ink)]/70">
            Led by the Chavan family since {company.since}, each generation building on the trust the last one earned.
          </p>
        </Reveal>
        <div className="mt-14 md:mt-16">
          {leadership.map((g, gi) => (
            <div key={`${g.generation}-${gi}`} className="grid gap-6 border-t border-[var(--f-navy)]/10 py-10 md:grid-cols-[13rem_1fr] md:gap-10">
              <div>
                <p className="f-label text-[var(--f-navy)]">{g.generation}</p>
                {g.era && <p className="f-display mt-2 text-[20px] italic text-[var(--f-gold)]">{g.era}</p>}
              </div>
              <div className="grid gap-8 lg:grid-cols-2">
                {g.people.map((p, i) => (
                  <Reveal key={p.name} delay={i * 0.08} className="flex gap-5 md:gap-6">
                    <Portrait p={p} />
                    <div>
                      <p className="f-label text-[var(--f-gold)]">{p.role}</p>
                      <h3 className="f-display mt-2 text-[length:clamp(24px,2.2vw,30px)] text-[var(--f-navy)]">{p.name}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-[var(--f-ink)]/70">{p.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
