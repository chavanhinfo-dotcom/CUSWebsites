"use client";
// Option G's building blocks: section headings, the gentle reveal, a number that counts up, and the four
// business groups the showroom finder sorts the franchises into.
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export const ease = [0.22, 1, 0.36, 1] as const;

export const BTN = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--g-navy)] px-6 text-[14px] font-bold text-white transition-colors duration-300 hover:bg-[var(--g-gold)]";
export const BTN_SOFT = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--g-navy)]/[0.06] px-6 text-[14px] font-bold text-[var(--g-navy)] transition-colors duration-300 hover:bg-[var(--g-navy)]/[0.1]";

// the businesses, as the finder groups the franchises (by the business named for each on the admin page)
export const GROUPS = [
  { id: "appliances", label: "Home appliances" },
  { id: "two-wheelers", label: "Two-wheelers" },
  { id: "cars", label: "Cars" },
  { id: "commercial", label: "Commercial" },
] as const;
export type GroupId = (typeof GROUPS)[number]["id"];
export function groupOf(business: string): GroupId | null {
  if (/commercial|truck/i.test(business)) return "commercial";
  if (/appliance/i.test(business)) return "appliances";
  if (/wheeler|motorcycle|scooter|bike/i.test(business)) return "two-wheelers";
  if (/car/i.test(business)) return "cars";
  return null;
}

/** Opens the showroom finder on one business (used by the business tiles at the top of the page). */
export function pickGroup(id: GroupId) {
  window.dispatchEvent(new CustomEvent<GroupId>("g-pick", { detail: id }));
}

/** A section's opening: the small gold line, the heading, and a line of text beside it. */
export function SectionHead({ eyebrow, title, text, light = false }: { eyebrow: string; title: React.ReactNode; text?: React.ReactNode; light?: boolean }) {
  return (
    <Reveal className="grid gap-4 px-1 md:grid-cols-[1.25fr_1fr] md:items-end md:gap-10">
      <div>
        <p className="g-eyebrow">{eyebrow}</p>
        <h2 className={`g-h mt-3 text-[length:clamp(32px,4.2vw,56px)] ${light ? "!text-white" : ""}`}>{title}</h2>
      </div>
      {text && <p className={`max-w-md text-[15px] leading-relaxed md:justify-self-end md:text-[16px] ${light ? "text-white/65" : "text-[var(--g-mute)]"}`}>{text}</p>}
    </Reveal>
  );
}

/** Fades its content up a little as it comes into view (once; not at all with reduced motion). */
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={{ duration: 0.75, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** A whole number that counts up from zero the first time it is seen. */
export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "-10% 0px" });
  const still = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    // (the page's HTML carries the real number; once it is live, it waits at zero until it is seen)
    if (still) return setShown(value);
    if (!seen) return setShown(0);
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1400);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, still, value]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown}
    </span>
  );
}
