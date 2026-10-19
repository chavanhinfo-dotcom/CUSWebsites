"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { gsap, reducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { categoryMeta, type Category } from "@/lib/content";
import { realCart } from "./cart";
import { RENDERS, applianceDelivery, renderSprite } from "./fleet";
import { Eyebrow, ease } from "./ui";
import { queueBuild, trackAsset } from "./loading";
import { warmUp } from "./batch";
import { building, type Kind } from "./town";
import { numberWord, useContent, type Milestone } from "./content";

const SPACING = 46; // metres of road between milestones
const ROAD_HALF = 3.6;
const LANE = -1.7; // keep left
const SETBACK = ROAD_HALF + 6.3; // from the road's centre line to a building's front
const SAMPLES = 1000;
const INTRO = 0.06; // share of the scroll for the opening aerial shot

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
// slows the traveller near each stop so every business gets its moment
const dwell = (s: number) => s - (Math.sin(2 * Math.PI * s) / (2 * Math.PI)) * 0.92;

// the vehicle on the road at each milestone: the trade's own, from the hand-cart of 1960 on (the same real
// pictures as the story above, with their wheels turning)
type Model = Exclude<keyof typeof RENDERS, "samsung">;
// ("delivery": the home appliances, loaded on a Super Carry)
type Ride = "cart" | "delivery" | Model;
const RIDE_BY_YEAR: Record<number, Ride> = {
  1960: "cart", 1984: "delivery", 1990: "kinetic", 1996: "delivery", 2004: "brezza", 2005: "delivery", 2007: "splendor", 2010: "victoris",
  2013: "yodha", 2015: "bullet", 2016: "prima", 2017: "superCarry", 2019: "brezza", 2022: "victoris", 2023: "ather", 2025: "harley",
};
const RIDE_BY_CAT: Record<Category, Ride> = { heritage: "cart", appliances: "delivery", "two-wheelers": "splendor", cars: "brezza", commercial: "yodha" };
const rideOf = (m: Milestone) => RIDE_BY_YEAR[m.year] ?? RIDE_BY_CAT[m.category];

// what each showroom has on its floor (a milestone added on the admin page shows its category's range)
type Model3 = keyof typeof RENDERS;
const SHOWCASE_BY_CAT: Record<Category, Model3[]> = {
  heritage: [],
  appliances: ["samsung"],
  "two-wheelers": ["splendor", "bullet", "ather"],
  cars: ["brezza", "victoris"],
  commercial: ["yodha", "superCarry"],
};
const SHOWCASE: Record<number, { inside: Model3[] }> = {
  1984: { inside: ["samsung"] },
  1990: { inside: ["kinetic", "kinetic", "kinetic"] },
  2004: { inside: ["brezza", "victoris"] },
  2005: { inside: ["samsung"] },
  2007: { inside: ["splendor", "splendor", "splendor"] },
  2010: { inside: ["victoris", "brezza"] },
  2013: { inside: ["yodha"] },
  2015: { inside: ["bullet", "bullet", "bullet"] },
  2016: { inside: ["yodha", "superCarry"] },
  2017: { inside: ["superCarry"] },
  2019: { inside: ["brezza", "victoris"] },
  2022: { inside: ["victoris", "victoris"] },
  2023: { inside: ["ather", "ather", "ather"] },
  2025: { inside: ["harley", "harley", "harley"] }, // Hero Premia: the Harley-Davidson X440
};

