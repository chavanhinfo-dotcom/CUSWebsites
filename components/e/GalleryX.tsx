"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { getLenis } from "@/lib/lenis";
import { reducedMotion } from "@/lib/gsap";
import { useContent, type Photo } from "./content";
import { Eyebrow, ease } from "./ui";

const AUTOPLAY = 5; // seconds per photograph while the gallery plays by itself

/** A frame awaiting its photograph (the built-in list): an engraved camera and its caption. */
function Awaiting({ p }: { p: Photo }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_50%_0%,#262628_0%,#141415_55%,#0d0d0e_100%)] p-6 text-center">
      <span className="pointer-events-none absolute inset-3 rounded-lg border border-white/[0.08]" aria-hidden />
      <div>
        <svg viewBox="0 0 48 48" className="mx-auto h-9 w-9 fill-none stroke-x-gold/80 stroke-[1.2] md:h-11 md:w-11" aria-hidden>
          <path d="M6 15h9l3-5h12l3 5h9v23H6z" strokeLinejoin="round" />
          <circle cx="24" cy="26" r="7.5" />
          <circle cx="24" cy="26" r="3" />
        </svg>
        <p className="wide mt-4 text-[clamp(12px,1.1vw,16px)] text-white/80">{p.caption}</p>
        <p className="micro mt-2 !text-[9px] text-white/35">Photograph to come</p>
      </div>
    </div>
  );
}

