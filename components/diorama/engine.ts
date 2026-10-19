// The 3D journey engine shared by Option C (sunrise → dusk cycle) and Option D (monochrome clay model).
// Mounts a WebGL scene into `host`, pins `pinEl` with ScrollTrigger and drives a camera along the route.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { milestones, type Category } from "@/lib/content";
import { Kit, makeMaterials, signMaterial, glowTexture, type Materials } from "./kit";
import { autoRickshaw, building, car, cloud, deliveryVan, handcart, person, scooter, streetLamp, tree, truck } from "./models";

export type DioramaMode = "cycle" | "mono";

export type DioramaOptions = {
  host: HTMLElement;
  pinEl: HTMLElement;
  mode: DioramaMode;
  /** Share of the scroll spent on the opening aerial shot (and hero overlay in mono mode). */
  intro?: number;
  /** Shift the framing right by this share of the width on desktop (to clear a left-hand panel). */
  viewOffset?: number;
  onActive?: (index: number, timeOfDay: string) => void;
  onProgress?: (progress: number) => void;
};

export type DioramaController = { destroy: () => void; jumpTo: (i: number) => void };

const SPACING = 62;
const ROAD_HALF = 3.6;
const LANE = 1.8; // hero drives on the left (−), oncoming traffic on the right (+)
const SAMPLES = 1200;
const GOLD = 0xc9a24a;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const dwell = (s: number) => s - (Math.sin(2 * Math.PI * s) / (2 * Math.PI)) * 0.92;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SkyKey = { t: number; sky: number; hemiSky: number; hemiGround: number; sun: number; sunI: number; hemiI: number; elev: number; azim: number; night: number; label: string };

// A day passes across six decades: dawn (1960) → noon → golden hour → dusk (2025).
const SKY_CYCLE: SkyKey[] = [
  { t: 0.0, sky: 0xf1d3b0, hemiSky: 0xffe3c2, hemiGround: 0x7a6a55, sun: 0xffbd7d, sunI: 2.6, hemiI: 0.7, elev: 0.28, azim: -1.25, night: 0, label: "Dawn" },
  { t: 0.28, sky: 0xcfe0ea, hemiSky: 0xeaf3ff, hemiGround: 0x7d7462, sun: 0xfff5e4, sunI: 3.3, hemiI: 0.8, elev: 0.95, azim: -0.55, night: 0, label: "Morning" },
  { t: 0.55, sky: 0xd3e2e8, hemiSky: 0xf0f5ff, hemiGround: 0x7d7462, sun: 0xfffaf0, sunI: 3.4, hemiI: 0.8, elev: 1.15, azim: 0.2, night: 0, label: "Noon" },
  { t: 0.8, sky: 0xf2bf8c, hemiSky: 0xffd2a6, hemiGround: 0x6d5844, sun: 0xffa45c, sunI: 2.8, hemiI: 0.65, elev: 0.32, azim: 1.0, night: 0.2, label: "Golden hour" },
  { t: 0.96, sky: 0x161c36, hemiSky: 0x3a4778, hemiGround: 0x15120f, sun: 0x8fa2ff, sunI: 0.35, hemiI: 0.4, elev: 0.75, azim: 1.5, night: 1, label: "Dusk" },
];
// Option D: one calm, pale-blue light, like an architect's clay model.
const SKY_MONO: SkyKey[] = [
  { t: 0, sky: 0xd9e8f1, hemiSky: 0xffffff, hemiGround: 0xa9bfcf, sun: 0xffffff, sunI: 1.9, hemiI: 1.9, elev: 0.95, azim: -0.7, night: 0, label: "Day" },
  { t: 1, sky: 0xd9e8f1, hemiSky: 0xffffff, hemiGround: 0xa9bfcf, sun: 0xffffff, sunI: 1.9, hemiI: 1.9, elev: 0.95, azim: -0.7, night: 0, label: "Day" },
];

