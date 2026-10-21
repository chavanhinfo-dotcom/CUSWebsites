"use client";
// Option F's building blocks: the section label, a heading with its gold word, the two buttons, and the one
// gentle reveal used throughout.
import { motion, useReducedMotion } from "framer-motion";

export const ease = [0.22, 1, 0.36, 1] as const;

export const BTN = "inline-flex h-12 items-center justify-center rounded-full bg-[var(--f-navy)] px-7 text-[14px] font-semibold text-white transition-colors duration-300 hover:bg-[var(--f-gold)]";
export const BTN_LINE = "inline-flex h-12 items-center justify-center rounded-full border border-[var(--f-navy)]/20 px-7 text-[14px] font-semibold text-[var(--f-navy)] transition-colors duration-300 hover:border-[var(--f-gold)] hover:text-[var(--f-gold)]";

/** A section's label: a short gold line, then the words. */
export function Label({ children, light = false, className = "" }: { children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <p className={`f-label flex items-center gap-3 ${light ? "text-white/70" : "text-[var(--f-mute)]"} ${className}`}>
      <span className="h-px w-8 bg-[var(--f-gold)]" aria-hidden />
      {children}
    </p>
  );
}

/** A heading in the display face; a word wrapped in *asterisks* is set in gold italic. */
export function Heading({ text, as: Tag = "h2", className = "" }: { text: string; as?: "h1" | "h2"; className?: string }) {
  return (
    <Tag className={`f-display ${className}`}>
      {text.split(/(\*[^*]+\*)/).map((part, i) =>
        /^\*[^*]+\*$/.test(part) ? (
          <em key={i} className="text-[var(--f-gold)]">
            {part.slice(1, -1)}
          </em>
        ) : (
          part
        ),
      )}
    </Tag>
  );
}

/** Fades its content up a little as it comes into view (once; not at all with reduced motion). */
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
