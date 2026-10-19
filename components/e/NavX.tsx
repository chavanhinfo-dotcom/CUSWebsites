"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLenis, scrollToHash } from "@/lib/lenis";
import { onIntroDone } from "@/lib/intro";
import { ease } from "./ui";
import { LOGO_ALT, LOGO_GROUND, LOGO_JPEG } from "./logo";

const links = [
  { href: "#about", label: "About" },
  { href: "#businesses", label: "Businesses" },
  { href: "#journey", label: "Journey" },
  { href: "#presence", label: "Presence" },
  { href: "#leadership", label: "Leadership" },
  { href: "#gallery", label: "Gallery" },
];

// Fixed header in difference blend mode so it reads on both the black and the white sections; the logo is
// shown as supplied, on its own ground, beside it.
export default function NavX() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 400);
      setAtTop(y < 120);
      last = y;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  // pause smooth scrolling under the menu; resume only after it was actually opened (calling start() on
  // mount re-enabled scrolling during the preloader, so a scroll then jumped the page past the hero)
  const opened = useRef(false);
  // the header appears as the intro curtain lifts (the intro now lasts as long as loading takes)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const off = onIntroDone(() => setReady(true));
    return () => void off();
  }, []);
  useEffect(() => {
    if (open) {
      opened.current = true;
      getLenis()?.stop();
    } else if (opened.current) getLenis()?.start();
  }, [open]);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    setTimeout(() => scrollToHash(href), open ? 400 : 0);
  };

  // the group's logo, exactly as supplied, on a plate of its own ground: its own layer, outside the header's
  // difference blend (which would invert its colours), moving with the header
  const plate = (
    <span className="block overflow-hidden rounded-xl shadow-[0_10px_28px_-14px_rgba(0,0,0,0.45)] ring-1 ring-black/[0.06]" style={{ backgroundColor: LOGO_GROUND }}>
      <img src={LOGO_JPEG} alt={LOGO_ALT} className="block h-14 w-auto md:h-16" />
    </span>
  );

  return (
    <>
      <motion.a
        href="#top"
        onClick={(e) => go(e, "#top")}
        aria-label="Chavan Udyog Samuh: back to the top"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0, y: hidden && !open ? -110 : 0 }}
        transition={{ opacity: { delay: 0.6, duration: 0.8 }, y: { duration: 0.6, ease } }}
        className="fixed left-4 top-3 z-[51] rounded-xl outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-x-gold md:left-8 md:top-4"
      >
        {plate}
      </motion.a>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0, y: hidden && !open ? -90 : 0 }}
        transition={{ opacity: { delay: 0.6, duration: 0.8 }, y: { duration: 0.6, ease } }}
        className="fixed inset-x-0 top-0 z-50 text-white mix-blend-difference"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-start px-4 pt-5 md:px-8 md:pt-6">
          {/* (the logo's place: it is drawn in its own layer above) */}
          <span aria-hidden />
          <nav className={`hidden items-center gap-6 pt-3 transition-opacity duration-500 lg:flex ${atTop ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} className="micro group flex items-center gap-2 !tracking-[0.12em]">
                <span className="h-px w-0 bg-current transition-all duration-500 group-hover:w-4" />
                {l.label}
              </a>
            ))}
          </nav>
          {/* (always the right-hand column, also when the links between are hidden on small screens) */}
          <div className="col-start-3 flex justify-end gap-2">
            <a
              href="#contact"
              onClick={(e) => go(e, "#contact")}
              className="micro hidden h-10 items-center rounded-full bg-white px-5 font-semibold text-black md:inline-flex"
            >
              Visit a showroom
            </a>
            <button onClick={() => setOpen(true)} className="micro h-10 rounded-full border border-white/60 px-5 md:hidden">
              Menu
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[60] flex flex-col bg-x-black px-4 pb-8 pt-5 text-white"
          >
            <div className="flex items-center justify-between">
              {plate}
              <button onClick={() => setOpen(false)} className="micro h-10 rounded-full border border-white/40 px-5">Close</button>
            </div>
            <ul className="mt-auto">
              {[...links, { href: "#contact", label: "Contact" }].map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05, duration: 0.7, ease }}>
                  <a href={l.href} onClick={(e) => go(e, l.href)} className="wide flex items-baseline justify-between border-b border-white/10 py-3 text-[34px]">
                    {l.label}
                    <span className="micro text-x-gold">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
