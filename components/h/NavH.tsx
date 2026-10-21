"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLenis, scrollToHash } from "@/lib/lenis";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "@/components/e/logo";
import { useContent } from "@/components/e/content";

export const LINKS = [
  { href: "#about", label: "The group", img: "/images/yarn-spools.jpg" },
  { href: "#houses", label: "Our houses", img: "/images/hero-showroom.jpg" },
  { href: "#journey", label: "Journey", img: "/images/bike-road.jpg" },
  { href: "#showrooms", label: "Showrooms", img: "/images/showroom-luxury.jpg" },
  { href: "#presence", label: "Presence", img: "/images/truck-rural.jpg" },
  { href: "#legacy", label: "Legacy", img: "/images/yarn-threads.jpg" },
  { href: "#gallery", label: "Gallery", img: "/images/appliance-kitchen.jpg" },
  { href: "#contact", label: "Visit us", img: "/images/car-key.jpg" },
];
const ease = [0.76, 0, 0.24, 1] as const;

/**
 * The menu bar: the logo in the left corner on a small plate of its own ivory ground (so it shows exactly as
 * supplied), the sections in the bar itself (the one being read underlined in gold), and "Visit us". It
 * frosts once the page is scrolled and steps aside while reading down. Where the sections do not fit (phones
 * and tablets), a button opens them full screen, a photograph of each part beside its name.
 */
export default function NavH() {
  const { company } = useContent();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    let last = window.scrollY, raf = 0;
    // the section across the middle of the screen (read from where each one is, so a held section counts too)
    const find = () => {
      raf = 0;
      const mid = window.innerHeight * 0.45;
      let cur = "";
      ["#top", ...LINKS.map((l) => l.href)].forEach((h) => {
        const r = document.querySelector(h)?.getBoundingClientRect();
        if (r && r.top <= mid && r.bottom > mid) cur = h;
      });
      setCurrent(cur);
    };
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > last && y > 300);
      last = y;
      raf ||= requestAnimationFrame(find);
    };
    find();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
    };
  }, []);

  useEffect(() => {
    if (open) getLenis()?.stop();
    else getLenis()?.start();
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    setTimeout(() => scrollToHash(href), open ? 500 : 0);
  };

  return (
    <>
      <motion.header
        animate={{ y: hidden && !open ? "-120%" : "0%" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-[60] transition-[background-color,border-color] duration-500 ${scrolled && !open ? "border-b border-white/[0.07] bg-[var(--h-night)]/[0.94] backdrop-blur-xl" : "border-b border-transparent"}`}
      >
        <nav className="h-wrap flex h-[76px] items-center justify-between gap-6 md:h-[88px]">
          {/* the logo, in the left corner */}
          <a href="#top" onClick={(e) => go(e, "#top")} aria-label={`${company.name}, back to the top`} className="block shrink-0">
            <span className="block overflow-hidden rounded-[12px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] ring-1 ring-[var(--h-gold)]/35 transition-transform duration-500 hover:scale-[1.03]" style={{ backgroundColor: LOGO_GROUND }}>
              <img src={LOGO_JPEG} alt={LOGO_ALT} className="block h-[54px] w-auto md:h-[62px]" />
            </span>
          </a>

          {/* the sections, in the bar itself (the one being read is underlined in gold) */}
          <ul className="hidden items-center gap-7 lg:flex xl:gap-9">
            {LINKS.filter((l) => l.href !== "#contact").map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={(e) => go(e, l.href)} className={`group relative py-2 text-[13px] tracking-[0.04em] transition-colors duration-300 hover:text-[var(--h-gold-2)] ${current === l.href ? "text-[var(--h-gold-2)]" : "text-[var(--h-pearl)]/80"}`}>
                  {l.label}
                  <span className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-[var(--h-gold)] transition-transform duration-500 ${current === l.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a href="#contact" onClick={(e) => go(e, "#contact")} className="group relative inline-flex overflow-hidden rounded-full border border-[var(--h-gold)]/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--h-gold-2)] transition-colors duration-500 hover:text-[var(--h-night)] md:px-6">
              <span className="absolute inset-0 translate-y-full bg-[var(--h-gold)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" aria-hidden />
              <span className="relative">Visit us</span>
            </a>
            {/* (only where the sections do not fit in the bar: phones and tablets) */}
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close the sections" : "Show the sections"} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-[var(--h-pearl)] transition-colors duration-500 hover:border-[var(--h-gold)] lg:hidden">
              <span className={`absolute h-px w-[18px] bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-[3px]"}`} />
              <span className={`absolute h-px w-[18px] bg-current transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-[3px]"}`} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.9, ease }}
            className="fixed inset-0 z-50 overflow-y-auto bg-[var(--h-night)] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="h-wrap grid min-h-full gap-10 pb-12 pt-[112px] md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16 md:pt-[120px]">
              <ul>
                {LINKS.map((l, i) => (
                  <motion.li key={l.href} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="border-b border-white/[0.08]">
                    <a href={l.href} onClick={(e) => go(e, l.href)} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} className="group flex items-baseline gap-5 py-2.5 md:py-3">
                      <span className="w-7 text-[11px] tracking-[0.2em] text-[var(--h-gold)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className={`h-serif text-[clamp(2.1rem,min(4.8vw,6.2svh),4.2rem)] leading-[1.05] transition-all duration-500 group-hover:translate-x-3 group-hover:italic group-hover:text-[var(--h-gold-2)] ${hover === i ? "text-[var(--h-gold-2)]" : "text-[var(--h-pearl)]"}`}>{l.label}</span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }} className="hidden md:block">
                <div className="relative mx-auto aspect-[4/5] h-[min(64svh,640px)] max-w-full overflow-hidden rounded-t-full border border-[var(--h-gold)]/30 p-2">
                  <div className="relative h-full w-full overflow-hidden rounded-t-full">
                    <AnimatePresence initial={false}>
                      <motion.img key={LINKS[hover].img} src={LINKS[hover].img} alt="" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 h-full w-full object-cover" />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--h-night)]/70 to-transparent" />
                  </div>
                </div>
                <div className="mt-6 flex items-end justify-between gap-6 text-[13px] text-[var(--h-pearl)]/60">
                  <p>{company.address || company.hq}</p>
                  <p className="h-serif text-xl italic text-[var(--h-gold-2)]">{company.motto}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
