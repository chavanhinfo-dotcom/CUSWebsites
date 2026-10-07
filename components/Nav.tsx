"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { navLinks } from "@/lib/content";
import { getLenis, scrollToHash } from "@/lib/lenis";

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > last && y > 300);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open]);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    scrollToHash(href);
  };

  return (
    <>
      <motion.header
        animate={{ y: hidden && !open ? "-110%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled ? "bg-ink/70 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-10 md:py-5">
          <a href="#top" onClick={(e) => go(e, "#top")} className="group flex items-center gap-3" aria-label="Chavan Udyog Samuh, back to top">
            <img
              src="/brand/logo-mark-light.png"
              alt=""
              className="h-10 w-auto transition-transform duration-500 group-hover:scale-105 md:h-11"
            />
            <span className="hidden leading-tight sm:block">
              <span className="block font-serif text-lg tracking-tight">Chavan</span>
              <span className="block text-[9px] uppercase tracking-[0.35em] text-muted">Udyog Samuh</span>
            </span>
          </a>

          <ul className="hidden items-center gap-9 md:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => go(e, l.href)}
                  className="group relative text-sm text-cream/80 transition-colors hover:text-cream"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-gold transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <a
            href="#contact"
            onClick={(e) => go(e, "#contact")}
            className="hidden rounded-full border border-gold/60 px-5 py-2.5 text-sm text-gold transition-colors hover:bg-gold hover:text-ink md:inline-block"
          >
            Get in touch
          </a>

          <button
            onClick={() => setOpen((o) => !o)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span className={`h-px w-6 bg-cream transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-cream transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-ink-2 px-6 md:hidden"
          >
            <ul className="space-y-4">
              {[...navLinks, { href: "#contact", label: "Contact" }].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a href={l.href} onClick={(e) => go(e, l.href)} className="font-serif text-5xl">
                    {l.label}
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
