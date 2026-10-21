"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { ALBUMS, safeUrl, useContent, type Photo } from "@/components/e/content";

const SHOWN = 5; // one large photograph and four beside it; the whole album opens in the viewer

// a photograph in its frame (or, until it is added, a quiet placeholder)
function Picture({ p, contain = false }: { p: Photo; contain?: boolean }) {
  const src = safeUrl(p.src);
  const [failed, setFailed] = useState(false);
  if (src && !failed)
    return <img src={src} alt={p.caption} loading="lazy" onError={() => setFailed(true)} className={`h-full w-full ${contain ? "object-contain" : "object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"}`} />;
  return (
    // (its line sits in the upper part of the frame, clear of the caption over the lower part)
    <div className="flex h-full w-full justify-center bg-[radial-gradient(circle_at_30%_20%,#14306a,#071634_70%)] pt-[14%]">
      <div className="px-4 text-center">
        <span className="mx-auto block h-px w-10 bg-[var(--h-gold)]/50" />
        <p className="mt-4 text-[10px] uppercase tracking-[0.34em] text-[var(--h-pearl)]/40">Photograph to come</p>
      </div>
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
            {String(at + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
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
          <motion.div key={at} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="flex h-full w-full items-center justify-center">
            {safeUrl(p.src) ? (
              <Picture p={p} contain />
            ) : (
              <div className="aspect-[4/3] w-[min(100%,760px)] border border-[var(--h-gold)]/20 p-2">
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
 * The family album as a salon wall: one photograph large and four beside it, each in a gold-lined frame that
 * opens from below as it comes into view, filtered by album; the whole album
 * opens full screen.
 */
export default function GalleryH() {
  const { gallery } = useContent();
  const root = useRef<HTMLElement>(null);
  const present = ALBUMS.filter((a) => gallery.some((p) => p.album === a));
  const extra = [...new Set(gallery.map((p) => p.album))].filter((a) => !ALBUMS.includes(a));
  const albums = ["All", ...present, ...extra];
  const [album, setAlbum] = useState("All");
  const [view, setView] = useState<number | null>(null);
  const shown = album === "All" ? gallery : gallery.filter((p) => p.album === album);
  const tiles = shown.slice(0, SHOWN);
  const more = shown.length - tiles.length;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".gal-head > *", { y: 50, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".gal-head", start: "top 85%" } });
        gsap.utils.toArray<HTMLElement>(".gal-frame").forEach((f, i) => {
          gsap.fromTo(f, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.5, ease: "expo.inOut", delay: (i % 3) * 0.12, scrollTrigger: { trigger: f, start: "top 90%" } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, [album, gallery.length]);

  return (
    <section id="gallery" ref={root} className="relative bg-[var(--h-night)] px-6 py-24 md:px-12 md:py-36">
      <div className="mx-auto max-w-[1400px]">
        <div className="gal-head grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="h-eyebrow mb-6">The family album</p>
            <h2 className="h-serif text-[clamp(2.8rem,6.6vw,6.2rem)] leading-[0.98]">
              Moments that
              <br />
              <span className="italic text-[var(--h-gold-2)]">made us.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[var(--h-pearl)]/60 md:pb-3 md:text-right">The Chavan family and the people of the group, through the years.</p>
          {albums.length > 2 && (
            <div className="flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6 md:col-span-2" role="group" aria-label="Albums">
              {albums.map((a) => (
                <button key={a} type="button" aria-pressed={album === a} onClick={() => setAlbum(a)} className={`relative pb-1 text-[12px] uppercase tracking-[0.24em] transition-colors ${album === a ? "text-[var(--h-gold-2)]" : "text-[var(--h-pearl)]/50 hover:text-[var(--h-pearl)]"}`}>
                  {a}
                  <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--h-gold)] transition-transform duration-500 ${album === a ? "scale-x-100" : "scale-x-0"}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 grid auto-rows-[46vw] grid-cols-2 gap-3 md:mt-20 md:auto-rows-[clamp(180px,17vw,270px)] md:grid-cols-4 md:gap-5">
          {tiles.map((p, i) => {
            const last = i === tiles.length - 1 && more > 0;
            return (
              <button
                key={`${album}-${p.caption}-${i}`}
                type="button"
                onClick={() => setView(i)}
                data-cursor="View"
                aria-label={last ? `Open the album: ${more} more photographs` : `Open: ${p.caption}`}
                className={`gal-frame group relative overflow-hidden text-left ${i === 0 ? "col-span-2 md:row-span-2" : ""}`}
              >
                <Picture p={p} />
                <span className="pointer-events-none absolute inset-2.5 border border-[var(--h-gold)]/25 transition-colors duration-500 group-hover:border-[var(--h-gold)]/60 md:inset-3.5" aria-hidden />
                <span className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--h-night)]/85 to-transparent px-5 pb-5 pt-14 md:px-7 md:pb-6 ${last ? "hidden" : ""}`}>
                  <span className="block text-[10px] uppercase tracking-[0.3em] text-[var(--h-gold-2)]/80">
                    {p.album}
                    {p.year ? ` · ${p.year}` : ""}
                  </span>
                  <span className={`h-serif mt-1 block truncate text-[var(--h-pearl)] ${i === 0 ? "text-[1.9rem] md:text-[2.4rem]" : "text-[1.25rem] md:text-[1.4rem]"}`}>{p.caption}</span>
                </span>
                {last && (
                  <span className="absolute inset-0 grid place-items-center bg-[var(--h-night)]/[0.92] transition-colors duration-500 group-hover:bg-[var(--h-night)]/80">
                    <span className="text-center">
                      <span className="h-serif block text-5xl italic text-[var(--h-gold-2)]">+{more}</span>
                      <span className="mt-2 block text-[10px] uppercase tracking-[0.3em] text-[var(--h-pearl)]/80">View the album</span>
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <AnimatePresence>{view !== null && <Viewer list={shown} at={view} onClose={() => setView(null)} onMove={(d) => setView((v) => (v === null ? v : (v + d + shown.length) % shown.length))} />}</AnimatePresence>
    </section>
  );
}