/** Recolours every material into a single pale tone; the hero vehicle keeps its gold. */
function monochrome(M: Materials) {
  const PALE = 0xe6eef3;
  const set = (m: THREE.Material, color: number, extra: Partial<THREE.MeshStandardMaterial> = {}) => {
    const s = m as THREE.MeshStandardMaterial;
    if (s.map) { s.map.dispose(); s.map = null; }
    s.color?.set(color);
    s.metalness = 0;
    s.roughness = 0.92;
    s.envMapIntensity = 0.3;
    if (s.emissive) s.emissiveIntensity = 0;
    Object.assign(s, extra);
    s.needsUpdate = true;
  };
  for (const [key, v] of Object.entries(M)) {
    if (typeof v === "function") continue;
    const list = Array.isArray(v) ? v : [v];
    list.forEach((m, i) => {
      if (!(m instanceof THREE.MeshStandardMaterial)) return;
      switch (key) {
        case "glass": return set(m, 0xb3c6d4, { roughness: 0.25, metalness: 0.15 });
        case "glassClear": return set(m, 0xd3e3ec, { opacity: 0.4 });
        case "trim": case "tire": case "hair": return set(m, 0xb9cad6);
        case "roofTile": case "roofMetal": return set(m, 0xd3e0e8);
        case "asphalt": return set(m, 0xcad8e1);
        case "paint": return set(m, 0xf7fafc);
        case "ground": return set(m, 0xdbe7ee, { roughness: 1 });
        case "grass": case "fields": return set(m, [0xd2e1e9, 0xcddce5, 0xd6e3ea][i % 3], { roughness: 1 });
        case "foliage": return set(m, [0xdde9ef, 0xd2e0e8, 0xe4edf2, 0xcfdde6][i % 4]);
        case "headlight": case "taillight": case "lampHead": return set(m, 0xf4f8fa);
        default: return set(m, PALE);
      }
    });
  }
  (M.glow as THREE.MeshBasicMaterial).visible = false;
  const original = M.paintOf;
  M.paintOf = (hex: number, metal = 0.5) => (hex === GOLD ? original(hex, metal) : original(0xe9f0f4, 0));
}

