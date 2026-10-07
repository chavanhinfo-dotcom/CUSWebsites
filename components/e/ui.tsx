"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { scrollToHash } from "@/lib/lenis";

export const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Wide two-tone headline: the first `grey` lines are grey, the rest ink.
 * Lines rise out of a mask when the heading enters the viewport.
 */
export function Headline({
  lines,
  grey = 0,
  muted,
  className = "",
  light = false,
  as: Tag = "h2",
}: {
  lines: string[];
  /** first N lines grey */
  grey?: number;
  /** or: explicit indices of grey lines */
  muted?: number[];
  className?: string;
  light?: boolean;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={`wide ${className}`} aria-label={lines.join(" ")}>
      <motion.span
        className="block"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        aria-hidden
      >
        {lines.map((l, i) => (
          <span key={i} className="block overflow-hidden pb-[0.06em]">
            <motion.span
              className={`block ${(muted ? muted.includes(i) : i < grey) ? (light ? "text-white/35" : "text-x-grey") : light ? "text-white" : "text-x-ink"}`}
              variants={{ hidden: { y: "110%" }, show: { y: 0, transition: { duration: 1, ease } } }}
            >
              {l}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/** Words fill from grey to ink as the paragraph scrolls through the viewport. */
export function ScrubText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} p={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>
          {w}
        </Word>
      ))}
    </p>
  );
}
function Word({ p, from, to, children }: { p: MotionValue<number>; from: number; to: number; children: string }) {
  const color = useTransform(p, [from, to], ["#b9b9b6", "#111112"]);
  return <motion.span style={{ color }}>{children} </motion.span>;
}

export function Pill({
  href,
  children,
  dark = false,
  solid = false,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
  solid?: boolean;
}) {
  const base = solid
    ? dark
      ? "bg-white text-x-ink"
      : "bg-x-ink text-white"
    : dark
      ? "border border-white/40 text-white"
      : "border border-x-ink/30 text-x-ink";
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        scrollToHash(href);
      }}
      className={`group relative inline-flex h-11 items-center gap-3 overflow-hidden rounded-full px-6 text-[11px] font-semibold uppercase tracking-[0.14em] ${base}`}
    >
      <span className="absolute inset-0 translate-y-full rounded-full bg-x-gold transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
      <span className="relative transition-colors duration-500 group-hover:text-x-ink">{children}</span>
      <span className="relative h-1.5 w-1.5 rounded-full bg-current transition-colors duration-500 group-hover:bg-x-ink" />
    </a>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`micro flex items-center gap-3 ${light ? "text-white/60" : "text-x-mute"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-x-gold" />
      {children}
    </p>
  );
}
