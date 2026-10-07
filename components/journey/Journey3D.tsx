"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { gsap, ScrollTrigger, reducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { categoryMeta, milestones } from "@/lib/content";
import { Sketch, building, rng, sketchify, tree, vehicleFor } from "./models";

type Theme = "paper" | "ink";

const PALETTE = {
  paper: { bg: 0xf6f1e7, ink: 0x0b2859, inkOp: 0.92, hatchOp: 0.32, accent: 0xc99a2e, road: 0xece4d3, dotOp: 0.22 },
  ink: { bg: 0x0c0b09, ink: 0xeae2d1, inkOp: 0.8, hatchOp: 0.2, accent: 0xe6c87e, road: 0x17150f, dotOp: 0.1 },
};

// Tailwind classes per theme (kept as full strings so they are compiled)
const UI = {
  paper: {
    section: "bg-paper text-navy",
    kicker: "font-hand text-2xl md:text-3xl text-brass",
    title: "font-display text-4xl md:text-6xl leading-none",
    titleEm: "text-brass",
    hint: "font-hand text-xl leading-tight text-navy/70",
    card: "rounded-2xl border-[1.5px] border-navy bg-paper/92 shadow-[5px_5px_0_#0b2859]",
    year: "font-display text-6xl md:text-7xl leading-none text-navy",
    tag: "bg-brass text-paper",
    body: "font-grotesk",
    counter: "text-navy/60",
    track: "bg-navy/15", fill: "bg-brass",
    dotOn: "border-brass bg-brass", dotOff: "border-navy/40 bg-paper",
    yearOn: "font-bold text-navy", yearOff: "text-navy/45 group-hover:text-navy",
    sign: "rounded-md border-[1.5px] border-navy bg-paper/95 shadow-[3px_3px_0_#0b2859] text-navy",
    signYear: "font-hand text-lg md:text-xl text-brass",
    signName: "font-grotesk font-semibold",
    signTip: "border-navy bg-paper",
    vignette: "from-paper/0 via-paper/0 to-paper/70",
  },
  ink: {
    section: "bg-ink text-cream",
    kicker: "eyebrow",
    title: "font-serif font-light text-4xl md:text-6xl leading-none tracking-tight mt-3",
    titleEm: "italic text-gold-2",
    hint: "text-sm leading-relaxed text-cream/55",
    card: "rounded-2xl border border-gold/30 bg-ink-2/85 backdrop-blur-md shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]",
    year: "font-serif font-light text-6xl md:text-7xl leading-none text-gold-2",
    tag: "bg-gold text-ink",
    body: "font-sans",
    counter: "text-cream/45",
    track: "bg-white/10", fill: "bg-gold",
    dotOn: "border-gold bg-gold", dotOff: "border-white/25 bg-ink",
    yearOn: "font-semibold text-cream", yearOff: "text-cream/40 group-hover:text-cream",
    sign: "rounded-md border border-gold/60 bg-ink/90 text-cream shadow-[0_10px_30px_-8px_rgba(230,200,126,0.35)]",
    signYear: "font-serif text-base md:text-lg text-gold-2",
    signName: "font-sans font-semibold",
    signTip: "border-gold/60 bg-ink",
    vignette: "from-ink/0 via-ink/0 to-ink/80",
  },
} as const;

const SPACING = 46;
const ROAD_HALF = 3.4;
const LANE = -1.5; // drive on the left
const SAMPLES = 1000;
const INTRO = 0.06; // share of the scroll used for the opening aerial shot

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Slows the traveller near each stop so every business gets its moment.
const dwell = (s: number) => s - (Math.sin(2 * Math.PI * s) / (2 * Math.PI)) * 0.92;

