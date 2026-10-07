"use client";
import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "@/lib/gsap";

// Soft trailing cursor on pointer devices; grows over links and [data-cursor] elements.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || reducedMotion()) return;
    const el = dot.current!;
    gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });

    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      gsap.to(el, { opacity: 1, duration: 0.3 });
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest("a, button, [data-cursor]") as HTMLElement | null;
      const text = t?.dataset.cursor ?? "";
      if (label.current) label.current.textContent = text;
      gsap.to(el, {
        width: t ? (text ? 88 : 48) : 12,
        height: t ? (text ? 88 : 48) : 12,
        duration: 0.4,
        ease: "power3.out",
      });
    };
    const leave = () => gsap.to(el, { opacity: 0, duration: 0.3 });

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={dot}
      className="pointer-events-none fixed left-0 top-0 z-[95] hidden h-3 w-3 items-center justify-center rounded-full bg-gold-2 mix-blend-difference md:flex"
      style={{ opacity: 0 }}
      aria-hidden
    >
      <span ref={label} className="text-[10px] font-semibold uppercase tracking-widest text-ink" />
    </div>
  );
}
