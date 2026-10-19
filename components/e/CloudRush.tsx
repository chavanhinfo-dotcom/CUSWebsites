"use client";
import { useEffect, useRef } from "react";

// Puffs of cloud the camera plunges through: each one appears small near the centre (far ahead), swells and
// rushes outwards past the edges. One continuous timeline t ∈ [0, 1] is split across two sections: the hero
// plays 0 → 0.5 (clouds gather until the view is white) and the highway plays 0.5 → 1 (they clear).
const PUFFS = Array.from({ length: 28 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    angle: r(1) * Math.PI * 2,
    reach: 0.12 + r(2) * 0.5, // how far from the centre it drifts (share of the view)
    start: r(3) * 0.55, // when it appears on the timeline (all have passed by t ≈ 0.97)
    size: 0.32 + r(4) * 0.4, // base width (share of the view's larger side)
    stretch: 1.2 + r(5) * 0.6, // clouds are wider than tall
    tilt: (r(6) - 0.5) * 30, // degrees
    shape: Math.floor(r(7) * 3),
  };
});
const LIFE = 0.42; // share of the timeline each puff takes to rush past

// Cumulus silhouettes: a few overlapping soft lobes, bright on top and faintly grey underneath.
const SHAPES = [
  "radial-gradient(34% 40% at 32% 54%, rgba(250,250,248,0.95), rgba(250,250,248,0) 100%), radial-gradient(30% 38% at 55% 40%, rgba(255,255,255,0.97), rgba(255,255,255,0) 100%), radial-gradient(32% 36% at 72% 56%, rgba(242,242,238,0.92), rgba(242,242,238,0) 100%), radial-gradient(48% 30% at 52% 68%, rgba(222,222,218,0.8), rgba(222,222,218,0) 100%)",
  "radial-gradient(28% 36% at 40% 46%, rgba(255,255,255,0.97), rgba(255,255,255,0) 100%), radial-gradient(36% 40% at 62% 52%, rgba(248,248,246,0.95), rgba(248,248,246,0) 100%), radial-gradient(24% 30% at 22% 60%, rgba(244,244,240,0.9), rgba(244,244,240,0) 100%), radial-gradient(46% 28% at 50% 70%, rgba(220,220,215,0.75), rgba(220,220,215,0) 100%)",
  "radial-gradient(40% 42% at 48% 50%, rgba(252,252,250,0.96), rgba(252,252,250,0) 100%), radial-gradient(26% 32% at 74% 44%, rgba(255,255,255,0.95), rgba(255,255,255,0) 100%), radial-gradient(26% 30% at 26% 48%, rgba(246,246,242,0.9), rgba(246,246,242,0) 100%), radial-gradient(44% 26% at 50% 69%, rgba(224,224,219,0.78), rgba(224,224,219,0) 100%)",
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function styles(t: number) {
  const puffs = PUFFS.map((p) => {
    const u = (t - p.start) / LIFE;
    if (u <= 0 || u >= 1) return HIDDEN;
    const near = u * u; // perspective: slow while far away, rushing as it passes
    const dist = p.reach * (0.2 + near * 2.2) * 100;
    const x = Math.cos(p.angle) * dist, y = Math.sin(p.angle) * dist;
    // (elements are 50vmax squares, so the scale is doubled to keep the same on-screen size: a quarter of the
    // pixels to paint)
    const s = 2 * p.size * (0.06 + near * 2.8);
    const opacity = Math.min(1, u * 3.5) * (1 - smooth(0.72, 1, u));
    return {
      opacity,
      transform: `translate(calc(-50% + ${x}vmax), calc(-50% + ${y}vmax)) rotate(${p.tilt}deg) scale(${s * p.stretch}, ${s})`,
    };
  });
  // a white veil peaks exactly at the seam (t = 0.5) so the hand-over between sections is invisible
  const veil = smooth(0.36, 0.495, t) * (1 - smooth(0.505, 0.64, t));
  return { puffs, veil };
}

const HIDDEN = { opacity: 0, transform: "translate(-50%, -50%) scale(0)" };

export default function CloudRush({ api, initial }: { api: React.MutableRefObject<((t: number) => void) | null>; initial: number }) {
  const puffs = useRef<(HTMLDivElement | null)[]>([]);
  const veil = useRef<HTMLDivElement>(null);
  // The server renders only what is exact in HTML: hidden puffs and a 0-or-1 veil (enough to cover the view
  // before the first frame). Puff positions and shapes are long decimals and gradients the browser rewrites
  // when parsing, so they are applied on the client only, avoiding a hydration mismatch.
  const veilStart = Math.round(styles(initial).veil);

  useEffect(() => {
    puffs.current.forEach((el, i) => {
      if (el) el.style.backgroundImage = SHAPES[PUFFS[i].shape];
    });
    api.current = (t: number) => {
      const s = styles(t);
      s.puffs.forEach((p, i) => {
        const el = puffs.current[i];
        if (!el) return;
        el.style.opacity = String(p.opacity);
        // invisible puffs leave the compositor entirely
        el.style.visibility = p.opacity > 0.003 ? "visible" : "hidden";
        if (p.opacity > 0.003) el.style.transform = p.transform;
      });
      if (veil.current) veil.current.style.opacity = String(s.veil);
    };
    return () => {
      api.current = null;
    };
  }, [api]);

  return (
    <div className="pointer-events-none absolute -inset-1 overflow-hidden" aria-hidden>
      {PUFFS.map((_, i) => (
        <div
          key={i}
          ref={(e) => {
            puffs.current[i] = e;
          }}
          className="absolute left-1/2 top-1/2 aspect-square w-[50vmax] will-change-transform"
          style={{ ...HIDDEN, visibility: "hidden" }}
        />
      ))}
      <div ref={veil} className="absolute inset-0 bg-x-white" style={{ opacity: veilStart }} />
    </div>
  );
}