// the building at each milestone (metres: width, height, depth)
const BUILDING: Record<Category, { kind: Kind; w: number; h: number; d: number }> = {
  heritage: { kind: "shop", w: 9, h: 4.6, d: 8 },
  appliances: { kind: "showroom", w: 13, h: 5.4, d: 11 },
  "two-wheelers": { kind: "showroom", w: 13, h: 5.4, d: 11 },
  cars: { kind: "showroom", w: 20, h: 7.4, d: 14 },
  commercial: { kind: "workshop", w: 22, h: 8, d: 16 },
};
const buildingOf = (m: Milestone) => ({
  ...(m.year === 1996 ? { kind: "warehouse" as const, w: 20, h: 7, d: 15 } : BUILDING[m.category]),
  name: m.short,
  products: (SHOWCASE[m.year]?.inside ?? SHOWCASE_BY_CAT[m.category]).map((k) => RENDERS[k]),
});

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/**
 * The journey in full 3D, after option A's (an aerial shot of the route, then the drive from one milestone
 * to the next), in option E's own look: a black world at dusk with the globe's dot grid on the ground and
 * the group's businesses along one side of the road, rising out of the ground as the road reaches them.
 * Each showroom is lit inside behind clear glass, its real products on podiums under pools of light; the
 * era's own vehicle (the same real pictures as the story, wheels turning) drives the road, and the camera
 * glides alongside it on the other verge, turning square-on to each business as it arrives. Signboards, a
 * card and a timeline in the template's type follow along.
 */