export function mountDiorama(opts: DioramaOptions): DioramaController {
  const { host, pinEl, mode } = opts;
  const INTRO = opts.intro ?? 0.06;
  const SKY = mode === "mono" ? SKY_MONO : SKY_CYCLE;
  const mono = mode === "mono";
  const todLabel = (p: number) => {
    let best = SKY[0];
    for (const k of SKY) if (p >= k.t - 0.12) best = k;
    return best.label;
  };

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  let disposed = false;
  let st: ScrollTrigger | null = null;
  const mobile = window.innerWidth < 768;
  // ?snap: camera jumps straight to its target (used for screenshot QA on slow renderers)
  const snap = new URLSearchParams(window.location.search).has("snap");
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = mono ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = mono ? 1 : 0.98;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.background = new THREE.Color(SKY[0].sky);
  scene.fog = new THREE.Fog(SKY[0].sky, mono ? 120 : 170, mono ? 420 : 600);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 900);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 260 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  if (mono) sun.shadow.radius = 6;
  scene.add(hemi, sun, sun.target);

  const M = makeMaterials();
  if (mono) monochrome(M);
  const rand = rng(1960);
  const timeU = { value: 0 };
  M.foliage.forEach((mat) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeU;
      shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec4 wpos = modelMatrix * vec4(position, 1.0);
        float sway = sin(uTime * 1.6 + wpos.x * 0.15 + wpos.z * 0.11) * 0.05 * max(0.0, position.y - 1.0);
        transformed.x += sway; transformed.z += sway * 0.6;`,
      );
    };
  });

  const n = milestones.length;
  let jump: (i: number) => void = () => {};
  let cleanup = () => {};

  const init = async () => {
    try { await document.fonts.ready; } catch { /* optional */ }
    if (disposed) return;

    // ---- Route ---------------------------------------------------------------
    const stopPts = milestones.map((_, i) => new THREE.Vector3(Math.sin(i * 0.75) * 24, 0, -i * SPACING));
    const ctrl = [
      new THREE.Vector3(stopPts[0].x - 10, 0, SPACING * 1.4),
      new THREE.Vector3(stopPts[0].x - 4, 0, SPACING * 0.6),
      ...stopPts,
      new THREE.Vector3(stopPts[n - 1].x + 10, 0, stopPts[n - 1].z - SPACING * 0.7),
      new THREE.Vector3(stopPts[n - 1].x + 18, 0, stopPts[n - 1].z - SPACING * 1.8),
    ];
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");
    const length = curve.getLength();
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
    const midZ = (stopPts[0].z + stopPts[n - 1].z) / 2;

    // ---- Ground, road ------------------------------------------------------------
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, Math.abs(stopPts[n - 1].z) + 700), M.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, midZ);
    ground.receiveShadow = true;
    scene.add(ground);

    const ribbon = (half: number, offset: number, y: number, mat: THREE.Material, withU = false) => {
      const pos: number[] = [], idx: number[] = [], nrm: number[] = [], uv: number[] = [], au: number[] = [];
      samples.forEach((s, i) => {
        const sd = sideAt(i / SAMPLES);
        const c = s.clone().addScaledVector(sd, offset);
        pos.push(c.x + sd.x * half, y, c.z + sd.z * half, c.x - sd.x * half, y, c.z - sd.z * half);
        nrm.push(0, 1, 0, 0, 1, 0);
        uv.push(i / SAMPLES, 0, i / SAMPLES, 1);
        au.push(i / SAMPLES, i / SAMPLES);
        if (i < SAMPLES) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      if (withU) g.setAttribute("aU", new THREE.Float32BufferAttribute(au, 1));
      g.setIndex(idx);
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = !withU;
      scene.add(m);
      return m;
    };
    ribbon(ROAD_HALF, 0, 0.01, M.asphalt);
    ribbon(0.09, ROAD_HALF - 0.3, 0.025, M.paint);
    ribbon(0.09, -ROAD_HALF + 0.3, 0.025, M.paint);
    ribbon(0.8, ROAD_HALF + 0.85, 0.1, M.sidewalk);
    ribbon(0.8, -ROAD_HALF - 0.85, 0.1, M.sidewalk);

    // Option C: a persistent gold line. Option D: a glowing comet streak that follows the hero.
    const goldTrail = new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.4 });
    const trail = mono ? null : ribbon(0.12, -LANE, 0.03, goldTrail);
    const streakU = { uHead: { value: 0 }, uTail: { value: 90 / length } };
    const streakMat = (color: number, strength: number) => new THREE.ShaderMaterial({
      uniforms: { ...streakU, uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
      vertexShader: `attribute float aU; varying float vU; varying vec2 vUv;
        void main(){ vU = aU; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uHead; uniform float uTail; uniform vec3 uColor; uniform float uStrength;
        varying float vU; varying vec2 vUv;
        void main(){
          float d = uHead - vU;
          if (d < 0.0 || d > uTail) discard;
          float a = pow(1.0 - d / uTail, 1.8);
          float edge = 1.0 - abs(vUv.y * 2.0 - 1.0);
          a *= smoothstep(0.0, 1.0, edge) * uStrength;
          gl_FragColor = vec4(uColor, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const streaks = mono ? [ribbon(1.6, -LANE, 0.06, streakMat(0xe8b54a, 0.55), true), ribbon(0.22, -LANE, 0.08, streakMat(0xfff1c8, 1.0), true)] : [];

    // Halftone dot ripples around the current business (Option D)
    const dotsMat = new THREE.ShaderMaterial({
      uniforms: { uTime: timeU, uAmp: { value: 0 }, uColor: { value: new THREE.Color(0x8aaecb) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uTime; uniform float uAmp; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          vec2 p = (vUv - 0.5) * 110.0;
          float cell = 1.7;
          vec2 id = floor(p / cell);
          vec2 f = fract(p / cell) - 0.5;
          float dist = length((id + 0.5) * cell);
          float wave = 0.5 + 0.5 * sin(dist * 0.32 - uTime * 2.4);
          float fall = smoothstep(52.0, 6.0, dist);
          float r = 0.06 + 0.2 * wave * fall;
          float a = (1.0 - smoothstep(r - 0.06, r, length(f))) * fall * uAmp;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a * 0.7);
        }`,
      transparent: true,
      depthWrite: false,
    });
    const dots = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), dotsMat);
    dots.rotation.x = -Math.PI / 2;
    dots.visible = mono;
    scene.add(dots);

    const dashes = new Kit();
    for (let d = 0; d < length; d += 5) {
      const u = d / length;
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      dashes.add(new THREE.BoxGeometry(0.16, 0.02, 2.2), M.paint, new THREE.Matrix4().makeRotationY(Math.atan2(t.x, t.z)).setPosition(p.x, 0.025, p.z));
    }
    scene.add(dashes.build(false));

    // ---- Businesses --------------------------------------------------------------
    const signTheme = mono
      ? { bg: "#fbfdfe", border: "#0b2859", text: "#0b2859", accent: "#b08a35" }
      : { bg: "#15130f", border: "#c9a24a", text: "#f3ede2", accent: "#e6c87e" };
    const signMats: THREE.MeshStandardMaterial[] = [];
    const stops = milestones.map((m, i) => {
      const u = stopU[i];
      const p = curve.getPointAt(u);
      const side = i % 2 === 0 ? 1 : -1;
      const nrm = sideAt(u).multiplyScalar(side);
      const sign = signMaterial(m.short, `Since ${m.year}`, signTheme);
      if (mono) sign.emissiveIntensity = 0.35;
      signMats.push(sign);
      const b = building(m.category, M, sign, rand);
      const setback = ROAD_HALF + 2.2 + b.size.d / 2;
      const pos = p.clone().addScaledVector(nrm, setback);
      b.group.position.copy(pos);
      b.group.rotation.y = Math.atan2(-nrm.x, -nrm.z);
      b.group.scale.set(1, 0.001, 1);
      b.group.visible = false;
      scene.add(b.group);
      const people = b.walkers.map((w, j) => {
        const pp = person(M, rand);
        pp.userData.path = w;
        pp.userData.phase = j * 1.7 + rand() * 3;
        pp.userData.speed = 0.6 + rand() * 0.4;
        pp.scale.setScalar(0.001);
        b.group.add(pp);
        return pp;
      });
      return { ...b, pos, nrm, road: p, up: false, people, radius: Math.max(b.size.w, b.size.d) / 2 + 4 };
    });

    // ---- Scenery -----------------------------------------------------------------
    const scen = new Kit();
    const glow = new Kit();
    const nearRoad = (q: THREE.Vector3, margin: number) => {
      for (let i = 0; i < SAMPLES; i += 4) if (samples[i].distanceTo(q) < ROAD_HALF + margin) return true;
      return false;
    };
    const nearStop = (q: THREE.Vector3, pad = 0) => stops.some((s) => s.pos.distanceTo(q) < s.radius + pad);
    for (let f = 0; f < 70; f++) {
      const u = rand();
      const p = curve.getPointAt(u);
      const q = p.clone().addScaledVector(sideAt(u), (rand() > 0.5 ? 1 : -1) * (30 + rand() * 70));
      const w = 14 + rand() * 18, d = 10 + rand() * 16;
      if (nearRoad(q, Math.max(w, d) / 2 + 4) || nearStop(q, Math.max(w, d) / 2)) continue;
      scen.add(new THREE.PlaneGeometry(w, d), M.fields[f % M.fields.length], new THREE.Matrix4().makeRotationY(rand() * Math.PI).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).setPosition(q.x, 0.02, q.z));
    }
    for (let c = 0; c < 70; c++) {
      const u = rand();
      const p = curve.getPointAt(u);
      const centre = p.clone().addScaledVector(sideAt(u), (rand() > 0.5 ? 1 : -1) * (12 + rand() * 40));
      if (nearStop(centre, 4) || nearRoad(centre, 6)) continue;
      scen.add(new THREE.CircleGeometry(4 + rand() * 3, 18), M.grass, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(centre.x, 0.03, centre.z));
      const count = 2 + Math.floor(rand() * 4);
      for (let k = 0; k < count; k++) {
        const q = centre.clone().add(new THREE.Vector3((rand() - 0.5) * 7, 0, (rand() - 0.5) * 7));
        if (!nearRoad(q, 4) && !nearStop(q)) tree(scen, M, q.x, q.z, 3.5 + rand() * 3.5, rand);
      }
    }
    for (let u = 0.006; u < 1; u += 0.016) {
      const p = curve.getPointAt(u);
      if (stops.some((s) => s.road.distanceTo(p) < 16)) continue;
      const sd = sideAt(u);
      streetLamp(scen, glow, M, p.clone().addScaledVector(sd, ROAD_HALF + 1.4), p.clone().addScaledVector(sd, ROAD_HALF - 0.6));
    }
    if (!mono) {
      for (let h = 0; h < 46; h++) {
        const z = 120 - rand() * (Math.abs(stopPts[n - 1].z) + 380);
        const x = (rand() > 0.5 ? 1 : -1) * (150 + rand() * 120);
        const r = 30 + rand() * 40;
        scen.add(new THREE.ConeGeometry(r, 10 + rand() * 22, 7), M.hills[h % 3], new THREE.Matrix4().makeRotationY(rand() * 3).setPosition(x, 0, z));
      }
    }
    scene.add(scen.build());
    const glowMesh = glow.build(false);
    glowMesh.renderOrder = 2;
    scene.add(glowMesh);

    const clouds = mono ? [] : Array.from({ length: 16 }, (_, i) => {
      const c = cloud(M, rand);
      c.position.set((rand() - 0.5) * 200, 42 + rand() * 18, 60 - i * ((Math.abs(stopPts[n - 1].z) + 120) / 16));
      c.userData.speed = 0.6 + rand() * 0.8;
      scene.add(c);
      return c;
    });

    // ---- Traffic (oncoming lane) -----------------------------------------------------
    const npcColors = [0xb5332e, 0xeeeeea, 0x9aa0a8, 0x2e4f7a, 0x1f2023, 0x3f6a4f, 0xe0a33a];
    const traffic = Array.from({ length: mobile ? 14 : 24 }, (_, i) => {
      const kind = i % 5;
      const v = kind === 1 ? autoRickshaw(M) : kind === 3 ? truck(M, npcColors[i % npcColors.length], 0xd8c08a) : car(M, npcColors[i % npcColors.length]);
      v.userData.u0 = rand();
      v.userData.du = (kind === 3 ? 6 : 8 + rand() * 4) / length;
      scene.add(v);
      return v;
    });

    // ---- Hero vehicle ---------------------------------------------------------------
    const logo = await new THREE.TextureLoader().loadAsync("/brand/logo-mark.png").catch(() => undefined);
    if (logo) logo.colorSpace = THREE.SRGBColorSpace;
    if (disposed) return;
    const heroes: Record<Category, THREE.Group> = {
      heritage: handcart(M, rand),
      appliances: deliveryVan(M, logo),
      "two-wheelers": scooter(M, rand),
      cars: car(M, GOLD),
      commercial: truck(M, GOLD, 0xf1ead9),
    };
    Object.values(heroes).forEach((h) => {
      h.visible = false;
      scene.add(h);
    });
    let currentCat: Category | null = null;

    // ---- Arrival effects -------------------------------------------------------------
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.0, 64),
      new THREE.MeshBasicMaterial({ color: mono ? 0xc9a24a : 0xe6c87e, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,220,150,0.8)"), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.rotation.x = -Math.PI / 2;
    scene.add(halo);

    const CONF = 180;
    const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.28, 0.42), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.5, metalness: 0.3 }), CONF);
    const palette = mono ? [0xc9a24a, 0xe6c87e, 0x0b2859, 0xffffff, 0x7fa6c4] : [0xc9a24a, 0xe6c87e, 0xf3ede2, 0x0b2859, 0xb4563a];
    const cs = Array.from({ length: CONF }, (_, i) => {
      confetti.setColorAt(i, new THREE.Color(palette[i % palette.length]));
      return { p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), s: new THREE.Vector3(), life: 0 };
    });
    confetti.frustumCulled = false;
    scene.add(confetti);
    const dummy = new THREE.Object3D();
    const burst = (at: THREE.Vector3) => {
      cs.forEach((c) => {
        c.p.copy(at).add(new THREE.Vector3((rand() - 0.5) * 3, rand() * 2, (rand() - 0.5) * 3));
        c.v.set((rand() - 0.5) * 9, 6 + rand() * 7, (rand() - 0.5) * 9);
        c.s.set(rand() * 8, rand() * 8, rand() * 8);
        c.life = 2.6 + rand();
      });
    };

    // ---- Frame loop ------------------------------------------------------------------
    const state = { progress: 0 };
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const dotsPos = new THREE.Vector3();
    let first = true;
    let lastActive = -1;
    let lastU = 0;
    let lastT = performance.now();
    const tmp = new THREE.Vector3();
    const aerialPos = stopPts[0].clone().add(mono ? new THREE.Vector3(-45, 95, 120) : new THREE.Vector3(-55, 78, 110));
    const aerialLook = curve.getPointAt(stopU[Math.min(3, n - 1)]);
    const col = (a: number, b: number, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);

    const applySky = (p: number) => {
      let i = 0;
      while (i < SKY.length - 2 && p > SKY[i + 1].t) i++;
      const A = SKY[i], B = SKY[i + 1];
      const t = smooth(A.t, B.t, p);
      const sky = col(A.sky, B.sky, t);
      (scene.background as THREE.Color).copy(sky);
      (scene.fog as THREE.Fog).color.copy(sky);
      hemi.color.copy(col(A.hemiSky, B.hemiSky, t));
      hemi.groundColor.copy(col(A.hemiGround, B.hemiGround, t));
      hemi.intensity = THREE.MathUtils.lerp(A.hemiI, B.hemiI, t);
      sun.color.copy(col(A.sun, B.sun, t));
      sun.intensity = THREE.MathUtils.lerp(A.sunI, B.sunI, t);
      const elev = THREE.MathUtils.lerp(A.elev, B.elev, t);
      const azim = THREE.MathUtils.lerp(A.azim, B.azim, t);
      const night = THREE.MathUtils.lerp(A.night, B.night, t);
      if (!mono) {
        renderer.toneMappingExposure = 0.98 - night * 0.18;
        scene.environmentIntensity = 0.45 * (1 - night) + 0.06;
        M.glass.emissiveIntensity = night * 1.4;
        M.lampHead.emissiveIntensity = 0.2 + night * 4;
        (M.glow as THREE.MeshBasicMaterial).opacity = Math.min(1, night * 1.1);
        M.headlight.emissiveIntensity = 0.4 + night * 3;
        M.taillight.emissiveIntensity = 0.3 + night * 2.5;
        goldTrail.emissiveIntensity = 0.35 + night * 1.2;
        signMats.forEach((s) => (s.emissiveIntensity = 0.15 + night * 1.0));
      } else {
        scene.environmentIntensity = 0.25;
      }
      return new THREE.Vector3(Math.cos(elev) * Math.sin(azim), Math.sin(elev), Math.cos(elev) * Math.cos(azim));
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const time = now / 1000;
      timeU.value = time;
      const prog = state.progress;
      const intro = smooth(0, 1, prog / INTRO);
      const sf = prog < INTRO ? 0 : ((prog - INTRO) / (1 - INTRO)) * (n - 1);
      const k = Math.min(n - 2, Math.floor(sf));
      const u = stopU[k] + (stopU[k + 1] - stopU[k]) * dwell(clamp01(sf - k));
      const idx = Math.round(sf);
      const w = host.clientWidth;
      const far = w < 768 ? 1.35 : 1;

      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      const side = sideAt(u);
      const lane = p.clone().addScaledVector(side, -LANE);

      const cat = milestones[idx].category;
      if (cat !== currentCat) {
        if (currentCat) heroes[currentCat].visible = false;
        currentCat = cat;
        const h = heroes[cat];
        h.visible = true;
        h.scale.setScalar(0.01);
        gsap.to(h.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(2)" });
      }
      const hero = heroes[cat];
      hero.position.copy(lane);
      hero.lookAt(tmp.copy(curve.getPointAt(Math.min(1, u + 0.002))).addScaledVector(sideAt(u + 0.002), -LANE));
      const moved = (u - lastU) * length;
      lastU = u;
      (hero.userData.wheels ?? []).forEach((wh: { obj: THREE.Object3D; r: number }) => (wh.obj.rotation.x += moved / wh.r));
      if (hero.userData.walker) hero.userData.walker.userData.walk((u * length) / 0.55, 0.7);
      if (trail) trail.geometry.setDrawRange(0, Math.floor(u * SAMPLES) * 6);
      streakU.uHead.value = u + 0.004;

      const sfReveal = prog < INTRO ? -1.2 + intro * 1.2 : sf;
      stops.forEach((s, i) => {
        if (!s.up && sfReveal > i - 1.15) {
          s.up = true;
          s.group.visible = true;
          gsap.killTweensOf(s.group.scale);
          gsap.to(s.group.scale, { y: 1, duration: 1.5, ease: "elastic.out(1, 0.55)" });
          s.people.forEach((pp, j) => gsap.to(pp.scale, { x: 1, y: 1, z: 1, duration: 0.6, delay: 0.7 + j * 0.15, ease: "back.out(2)" }));
        } else if (s.up && sfReveal < i - 1.6) {
          s.up = false;
          gsap.killTweensOf(s.group.scale);
          gsap.to(s.group.scale, { y: 0.001, duration: 0.5, ease: "power2.in", onComplete: () => void (s.group.visible = false) });
          s.people.forEach((pp) => pp.scale.setScalar(0.001));
        }
        if (!s.group.visible) return;
        s.people.forEach((pp) => {
          const { path, phase, speed } = pp.userData;
          const ping = (Math.sin(time * speed * 0.35 + phase) + 1) / 2;
          const dir = Math.cos(time * speed * 0.35 + phase) >= 0 ? 1 : -1;
          pp.position.set(path.from[0] + (path.to[0] - path.from[0]) * ping, 0.25, path.from[2] + (path.to[2] - path.from[2]) * ping);
          pp.rotation.y = Math.atan2((path.to[0] - path.from[0]) * dir, (path.to[2] - path.from[2]) * dir);
          pp.userData.walk(time * 7 * speed + phase);
        });
        s.animated.forEach((f, j) => (f.rotation.y = Math.sin(time * 2.2 + j) * 0.35 - 0.2));
      });

      traffic.forEach((v) => {
        const uu = (((v.userData.u0 - time * v.userData.du) % 1) + 1) % 1;
        const pp = curve.getPointAt(uu);
        v.position.copy(pp).addScaledVector(sideAt(uu), LANE);
        v.lookAt(tmp.copy(curve.getPointAt(Math.max(0, uu - 0.002))).addScaledVector(sideAt(uu - 0.002), LANE));
        (v.userData.wheels ?? []).forEach((wh: { obj: THREE.Object3D; r: number }) => (wh.obj.rotation.x += (v.userData.du * length * dt) / wh.r));
      });
      clouds.forEach((c) => {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 130) c.position.x = -130;
      });

      cs.forEach((c, i) => {
        if (c.life > 0) {
          c.life -= dt;
          c.v.y -= 9 * dt * 0.55;
          c.v.multiplyScalar(1 - 1.2 * dt);
          c.p.addScaledVector(c.v, dt);
          if (c.p.y < 0.05) { c.p.y = 0.05; c.v.set(0, 0, 0); }
          c.r.x += c.s.x * dt; c.r.y += c.s.y * dt; c.r.z += c.s.z * dt;
          dummy.position.copy(c.p);
          dummy.rotation.copy(c.r);
          dummy.scale.setScalar(Math.min(1, c.life));
        } else dummy.scale.setScalar(0);
        dummy.updateMatrix();
        confetti.setMatrixAt(i, dummy.matrix);
      });
      confetti.instanceMatrix.needsUpdate = true;

      const stop = stops[idx];
      const near = 1 - smooth(0.06, 0.5, Math.abs(sf - idx));
      const ease = snap ? 1 : 1 - Math.exp(-dt * 3.2);

      // halftone ripple sits in front of the business we're visiting
      dotsPos.copy(stop.road).addScaledVector(stop.nrm, 6);
      if (first) dots.position.copy(dotsPos);
      dots.position.lerp(dotsPos, ease);
      dots.position.y = 0.05;
      dotsMat.uniforms.uAmp.value += ((prog < INTRO ? 0 : near) - dotsMat.uniforms.uAmp.value) * ease;

      const chasePos = lane.clone().addScaledVector(t, -30 * far).addScaledVector(up, 19 * far).addScaledVector(stop.nrm, -9);
      const chaseLook = curve.getPointAt(Math.min(1, u + 0.012)).add(new THREE.Vector3(0, 1.5, 0));
      const heroPos = lane.clone().addScaledVector(t, -22 * far).addScaledVector(stop.nrm, -20).addScaledVector(up, 14 * far);
      const heroLook = lane.clone().lerp(stop.pos, 0.6).add(new THREE.Vector3(0, 3, 0));
      const desired = chasePos.lerp(heroPos, near);
      const look = chaseLook.lerp(heroLook, near);
      if (prog < INTRO) {
        desired.lerpVectors(aerialPos, desired, intro);
        look.lerpVectors(aerialLook, look, intro);
      }
      if (first) { camPos.copy(desired); camLook.copy(look); first = false; }
      camPos.lerp(desired, ease);
      camLook.lerp(look, ease);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      const sunDir = applySky(prog);
      sun.target.position.copy(camLook);
      sun.position.copy(camLook).addScaledVector(sunDir, 110);

      renderer.render(scene, camera);

      if (idx !== lastActive) {
        if (lastActive !== -1 && idx > lastActive && prog >= INTRO) {
          ring.position.set(lane.x, 0.06, lane.z);
          halo.position.set(lane.x, 0.07, lane.z);
          ring.scale.setScalar(1);
          halo.scale.setScalar(4);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.95;
          (halo.material as THREE.MeshBasicMaterial).opacity = 0.9;
          gsap.to(ring.scale, { x: 14, y: 14, z: 14, duration: 1.6, ease: "expo.out" });
          gsap.to(ring.material, { opacity: 0, duration: 1.6, ease: "power2.out" });
          gsap.to(halo.scale, { x: 26, y: 26, z: 26, duration: 1.8, ease: "expo.out" });
          gsap.to(halo.material, { opacity: 0, duration: 1.8, ease: "power2.out" });
          burst(stop.pos.clone().addScaledVector(stop.nrm, -stop.size.d / 2).add(new THREE.Vector3(0, 7, 0)));
        }
        lastActive = idx;
        opts.onActive?.(idx, todLabel(prog));
      }
    };

    let raf = 0;
    const loop = (now: number) => {
      render(now);
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        lastT = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(host);

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w < 768 ? 44 : 30;
      if (w >= 768 && opts.viewOffset) camera.setViewOffset(w, h, -w * opts.viewOffset, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    st = ScrollTrigger.create({
      trigger: pinEl,
      start: "top top",
      end: () => `+=${window.innerHeight * n * 0.95}`,
      pin: true,
      scrub: 1.2,
      onUpdate: (self) => {
        if (snap) state.progress = self.progress;
        else gsap.to(state, { progress: self.progress, duration: 0.6, ease: "power2.out", overwrite: true });
        opts.onProgress?.(self.progress);
      },
    });
    ScrollTrigger.refresh();
    render(performance.now());
    opts.onProgress?.(st.progress);

    jump = (i: number) => {
      if (!st) return;
      const f = INTRO + (1 - INTRO) * (i / (n - 1));
      const y = st.start + (st.end - st.start) * f;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: 2.4 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    };

    cleanup = () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      st?.kill();
    };
  };

  init();

  return {
    jumpTo: (i) => jump(i),
    destroy: () => {
      disposed = true;
      cleanup();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | undefined;
        if (mat && !Array.isArray(mat)) {
          (mat as THREE.MeshStandardMaterial).map?.dispose();
          mat.dispose();
        }
      });
      M.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
