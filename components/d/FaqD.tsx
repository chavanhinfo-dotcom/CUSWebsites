"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { faq } from "@/lib/content";
import { RevealLines } from "./FeaturesD";

const ease = [0.25, 1, 0.5, 1] as const;

export default function FaqD() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="grid bg-d-bg lg:grid-cols-2">
      <div className="border-d-line px-5 pt-28 md:px-12 md:pt-[160px] lg:border-r lg:pb-[160px]">
        <h2 className="max-w-xl text-[clamp(40px,5vw,72px)] font-medium leading-none tracking-[-0.05em] lg:sticky lg:top-32">
          <RevealLines lines={["Everything to know", "about Chavan", "Udyog Samuh."]} />
        </h2>
      </div>
      <div className="px-5 pb-28 pt-12 md:px-12 md:pb-[160px] lg:pt-[160px]">
        {faq.map((f, i) => {
          const on = open === i;
          return (
            <div key={f.q} className="border-b border-d-line">
              <button onClick={() => setOpen(on ? -1 : i)} className="flex w-full items-center justify-between gap-6 py-8 text-left" aria-expanded={on}>
                <span className="text-[clamp(19px,1.7vw,24px)] font-medium tracking-[-0.02em]">{f.q}</span>
                <span className={`grid h-6 w-10 shrink-0 place-items-center rounded-md transition-colors duration-300 ${on ? "bg-brass" : "bg-d-dark"}`}>
                  <svg width="12" height="8" viewBox="0 0 12 8" className={`transition-transform duration-500 ${on ? "rotate-180" : ""}`}>
                    <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
                    <p className="max-w-2xl pb-8 text-[18px] leading-[1.5] text-d-sub">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