export default function JourneyX() {
  // the milestones (as edited on the admin page): the scene is built again only if they change
  const { milestones } = useContent();
  const N = milestones.length;
  const msKey = JSON.stringify(milestones);
  const root = useRef<HTMLElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const intro_ = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const railFill = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [fallback, setFallback] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  // the hand-over from the story, made to go unnoticed: this section starts one screen early, over the
  // story's last screen of scroll, in which the story's camera dives into its dark road. While this section's
  // top is still below the top of the window its stage is held in place and emerges from that darkness,
  // still moving forward (fading in as it grows to full size), landing exactly as it pins
  useEffect(() => {
    if (fallback) return;
    const sec = root.current, st = stage.current;
    if (!sec || !st) return;
    const slide = () => {
      const top = sec.getBoundingClientRect().top, vh = window.innerHeight;
      if (top <= 0) {
        st.style.transform = "";
        st.style.opacity = "";
        st.style.visibility = "visible";
        return;
      }
      const o = smooth(0.5, 1, 1 - top / vh); // (0 until the story's road fills the screen)
      st.style.visibility = o > 0 ? "visible" : "hidden";
      st.style.opacity = o.toFixed(3);
      // (while hidden it is moved aside, so its 3D scene does not start rendering early)
      st.style.transform = o > 0 ? `translate3d(0, ${-top}px, 0) scale(${(0.94 + 0.06 * o).toFixed(4)})` : "translate3d(100%, 0, 0)";
    };
    slide();
    window.addEventListener("scroll", slide, { passive: true });
    window.addEventListener("resize", slide);
    return () => {
      window.removeEventListener("scroll", slide);
      window.removeEventListener("resize", slide);
    };
  }, [fallback]);

  useEffect(() => {
    if (reducedMotion()) {
      setFallback(true);
      return;
    }
    // built through the load queue, one scene per task, while the preloader is still up
    return queueBuild(() => {
      const wrap = canvasWrap.current!;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      } catch {
        setFallback(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0a0a0b, 1);
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap; // (soft edges come from shadow.radius)
      wrap.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0a0a0b, 60, 230);
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 600);
      const rand = rng(1960);

      // dusk: a cool sky light, a low warm key with soft shadows that follows the camera
      scene.add(new THREE.HemisphereLight(0xdfe4ea, 0x0a0a0b, 1.1));
      const sun = new THREE.DirectionalLight(0xfff4e6, 2.2);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 260 });
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.03;
      sun.shadow.radius = 4;
      scene.add(sun, sun.target);

      const materials: THREE.Material[] = [];
      const textures: THREE.Texture[] = [];
      const mat = <T extends THREE.Material>(m: T) => (materials.push(m), m);
      const canvasTex = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        paint(c.getContext("2d")!);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        textures.push(t);
        return t;
      };

      // ---- route (as option A's: a gentle weave from one milestone to the next)
      const stopPts = milestones.map((_, i) => new THREE.Vector3(Math.sin(i * 0.8) * 18, 0, -i * SPACING));
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(stopPts[0].x - 6, 0, SPACING * 1.2),
        new THREE.Vector3(stopPts[0].x - 2, 0, SPACING * 0.55),
        ...stopPts,
        new THREE.Vector3(stopPts[N - 1].x + 8, 0, stopPts[N - 1].z - SPACING * 0.7),
        new THREE.Vector3(stopPts[N - 1].x + 14, 0, stopPts[N - 1].z - SPACING * 1.6),
      ], false, "centripetal");
      const samples = curve.getSpacedPoints(SAMPLES);
      const up = new THREE.Vector3(0, 1, 0);
      const sideAt = (u: number) => new THREE.Vector3().crossVectors(curve.getTangentAt(clamp01(u)), up).normalize(); // to the right
      const stopU = stopPts.map((p) => {
        let best = 0, bd = Infinity;
        samples.forEach((s, i) => {
          const d = s.distanceToSquared(p);
          if (d < bd) { bd = d; best = i; }
        });
        return best / SAMPLES;
      });

      // ---- the ground: black, with the dot grid of the globe at the top of the page
      const dots = canvasTex(64, 64, (g) => {
        g.fillStyle = "#0c0c0d";
        g.fillRect(0, 0, 64, 64);
        g.fillStyle = "rgba(233,230,222,0.2)";
        g.beginPath();
        g.arc(32, 32, 3, 0, Math.PI * 2);
        g.fill();
      });
      dots.wrapS = dots.wrapT = THREE.RepeatWrapping;
      dots.repeat.set(800 / 3, 1100 / 3);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 1100), mat(new THREE.MeshStandardMaterial({ map: dots, roughness: 1 })));
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, 0, stopPts[N - 1].z / 2);
      ground.receiveShadow = true;
      scene.add(ground);

      // ---- the road: a pavement either side, asphalt with white lines drawn along its length
      const ribbon = (half: number, y: number, material: THREE.Material) => {
        const pos: number[] = [], uv: number[] = [], idx: number[] = [];
        samples.forEach((s, i) => {
          const n = sideAt(i / SAMPLES);
          pos.push(s.x - n.x * half, y, s.z - n.z * half, s.x + n.x * half, y, s.z + n.z * half);
          uv.push(i / SAMPLES, 0, i / SAMPLES, 1);
          if (i < SAMPLES) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, material);
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
      };
      ribbon(ROAD_HALF + 1.8, 0.02, mat(new THREE.MeshStandardMaterial({ color: 0x2a2a2d, roughness: 1, side: THREE.DoubleSide })));
      const roadTex = canvasTex(256, 64, (g) => {
        g.fillStyle = "#161618";
        g.fillRect(0, 0, 256, 64);
        g.fillStyle = "rgba(255,255,255,0.85)";
        g.fillRect(0, 30, 110, 4);
        g.fillStyle = "rgba(255,255,255,0.6)";
        g.fillRect(0, 3, 256, 3);
        g.fillRect(0, 58, 256, 3);
      });
      roadTex.wrapS = THREE.RepeatWrapping;
      roadTex.repeat.set(curve.getLength() / 8, 1);
      ribbon(ROAD_HALF, 0.05, mat(new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.8, side: THREE.DoubleSide })));
      // the gold trail the journey leaves behind it
      const trail = ribbon(0.12, 0.07, mat(new THREE.MeshBasicMaterial({ color: 0xc9a24a, toneMapped: false, side: THREE.DoubleSide })));

      // ---- the businesses, one per milestone, all along the left of the road (the camera drives the right
      // verge), facing it. Each stands a little back from its stop, so the vehicle pulls up by its door
      const fonts = { wide: getComputedStyle(heading.current!).fontFamily, body: getComputedStyle(root.current!).fontFamily };
      const stops = milestones.map((_, i) => {
        const u = stopU[i];
        const p = curve.getPointAt(u);
        const t = curve.getTangentAt(u);
        const nrm = sideAt(u).multiplyScalar(-1); // from the road towards the building
        const spec = buildingOf(milestones[i]);
        const b = building(spec, fonts, true);
        const pos = p.clone().addScaledVector(nrm, SETBACK).addScaledVector(t, -spec.w * 0.22);
        b.group.position.copy(pos);
        b.group.rotation.y = Math.atan2(-nrm.x, -nrm.z);
        scene.add(b.group);
        const anchor = pos.clone().addScaledVector(nrm, spec.d / 2).add(new THREE.Vector3(0, b.top + 1.2, 0));
        const lane = p.clone().addScaledVector(sideAt(u), LANE);
        return { ...b, spec, pos, nrm, road: p, lane, anchor };
      });
      // if the display face is still loading, the signs are painted again once it arrives, and uploaded
      // straight away (re-uploading every sign on first sight made the journey stutter as it came in)
      let disposed = false;
      if (document.fonts && !document.fonts.check(`800 64px ${fonts.wide}`)) {
        document.fonts.load(`800 64px ${fonts.wide}`).then(() => {
          if (disposed) return;
          stops.forEach((b) => {
            b.repaint();
            b.textures.forEach((t) => renderer.initTexture(t));
          });
        }, () => {});
      }

      // ---- scenery: white model trees in clusters among the businesses, and streetlights with pools of
      // warm light along their side of the road (the camera's side is kept clear)
      const treesAt: THREE.Vector3[] = [];
      for (let c = 0; c < 40; c++) {
        const u = rand();
        const p = curve.getPointAt(u);
        const nrm = sideAt(u).multiplyScalar(-1);
        const centre = p.clone().addScaledVector(nrm, 14 + rand() * 30);
        for (let k = 0; k < 2 + Math.floor(rand() * 3); k++) {
          const q = centre.clone().add(new THREE.Vector3((rand() - 0.5) * 8, 0, (rand() - 0.5) * 8));
          if (stops.some((s) => s.pos.distanceTo(q) < s.spec.w * 0.7 + 6)) continue;
          if (samples.some((s) => s.distanceTo(q) < ROAD_HALF + 4)) continue;
          treesAt.push(q);
        }
      }
      const q0 = new THREE.Quaternion();
      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.2, 1.8, 6).translate(0, 0.9, 0), mat(new THREE.MeshStandardMaterial({ color: 0xbdb8ae, roughness: 1 })), treesAt.length);
      const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.3, 1).translate(0, 3.2, 0), mat(new THREE.MeshStandardMaterial({ color: 0xdcdad4, roughness: 1, flatShading: true })), treesAt.length);
      treesAt.forEach((p, i) => {
        const s = 1 + rand() * 0.7;
        const m = new THREE.Matrix4().compose(p, q0, new THREE.Vector3(s, s, s));
        trunks.setMatrixAt(i, m);
        crowns.setMatrixAt(i, m);
      });
      for (const t of [trunks, crowns]) {
        t.castShadow = t.receiveShadow = true;
        scene.add(t);
      }
      const lamps: THREE.Matrix4[] = [], heads: THREE.Matrix4[] = [], pools: THREE.Matrix4[] = [];
      const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      for (let u = 0.01; u < 0.99; u += 0.016) {
        const p = curve.getPointAt(u);
        if (stops.some((s) => s.road.distanceTo(p) < 20)) continue; // (clear of every showroom's front)
        const nrm = sideAt(u).multiplyScalar(-1);
        const base = p.clone().addScaledVector(nrm, ROAD_HALF + 1.2);
        const yaw = new THREE.Quaternion().setFromAxisAngle(up, Math.atan2(-nrm.x, -nrm.z));
        lamps.push(new THREE.Matrix4().compose(base, yaw, new THREE.Vector3(1, 1, 1)));
        heads.push(new THREE.Matrix4().compose(base.clone().addScaledVector(nrm, -1.1).setY(5.6), yaw, new THREE.Vector3(1, 1, 1)));
        pools.push(new THREE.Matrix4().compose(base.clone().addScaledVector(nrm, -2.6).setY(0.09), qFlat, new THREE.Vector3(1, 1, 1)));
      }
      const pole = new THREE.CylinderGeometry(0.07, 0.1, 5.8, 8).translate(0, 2.9, 0);
      const arm = new THREE.BoxGeometry(0.06, 0.06, 1.3).translate(0, 5.75, 0.6);
      const lampMesh = (geo: THREE.BufferGeometry, m: THREE.Material, list: THREE.Matrix4[], shadow = true) => {
        const inst = new THREE.InstancedMesh(geo, m, list.length);
        list.forEach((x, i) => inst.setMatrixAt(i, x));
        inst.castShadow = shadow;
        scene.add(inst);
      };
      const steel = mat(new THREE.MeshStandardMaterial({ color: 0xd8d7d2, roughness: 0.6 }));
      lampMesh(pole, steel, lamps);
      lampMesh(arm, steel, lamps);
      lampMesh(new THREE.BoxGeometry(0.45, 0.1, 0.25), mat(new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false })), heads, false);
      const poolTex = canvasTex(256, 256, (g) => {
        const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        r.addColorStop(0, "rgba(255,214,160,0.22)");
        r.addColorStop(0.5, "rgba(255,214,160,0.07)");
        r.addColorStop(1, "rgba(255,214,160,0)");
        g.fillStyle = r;
        g.fillRect(0, 0, 256, 256);
      });
      lampMesh(new THREE.PlaneGeometry(10, 10), mat(new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })), pools, false);

      // ---- the traveller: the era's own vehicle, swapped with a little pop as the road reaches the next
      const rides = new Map<Ride, THREE.Group>();
      new Set(milestones.map(rideOf)).forEach((r) => {
        const g = r === "cart" ? realCart() : r === "delivery" ? applianceDelivery() : renderSprite(RENDERS[r]);
        // (the 3D models cast shadows; the pictures carry their own soft contact shadow)
        g.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) m.castShadow = !(m.material as THREE.Material).transparent;
        });
        g.visible = false;
        scene.add(g);
        rides.set(r, g);
      });
      let current: Ride | null = null;
      let travelled = 0;
      let lastU = -1;

      const ringMat = mat(new THREE.MeshBasicMaterial({ color: 0xc9a24a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), ringMat);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);

      // ---- scroll → travel
      const state = { p: 0 };
      const tween = gsap.to(state, {
        p: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1.2 },
      });
      const camPos = new THREE.Vector3();
      const camLook = new THREE.Vector3();
      const tmp = new THREE.Vector3();
      // the opening: high over the right verge, behind the 1960 shop, looking on up the road
      const aerialPos = stopPts[0].clone().addScaledVector(sideAt(stopU[0]), 30).addScaledVector(curve.getTangentAt(stopU[0]), -26).add(new THREE.Vector3(0, 30, 0));
      const aerialLook = curve.getPointAt(stopU[0] + (stopU[1] - stopU[0]) * 0.4);
      let first = true;
      let lastActive = -1;
      let lastTime = 0;

      const render = (time: number) => {
        const prog = state.p;
        const dt = Math.min(0.1, Math.max(1 / 240, (time - lastTime) / 1000));
        lastTime = time;
        const intro = smooth(0, 1, prog / INTRO);
        const sf = prog < INTRO ? 0 : ((prog - INTRO) / (1 - INTRO)) * (N - 1);
        const k = Math.min(N - 2, Math.floor(sf));
        const u = prog < INTRO ? stopU[0] * (0.55 + 0.45 * intro) : stopU[k] + (stopU[k + 1] - stopU[k]) * dwell(clamp01(sf - k));
        const idx = Math.round(sf);
        const w = wrap.clientWidth, h = wrap.clientHeight;
        const far = w < 768 ? 1.45 : 1;

        const p = curve.getPointAt(u);
        const t = curve.getTangentAt(u);
        const lane = p.clone().addScaledVector(sideAt(u), LANE);

        // the vehicle: swapped as the journey reaches each business, rolling along its lane
        const ride = rideOf(milestones[idx]);
        if (ride !== current) {
          if (current) rides.get(current)!.visible = false;
          current = ride;
          const v = rides.get(ride)!;
          v.visible = true;
          if (!first) {
            v.scale.setScalar(0.01);
            gsap.to(v.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: "back.out(2.2)" });
          }
        }
        const v = rides.get(current!)!;
        v.position.copy(lane);
        v.lookAt(tmp.copy(curve.getPointAt(Math.min(1, u + 0.003))).addScaledVector(sideAt(u), LANE));
        // wheels roll by the distance moved (forwards or back), the trader walks it, the pictures ride their
        // suspension
        const moved = lastU < 0 ? 0 : (u - lastU) * curve.getLength();
        lastU = u;
        travelled += moved;
        (v.userData.wheels ?? []).forEach((wh: { obj: THREE.Object3D; r: number }) => (wh.obj.rotation.x += moved / wh.r));
        v.userData.walker?.userData.walk(travelled * 1.8, 0.78);
        v.userData.move?.(moved, 1);
        trail.geometry.setDrawRange(0, Math.floor(u * SAMPLES) * 6);

        // the businesses rise out of the ground as the road reaches them; their signboards follow on screen
        // (the 1960 shop already stands in the opening shot)
        const sfReveal = prog < INTRO ? -0.2 + intro * 0.2 : sf;
        stops.forEach((s, i) => {
          const r = clamp01((sfReveal - i + 1.25) / 0.95);
          s.group.position.y = -(s.spec.h + 0.6) * (1 - easeOut(r));
          s.group.visible = r > 0;
          const el = labels.current[i];
          if (!el) return;
          tmp.copy(s.anchor).project(camera);
          const near = 1 - smooth(0.2, 1.1, Math.abs(sf - i));
          // (hidden once its building has left the frame, rather than parked at the edge)
          const op = tmp.z < 1 && Math.abs(tmp.x) < 1.05 ? near * clamp01(r * 2 - 1) * (prog < INTRO ? intro : 1) : 0;
          const half = el.offsetWidth / 2 + 12;
          const sx = Math.min(w - half, Math.max(half, ((tmp.x + 1) / 2) * w));
          const sy = Math.max(el.offsetHeight + 90, ((1 - tmp.y) / 2) * h);
          el.style.opacity = op.toFixed(3);
          el.style.transform = `translate(-50%, -100%) translate(${sx}px, ${sy}px) scale(${0.85 + op * 0.15})`;
        });

        // camera: alongside the vehicle on the right-hand verge (so the pictures are seen side-on, as they
        // were photographed), turning square-on to each business as it arrives, framing its whole front
        const stop = stops[idx];
        const near = 1 - smooth(0.06, 0.48, Math.abs(sf - idx));
        const right = sideAt(u);
        const travelPos = lane.clone().addScaledVector(right, 13 * far).addScaledVector(t, -3.5).addScaledVector(up, 3.4 * far);
        const travelLook = lane.clone().addScaledVector(t, 5).addScaledVector(up, 1.5);
        const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
        // (far enough back to take in the whole front with the vehicle before it, at about eye level, so the
        // vehicle sits below the showroom's glass rather than across it)
        const heroDist = THREE.MathUtils.clamp((stop.spec.w * 0.5 + 6) / tanH, 22, w < 768 ? 40 : 60);
        const heroLook = stop.pos.clone().lerp(stop.lane, 0.45).addScaledVector(up, 2.6);
        const heroPos = heroLook.clone().addScaledVector(stop.nrm, -heroDist).addScaledVector(up, 2.2);
        const desired = travelPos.lerp(heroPos, near);
        const look = travelLook.lerp(heroLook, near);
        if (prog < INTRO) {
          desired.lerpVectors(aerialPos, desired, intro);
          look.lerpVectors(aerialLook, look, intro);
        }
        const kf = first ? 1 : 1 - Math.exp(-dt * 4);
        first = false;
        camPos.lerp(desired, kf);
        camLook.lerp(look, kf);
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        sun.position.copy(camLook).add(tmp.set(-40, 70, 30));
        sun.target.position.copy(camLook);

        renderer.render(scene, camera);
        if (railFill.current) railFill.current.style.transform = `scaleX(${prog})`;
        // the heading gives the road the screen once the drive begins
        if (intro_.current) {
          const o = 1 - smooth(INTRO * 0.6, INTRO * 1.4, prog);
          intro_.current.style.opacity = o.toFixed(3);
          intro_.current.style.visibility = o < 0.01 ? "hidden" : "visible";
        }

        if (idx !== lastActive) {
          // a gold ring spreads from the vehicle at each new milestone
          if (lastActive !== -1 && prog >= INTRO) {
            ring.position.set(lane.x, 0.1, lane.z);
            ring.scale.setScalar(1);
            ringMat.opacity = 0.9;
            gsap.to(ring.scale, { x: 10, y: 10, z: 10, duration: 1.4, ease: "expo.out" });
            gsap.to(ringMat, { opacity: 0, duration: 1.4, ease: "power2.out" });
          }
          lastActive = idx;
          setActive(idx);
        }
      };

      const resize = () => {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.fov = w < 768 ? 60 : 46;
        // on desktop, shift the framing right so the scene clears the card on the left
        if (w >= 768) camera.setViewOffset(w, h, -w * 0.11, 0, w, h);
        else camera.clearViewOffset();
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      // lay out one frame and compile everything now (behind the preloader), not on first sight
      render(0);
      warmUp(renderer, scene, camera, trackAsset());

      let raf = 0;
      const loop = (time: number) => {
        render(time);
        raf = requestAnimationFrame(loop);
      };
      // render only while the journey is on screen
      const io = new IntersectionObserver(([e]) => {
        cancelAnimationFrame(raf);
        if (e.isIntersecting) raf = requestAnimationFrame(loop);
      });
      io.observe(wrap);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", resize);
        tween.scrollTrigger?.kill();
        tween.kill();
        scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
        rides.get("cart")?.userData.dispose?.();
        stops.forEach((b) => b.dispose());
        materials.forEach((m) => m.dispose());
        textures.forEach((t) => t.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
      // (further down the page: built after the opening is revealed, not before)
    }, { defer: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msKey]);

  // the timeline jumps straight to a milestone
  const jumpTo = (i: number) => {
    const el = root.current;
    if (!el) return;
    const f = INTRO + (1 - INTRO) * (i / (N - 1));
    const y = el.offsetTop + (el.offsetHeight - window.innerHeight) * f;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 2.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const m = milestones[Math.min(active, N - 1)];
  // the span of the journey, from the milestones themselves
  const span = `${milestones[0].year} – ${milestones[N - 1].year}`;
  const decades = Math.max(1, Math.floor((milestones[N - 1].year - milestones[0].year) / 10));
  const decadesTitle = `${numberWord(decades)} decade${decades === 1 ? "" : "s"}.`;

  if (fallback) {
    return (
      <section id="journey" className="bg-x-black px-4 py-24 text-white md:px-8">
        <Eyebrow light>Our journey · {span}</Eyebrow>
        <h2 className="wide mt-6 text-[clamp(34px,4.4vw,76px)]">{decadesTitle}<br />Milestone by milestone.</h2>
        <ol className="mt-12 space-y-6 border-l border-x-gold/40 pl-6">
          {milestones.map((x) => (
            <li key={x.year}>
              <span className="wide text-[clamp(26px,3vw,44px)] text-x-gold">{x.year}</span>
              <p className="mt-1 text-white/80">{x.title}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    // (overlaps the story's last screen, over which it fades in: see the effect above)
    <section id="journey" ref={root} className="relative z-10 -mt-[100svh] overflow-x-clip text-white" style={{ height: `${(N * 0.9 + 1) * 100}svh` }}>
      <div ref={stage} className="sticky top-0 h-[100svh] overflow-hidden bg-x-black will-change-[opacity,transform]" style={{ transform: "translate3d(100%, 0, 0)", opacity: 0, visibility: "hidden" }}>
        <div ref={canvasWrap} className="absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(10,10,11,0.8))]" aria-hidden />

        {/* signboards over each business */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {milestones.map((x, i) => (
            <div key={x.year} ref={(el) => { labels.current[i] = el; }} className="absolute left-0 top-0 origin-bottom opacity-0 will-change-transform">
              <div className="relative -translate-y-3 rounded-md bg-x-black/90 px-3 py-1.5 ring-1 ring-x-gold/60 shadow-[0_10px_30px_-8px_rgba(201,162,74,0.35)] md:px-4 md:py-2">
                <p className="micro !tracking-[0.2em] text-x-gold">{x.year}</p>
                <p className="wide mt-1 whitespace-nowrap text-[12px] md:text-[14px]">{x.short}</p>
                <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-x-gold/60 bg-x-black" />
              </div>
            </div>
          ))}
        </div>

        {/* heading, the current milestone, the timeline (kept clear of the design switcher, bottom-left) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pb-20 pt-24 md:p-8 md:pb-[76px] md:pt-28">
          <div>
            <Eyebrow light>Our journey · {span}</Eyebrow>
            <div ref={intro_} className="flex items-start justify-between gap-6">
              <h2 ref={heading} className="wide mt-4 text-[clamp(26px,3.4vw,56px)] !leading-[0.95]">
                <span className="block text-white/45">{decadesTitle}</span>
                <span className="block">Milestone by milestone.</span>
              </h2>
              <p className="hidden max-w-[240px] text-right text-[13px] leading-relaxed text-white/55 md:block">
                Scroll to drive from one business to the next. Each one rises beside the road as you arrive.
              </p>
            </div>
          </div>

          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 30, rotateX: -25 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.55, ease }}
                className="flex max-w-lg items-center gap-4 overflow-hidden rounded-xl bg-x-black/80 p-3 ring-1 ring-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md md:p-4"
                style={{ transformPerspective: 800 }}
              >
                {m.image && <img src={m.image} alt="" loading="lazy" decoding="async" className="hidden h-24 w-24 shrink-0 rounded-lg object-cover sm:block md:h-28 md:w-28" />}
                <div className="py-1 pr-2">
                  <div className="flex items-center gap-3">
                    <span className="wide text-[clamp(34px,3.6vw,56px)] !leading-none text-x-gold">{m.year}</span>
                    <span className="micro rounded-full bg-x-gold px-3 py-1 !text-[10px] text-x-black">{categoryMeta[m.category].label}</span>
                  </div>
                  <p className="mt-2 text-[15px] leading-snug md:text-[17px]">{m.title}</p>
                  <p className="micro mt-2 !text-[10px] text-white/45">
                    Stop {String(active + 1).padStart(2, "0")} of {N}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-auto relative mt-5 hidden md:block">
              <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-white/10">
                <div ref={railFill} className="h-full origin-left bg-x-gold" style={{ transform: "scaleX(0)" }} />
              </div>
              <ol className="relative flex justify-between">
                {milestones.map((x, i) => (
                  <li key={x.year}>
                    <button onClick={() => jumpTo(i)} className="group flex flex-col items-center gap-2" aria-label={`Go to ${x.year}: ${x.title}`}>
                      <span className={`h-4 w-4 rounded-full border-2 transition-all duration-300 ${i <= active ? "border-x-gold bg-x-gold" : "border-white/25 bg-x-black"} ${i === active ? "scale-125" : ""}`} />
                      <span className={`text-[11px] transition-colors ${i === active ? "font-semibold text-white" : "text-white/40 group-hover:text-white"}`}>{x.year}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
