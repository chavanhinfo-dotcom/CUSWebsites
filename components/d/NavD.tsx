"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLenis, scrollToHash } from "@/lib/lenis";

const left = [
  { href: "#businesses", label: "Our businesses" },
  { href: "#legacy", label: "Our legacy" },
];
const all = [
  { href: "#journey", label: "Our journey" },
  { href: "#businesses", label: "Our businesses" },
  { href: "#legacy", label: "Our legacy" },
  { href: "#presence", label: "Our presence" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Get in touch" },
];

// Three-part header; flips to light text whenever a dark section sits under it.
export default function NavD() {
  const [dark, setDark] = useState(false);
  const [solid, setSolid] = useState(false);
  const [clear, setClear] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      setSolid(window.scrollY > 40);
      const probe = 40;
      const under = (sel: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(sel)).some((el) => {
          const r = el.getBoundingClientRect();
          return r.top <= probe && r.bottom >= probe;
        });
      setDark(under("[data-header='dark']"));
      setClear(under("[data-header='clear']"));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
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
  const txt = dark ? "text-white" : "text-d-text";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-colors duration-500 md:h-20 ${solid && !dark && !clear ? "border-b border-d-line/70 bg-d-bg/80 backdrop-blur-md" : ""}`}
      >
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center px-4 md:px-5">
          <nav className="hidden items-center gap-8 md:flex">
            {left.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} className={`group relative text-[13px] font-medium uppercase tracking-[0.06em] transition-colors ${txt}`}>
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 ease-[cubic-bezier(.25,1,.5,1)] group-hover:origin-left group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
          <span className="md:hidden" />

          <a href="#journey" onClick={(e) => go(e, "#journey")} className={`flex items-center gap-2.5 ${txt}`} aria-label="Chavan Udyog Samuh, back to top">
            <img src={dark ? "/brand/logo-mark-light.png" : "/brand/logo-mark.png"} alt="" className="h-8 w-auto md:h-9" />
            <span className="hidden text-[15px] font-bold uppercase leading-none tracking-[0.02em] sm:block">
              Chavan
              <span className="block text-[9px] font-semibold tracking-[0.32em] opacity-70">Udyog Samuh</span>
            </span>
          </a>

          <div className="flex items-center justify-end gap-2">
            <a
              href="#presence"
              onClick={(e) => go(e, "#presence")}
              className={`hidden h-12 items-center rounded-full px-6 text-[13px] font-medium uppercase tracking-[0.04em] backdrop-blur transition-colors md:inline-flex ${
                dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#b7c9d6]/60 text-d-text hover:bg-[#b7c9d6]"
              }`}
            >
              Our presence
            </a>
            <a
              href="#contact"
              onClick={(e) => go(e, "#contact")}
              className={`hidden h-12 items-center rounded-full px-6 text-[13px] font-semibold uppercase tracking-[0.04em] transition-colors md:inline-flex ${
                dark ? "bg-white text-d-dark hover:bg-d-alt" : "bg-d-dark text-white hover:bg-[#1a2342]"
              }`}
            >
              Get in touch
            </a>
            <button
              onClick={() => setOpen(true)}
              className={`inline-flex h-10 items-center rounded-full px-4 text-[12px] font-semibold uppercase tracking-[0.06em] md:hidden ${dark ? "bg-white text-d-dark" : "bg-d-dark text-white"}`}
            >
              Menu
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-d-alt px-5 pb-8 pt-5"
          >
            <div className="flex items-center justify-between">
              <img src="/brand/logo-mark.png" alt="" className="h-9" />
              <button onClick={() => setOpen(false)} className="h-10 rounded-full bg-d-dark px-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
                Close
              </button>
            </div>
            <ul className="mt-auto divide-y divide-d-text/10 border-y border-d-text/10">
              {all.map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, ease: [0.25, 1, 0.5, 1] }}>
                  <a href={l.href} onClick={(e) => go(e, l.href)} className="flex items-center justify-between py-4 text-3xl font-medium tracking-[-0.03em]">
                    {l.label} <span className="text-brass">→</span>
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
