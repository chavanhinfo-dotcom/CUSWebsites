"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { company, future, navLinks, presence, verticals } from "@/lib/content";
import { scrollToHash } from "@/lib/lenis";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Text that decodes from random glyphs when it scrolls into view.
function scramble(el: HTMLElement) {
  const final = el.dataset.text ?? "";
  const obj = { p: 0 };
  gsap.to(obj, {
    p: 1,
    duration: 1.6,
    ease: "power2.out",
    onUpdate: () => {
      const n = Math.floor(obj.p * final.length);
      el.textContent = final
        .split("")
        .map((c, i) => (i < n || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join("");
    },
  });
}

export default function FutureFooterB() {
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Navy floods in from a circle as the section arrives
        gsap.fromTo(".ff-flood", { clipPath: "circle(8% at 50% 100%)" }, {
          clipPath: "circle(150% at 50% 100%)",
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 20%", scrub: true },
        });
        gsap.to(".ff-mark", {
          rotate: 25, yPercent: -20, ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        });
        gsap.utils.toArray<HTMLElement>(".ff-scramble").forEach((el) => {
          gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%" } }).call(() => scramble(el));
        });
        gsap.from(".ff-pillar", {
          rotateY: -90, opacity: 0, transformOrigin: "left center", duration: 1.1, ease: "expo.out", stagger: 0.12,
          scrollTrigger: { trigger: ".ff-pillars", start: "top 85%" },
        });
      });

      // Magnetic contact button
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const b = btn.current!;
        const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        const yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        const move = (e: PointerEvent) => {
          const r = b.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const near = Math.hypot(dx, dy) < 220;
          xTo(near ? dx * 0.35 : 0);
          yTo(near ? dy * 0.35 : 0);
        };
        window.addEventListener("pointermove", move);
        return () => window.removeEventListener("pointermove", move);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };

  return (
    <div ref={root} className="relative">
      <div className="ff-flood relative overflow-hidden bg-navy text-paper">
        <img src="/brand/logo-mark-light.png" alt="" aria-hidden className="ff-mark pointer-events-none absolute -right-24 top-10 w-[70vw] max-w-[900px] opacity-[0.06]" />

        {/* Looking ahead */}
        <section className="relative mx-auto max-w-[1400px] px-4 pb-20 pt-32 md:px-10 md:pt-44">
          <p className="font-hand text-3xl text-brass">Looking ahead</p>
          <h2 className="mt-2 max-w-5xl font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.95]">
            Building on heritage, moving toward a{" "}
            <em className="ff-scramble text-brass" data-text="FUTURE-READY">FUTURE-READY</em> tomorrow.
          </h2>
          <p className="mt-8 max-w-2xl text-lg text-paper/75">{future.text}</p>
          <div className="ff-pillars mt-14 grid gap-4 [perspective:1200px] md:grid-cols-3">
            {future.pillars.map((p, i) => (
              <div key={p} className="ff-pillar rounded-2xl border-[1.5px] border-paper/30 p-7 transition-colors duration-500 hover:border-brass hover:bg-paper/5">
                <span className="font-hand text-3xl text-brass">0{i + 1}</span>
                <p className="mt-6 font-display text-4xl">{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="relative mx-auto max-w-[1400px] px-4 pb-8 pt-16 md:px-10 md:pt-24">
          <div className="flex flex-col items-start justify-between gap-12 border-t border-paper/15 pt-16 md:flex-row md:items-center">
            <div>
              <p className="font-hand text-3xl text-brass">Get in touch</p>
              <h2 className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-none">
                Visit a showroom<br /><em>near you.</em>
              </h2>
              <p className="mt-6 max-w-md text-paper/70">
                Head office in {company.hq}. Serving {presence.flatMap((s) => s.districts.map((d) => d.name)).join(", ")}.
              </p>
            </div>
            <button
              ref={btn}
              onClick={() => scrollToHash("#presence")}
              className="grid h-40 w-40 shrink-0 place-items-center rounded-full bg-brass text-center font-semibold text-navy shadow-[0_20px_50px_-10px_rgba(201,154,46,0.6)] transition-colors hover:bg-paper md:h-48 md:w-48"
            >
              <span>Find us<br /><span className="font-hand text-2xl font-normal">→ map</span></span>
            </button>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <img src="/brand/logo-full-light.png" alt={`${company.name}: ${company.motto}`} className="w-56" />
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-paper/50">Explore</p>
              <ul className="space-y-2">
                {navLinks.map((l) => (
                  <li key={l.href}><a href={l.href} onClick={(e) => go(e, l.href)} className="hover:text-brass">{l.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-paper/50">Businesses</p>
              <ul className="space-y-2">{verticals.map((v) => <li key={v.id}>{v.title}</li>)}</ul>
            </div>
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-paper/50">Regions</p>
              <ul className="space-y-2">{presence.map((s) => <li key={s.state}>{s.state}</li>)}</ul>
            </div>
          </div>

          <div className="mt-20 flex flex-col justify-between gap-3 border-t border-paper/15 pt-6 text-xs text-paper/50 md:flex-row">
            <p>© {new Date().getFullYear()} {company.name}. {company.motto}</p>
            <p>Brand names are trademarks of their respective owners. Photography: Unsplash.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
