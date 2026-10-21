"use client";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "@/components/e/logo";
import { statesOf, useContent } from "@/components/e/content";
import { LINKS } from "./NavF";
import { Heading, Label } from "./ui";

/**
 * The close: an invitation to visit, with directions; how to reach the group; then the logo, exactly as
 * supplied, on its own ivory ground.
 */
export default function FooterF() {
  const { company, districts } = useContent();
  const where = encodeURIComponent(company.address || `${company.name}, ${company.hq}`);
  const states = statesOf(districts);

  return (
    <footer id="contact" className="bg-[var(--f-deep)] text-white">
      <div className="f-wrap py-24 md:py-28">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Label light>Visit us</Label>
            <Heading text="Come and *see* us." className="mt-6 text-[length:clamp(44px,6vw,88px)]" />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${where}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-max items-center gap-2 rounded-full bg-[var(--f-gold)] px-7 text-[14px] font-semibold text-white transition-colors duration-300 hover:bg-[var(--f-ivory)] hover:text-[var(--f-navy)]"
          >
            Get directions <span aria-hidden>↗</span>
          </a>
        </div>

        <div className="mt-16 grid gap-10 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="f-label text-[var(--f-gold-2)]">Head office</p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/80">{company.address || company.hq}</p>
          </div>
          <div>
            <p className="f-label text-[var(--f-gold-2)]">Get in touch</p>
            <div className="mt-4 space-y-2 text-[15px] text-white/80">
              {company.phone && (
                <a className="block hover:text-[var(--f-gold-2)]" href={`tel:${company.phone.replace(/[^\d+]/g, "")}`}>
                  {company.phone}
                </a>
              )}
              {company.email && (
                <a className="block break-all hover:text-[var(--f-gold-2)]" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
              )}
              {!company.phone && !company.email && (
                <a className="block hover:text-[var(--f-gold-2)]" href="#franchises">
                  Through any of our showrooms
                </a>
              )}
            </div>
          </div>
          <div>
            <p className="f-label text-[var(--f-gold-2)]">Where we are</p>
            <ul className="mt-4 space-y-2 text-[15px] text-white/80">
              {states.map((s) => (
                <li key={s}>
                  <span className="text-white">{s}</span>
                  <span className="text-white/50"> · {districts.filter((d) => d.state === s).map((d) => d.name).join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="f-label text-[var(--f-gold-2)]">Explore</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[15px] text-white/80">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-[var(--f-gold-2)]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* the logo exactly as supplied, on its own ground */}
      <div style={{ backgroundColor: LOGO_GROUND }} className="text-[var(--f-ink)]">
        <div className="f-wrap flex flex-col items-center gap-6 py-10 md:flex-row md:justify-between">
          <img src={LOGO_JPEG} alt={LOGO_ALT} loading="lazy" className="h-[100px] w-auto md:h-[116px]" />
          <p className="f-display text-center text-[length:clamp(24px,2.6vw,34px)] italic text-[var(--f-navy)]">{company.motto}</p>
          <a href="#top" className="inline-flex items-center gap-3 text-[13px] font-semibold text-[var(--f-navy)] hover:text-[var(--f-gold)]">
            Back to the top
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--f-navy)]/20" aria-hidden>
              ↑
            </span>
          </a>
        </div>
        <div className="border-t border-[var(--f-navy)]/10">
          <p className="f-wrap py-5 pb-20 text-center text-[12px] text-[var(--f-mute)] md:pb-5 md:text-left">
            © {new Date().getFullYear()} {company.name}. {company.tagline}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