/** The photograph viewer: arrows, keyboard (← → Esc), swipe, and a strip of thumbnails. */
function Viewer({ photos, start, onClose }: { photos: Photo[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const dir = useRef(1);
  const close = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const down = useRef<number | null>(null);
  const n = photos.length;
  const go = (d: number) => {
    dir.current = d;
    setI((x) => (x + d + n) % n);
  };

  useEffect(() => {
    // the page holds still under the viewer
    const lenis = getLenis();
    lenis?.stop();
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      html.style.overflow = was;
      lenis?.start();
      opener?.focus?.();
    };
    // (once, while the viewer is open)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // keep the current thumbnail in view
  useEffect(() => {
    strip.current?.children[i]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [i]);

  const p = photos[i];
  const arrow = (d: 1 | -1) => (
    <button
      type="button"
      onClick={() => go(d)}
      aria-label={d < 0 ? "Previous photograph" : "Next photograph"}
      className={`absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-x-black/50 text-white backdrop-blur transition hover:border-x-gold hover:text-x-gold md:h-14 md:w-14 ${d < 0 ? "left-3 md:left-8" : "right-3 md:right-8"}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photograph"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease }}
      className="fixed inset-0 z-[95] flex flex-col bg-[#070708]/[0.97] text-white"
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-4 md:px-8 md:pt-6">
        <p className="micro tabular-nums text-white/60">
          <span className="text-x-gold">{String(i + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
        </p>
        <button ref={close} type="button" onClick={onClose} className="micro h-10 rounded-full border border-white/25 px-5 transition hover:border-white">
          Close
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-4 md:px-24"
        onPointerDown={(e) => (down.current = e.clientX)}
        onPointerUp={(e) => {
          if (down.current === null) return;
          const dx = e.clientX - down.current;
          down.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {n > 1 && arrow(-1)}
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={i}
            initial={{ opacity: 0, x: dir.current * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dir.current * 40 }}
            transition={{ duration: 0.4, ease }}
            className="flex max-h-full max-w-full flex-col items-center"
          >
            <img src={p.src} alt={p.caption} draggable={false} className="max-h-[calc(100svh-260px)] max-w-full select-none rounded-lg object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] md:max-h-[calc(100svh-280px)]" />
            <figcaption className="mt-5 text-center">
              {p.caption && <p className="wide text-[clamp(15px,1.5vw,22px)]">{p.caption}</p>}
              <p className="micro mt-2 text-x-gold">
                {p.album}
                {p.year ? ` · ${p.year}` : ""}
              </p>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
        {n > 1 && arrow(1)}
      </div>

      {n > 1 && (
        <div ref={strip} className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-5 [scrollbar-width:none] md:justify-center md:px-8 md:pb-7">
          {photos.map((x, k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                dir.current = k > i ? 1 : -1;
                setI(k);
              }}
              aria-label={`Photograph ${k + 1}${x.caption ? `: ${x.caption}` : ""}`}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-md transition md:h-16 md:w-24 ${k === i ? "opacity-100 ring-2 ring-x-gold" : "opacity-40 hover:opacity-80"}`}
            >
              <img src={x.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** Signed distance of photograph `i` from the current one, the shorter way round the loop. */
const around = (i: number, at: number, n: number) => {
  let d = (((i - at) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
};
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-current stroke-[1.7]`} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const ctl = "grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/85 transition hover:border-x-gold hover:text-x-gold disabled:pointer-events-none disabled:opacity-30";

// The family's photographs (added on the admin page), as a compact coverflow about one screen tall: the
// current photograph in the middle, its neighbours turned away to either side. Drag or swipe it, use the
// arrows or keys, pick from the thumbnails, or let it play by itself; the middle one opens full screen.
// Until photographs are added, framed places show what each will hold.
export default function GalleryX() {
  const { gallery } = useContent();
  const albums = useMemo(() => [...new Set(gallery.map((p) => p.album))], [gallery]);
  const [album, setAlbum] = useState<string | null>(null);
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const [drag, setDrag] = useState<number | null>(null); // the live drag offset, px
  const [w, setW] = useState(1200);
  const [vh, setVh] = useState(800);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; t: number; moved: boolean; i: number | null } | null>(null);
  const inView = useInView(section, { amount: 0.35 });

  const shown = album ? gallery.filter((p) => p.album === album) : gallery;
  const n = shown.length;
  const photos = shown.filter((p) => p.src); // (the ones that open full screen)
  const count = gallery.filter((p) => p.src).length;
  const cur = shown[Math.min(at, n - 1)];
  const go = useCallback((d: number) => setAt((x) => (((x + d) % n) + n) % n), [n]);
  const expand = (i: number) => shown[i]?.src && setOpen(photos.indexOf(shown[i]));

  // the stage's size, the starting album, still for visitors who prefer less motion
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      setW(el.clientWidth);
      setVh(window.innerHeight);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    fit();
    if (reducedMotion()) setPlaying(false);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);
  useEffect(() => setAt(0), [album]);
  // the current thumbnail kept in view (by scrolling the rail only, never the page)
  useEffect(() => {
    const r = rail.current;
    const t = r?.children[at] as HTMLElement | undefined;
    if (r && t) r.scrollTo({ left: t.offsetLeft - r.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
  }, [at, album]);

  const running = playing && inView && !hover && drag === null && open === null && n > 1;

  // the cards: sized to the stage and to the screen's height (so the whole gallery fits one screen); the
  // neighbours set at a fixed step, turned and dimmed
  const mobile = w < 640;
  const ratio = mobile ? 0.78 : 0.62;
  const cardH = Math.min((mobile ? w * 0.8 : Math.min(w * 0.5, 780)) * ratio, vh * (mobile ? 0.34 : 0.46));
  const cardW = cardH / ratio;
  const step = cardW * (mobile ? 0.88 : 0.6);
  const live = (drag ?? 0) / step; // (dragging moves every card, fractionally, as it follows the finger)

  const release = (x: number) => {
    const p = press.current;
    press.current = null;
    setDrag(null);
    if (!p) return;
    const dx = x - p.x;
    if (!p.moved) {
      // a tap: on the middle photograph it opens; on a neighbour it comes to the middle
      if (p.i === null) return;
      if (p.i === at) expand(p.i);
      else setAt(p.i);
      return;
    }
    const speed = dx / Math.max(1, performance.now() - p.t);
    const steps = Math.round(-dx / (step * 0.55)) || (Math.abs(speed) > 0.45 ? -Math.sign(dx) : 0);
    if (steps) go(clamp(steps, -3, 3));
  };

  return (
    <section id="gallery" ref={section} className="overflow-hidden bg-x-black py-16 text-white md:py-16">
      {/* heading and albums, in one row on a wide screen */}
      <div className="flex flex-col gap-5 px-4 md:flex-row md:items-end md:justify-between md:gap-8 md:px-8">
        <div className="min-w-0">
          <Eyebrow light>Gallery{count ? ` · ${count} photograph${count === 1 ? "" : "s"}` : ""}</Eyebrow>
          <h2 className="wide mt-3 text-[clamp(26px,2.9vw,46px)]">
            <span className="text-white/40">The family</span> behind the group.
          </h2>
        </div>
        {albums.length > 1 && (
          <div className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:max-w-[45%] md:px-0" role="tablist" aria-label="Albums">
            {[null, ...albums].map((a) => {
              const on = a === album;
              const k = a ? gallery.filter((p) => p.album === a).length : gallery.length;
              return (
                <button
                  key={a ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setAlbum(a)}
                  className={`micro flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 transition-colors duration-300 ${on ? "border-white bg-white text-x-ink" : "border-white/20 text-white/70 hover:border-white/60 hover:text-white"}`}
                >
                  {a ?? "All"}
                  <span className={`tabular-nums ${on ? "text-x-gold" : "text-white/35"}`}>{k}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* the coverflow */}
      <div
        ref={stage}
        role="region"
        aria-roledescription="carousel"
        aria-label="Family gallery"
        tabIndex={0}
        className="relative mt-8 cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing md:mt-10"
        style={{ height: cardH, perspective: 1600 }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => {
          setHover(false);
          if (press.current) release(press.current.x);
        }}
        onPointerDown={(e) => {
          const card = (e.target as HTMLElement).closest("[data-i]") as HTMLElement | null;
          press.current = { x: e.clientX, t: performance.now(), moved: false, i: card ? Number(card.dataset.i) : null };
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (!p) return;
          const dx = e.clientX - p.x;
          if (Math.abs(dx) > 6) p.moved = true;
          if (p.moved) setDrag(dx);
        }}
        onPointerUp={(e) => release(e.clientX)}
        onPointerCancel={() => {
          press.current = null;
          setDrag(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          else if (e.key === "ArrowLeft") go(-1);
          else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            expand(at);
          }
        }}
      >
        {shown.map((p, i) => {
          const base = around(i, at, n);
          if (Math.abs(base) > 3) return null;
          const d = base + live;
          const a = Math.abs(d);
          return (
            <motion.div
              key={`${album ?? "all"}-${i}`}
              data-i={i}
              initial={false}
              animate={{
                x: d * step,
                scale: 1 - Math.min(a, 3) * (mobile ? 0.1 : 0.15),
                rotateY: -clamp(d, -1.3, 1.3) * (mobile ? 14 : 26),
                opacity: a > 2.6 ? 0 : 1 - Math.max(0, a - 1.6),
                filter: `brightness(${1 - Math.min(a, 2) * 0.3})`,
              }}
              transition={drag !== null ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 32, mass: 0.9 }}
              className={`absolute left-1/2 top-0 overflow-hidden rounded-2xl bg-x-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] ${a < 0.5 ? "ring-1 ring-white/15" : ""}`}
              style={{ width: cardW, height: cardH, marginLeft: -cardW / 2, zIndex: 100 - Math.round(a * 10) }}
              aria-hidden={base !== 0}
            >
              {p.src ? (
                <>
                  <img src={p.src} alt={p.caption} draggable={false} loading={a < 1.5 ? "eager" : "lazy"} decoding="async" className="pointer-events-none h-full w-full object-cover" />
                  {base === 0 && (
                    <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur" aria-hidden>
                      <Icon d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                    </span>
                  )}
                </>
              ) : (
                <Awaiting p={p} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* the caption, the thumbnails and the controls: one row on a wide screen, stacked on a phone */}
      <div className="mt-7 grid gap-5 px-4 md:mt-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_auto] md:items-center md:gap-8 md:px-8">
        <div className="min-h-[52px] min-w-0" aria-live={running ? "off" : "polite"}>
          <AnimatePresence mode="wait" initial={false}>
            {cur && (
              <motion.div key={`${album ?? "all"}-${at}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
                <p className="micro text-x-gold">
                  {cur.album}
                  {cur.year ? ` · ${cur.year}` : ""}
                </p>
                <p className="wide mt-2 text-[clamp(16px,1.6vw,24px)]">{cur.caption || " "}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* the thumbnails (faded at the ends, scrolled to keep the current one in view) */}
        {n > 1 ? (
          <div ref={rail} className="relative order-3 flex min-w-0 gap-2 overflow-x-auto px-1 py-1 [mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%-20px),transparent)] [scrollbar-width:none] md:order-none">
            {shown.map((p, i) => (
              <button
                key={`${album ?? "all"}-${i}`}
                type="button"
                onClick={() => setAt(i)}
                aria-label={`Photograph ${i + 1}${p.caption ? `: ${p.caption}` : ""}`}
                aria-current={i === at}
                className={`relative h-12 w-[72px] shrink-0 overflow-hidden rounded-md bg-x-ink transition first:ml-3 last:mr-3 md:h-14 md:w-20 ${i === at ? "opacity-100 ring-2 ring-x-gold" : "opacity-45 hover:opacity-90"}`}
              >
                {p.src ? (
                  <img src={p.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-x-gold/70"><Icon d="M3 8h4l2-3h6l2 3h4v11H3zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" className="h-4 w-4" /></span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <span className="hidden md:block" />
        )}
        <div className="order-2 flex items-center gap-3 md:order-none">
          <p className="micro w-[52px] tabular-nums text-white/50">
            <span className="text-white">{String(at + 1).padStart(2, "0")}</span>/{String(n).padStart(2, "0")}
          </p>
          {/* the autoplay's progress */}
          <span className="relative h-px w-16 overflow-hidden bg-white/15 md:w-24" aria-hidden>
            <motion.span
              key={`${album ?? "all"}-${at}-${running}`}
              className="absolute inset-0 origin-left bg-x-gold"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: running ? 1 : 0 }}
              transition={running ? { duration: AUTOPLAY, ease: "linear" } : { duration: 0.2 }}
              onAnimationComplete={() => running && go(1)}
            />
          </span>
          <button type="button" className={ctl} onClick={() => go(-1)} disabled={n < 2} aria-label="Previous photograph"><Icon d="M15 5l-7 7 7 7" /></button>
          <button type="button" className={ctl} onClick={() => go(1)} disabled={n < 2} aria-label="Next photograph"><Icon d="M9 5l7 7-7 7" /></button>
          <button type="button" className={ctl} onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Pause" : "Play"} aria-pressed={playing}>
            <Icon d={playing ? "M9 6v12M15 6v12" : "M8 5.5v13l11-6.5z"} />
          </button>
          <button type="button" className={ctl} onClick={() => expand(at)} disabled={!cur?.src} aria-label="View full screen"><Icon d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></button>
        </div>
      </div>

      <AnimatePresence>{open !== null && photos[open] && <Viewer photos={photos} start={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}
