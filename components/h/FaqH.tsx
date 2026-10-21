"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { useContent } from "@/components/e/content";

/** Questions and answers on pearl: each question opens in place, one at a time, between hairline rules. */
export default function FaqH() {
  const { faq } = useContent();
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".fq-head > *", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".fq-head", start: "top 85%" } });
        gsap.from(".fq-item", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.06, scrollTrigger: { trigger: ".fq-list", start: "top 85%" } });
      });
    }, root);
    return () => ctx.revert();
  }, [faq.length]);

  if (!faq.length) return null;
  return (
    <section id="faq" ref={root} className="bg-[var(--h-pearl)] py-24 text-[var(--h-ink)] md:py-36">
      <div className="h-wrap grid gap-12 lg:grid-cols-12">
        <div className="fq-head lg:col-span-4">
          <p className="h-eyebrow h-dark">Questions</p>
          <h2 className="h-serif mt-5 text-[clamp(2.6rem,4.6vw,4.4rem)] leading-[1] text-[var(--h-brand)]">
            Good <span className="italic text-[var(--h-gold-deep)]">to know.</span>
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[var(--h-mute)]">Anything else? Any of our showrooms will be glad to help.</p>
        </div>
        <ul className="fq-list border-t border-[var(--h-ink)]/12 lg:col-span-8">
          {faq.map((f, i) => (
            <li key={f.q} className="fq-item border-b border-[var(--h-ink)]/12">
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="group flex w-full items-start gap-6 py-6 text-left md:py-7">
                <span className="mt-2.5 w-8 shrink-0 text-[11px] tracking-[0.2em] text-[var(--h-gold-deep)]">{String(i + 1).padStart(2, "0")}</span>
                <span className={`h-serif flex-1 text-[1.6rem] leading-snug transition-colors duration-500 md:text-[2rem] ${open === i ? "text-[var(--h-gold-deep)]" : "text-[var(--h-brand)] group-hover:text-[var(--h-gold-deep)]"}`}>{f.q}</span>
                <span className={`mt-2 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-lg transition-all duration-500 ${open === i ? "rotate-45 border-[var(--h-gold)] bg-[var(--h-gold)] text-white" : "border-[var(--h-ink)]/20 text-[var(--h-brand)]"}`} aria-hidden>
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <p className="max-w-2xl pb-8 pl-14 pr-12 text-[15px] leading-relaxed text-[var(--h-ink)]/70 md:text-[16px]">{f.a}</p>
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
