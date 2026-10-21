"use client";
import { useEffect, useState } from "react";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "@/components/e/logo";
import { useContent } from "@/components/e/content";

export const LINKS = [
  { href: "#about", label: "About" },
  { href: "#businesses", label: "Businesses" },
  { href: "#franchises", label: "Franchises" },
  { href: "#journey", label: "Journey" },
  { href: "#presence", label: "Presence" },
  { href: "#leadership", label: "Leadership" },
  { href: "#gallery", label: "Gallery" },
];

/**
 * The menu bar, always in place: the logo on its own ivory ground (so it shows exactly as supplied), the
 * sections, and one button. On smaller screens the sections open as a simple list beneath it.
 */
export default function NavF() {
  const { company } = useContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-shadow duration-300 ${scrolled || open ? "border-[var(--f-navy)]/10 shadow-[0_8px_24px_-20px_rgba(7,41,89,0.5)]" : "border-transparent"}`}
      style={{ backgroundColor: LOGO_GROUND }}
    >
      <div className="f-wrap flex h-[72px] items-center justify-between gap-6 md:h-[84px]">
        <a href="#top" onClick={() => setOpen(false)} aria-label={`${company.name}: back to the top`} className="shrink-0">
          <img src={LOGO_JPEG} alt={LOGO_ALT} className="h-[56px] w-auto md:h-[68px]" />
        </a>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium text-[var(--f-ink)]/70 transition-colors hover:text-[var(--f-gold)]">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="#contact" className="hidden h-11 items-center rounded-full bg-[var(--f-navy)] px-6 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--f-gold)] sm:inline-flex">
            Contact us
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close the menu" : "Open the menu"}
            aria-expanded={open}
            aria-controls="f-menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--f-navy)]/15 text-[var(--f-navy)] lg:hidden"
          >
            <span className="relative block h-3 w-5" aria-hidden>
              <span className={`absolute left-0 top-0 h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>
      {open && (
        <nav id="f-menu" aria-label="Sections" className="border-t border-[var(--f-navy)]/10 lg:hidden">
          <ul className="f-wrap py-3">
            {[...LINKS, { href: "#contact", label: "Contact us" }].map((l) => (
              <li key={l.href} className="border-b border-[var(--f-navy)]/[0.06] last:border-0">
                <a href={l.href} onClick={() => setOpen(false)} className="f-display block py-3.5 text-[24px] text-[var(--f-navy)]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
