"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ALBUMS, safeUrl, useContent, type Photo } from "@/components/e/content";
import { Heading, Label, Reveal, ease } from "./ui";

const SHOWN = 5; // one large photograph and four beside it; the rest open in the viewer

// a photograph filling its frame (or, until it is added, a quiet placeholder)
function Frame({ p, i }: { p: Photo; i: number }) {
  const src = safeUrl(p.src);
  const [failed, setFailed] = useState(false);
  if (src && !failed)
    return <img src={src} alt={p.caption} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />;
  return (
    <div className="relative grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#0d3a7a,var(--f-deep)_70%)]">
      <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
        <path d={`M -5 ${60 + (i % 3) * 8} C 30 ${30 + (i % 4) * 6}, 60 ${85 - (i % 3) * 7}, 105 ${45 + (i % 2) * 10}`} fill="none" stroke="#d9a441" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="f-label relative text-center text-white/40">Photograph<br />to come</p>
    </div>
  );
}

function Viewer({ list, at, onMove, onClose }: { list: Photo[]; at: number; onMove: (d: number) => void; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const [dir, setDir] = useState(1);
  const start = useRef<number | null>(null);
  const p = list[at];
  const go = (d: number) => {
    setDir(d);
    onMove(d);
  };

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    close.current?.focus();
    // (the page behind holds still while the viewer is open)
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      html.style.overflow = "";
      back?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!p) return null;
  const src = safeUrl(p.src);
  const arrow = "grid h-12 w-12 place-items-center rounded-full border border-white/20 transition hover:border-[var(--f-gold)] hover:text-[var(--f-gold)]";
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photograph viewer"
      className="fixed inset-0 z-[90] flex flex-col bg-[var(--f-night)]/96 text-white backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const dx = e.clientX - start.current;
        start.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        <p className="f-label flex items-center gap-3 text-white/60">
          <span className="tabular-nums text-white">
            {String(at + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
          </span>
          <span className="h-px w-6 bg-[var(--f-gold)]" />
          {p.album}
        </p>
        <button ref={close} type="button" onClick={onClose} aria-label="Close the viewer" className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-xl transition hover:border-[var(--f-gold)] hover:text-[var(--f-gold)]">
          ×
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-24">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={at}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.55, ease }}
            className="flex h-full w-full items-center justify-center"
          >
            {src ? (
              <img src={src} alt={p.caption} className="max-h-full max-w-full select-none rounded-[10px] object-contain" draggable={false} />
            ) : (
              <div className="aspect-[4/3] w-[min(100%,720px)] overflow-hidden rounded-[14px]">
                <Frame p={p} i={at} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => go(-1)} aria-label="Previous photograph" className={`absolute left-8 top-1/2 hidden -translate-y-1/2 md:grid ${arrow}`}>
          ←
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next photograph" className={`absolute right-8 top-1/2 hidden -translate-y-1/2 md:grid ${arrow}`}>
          →
        </button>
      </div>
      <div className="flex items-end justify-between gap-4 px-4 pb-6 pt-4 md:px-8 md:pb-8">
        <p className="f-display text-[length:clamp(22px,2.4vw,32px)] leading-tight">
          {p.caption}
          {p.year && <span className="ml-3 italic text-[var(--f-gold-2)]">{p.year}</span>}
        </p>
        <div className="flex gap-2 md:hidden">
          <button type="button" onClick={() => go(-1)} aria-label="Previous photograph" className={arrow}>←</button>
          <button type="button" onClick={() => go(1)} aria-label="Next photograph" className={arrow}>→</button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The family album, kept compact: one photograph large and four beside it, filtered by album. Any of them opens
 * full screen, where the arrows, the keyboard or a swipe go through the whole album.
 */
export default function GalleryF() {
  const { gallery } = useContent();
  const present = ALBUMS.filter((a) => gallery.some((p) => p.album === a));
  const extra = [...new Set(gallery.map((p) => p.album))].filter((a) => !ALBUMS.includes(a));
  const albums = ["All", ...present, ...extra];
  const [album, setAlbum] = useState("All");
  const [view, setView] = useState<number | null>(null);
  const shown = album === "All" ? gallery : gallery.filter((p) => p.album === album);
  const tiles = shown.slice(0, SHOWN);
  const more = shown.length - tiles.length;

  return (
    <section id="gallery" className="bg-[var(--f-navy)] py-24 text-white md:py-32">
      <div className="f-wrap">
        <Reveal className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-10">
          <div>
            <Label light>Gallery</Label>
            <Heading text="The family *album*." className="mt-6 text-[length:clamp(36px,4.6vw,64px)]" />
          </div>
          <p className="max-w-md text-[16px] leading-relaxed text-white/65 md:justify-self-end">
            The Chavan family and the people of the group, through the years.
          </p>
        </Reveal>
        {albums.length > 2 && (
          <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Albums">
            {albums.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={album === a}
                onClick={() => setAlbum(a)}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-300 ${album === a ? "border-[var(--f-gold)] bg-[var(--f-gold)] text-white" : "border-white/20 text-white/75 hover:border-white/50 hover:text-white"}`}
              >
                {a}
              </button>
            ))}
          </div>
        )}
  
        <AnimatePresence mode="wait">
          <motion.div
            key={album}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease }}
            className="mt-10 grid auto-rows-[44vw] grid-cols-2 gap-3 md:mt-14 md:auto-rows-[clamp(170px,16.5vw,260px)] md:grid-cols-4 md:gap-4"
          >
            {tiles.map((p, i) => {
              const last = i === tiles.length - 1 && more > 0;
              return (
                <button
                  key={`${p.caption}-${i}`}
                  type="button"
                  onClick={() => setView(i)}
                  aria-label={last ? `Open the album: ${more} more photographs` : `Open: ${p.caption}`}
                  className={`group relative overflow-hidden rounded-[16px] text-left ${i === 0 ? "col-span-2 md:row-span-2" : ""}`}
                >
                  <Frame p={p} i={i} />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(3,15,39,0.75)] to-transparent px-4 pb-3.5 pt-10 md:px-5 md:pb-4">
                    <span className={`block truncate text-white ${i === 0 ? "f-display text-[20px] md:text-[26px]" : "text-[13px] md:text-[14px]"}`}>
                      {p.caption}
                      {p.year && <span className="f-display ml-2 italic text-[var(--f-gold-2)]">{p.year}</span>}
                    </span>
                  </span>
                  {last && (
                    <span className="absolute inset-0 grid place-items-center bg-[rgba(3,15,39,0.62)] transition-colors duration-500 group-hover:bg-[rgba(3,15,39,0.5)]">
                      <span className="text-center">
                        <span className="f-display block text-[40px] italic leading-none text-[var(--f-gold-2)] md:text-[48px]">+{more}</span>
                        <span className="f-label mt-2 block text-white/80">View all</span>
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
  
        <AnimatePresence>
          {view !== null && (
            <Viewer list={shown} at={view} onClose={() => setView(null)} onMove={(d) => setView((v) => (v === null ? v : (v + d + shown.length) % shown.length))} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
