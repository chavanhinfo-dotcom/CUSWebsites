"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useContent } from "@/components/e/content";
import { Reveal, ease } from "./ui";

/** Questions and answers, in one tile: each question opens in place (one at a time). */
export default function FaqG() {
  const { faq } = useContent();
  const [open, setOpen] = useState<number | null>(0);
  if (!faq.length) return null;
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="g-wrap grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <Reveal className="px-1">
          <p className="g-eyebrow">Questions</p>
          <h2 className="g-h mt-3 text-[length:clamp(32px,4.2vw,56px)]">Questions, answered.</h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[var(--g-mute)] md:text-[16px]">
            Anything else?{" "}
            <a href="#contact" className="font-bold text-[var(--g-navy)] underline decoration-[var(--g-gold)] decoration-2 underline-offset-4 hover:text-[var(--g-gold)]">
              Get in touch
            </a>{" "}
            or visit any of our showrooms.
          </p>
        </Reveal>
        <Reveal delay={0.06} className="g-tile p-2 md:p-3">
          <ul>
            {faq.map((f, i) => (
              <li key={f.q} className={`rounded-[20px] transition-colors duration-300 ${open === i ? "bg-[var(--g-bg)]" : ""}`}>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-4 px-4 py-4 text-left md:px-5 md:py-5">
                  <span className="flex-1 text-[15px] font-bold leading-snug text-[var(--g-navy)] md:text-[17px]">{f.q}</span>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[16px] font-bold transition-all duration-300 ${open === i ? "rotate-45 bg-[var(--g-navy)] text-white" : "bg-[var(--g-navy)]/[0.06] text-[var(--g-navy)]"}`} aria-hidden>
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
                      <p className="px-4 pb-5 pr-14 text-[15px] leading-relaxed text-[var(--g-ink)]/70 md:px-5">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
