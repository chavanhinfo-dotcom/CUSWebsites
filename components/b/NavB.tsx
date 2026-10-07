"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { navLinks } from "@/lib/content";
import { getLenis, scrollToHash } from "@/lib/lenis";

// Floating pill nav with the logo in the centre; shrinks once you scroll.
export default function NavB() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 80);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) getLenis()?.stop();
    else getLenis()?.start();
  }, [open]);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    scrollToHash(href);
  };
  const left = navLinks.slice(0, 2);
  const right = [...navLinks.slice(2), { href: "#contact", label: "Contact" }];
  const link = (l: { href: string; label: string }) => (
    <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} className="group relative px-1 py-1 text-sm font-medium">
      {l.label}
      <svg className="absolute -bottom-1 left-0 h-2 w-full" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden>
        <path d="M2 5 Q 25 1, 50 4 T 98 3" fill="none" stroke="#c99a2e" strokeWidth="2.5" strokeLinecap="round"
          className="[stroke-dasharray:110] [stroke-dashoffset:110] transition-[stroke-dashoffset] duration-500 group-hover:[stroke-dashoffset:0]" />
      </svg>
    </a>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-5"
      >
        <div
          className={`relative flex items-center gap-6 overflow-hidden rounded-full border-[1.5px] border-navy bg-paper/85 shadow-[4px_4px_0_#0b2859] backdrop-blur-md transition-all duration-500 md:gap-8 ${
            compact ? "px-4 py-1.5 md:px-6" : "px-5 py-2.5 md:px-8"
          }`}
        >
          <div className="hidden items-center gap-6 md:flex">{left.map(link)}</div>
          <a href="#top" onClick={(e) => go(e, "#top")} aria-label="Back to top">
            <img src="/brand/logo-mark.png" alt="Chavan Udyog Samuh" className={`w-auto transition-all duration-500 ${compact ? "h-8" : "h-11"}`} />
          </a>
          <div className="hidden items-center gap-6 md:flex">{right.map(link)}</div>
          <button
            onClick={() => setOpen(true)}
            className="font-hand text-2xl leading-none md:hidden"
            aria-label="Open menu"
          >
            menu
          </button>
          <span className="absolute bottom-0 left-0 h-[2px] bg-brass" style={{ width: `${progress * 100}%` }} />
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[60] flex flex-col bg-navy px-6 pb-10 pt-6 text-paper"
          >
            <div className="flex items-center justify-between">
              <img src="/brand/logo-mark-light.png" alt="" className="h-10" />
              <button onClick={() => setOpen(false)} className="font-hand text-3xl" aria-label="Close menu">close</button>
            </div>
            <ul className="mt-auto space-y-2">
              {[...navLinks, { href: "#contact", label: "Contact" }].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a href={l.href} onClick={(e) => go(e, l.href)} className="font-display text-6xl">
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
