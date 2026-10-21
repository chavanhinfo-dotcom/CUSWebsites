"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useContent } from "@/components/e/content";
import { Heading, Label, Reveal, ease } from "./ui";

/** Questions and answers: each question opens in place (one at a time). */
export default function FaqF() {
  const { faq } = useContent();
  const [open, setOpen] = useState<number | null>(0);
  if (!faq.length) return null;

  return (
    <section id="faq" className="bg-[var(--f-cream)] py-24 md:py-32">
      <div className="f-wrap grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <Label>Questions</Label>
          <Heading text="Good to *know*." className="mt-6 text-[length:clamp(36px,4.6vw,64px)] text-[var(--f-navy)]" />
          <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-[var(--f-ink)]/70">
            Anything else? <a href="#contact" className="font-semibold text-[var(--f-navy)] underline decoration-[var(--f-gold)] underline-offset-4 hover:text-[var(--f-gold)]">Get in touch</a> or visit any of our showrooms.
          </p>
        </Reveal>
        <ul className="border-t border-[var(--f-navy)]/12">
          {faq.map((f, i) => (
            <li key={f.q} className="border-b border-[var(--f-navy)]/12">
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-start gap-5 py-5 text-left md:py-6">
                <span className={`flex-1 text-[16px] leading-snug transition-colors md:text-[18px] ${open === i ? "font-semibold text-[var(--f-navy)]" : "text-[var(--f-ink)]/80 hover:text-[var(--f-navy)]"}`}>{f.q}</span>
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[15px] transition-transform duration-300 ${open === i ? "rotate-45 border-[var(--f-gold)] text-[var(--f-gold)]" : "border-[var(--f-navy)]/20 text-[var(--f-navy)]"}`} aria-hidden>
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease }} className="overflow-hidden">
                    <p className="max-w-2xl pb-6 pr-12 text-[15px] leading-relaxed text-[var(--f-ink)]/70 md:text-[16px]">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
