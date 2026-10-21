"use client";
import { LOGO_ALT, LOGO_JPEG } from "@/components/e/logo";
import { useContent } from "@/components/e/content";
import { LINKS } from "./NavG";
import { Reveal } from "./ui";

/**
 * The close, as tiles: an invitation to visit with directions and contacts; the logo, exactly as supplied, on
 * its own ivory; and the links.
 */
export default function FooterG() {
  const { company } = useContent();
  const where = encodeURIComponent(company.address || `${company.name}, ${company.hq}`);
  return (
    <footer id="contact" className="pb-20 pt-20 md:pb-6 md:pt-28">
      <div className="g-wrap grid gap-3 md:gap-4 lg:grid-cols-12">
        <Reveal className="relative overflow-hidden rounded-[28px] bg-[var(--g-navy)] p-7 text-white md:p-12 lg:col-span-8">
          <span className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(199,138,31,0.22),transparent_70%)]" aria-hidden />
          <p className="g-eyebrow relative">Visit us</p>
          <h2 className="g-h relative mt-3 !text-white text-[length:clamp(36px,5vw,68px)]">Come and see us.</h2>
          <p className="relative mt-4 max-w-md text-[15px] leading-relaxed text-white/65 md:text-[16px]">
            Visit any of our showrooms, or reach the head office in {company.hq.split(",")[0]}.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${where}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--g-gold)] px-6 text-[14px] font-bold text-white transition-colors hover:bg-white hover:text-[var(--g-navy)]"
            >
              Get directions <span aria-hidden>↗</span>
            </a>
            <a href="#showrooms" className="inline-flex h-12 items-center rounded-full bg-white/10 px-6 text-[14px] font-bold text-white transition-colors hover:bg-white/20">
              Find a showroom
            </a>
          </div>
          <div className="relative mt-10 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/45">Head office</p>
              <p className="mt-2 text-[15px] font-semibold">{company.address || company.hq}</p>
            </div>
            {company.phone && (
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/45">Call</p>
                <a href={`tel:${company.phone.replace(/[^\d+]/g, "")}`} className="mt-2 block text-[15px] font-semibold hover:text-[var(--g-gold)]">
                  {company.phone}
                </a>
              </div>
            )}
            {company.email && (
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/45">Write</p>
                <a href={`mailto:${company.email}`} className="mt-2 block break-all text-[15px] font-semibold hover:text-[var(--g-gold)]">
                  {company.email}
                </a>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.06} className="g-tile flex flex-col items-center justify-center gap-5 p-8 text-center lg:col-span-4">
          <img src={LOGO_JPEG} alt={LOGO_ALT} loading="lazy" className="h-[150px] w-auto md:h-[170px]" />
          <p className="text-[13px] font-semibold text-[var(--g-mute)]">
            Est. {company.since} · {company.hq}
          </p>
        </Reveal>

        <div className="g-tile flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between lg:col-span-12">
          <nav aria-label="Sections" className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[14px] font-semibold text-[var(--g-ink)]/70 hover:text-[var(--g-navy)]">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-6">
            <p className="text-[12px] text-[var(--g-mute)]">
              © {new Date().getFullYear()} {company.name}
            </p>
            <a href="#top" className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--g-navy)] hover:text-[var(--g-gold)]">
              Back to top <span aria-hidden>↑</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