export default function Journey3D({ theme = "paper" }: { theme?: Theme }) {
  const ui = UI[theme];
  const root = useRef<HTMLElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (reducedMotion()) {
      setFallback(true);
      return;
    }
    const P = PALETTE[theme];
    const wrap = canvasWrap.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(P.bg, 1);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.bg, 45, 170);
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500);
    const rand = rng(1960);

    const mats = {
      ink: new THREE.LineBasicMaterial({ color: P.ink, transparent: true, opacity: P.inkOp }),
      hatch: new THREE.LineBasicMaterial({ color: P.ink, transparent: true, opacity: P.hatchOp }),
      accent: new THREE.LineBasicMaterial({ color: P.accent }),
      accentSoft: new THREE.LineBasicMaterial({ color: P.accent, transparent: true, opacity: 0.55 }),
      fill: new THREE.MeshBasicMaterial({ color: P.bg, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide }),
      road: new THREE.MeshBasicMaterial({ color: P.road, side: THREE.DoubleSide }),
      trail: new THREE.MeshBasicMaterial({ color: P.accent, side: THREE.DoubleSide }),
    };

    const lineObj = (pts: number[], mat: THREE.LineBasicMaterial) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      return new THREE.LineSegments(g, mat);
    };
    const fillObj = (solids: THREE.BufferGeometry[]) => {
      if (!solids.length) return null;
      const flat = solids.map((g) => {
        const ng = g.index ? g.toNonIndexed() : g;
        const out = new THREE.BufferGeometry();
        out.setAttribute("position", ng.getAttribute("position"));
        return out;
      });
      const merged = mergeGeometries(flat, false);
      solids.forEach((g) => g.dispose());
      return new THREE.Mesh(merged, mats.fill);
    };
    /** Builds a sketch into a group; returns the objects so their reveal can be animated. */
    const realise = (s: Sketch, lineMat = mats.ink, hatchMat = mats.hatch, passes = 2) => {
      const group = new THREE.Group();
      const lines = lineObj(sketchify(s.lines, rand, passes), lineMat);
      const hatch = lineObj(sketchify(s.hatch, rand, 1, 0.02, 0.1), hatchMat);
      const accent = lineObj(sketchify(s.accent, rand, 2, 0.015, 0.12), mats.accent);
      const fill = fillObj(s.solids);
      if (fill) group.add(fill);
      group.add(lines, hatch, accent);
      return { group, lines, hatch, accent, fill };
    };

    // ---- Route ------------------------------------------------------------------------
    const n = milestones.length;
    const stopPts = milestones.map((_, i) => new THREE.Vector3(Math.sin(i * 0.8) * 18, 0, -i * SPACING));
    const ctrl = [
      new THREE.Vector3(stopPts[0].x - 6, 0, SPACING * 1.2),
      new THREE.Vector3(stopPts[0].x - 2, 0, SPACING * 0.55),
      ...stopPts,
      new THREE.Vector3(stopPts[n - 1].x + 8, 0, stopPts[n - 1].z - SPACING * 0.7),
      new THREE.Vector3(stopPts[n - 1].x + 14, 0, stopPts[n - 1].z - SPACING * 1.6),
    ];
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");
    const samples = curve.getSpacedPoints(SAMPLES);
    const up = new THREE.Vector3(0, 1, 0);
    const sideAt = (u: number) => new THREE.Vector3().crossVectors(curve.getTangentAt(clamp01(u)), up).normalize();
    const stopU = stopPts.map((p) => {
      let best = 0, bd = Infinity;
      samples.forEach((s, i) => {
        const d = s.distanceToSquared(p);
        if (d < bd) { bd = d; best = i; }
      });
      return best / SAMPLES;
    });

    // ---- Road: surface, kerbs, centre line ---------------------------------------------
    const ribbon = (half: number, offset: number, y: number, mat: THREE.Material) => {
      const pos: number[] = [], idx: number[] = [];
      samples.forEach((s, i) => {
        const nrm = sideAt(i / SAMPLES);
        const c = s.clone().addScaledVector(nrm, offset);
        pos.push(c.x + nrm.x * half, y, c.z + nrm.z * half, c.x - nrm.x * half, y, c.z - nrm.z * half);
        if (i < SAMPLES) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      const m = new THREE.Mesh(g, mat);
      scene.add(m);
      return m;
    };
    ribbon(ROAD_HALF, 0, -0.01, mats.road);
    const trail = ribbon(0.2, LANE, 0.02, mats.trail);

    const road = new Sketch();
    for (let i = 0; i < SAMPLES; i++) {
      const a = samples[i], b = samples[i + 1];
      const na = sideAt(i / SAMPLES), nb = sideAt((i + 1) / SAMPLES);
      for (const off of [ROAD_HALF, -ROAD_HALF]) road.seg([a.x + na.x * off, 0, a.z + na.z * off], [b.x + nb.x * off, 0, b.z + nb.z * off]);
      for (const off of [ROAD_HALF + 0.45, -ROAD_HALF - 0.45]) road.seg([a.x + na.x * off, 0, a.z + na.z * off], [b.x + nb.x * off, 0, b.z + nb.z * off], road.hatch);
      if (i % 8 < 4) road.seg([a.x, 0.01, a.z], [b.x, 0.01, b.z], road.hatch);
    }
    scene.add(lineObj(road.lines, mats.ink), lineObj(road.hatch, mats.hatch));

    // ---- Businesses ---------------------------------------------------------------------
    const stops = milestones.map((m, i) => {
      const u = stopU[i];
      const p = curve.getPointAt(u);
      const side = i % 2 === 0 ? 1 : -1;
      const nrm = sideAt(u).multiplyScalar(side);
      const { sketch, sign, size } = building(m.category);
      const setback = size.d / 2 + ROAD_HALF + (m.category === "cars" ? 10.5 : m.category === "commercial" ? 8 : m.category === "two-wheelers" ? 9 : 5.5);
      const pos = p.clone().addScaledVector(nrm, setback);
      const yaw = Math.atan2(-nrm.x, -nrm.z);

      // driveway (in world space)
      const fwd = curve.getTangentAt(u);
      const drive = new Sketch();
      for (const off of [-2.4, 2.4]) {
        const a = p.clone().addScaledVector(nrm, ROAD_HALF + 0.45).addScaledVector(fwd, off);
        const b = pos.clone().addScaledVector(nrm, -size.d / 2).addScaledVector(fwd, off);
        drive.seg([a.x, 0, a.z], [b.x, 0, b.z], drive.hatch);
      }
      scene.add(lineObj(drive.hatch, mats.hatch));

      const r = realise(sketch);
      r.group.position.copy(pos);
      r.group.rotation.y = yaw;
      scene.add(r.group);
      const anchor = new THREE.Vector3(...sign).applyEuler(new THREE.Euler(0, yaw, 0)).add(pos);
      const totals = {
        lines: r.lines.geometry.attributes.position.count,
        hatch: r.hatch.geometry.attributes.position.count,
        accent: r.accent.geometry.attributes.position.count,
      };
      return { ...r, pos, anchor, totals, road: p, nrm };
    });

    // ---- Scenery: clustered trees, lamp posts, horizon --------------------------------
    const scenery = new Sketch();
    for (let c = 0; c < 30; c++) {
      const u = rand();
      const p = curve.getPointAt(u);
      const nrm = sideAt(u).multiplyScalar(rand() > 0.5 ? 1 : -1);
      const centre = p.clone().addScaledVector(nrm, 16 + rand() * 26);
      const count = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < count; k++) {
        const q = centre.clone().add(new THREE.Vector3((rand() - 0.5) * 7, 0, (rand() - 0.5) * 7));
        if (stops.some((s) => s.pos.distanceTo(q) < 17)) continue;
        if (samples.some((s) => s.distanceTo(q) < ROAD_HALF + 5)) continue;
        tree(scenery, q.x, q.z, 4 + rand() * 3.5, rand);
      }
    }
    for (let u = 0.004; u < 1; u += 0.022) {
      const p = curve.getPointAt(u);
      const nrm = sideAt(u);
      if (stops.some((s) => s.road.distanceTo(p) < 9)) continue;
      const base = p.clone().addScaledVector(nrm, ROAD_HALF + 1.1);
      const head = p.clone().addScaledVector(nrm, ROAD_HALF - 0.4);
      scenery.seg([base.x, 0, base.z], [base.x, 4.6, base.z]);
      scenery.seg([base.x, 4.6, base.z], [head.x, 4.75, head.z]);
      scenery.box(0.5, 0.15, 0.3, head.x, 4.6, head.z);
    }
    const sceneryObj = realise(scenery, mats.ink, mats.hatch, 1);
    scene.add(sceneryObj.group);

    const horizon: number[] = [];
    for (let k = 0; k < 2; k++) {
      const z0 = stopPts[n - 1].z - 60 - k * 30;
      let prev: number[] | null = null;
      for (let x = -220; x <= 220; x += 10) {
        const pt = [x, 8 + k * 5 + Math.sin(x * 0.03 + k * 2) * 7 + Math.sin(x * 0.11) * 2, z0 + Math.sin(x * 0.02) * 12];
        if (prev) horizon.push(...prev, ...pt);
        prev = pt;
      }
    }
    scene.add(lineObj(horizon, mats.hatch));

    const dots: number[] = [];
    for (let z = SPACING; z > stopPts[n - 1].z - 90; z -= 7) for (let x = -110; x <= 110; x += 7) dots.push(x + (rand() - 0.5) * 2, 0, z + (rand() - 0.5) * 2);
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
    scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: P.ink, size: 0.16, transparent: true, opacity: P.dotOp })));

    // ---- Traveller ----------------------------------------------------------------------
    const cats = Array.from(new Set(milestones.map((m) => m.category)));
    const vehicles = Object.fromEntries(cats.map((c) => {
      const v = realise(vehicleFor(c), mats.accent, mats.accentSoft, 2).group;
      v.visible = false;
      v.scale.setScalar(1.2);
      scene.add(v);
      return [c, v];
    })) as Record<string, THREE.Group>;
    let currentCat = "";

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.92, 1, 64),
      new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);

    // ---- Scroll → travel ----------------------------------------------------------------
    const state = { progress: 0 };
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    let first = true;
    let lastActive = -1;
    const tmp = new THREE.Vector3();
    const aerialPos = stopPts[0].clone().add(new THREE.Vector3(-30, 50, 58));
    const aerialLook = curve.getPointAt(stopU[Math.min(2, n - 1)]);
    const fog = scene.fog as THREE.Fog;

    const render = (time: number) => {
      const prog = state.progress;
      const intro = smooth(0, 1, prog / INTRO);
      const sf = prog < INTRO ? 0 : ((prog - INTRO) / (1 - INTRO)) * (n - 1);
      const k = Math.min(n - 2, Math.floor(sf));
      const u = stopU[k] + (stopU[k + 1] - stopU[k]) * dwell(clamp01(sf - k));
      const idx = Math.round(sf);
      const w = wrap.clientWidth, h = wrap.clientHeight;
      const far = w < 768 ? 1.45 : 1;

      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      const side = sideAt(u);
      const lane = p.clone().addScaledVector(side, LANE);

      // vehicle swap + placement
      const cat = milestones[idx].category;
      if (cat !== currentCat) {
        if (currentCat) vehicles[currentCat].visible = false;
        currentCat = cat;
        const v = vehicles[cat];
        v.visible = true;
        v.scale.setScalar(0.01);
        gsap.to(v.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.7, ease: "back.out(2.2)" });
      }
      const v = vehicles[currentCat];
      v.position.copy(lane);
      v.position.y = Math.abs(Math.sin(time * 0.009)) * 0.03;
      v.lookAt(tmp.copy(curve.getPointAt(Math.min(1, u + 0.003))).addScaledVector(side, LANE));

      trail.geometry.setDrawRange(0, Math.floor(u * SAMPLES) * 6);

      // buildings sketch themselves in as you approach
      const sfReveal = prog < INTRO ? -1.25 + intro * 1.25 : sf;
      stops.forEach((s, i) => {
        const r = clamp01((sfReveal - i + 1.25) / 0.95);
        const evenDraw = (count: number, f: number) => Math.floor((count * f) / 2) * 2;
        s.lines.geometry.setDrawRange(0, evenDraw(s.totals.lines, r));
        s.hatch.geometry.setDrawRange(0, evenDraw(s.totals.hatch, clamp01(r * 1.7 - 0.7)));
        s.accent.geometry.setDrawRange(0, evenDraw(s.totals.accent, clamp01(r * 2.2 - 1.2)));
        if (s.fill) s.fill.visible = r > 0.3;
        s.group.visible = r > 0;

        const el = labels.current[i];
        if (!el) return;
        tmp.copy(s.anchor).project(camera);
        const near = 1 - smooth(0.2, 1.1, Math.abs(sf - i));
        const op = tmp.z < 1 ? near * clamp01(r * 2 - 1) * (prog < INTRO ? intro : 1) : 0;
        const half = el.offsetWidth / 2 + 12;
        const sx = Math.min(w - half, Math.max(half, ((tmp.x + 1) / 2) * w));
        const sy = Math.max(el.offsetHeight + 90, ((1 - tmp.y) / 2) * h);
        el.style.opacity = op.toFixed(3);
        el.style.transform = `translate(-50%, -100%) translate(${sx}px, ${sy}px) scale(${0.8 + op * 0.2})`;
      });

      // camera: chase cam that swings into a framed "hero shot" at each stop
      const stop = stops[idx];
      const near = 1 - smooth(0.06, 0.48, Math.abs(sf - idx));
      const chasePos = lane.clone().addScaledVector(t, -16 * far).addScaledVector(up, 8.5 * far).addScaledVector(stop.nrm, -3);
      const chaseLook = curve.getPointAt(Math.min(1, u + 0.014)).add(new THREE.Vector3(0, 2, 0));
      const heroPos = lane.clone().addScaledVector(t, -15 * far).addScaledVector(stop.nrm, -12).addScaledVector(up, 8 * far);
      const heroLook = lane.clone().lerp(stop.pos, 0.72).add(new THREE.Vector3(0, 3.5, 0));
      const desired = chasePos.lerp(heroPos, near);
      const look = chaseLook.lerp(heroLook, near);
      fog.far = 170 + (1 - intro) * 140;
      if (prog < INTRO) {
        desired.lerpVectors(aerialPos, desired, intro);
        look.lerpVectors(aerialLook, look, intro);
      }
      if (first) { camPos.copy(desired); camLook.copy(look); first = false; }
      camPos.lerp(desired, 0.06);
      camLook.lerp(look, 0.06);
      camera.position.copy(camPos);
      camera.position.y += Math.sin(time * 0.0007) * 0.12;
      camera.lookAt(camLook);

      renderer.render(scene, camera);

      if (idx !== lastActive) {
        if (lastActive !== -1 && prog >= INTRO) {
          ring.position.set(lane.x, 0.04, lane.z);
          ring.scale.setScalar(1);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.9;
          gsap.to(ring.scale, { x: 10, y: 10, z: 10, duration: 1.4, ease: "expo.out" });
          gsap.to(ring.material, { opacity: 0, duration: 1.4, ease: "power2.out" });
        }
        lastActive = idx;
        setActive(idx);
      }
    };

    let raf = 0;
    const loop = (time: number) => {
      render(time);
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    });
    io.observe(wrap);

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w < 768 ? 60 : 48;
      // on desktop, shift the framing right so the scene clears the info card on the left
      if (w >= 768) camera.setViewOffset(w, h, -w * 0.11, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: () => `+=${window.innerHeight * n * 0.9}`,
      pin: true,
      scrub: 1.2,
      onUpdate: (self) => {
        gsap.to(state, { progress: self.progress, duration: 0.6, ease: "power2.out", overwrite: true });
        gsap.set(".j3-rail-fill", { scaleX: self.progress });
      },
    });
    trigger.current = st;
    render(0);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      st.kill();
      scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      Object.values(mats).forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [theme]);

  const jumpTo = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    const f = INTRO + (1 - INTRO) * (i / (milestones.length - 1));
    const y = st.start + (st.end - st.start) * f;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 2.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const m = milestones[active];

  if (fallback) {
    return (
      <section id="journey" className={`${ui.section} px-4 py-24 md:px-10`}>
        <div className="mx-auto max-w-5xl">
          <p className={ui.kicker}>Our journey</p>
          <h2 className={ui.title}>Six decades <em className={ui.titleEm}>on the road</em></h2>
          <ol className="mt-12 space-y-6 border-l-2 border-gold/40 pl-6">
            {milestones.map((x) => (
              <li key={x.year}>
                <span className={ui.year}>{x.year}</span>
                <p className="mt-1">{x.title}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section id="journey" ref={root} className={`relative h-[100svh] overflow-hidden ${ui.section}`}>
      <div ref={canvasWrap} className="absolute inset-0" aria-hidden />
      <div className={`pointer-events-none absolute inset-0 bg-radial ${ui.vignette}`} aria-hidden />

      {/* Signboards anchored to each building */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {milestones.map((x, i) => (
          <div key={x.year} ref={(el) => { labels.current[i] = el; }} className="absolute left-0 top-0 origin-bottom opacity-0 will-change-transform">
            <div className={`relative -translate-y-3 px-3 py-1.5 md:px-4 md:py-2 ${ui.sign}`}>
              <p className={`leading-none ${ui.signYear}`}>{x.year}</p>
              <p className={`whitespace-nowrap text-sm uppercase tracking-wider md:text-base ${ui.signName}`}>{x.short}</p>
              <span className={`absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r ${ui.signTip}`} />
            </div>
          </div>
        ))}
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pt-24 md:p-10 md:pt-28">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className={ui.kicker}>Our journey</p>
            <h2 className={ui.title}>Six decades <em className={ui.titleEm}>on the road</em></h2>
          </div>
          <p className={`hidden max-w-[230px] text-right md:block ${ui.hint}`}>
            Scroll to drive from one business to the next. Each one sketches itself as you arrive.
          </p>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={m.year}
              initial={{ opacity: 0, y: 30, rotateX: -25 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`flex max-w-lg items-stretch gap-4 overflow-hidden p-3 md:p-4 ${ui.card} ${ui.body}`}
              style={{ transformPerspective: 800 }}
            >
              {m.image && (
                <img src={m.image} alt="" className="hidden w-28 shrink-0 rounded-xl object-cover sm:block md:w-32" />
              )}
              <div className="py-1 pr-2">
                <div className="flex items-baseline gap-3">
                  <span className={ui.year}>{m.year}</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${ui.tag}`}>
                    {categoryMeta[m.category].label}
                  </span>
                </div>
                <p className="mt-2 text-base md:text-lg">{m.title}</p>
                <p className={`mt-2 text-[10px] uppercase tracking-[0.3em] ${ui.counter}`}>
                  Stop {String(active + 1).padStart(2, "0")} of {milestones.length}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={`pointer-events-auto relative mt-5 hidden md:block ${ui.body}`}>
          <div className={`absolute left-0 right-0 top-[7px] h-[2px] ${ui.track}`}>
            <div className={`j3-rail-fill h-full origin-left scale-x-0 ${ui.fill}`} />
          </div>
          <ol className="relative flex justify-between">
            {milestones.map((x, i) => (
              <li key={x.year}>
                <button onClick={() => jumpTo(i)} className="group flex flex-col items-center gap-2" aria-label={`Go to ${x.year}: ${x.title}`}>
                  <span className={`h-4 w-4 rounded-full border-2 transition-all duration-300 ${i <= active ? ui.dotOn : ui.dotOff} ${i === active ? "scale-125" : ""}`} />
                  <span className={`text-[11px] transition-colors ${i === active ? ui.yearOn : ui.yearOff}`}>{x.year}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
