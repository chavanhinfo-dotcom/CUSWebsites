"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, reducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { ALBUMS, safeUrl, useContent, type Photo } from "@/components/e/content";

const AUTO_MS = 6000; // how long each photograph is shown before the next
const ease = [0.22, 1, 0.36, 1] as const;
const pad = (k: number) => String(k).padStart(2, "0");

// fine gold diagonals, for frames still awaiting their photograph
const Hatch = () => (
  <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
    <defs>
      <pattern id="gal-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="14" stroke="#e4c98f" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#gal-hatch)" />
  </svg>
);

/** A photograph filling its frame; or, until it is added, a quiet panel (large, or as a thumbnail). */
function Picture({ p, size = "lg", contain = false, drift = false, n }: { p: Photo; size?: "lg" | "sm"; contain?: boolean; drift?: boolean; n?: number }) {
  const src = safeUrl(p.src);
  const [failed, setFailed] = useState(false);
  if (src && !failed)
    return (
      <img
        src={src}
        alt={size === "lg" ? p.caption : ""}
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className={`h-full w-full select-none ${contain ? "object-contain" : "object-cover"} ${drift ? "animate-[h-drift_9s_cubic-bezier(0.16,1,0.3,1)_both]" : ""}`}
      />
    );
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#17366f,#071634_70%)]">
      <Hatch />
      {size === "lg" ? (
        <div className="relative px-8 text-center">
          <span className="mx-auto block h-2.5 w-2.5 rotate-45 bg-[var(--h-gold)]" aria-hidden />
          <p className="h-serif mt-5 text-[clamp(1.8rem,3vw,2.8rem)] italic leading-none text-[var(--h-pearl)]/85">{p.album}</p>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-[var(--h-pearl)]/40">Photograph to come</p>
        </div>
      ) : (
        <span className="h-serif relative text-[1.35rem] italic leading-none text-[var(--h-gold-2)]/80" aria-hidden>
          {n !== undefined ? pad(n) : "◆"}
        </span>
      )}
    </div>
  );
}

