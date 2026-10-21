"use client";
import { scrollToHash } from "@/lib/lenis";
import { verticals } from "@/lib/content";
import { statesOf, useContent } from "@/components/e/content";
import { LINKS } from "./NavH";

/** The foot of the page: the group's name set wide, the sections, the businesses and regions, and the fine print. */
export default function FooterH() {
  const { company, districts } = useContent();
  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };
  return (
    <footer className="bg-[var(--h-night)] pb-20 pt-20 text-[var(--h-pearl)] md:pb-8 md:pt-24">
      <div className="h-wrap">
        <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="h-serif text-[clamp(2.2rem,3.6vw,3.2rem)] leading-[1.05]">
              {company.name}
              <span className="mt-2 block text-[0.62em] italic text-[var(--h-gold-2)]">{company.motto}</span>
            </p>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-[var(--h-pearl)]/55">
              {company.tagline}. Serving customers since {company.since}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--h-gold)]">Explore</p>
              <ul className="space-y-2 text-[14px] text-[var(--h-pearl)]/75">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={(e) => go(e, l.href)} className="transition-colors hover:text-[var(--h-gold-2)]">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--h-gold)]">Businesses</p>
              <ul className="space-y-2 text-[14px] text-[var(--h-pearl)]/75">
                {verticals.map((v) => (
                  <li key={v.id}>{v.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--h-gold)]">Regions</p>
              <ul className="space-y-2 text-[14px] text-[var(--h-pearl)]/75">
                {statesOf(districts).map((s) => (
                  <li key={s}>
                    {s}
                    <span className="block text-[12px] text-[var(--h-pearl)]/45">{districts.filter((d) => d.state === s).map((d) => d.name).join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 pt-7 text-[12px] text-[var(--h-pearl)]/45 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {company.name}. Brand names are trademarks of their respective owners.
          </p>
          <a href="#top" onClick={(e) => go(e, "#top")} className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--h-gold-2)] hover:text-[var(--h-pearl)]">
            Back to the top
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--h-gold)]/50" aria-hidden>
              ↑
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
