"use client";
import { useEffect, useState } from "react";
import { LOGO_ALT, LOGO_JPEG } from "@/components/e/logo";
import { useContent } from "@/components/e/content";

export const LINKS = [
  { href: "#showrooms", label: "Showrooms" },
  { href: "#about", label: "About" },
  { href: "#journey", label: "Journey" },
  { href: "#leadership", label: "Leadership" },
  { href: "#gallery", label: "Gallery" },
  { href: "#faq", label: "FAQ" },
];

/**
 * The menu: a floating bar in the tiles' ivory (the logo's own ground, so the logo shows exactly as supplied),
 * with the sections and the showroom finder. On smaller screens the sections open in a tile beneath it.
 */
export default function NavG() {
  const { company } = useContent();
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const on = () => setLifted(window.scrollY > 10);
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
    <header className="fixed inset-x-0 top-0 z-50 pt-3">
      <div className="g-wrap">
        <div className={`g-tile flex h-[68px] items-center justify-between gap-4 !rounded-[22px] pl-3 pr-2.5 transition-shadow duration-300 md:pl-4 ${lifted || open ? "shadow-[0_12px_32px_-16px_rgba(7,41,89,0.28)]" : ""}`}>
          <a href="#top" onClick={() => setOpen(false)} aria-label={`${company.name}: back to the top`} className="shrink-0">
            <img src={LOGO_JPEG} alt={LOGO_ALT} className="h-[54px] w-auto" />
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[14px] font-semibold text-[var(--g-ink)]/70 transition-colors hover:bg-[var(--g-navy)]/[0.05] hover:text-[var(--g-navy)]">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="#contact" className="hidden h-11 items-center rounded-full bg-[var(--g-navy)] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[var(--g-gold)] sm:inline-flex">
              Contact
            </a>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close the menu" : "Open the menu"}
              aria-expanded={open}
              aria-controls="g-menu"
              className="grid h-11 w-11 place-items-center rounded-full bg-[var(--g-navy)]/[0.06] text-[var(--g-navy)] lg:hidden"
            >
              <span className="relative block h-3 w-[18px]" aria-hidden>
                <span className={`absolute left-0 top-0 h-[2px] w-full rounded bg-current transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
                <span className={`absolute bottom-0 left-0 h-[2px] w-full rounded bg-current transition-transform duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
        {open && (
          <nav id="g-menu" aria-label="Sections" className="g-tile mt-2 animate-[g-in_0.3s_ease_both] p-2 shadow-[0_12px_32px_-16px_rgba(7,41,89,0.28)] lg:hidden">
            <ul className="grid grid-cols-2 gap-1">
              {[...LINKS, { href: "#contact", label: "Contact" }].map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3.5 text-[16px] font-bold text-[var(--g-navy)] hover:bg-[var(--g-navy)]/[0.05]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