function Viewer({ list, at, onMove, onClose }: { list: Photo[]; at: number; onMove: (d: number) => void; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const start = useRef<number | null>(null);
  const p = list[at];

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    close.current?.focus();
    getLenis()?.stop();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove(1);
      if (e.key === "ArrowLeft") onMove(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      getLenis()?.start();
      back?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!p) return null;
  const arrow = "grid h-12 w-12 place-items-center rounded-full border border-white/20 text-[var(--h-pearl)] transition-colors hover:border-[var(--h-gold)] hover:text-[var(--h-gold)]";
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photograph viewer"
      className="fixed inset-0 z-[90] flex flex-col bg-[var(--h-night)]/[0.97] px-4 py-4 backdrop-blur-sm md:px-10 md:py-7"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const dx = e.clientX - start.current;
        start.current = null;
        if (Math.abs(dx) > 50) onMove(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--h-pearl)]/55">
          <span className="tabular-nums text-[var(--h-pearl)]">
            {pad(at + 1)} / {pad(list.length)}
          </span>
          <span className="mx-3 text-[var(--h-gold)]">—</span>
          {p.album}
        </p>
        <button ref={close} type="button" onClick={onClose} aria-label="Close the viewer" className={arrow}>
          ×
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center py-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={at} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} className="flex h-full w-full items-center justify-center">
            {safeUrl(p.src) ? (
              <Picture p={p} contain />
            ) : (
              <div className="aspect-[4/3] w-[min(100%,760px)] overflow-hidden rounded-[18px] border border-[var(--h-gold)]/25">
                <Picture p={p} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-end justify-between gap-6">
        <p className="h-serif text-[clamp(1.6rem,2.6vw,2.4rem)] leading-tight text-[var(--h-pearl)]">
          {p.caption}
          {p.year && <span className="ml-3 italic text-[var(--h-gold-2)]">{p.year}</span>}
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onMove(-1)} aria-label="Previous photograph" className={arrow}>
            ←
          </button>
          <button type="button" onClick={() => onMove(1)} aria-label="Next photograph" className={arrow}>
            →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The family album as a showcase, on one screen: a photograph in a gold-lined frame, drifting slowly, and
 * beside it its caption, its place in the album and an index of every photograph to choose from. The album
 * turns its own pages while it is in view (a gold line timing each), pausing while it is browsed; any
 * photograph opens full screen; albums are chosen above.
 */
export default function GalleryH() {
  const { gallery } = useContent();
  const root = useRef<HTMLElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const present = ALBUMS.filter((a) => gallery.some((p) => p.album === a));
  const extra = [...new Set(gallery.map((p) => p.album))].filter((a) => !ALBUMS.includes(a));
  const albums = ["All", ...present, ...extra];
  const [album, setAlbum] = useState("All");
  const [at, setAt] = useState(0);
  const [view, setView] = useState(false);
  const [hold, setHold] = useState(false);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const shown = album === "All" ? gallery : gallery.filter((p) => p.album === album);
  const i = Math.min(at, Math.max(0, shown.length - 1));
  const p = shown[i];
  const go = (d: number) => setAt((a) => (Math.min(a, shown.length - 1) + d + shown.length) % shown.length);
  const playing = seen && !hold && !view && !still && shown.length > 1;

  useEffect(() => setStill(reducedMotion()), []);

  // the album turns its pages only while it is on screen
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => go(1), AUTO_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, i, album]);

  // the chosen thumbnail is kept in view within the index (the page itself does not move)
  useEffect(() => {
    const c = thumbs.current, b = c?.children[i] as HTMLElement | undefined;
    if (c && b) c.scrollTo({ left: b.offsetLeft - c.clientWidth / 2 + b.offsetWidth / 2, top: b.offsetTop - c.clientHeight / 2 + b.offsetHeight / 2, behavior: "smooth" });
  }, [i, album]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".gal-head > *", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".gal-head", start: "top 85%" } });
        gsap.fromTo(".gal-frame", { clipPath: "inset(100% 0 0 0 round 20px)" }, { clipPath: "inset(0% 0 0 0 round 20px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".gal-frame", start: "top 85%" } });
        gsap.from(".gal-side > *", { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".gal-frame", start: "top 80%" } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  if (!p) return null;
  const arrow = "grid h-11 w-11 place-items-center rounded-full border border-white/20 text-[var(--h-pearl)] transition-colors duration-300 hover:border-[var(--h-gold)] hover:text-[var(--h-gold-2)]";
  return (
    <section id="gallery" ref={root} className="relative bg-[var(--h-night)] py-20 text-[var(--h-pearl)] md:py-24">
      <div className="h-wrap">
        <div className="gal-head flex flex-col gap-7 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="shrink-0">
            <p className="h-eyebrow">The family album</p>
            <h2 className="h-serif mt-5 text-[clamp(2.4rem,4.4vw,4.2rem)] leading-[1]">
              Moments that <em className="text-[var(--h-gold-2)]">made us.</em>
            </h2>
          </div>
          {albums.length > 2 && (
            <div role="group" aria-label="Albums" className="h-noscroll -mx-5 flex min-w-0 gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:justify-end md:px-0">
              {albums.map((a) => {
                const n = a === "All" ? gallery.length : gallery.filter((q) => q.album === a).length;
                const on = album === a;
                return (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setAlbum(a);
                      setAt(0);
                    }}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${on ? "border-[var(--h-gold)] bg-[var(--h-gold)] text-[var(--h-night)]" : "border-white/15 text-[var(--h-pearl)]/70 hover:border-[var(--h-gold)]/60 hover:text-[var(--h-pearl)]"}`}
                  >
                    {a}
                    <span className="ml-2 opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="mt-9 grid grid-cols-[minmax(0,1fr)] gap-6 md:mt-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)] lg:gap-10"
          onMouseEnter={() => setHold(true)}
          onMouseLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={() => setHold(false)}
        >
          {/* the photograph */}
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setView(true)}
              aria-label={`Open full screen: ${p.caption}`}
              className="gal-frame group relative block aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-[#071634] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] lg:aspect-auto lg:h-[min(56svh,520px)]"
            >
              <AnimatePresence initial={false}>
                <motion.div key={`${album}-${i}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease }}>
                  <Picture p={p} drift />
                </motion.div>
              </AnimatePresence>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(6,20,48,0.55)] to-transparent" aria-hidden />
              <span className="pointer-events-none absolute inset-2.5 rounded-[14px] border border-white/25 md:inset-3" aria-hidden />
              <span className="pointer-events-none absolute inset-[18px] rounded-[10px] border border-[var(--h-gold)]/30 md:inset-[22px]" aria-hidden />
              <span className="absolute bottom-6 right-6 flex items-center gap-2 rounded-full bg-[rgba(6,20,48,0.7)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--h-gold-2)] opacity-0 ring-1 ring-[var(--h-gold)]/50 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 md:bottom-8 md:right-8">
                View <span aria-hidden>⤢</span>
              </span>
            </button>
            {/* the timer of the album's turning pages */}
            <div className="mt-3 h-px overflow-hidden bg-white/10" aria-hidden>
              {playing && <span key={`${album}-${i}`} className="block h-full origin-left animate-[h-bar_6s_linear_both] bg-[var(--h-gold)]" />}
            </div>
          </div>

          {/* its place, its caption, and the index */}
          <div className="gal-side flex min-h-0 min-w-0 flex-col lg:h-[min(56svh,520px)]">
            <div className="flex items-end justify-between gap-4">
              <p className="h-serif leading-none tabular-nums">
                <span className="text-[clamp(2.8rem,4vw,3.6rem)] text-[var(--h-gold-2)]">{pad(i + 1)}</span>
                <span className="ml-2 text-[1.3rem] text-[var(--h-pearl)]/40">/ {pad(shown.length)}</span>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => go(-1)} aria-label="Previous photograph" className={arrow}>
                  ←
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next photograph" className={arrow}>
                  →
                </button>
              </div>
            </div>
            <div className="mt-5 border-t border-white/10 pt-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={`${album}-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--h-gold)]">
                    {p.album}
                    {p.year ? ` · ${p.year}` : ""}
                  </p>
                  <p className="h-serif mt-2 line-clamp-2 text-[1.65rem] leading-snug md:text-[1.9rem]">{p.caption}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              ref={thumbs}
              role="group"
              aria-label="Photographs"
              className="h-noscroll relative -mx-5 mt-6 grid auto-cols-[72px] grid-flow-col gap-2 overflow-x-auto px-5 py-1.5 md:mx-0 md:px-1.5 lg:mt-auto lg:max-h-[52%] lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-4 lg:overflow-y-auto lg:overflow-x-hidden"
            >
              {shown.map((q, k) => (
                <button
                  key={`${album}-${k}`}
                  type="button"
                  onClick={() => setAt(k)}
                  aria-label={`Show: ${q.caption}`}
                  aria-current={k === i}
                  className={`relative aspect-square overflow-hidden rounded-[10px] transition-all duration-500 ${k === i ? "opacity-100 ring-2 ring-[var(--h-gold)] ring-offset-2 ring-offset-[#061430]" : "opacity-45 hover:opacity-90"}`}
                >
                  <Picture p={q} size="sm" n={k + 1} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>{view && <Viewer list={shown} at={i} onClose={() => setView(false)} onMove={go} />}</AnimatePresence>
    </section>
  );
}
