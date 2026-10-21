"use client";
import { useEffect, useState } from "react";
import { heroSlides } from "@/lib/content";
import { headOffice, numberWord, useContent } from "@/components/e/content";
import { BTN, BTN_LINE, Heading, Label } from "./ui";

const SLIDE_MS = 5000;

/**
 * The opening: the headline, one line on what the group does, two buttons, and a photograph that slowly
 * changes between the four businesses (its dots choose one).
 */
export default function HeroF() {
  const { company, districts, leadership } = useContent();
  const [slide, setSlide] = useState(0);
  const city = headOffice(districts)?.name ?? company.hq.split(",")[0];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setSlide((s) => (s + 1) % heroSlides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide]);

  return (
    <section id="top" className="bg-[var(--f-ivory)] pt-[72px] md:pt-[84px]">
      <div className="f-wrap grid items-center gap-10 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-14 md:pb-24 md:pt-16 lg:min-h-[calc(100svh-84px)]">
        <div className="animate-[f-fade_0.9s_cubic-bezier(0.22,1,0.36,1)_both]">
          <Label>
            Est. {company.since} · {company.hq}
          </Label>
          <Heading as="h1" text={`Moving ${city} *forward* since ${company.since}.`} className="mt-6 text-[length:clamp(44px,5.2vw,76px)] text-[var(--f-navy)]" />
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--f-ink)]/70 md:text-[17px]">
            {company.tagline}: home appliances, two-wheelers, passenger cars and commercial vehicles, from one family for {numberWord(leadership.length).toLowerCase()} generations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#businesses" className={BTN}>
              Our businesses
            </a>
            <a href="#contact" className={BTN_LINE}>
              Visit a showroom
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] bg-[var(--f-navy)] animate-[f-fade_1.1s_0.15s_cubic-bezier(0.22,1,0.36,1)_both] md:aspect-auto md:h-[min(70svh,640px)]">
          {heroSlides.map((s, i) => (
            <img
              key={s.src}
              src={s.src}
              alt={i === slide ? s.label : ""}
              aria-hidden={i !== slide}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1.4s] ease-in-out"
              style={{ opacity: i === slide ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-[rgba(3,15,39,0.6)] to-transparent px-5 pb-5 pt-16 text-white md:px-6 md:pb-6">
            <p className="f-label">{heroSlides[slide]?.label}</p>
            <div className="flex gap-2">
              {heroSlides.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Show ${s.label}`}
                  aria-pressed={i === slide}
                  className={`h-2 rounded-full transition-all duration-500 ${i === slide ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
