"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { faq } from "@/lib/content";
import { ease } from "./ui";

export default function FaqX() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="grid gap-10 px-4 py-28 md:px-8 md:py-40 lg:grid-cols-[1fr_1.6fr_0.8fr]">
      <div>
        <h2 className="wide text-[clamp(56px,7vw,110px)]">F.A.Q</h2>
        <p className="mt-4 max-w-[240px] text-[14px] leading-relaxed text-x-mute">Straightforward answers about the group, its businesses and where we operate.</p>
      </div>
      <ol className="border-t border-x-line">
        {faq.map((f, i) => {
          const on = open === i;
          return (
            <li key={f.q} className="border-b border-x-line">
              <button onClick={() => setOpen(on ? -1 : i)} aria-expanded={on} className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 py-6 text-left">
                <span className="micro text-x-grey">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[16px] font-semibold md:text-[18px]">{f.q}</span>
                <span className="relative h-3 w-3" aria-hidden>
                  <span className="absolute left-0 top-1/2 h-px w-3 bg-x-ink" />
                  <span className={`absolute left-1/2 top-0 h-3 w-px bg-x-ink transition-transform duration-500 ${on ? "scale-y-0" : ""}`} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                    <p className="max-w-2xl pb-7 pl-[52px] text-[15px] leading-relaxed text-x-mute">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      <div className="lg:pt-2">
        <p className="text-[14px] leading-relaxed">Still have questions? Our team is here to help at any of our showrooms.</p>
        <a href="#contact" className="micro mt-4 inline-block border-b border-x-ink pb-1">Get in touch</a>
      </div>
    </section>
  );
}
