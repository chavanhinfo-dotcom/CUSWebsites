"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ALBUMS, safeUrl, useContent, type Photo } from "@/components/e/content";
import { SectionHead, ease } from "./ui";

// a photograph filling its frame (or, until it is added, a quiet placeholder)
function Frame({ p }: { p: Photo }) {
  const src = safeUrl(p.src);
  const [failed, setFailed] = useState(false);
  if (src && !failed)
    return <img src={src} alt={p.caption} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />;
  return (
    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#0e3a7a,var(--g-deep)_70%)]">
      <p className="text-center text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">
        Photograph
        <br />
        to come
      </p>
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
    // (the page behind holds still while the viewer is open)
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove(1);
      if (e.key === "ArrowLeft") onMove(-1);
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
  const btn = "grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-[var(--g-navy)]";
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photograph viewer"
      className="fixed inset-0 z-[90] flex flex-col bg-[rgba(4,16,38,0.96)] p-3 text-white backdrop-blur-sm md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const dx = e.clientX - start.current;
        start.current = null;
        if (Math.abs(dx) > 50) onMove(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-white/70">
          <span className="tabular-nums text-white">
            {at + 1} / {list.length}
          </span>{" "}
          · {p.album}
        </p>
        <button ref={close} type="button" onClick={onClose} aria-label="Close the viewer" className={btn}>
          ×
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center py-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={at} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className="flex h-full w-full items-center justify-center">
            {src ? (
              <img src={src} alt={p.caption} draggable={false} className="max-h-full max-w-full select-none rounded-[20px] object-contain" />
            ) : (
              <div className="aspect-[4/3] w-[min(100%,720px)] overflow-hidden rounded-[24px]">
                <Frame p={p} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[18px] font-extrabold tracking-tight md:text-[22px]">
          {p.caption}
          {p.year && <span className="ml-2 text-[var(--g-gold)]">{p.year}</span>}
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onMove(-1)} aria-label="Previous photograph" className={btn}>
            ←
          </button>
          <button type="button" onClick={() => onMove(1)} aria-label="Next photograph" className={btn}>
            →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The family album as a row of photographs to swipe (or step through with the arrows), filtered by album;
 * any of them opens full screen.
 */
export default function GalleryG() {
  const { gallery } = useContent();
  const present = ALBUMS.filter((a) => gallery.some((p) => p.album === a));
  const extra = [...new Set(gallery.map((p) => p.album))].filter((a) => !ALBUMS.includes(a));
  const albums = ["All", ...present, ...extra];
  const [album, setAlbum] = useState("All");
  const [view, setView] = useState<number | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const shown = album === "All" ? gallery : gallery.filter((p) => p.album === album);
  const slide = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = "grid h-11 w-11 place-items-center rounded-full bg-[var(--g-tile)] text-[var(--g-navy)] shadow-[0_0_0_1px_var(--g-line)] transition-colors hover:bg-[var(--g-navy)] hover:text-white";

  useEffect(() => row.current?.scrollTo({ left: 0 }), [album]);

  return (
    <section id="gallery" className="py-20 md:py-28">
      <div className="g-wrap">
        <SectionHead eyebrow="Gallery" title="The family album." text="The Chavan family and the people of the group, through the years." />
        <div className="mt-8 flex items-center justify-between gap-4">
          {albums.length > 2 ? (
            <div role="group" aria-label="Albums" className="g-row flex gap-1.5 overflow-x-auto">
              {albums.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={album === a}
                  onClick={() => setAlbum(a)}
                  className={`h-10 shrink-0 rounded-full px-4 text-[13px] font-bold transition-colors duration-300 ${album === a ? "bg-[var(--g-navy)] text-white" : "bg-[var(--g-tile)] text-[var(--g-ink)]/70 shadow-[0_0_0_1px_var(--g-line)] hover:text-[var(--g-navy)]"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <div className="hidden shrink-0 gap-2 md:flex">
            <button type="button" onClick={() => slide(-1)} aria-label="Scroll the photographs back" className={arrow}>
              ←
            </button>
            <button type="button" onClick={() => slide(1)} aria-label="Scroll the photographs on" className={arrow}>
              →
            </button>
          </div>
        </div>
        <div ref={row} className="g-row -mx-3 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-3 px-3 md:mx-0 md:gap-4 md:scroll-px-0 md:px-0">
          {shown.map((p, i) => (
            <button
              key={`${album}-${p.caption}-${i}`}
              type="button"
              onClick={() => setView(i)}
              aria-label={`Open: ${p.caption}`}
              className="group relative aspect-[4/5] w-[76vw] shrink-0 snap-start overflow-hidden rounded-[28px] text-left animate-[g-in_0.5s_ease_both] sm:w-[320px]"
            >
              <Frame p={p} />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,16,38,0.8)] to-transparent px-5 pb-5 pt-12 text-white">
                <span className="block text-[12px] font-semibold text-white/65">
                  {p.album}
                  {p.year ? ` · ${p.year}` : ""}
                </span>
                <span className="mt-1 block truncate text-[16px] font-extrabold tracking-tight">{p.caption}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {view !== null && <Viewer list={shown} at={view} onClose={() => setView(null)} onMove={(d) => setView((v) => (v === null ? v : (v + d + shown.length) % shown.length))} />}
      </AnimatePresence>
    </section>
  );
}
