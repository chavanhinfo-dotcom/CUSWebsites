"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { presence } from "@/lib/content";

// Two "postcards" (one per state) that tilt toward the pointer, joined by a sketched route.
function Postcard({ state, districts, i }: { state: string; districts: { name: string; hq?: boolean }[]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: x * 14, rotateX: -y * 14, duration: 0.6, ease: "power3.out" });
  };
  const leave = () => gsap.to(ref.current, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" });

  return (
    <div className="pc-card [perspective:1000px]">
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        className={`relative rounded-2xl border-[1.5px] border-navy bg-white p-7 shadow-[8px_8px_0_#0b2859] [transform-style:preserve-3d] md:p-10 ${i ? "md:rotate-2" : "md:-rotate-2"}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-hand text-2xl text-brass">greetings from</p>
            <h3 className="font-display text-5xl leading-none md:text-6xl">{state}</h3>
          </div>
          <div className="grid h-20 w-16 place-items-center border-2 border-dashed border-brass text-center font-hand text-sm leading-tight text-brass [transform:translateZ(30px)]">
            CUS<br />{i ? "KA" : "MH"}
          </div>
        </div>
        <ul className="mt-8 space-y-3 [transform:translateZ(40px)]">
          {districts.map((d) => (
            <li key={d.name} className="flex items-center justify-between border-b border-dashed border-navy/25 pb-3">
              <span className="font-display text-3xl md:text-4xl">{d.name}</span>
              {d.hq && <span className="rounded-full bg-navy px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-paper">Head office</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PresenceB() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".pc-card", {
          x: (i: number) => (i ? 200 : -200), rotate: (i: number) => (i ? 12 : -12), opacity: 0,
          duration: 1.3, ease: "expo.out", stagger: 0.15,
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
        const path = document.querySelector<SVGPathElement>(".pc-route");
        if (path) {
          const len = path.getTotalLength();
          gsap.fromTo(path, { strokeDashoffset: len, strokeDasharray: `${len}` }, {
            strokeDashoffset: 0, duration: 2, ease: "power2.inOut",
            scrollTrigger: { trigger: root.current, start: "top 60%" },
            onComplete: () => void gsap.set(path, { strokeDasharray: "8 10" }),
          });
        }
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="presence" ref={root} className="relative overflow-hidden px-4 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center">
          <p className="font-hand text-3xl text-brass">Our presence</p>
          <h2 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-none">Two states, four districts</h2>
        </div>

        <div className="relative mt-16 grid gap-16 md:grid-cols-2 md:gap-24">
          <svg className="pointer-events-none absolute left-1/2 top-1/2 hidden h-48 w-48 -translate-x-1/2 -translate-y-1/2 md:block" viewBox="0 0 200 200" aria-hidden>
            <path id="pc-route" className="pc-route" d="M10 60 C 60 0, 140 200, 190 140" fill="none" stroke="#c99a2e" strokeWidth="3" strokeLinecap="round" />
            <g>
              <rect x="-9" y="-6" width="18" height="12" rx="3" fill="#0b2859" />
              <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                <mpath href="#pc-route" />
              </animateMotion>
            </g>
          </svg>
          {presence.map((s, i) => (
            <Postcard key={s.state} state={s.state} districts={s.districts} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
