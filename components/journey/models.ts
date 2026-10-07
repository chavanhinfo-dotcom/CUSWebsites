// Architectural-sketch models for the 3D journey.
// Each model collects: main ink lines (in drawing order), lighter hatch lines (shading),
// accent lines (gold signage) and solid geometry used only to hide lines behind it.
import * as THREE from "three";
import type { Category } from "@/lib/content";

export type V3 = [number, number, number];

export class Sketch {
  lines: number[] = [];
  hatch: number[] = [];
  accent: number[] = [];
  solids: THREE.BufferGeometry[] = [];

  seg(a: V3, b: V3, t = this.lines) {
    t.push(...a, ...b);
    return this;
  }

  poly(pts: V3[], closed = false, t = this.lines) {
    for (let i = 0; i < pts.length - 1; i++) this.seg(pts[i], pts[i + 1], t);
    if (closed) this.seg(pts[pts.length - 1], pts[0], t);
    return this;
  }

  /** Adds a geometry's crease edges to `t` and keeps it as an occluder. */
  shape(g: THREE.BufferGeometry, m: THREE.Matrix4, t = this.lines, solid = true) {
    g.applyMatrix4(m);
    const e = new THREE.EdgesGeometry(g, 25);
    const a = e.attributes.position.array;
    for (let i = 0; i < a.length; i++) t.push(a[i]);
    e.dispose();
    if (solid) this.solids.push(g);
    else g.dispose();
    return this;
  }

  /** Box resting on y, centred on x/z. */
  box(w: number, h: number, d: number, x = 0, y = 0, z = 0, t = this.lines, solid = true) {
    return this.shape(new THREE.BoxGeometry(w, h, d), new THREE.Matrix4().makeTranslation(x, y + h / 2, z), t, solid);
  }

  cyl(r: number, len: number, at: V3, axis: "x" | "y" | "z" = "y", seg = 12, t = this.lines) {
    const m = new THREE.Matrix4();
    if (axis === "x") m.makeRotationZ(Math.PI / 2);
    if (axis === "z") m.makeRotationX(Math.PI / 2);
    m.setPosition(...at);
    return this.shape(new THREE.CylinderGeometry(r, r, len, seg), m, t);
  }

  /** Extrudes a profile drawn in the (z, y) plane across the x axis, centred on x. */
  profileX(pts: [number, number][], width: number, x = 0, t = this.lines) {
    const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    m.setPosition(x - width / 2, 0, 0);
    return this.shape(g, m, t);
  }

  /** Extrudes a profile drawn in the (x, y) plane along z, centred on z. */
  profileZ(pts: [number, number][], depth: number, z = 0, t = this.lines) {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    return this.shape(g, new THREE.Matrix4().makeTranslation(0, 0, z - depth / 2), t);
  }

  /** 45° hatching inside the parallelogram o + a·u + b·v. */
  hatchQuad(o: V3, u: V3, v: V3, spacing = 0.32, t = this.hatch) {
    const U = new THREE.Vector3(...u), V = new THREE.Vector3(...v);
    const W = U.length(), H = V.length();
    U.normalize(); V.normalize();
    const O = new THREE.Vector3(...o);
    const at = (x: number, y: number) => O.clone().addScaledVector(U, x).addScaledVector(V, y).toArray() as V3;
    for (let c = -H + spacing / 2; c < W; c += spacing) {
      const y0 = Math.max(0, -c), y1 = Math.min(H, W - c);
      if (y1 > y0) this.seg(at(y0 + c, y0), at(y1 + c, y1), t);
    }
    return this;
  }

  /** Framed window grid on a front face at z. */
  windows(x0: number, x1: number, y0: number, y1: number, z: number, cols: number, rows: number, frame = 0.1) {
    this.poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], true);
    this.poly([[x0 + frame, y0 + frame, z], [x1 - frame, y0 + frame, z], [x1 - frame, y1 - frame, z], [x0 + frame, y1 - frame, z]], true);
    for (let c = 1; c < cols; c++) {
      const x = x0 + ((x1 - x0) * c) / cols;
      this.seg([x, y0 + frame, z], [x, y1 - frame, z]);
    }
    for (let r = 1; r < rows; r++) {
      const y = y0 + ((y1 - y0) * r) / rows;
      this.seg([x0 + frame, y, z], [x1 - frame, y, z]);
    }
    return this;
  }

  /** Horizontal slats (shutters, louvres, cladding). */
  slats(x0: number, x1: number, y0: number, y1: number, z: number, step: number, t = this.hatch) {
    for (let y = y0 + step; y < y1; y += step) this.seg([x0, y, z], [x1, y, z], t);
    return this;
  }

  /** Shaded right-hand wall and a hatched cast shadow on the ground. */
  shade(w: number, h: number, d: number) {
    this.hatchQuad([w / 2 + 0.02, 0, d / 2], [0, 0, -d], [0, h, 0], 0.4);
    this.hatchQuad([w / 2, 0.02, d / 2], [h * 0.45, 0, 0], [0, 0, -d], 0.45);
    return this;
  }

  /** Adds another sketch, transformed. */
  merge(o: Sketch, m: THREE.Matrix4, solid = true) {
    const tf = (src: number[], dst: number[]) => {
      const v = new THREE.Vector3();
      for (let i = 0; i < src.length; i += 3) {
        v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(m);
        dst.push(v.x, v.y, v.z);
      }
    };
    tf(o.lines, this.lines);
    tf(o.hatch, this.hatch);
    tf(o.accent, this.accent);
    if (solid) o.solids.forEach((g) => this.solids.push(g.applyMatrix4(m)));
    return this;
  }
}

const place = (x: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);

// ---------------------------------------------------------------- vehicles (front faces +z)

export function car() {
  const s = new Sketch();
  s.profileX([[-2.1, 0.32], [-2.12, 0.82], [-1.95, 0.96], [-1.2, 1.02], [-0.78, 1.42], [0.62, 1.44], [1.18, 1.02], [1.98, 0.88], [2.12, 0.62], [2.1, 0.32]], 1.7);
  for (const x of [-0.86, 0.86]) {
    s.poly([[x, 1.04, -1.05], [x, 1.35, -0.72], [x, 1.37, 0.55], [x, 1.04, 1.05]], true);
    s.seg([x, 1.04, -0.08], [x, 1.37, -0.08]);
    s.seg([x, 0.62, -1.9], [x, 0.62, 1.95], s.hatch);
  }
  for (const x of [-0.78, 0.78]) for (const z of [-1.35, 1.35]) s.cyl(0.34, 0.24, [x, 0.34, z], "x", 14);
  s.seg([-0.7, 0.75, 2.12], [-0.35, 0.75, 2.12], s.accent).seg([0.35, 0.75, 2.12], [0.7, 0.75, 2.12], s.accent);
  return s;
}

export function van() {
  const s = new Sketch();
  s.profileX([[-1.95, 0.38], [-1.95, 2.02], [0.95, 2.06], [1.55, 1.32], [2.02, 1.02], [2.02, 0.38]], 1.75);
  for (const x of [-0.88, 0.88]) {
    s.poly([[x, 1.25, 0.75], [x, 1.9, 0.95], [x, 1.3, 1.5]], true);
    s.seg([x, 0.4, 0.6], [x, 1.95, 0.6]);
  }
  for (const x of [-0.8, 0.8]) for (const z of [-1.3, 1.35]) s.cyl(0.36, 0.26, [x, 0.36, z], "x", 14);
  return s;
}

export function truck() {
  const s = new Sketch();
  s.profileX([[1.0, 0.5], [1.0, 2.35], [2.15, 2.35], [2.6, 1.55], [2.62, 0.5]], 1.9);
  s.box(2.05, 0.16, 3.7, 0, 0.62, -0.95);
  // open cargo body with side boards
  s.box(2.05, 1.0, 0.08, 0, 0.78, -2.76).box(0.08, 1.0, 3.6, -0.99, 0.78, -0.95).box(0.08, 1.0, 3.6, 0.99, 0.78, -0.95);
  for (const x of [-0.96, 0.96]) {
    s.poly([[x, 1.4, 1.1], [x, 2.2, 1.1], [x, 2.2, 2.0], [x, 1.4, 2.3]], true);
    s.seg([x, 1.03, -2.7], [x, 1.03, 0.8], s.hatch).seg([x, 1.33, -2.7], [x, 1.33, 0.8], s.hatch);
  }
  for (const x of [-0.85, 0.85]) for (const z of [-1.9, 1.75]) s.cyl(0.42, 0.3, [x, 0.42, z], "x", 14);
  return s;
}

export function scooter() {
  const s = new Sketch();
  s.profileX([[-0.92, 0.42], [-0.86, 0.92], [-0.18, 0.95], [0.12, 0.66], [0.52, 0.7], [0.66, 1.28], [0.84, 1.3], [0.78, 0.42]], 0.46);
  s.box(0.38, 0.12, 0.7, 0, 0.95, -0.45);
  s.seg([-0.38, 1.38, 0.74], [0.38, 1.38, 0.74]).seg([0, 1.3, 0.75], [0, 1.38, 0.74]);
  s.cyl(0.3, 0.13, [0, 0.3, -0.72], "x", 16).cyl(0.3, 0.13, [0, 0.3, 0.8], "x", 16);
  s.seg([-0.1, 1.15, 0.86], [0.1, 1.15, 0.86], s.accent);
  return s;
}

export function handcart() {
  const s = new Sketch();
  s.box(1.5, 0.12, 2.1, 0, 0.8, -0.2);
  s.box(1.5, 0.35, 0.06, 0, 0.92, -1.22).box(0.06, 0.35, 2.1, -0.72, 0.92, -0.2).box(0.06, 0.35, 2.1, 0.72, 0.92, -0.2);
  for (const [x, y, z] of [[-0.35, 1.18, -0.6], [0.35, 1.18, -0.6], [0, 1.18, 0.15], [0, 1.6, -0.25]] as V3[]) s.cyl(0.25, 0.9, [x, y, z], "x", 10);
  for (const x of [-0.92, 0.92]) {
    s.cyl(0.62, 0.08, [x, 0.62, -0.2], "x", 18);
    for (let a = 0; a < Math.PI; a += Math.PI / 4) s.seg([x, 0.62 + Math.sin(a) * 0.6, -0.2 + Math.cos(a) * 0.6], [x, 0.62 - Math.sin(a) * 0.6, -0.2 - Math.cos(a) * 0.6], s.hatch);
  }
  s.seg([-0.55, 0.86, 0.85], [-0.55, 0.95, 2.1]).seg([0.55, 0.86, 0.85], [0.55, 0.95, 2.1]).seg([-0.55, 0.95, 2.0], [0.55, 0.95, 2.0]);
  return s;
}

/** Line-only motorcycle used as showroom display. */
export function motorbike() {
  const s = new Sketch();
  const wheel = (z: number) => {
    const pts: V3[] = [];
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      pts.push([0, 0.36 + Math.sin(a) * 0.36, z + Math.cos(a) * 0.36]);
    }
    s.poly(pts);
  };
  wheel(-0.7); wheel(0.72);
  s.poly([[0, 0.36, -0.7], [0, 0.85, -0.25], [0, 0.95, 0.35], [0, 0.36, 0.72]]);
  s.poly([[0, 0.85, -0.25], [0, 0.55, 0.1], [0, 0.95, 0.35]]);
  s.box(0.3, 0.25, 0.55, 0, 0.88, 0.1);
  s.seg([0, 0.95, 0.35], [0, 1.25, 0.55]).seg([-0.35, 1.25, 0.55], [0.35, 1.25, 0.55]);
  s.box(0.26, 0.08, 0.6, 0, 0.98, -0.45);
  return s;
}

export function vehicleFor(cat: Category) {
  switch (cat) {
    case "heritage": return handcart();
    case "appliances": return van();
    case "two-wheelers": return scooter();
    case "cars": return car();
    case "commercial": return truck();
  }
}

// ---------------------------------------------------------------- buildings (front faces +z)

export function building(cat: Category) {
  const s = new Sketch();
  let sign: V3 = [0, 5, 0];
  let size = { w: 8, d: 8 };

  switch (cat) {
    case "heritage": {
      // Two-storey trading house: tiled roof, shutters, awning, cloth bales
      const W = 7, D = 6, H = 6;
      s.box(W, H, D);
      s.profileX([[-D / 2 - 0.4, H], [0, H + 2], [D / 2 + 0.4, H]], W + 0.6);
      s.box(W + 0.3, 0.2, D + 0.3, 0, 3.1, 0); // floor band
      const f = D / 2 + 0.01;
      s.poly([[-3.0, 0, f], [-3.0, 2.6, f], [0.4, 2.6, f], [0.4, 0, f]]); // shutter opening
      s.slats(-3.0, 0.4, 1.0, 2.6, f, 0.16);
      s.windows(1.1, 2.9, 0.8, 2.5, f, 2, 2);
      // awning on posts
      s.poly([[-3.5, 2.95, f], [-3.5, 2.55, f + 1.7], [3.5, 2.55, f + 1.7], [3.5, 2.95, f]]);
      for (let x = -3.5; x <= 3.5; x += 0.5) s.seg([x, 2.95, f], [x, 2.55, f + 1.7], s.hatch);
      s.seg([-3.3, 0, f + 1.6], [-3.3, 2.58, f + 1.6]).seg([3.3, 0, f + 1.6], [3.3, 2.58, f + 1.6]);
      // upper storey
      for (const x of [-2.4, 0, 2.4]) s.windows(x - 0.6, x + 0.6, 4.4, 5.6, f, 2, 1, 0.08);
      // roof tiles
      for (let k = 1; k < 6; k++) {
        const t = k / 6;
        s.seg([-W / 2 - 0.3, H + 2 * (1 - t), (D / 2 + 0.4) * t], [W / 2 + 0.3, H + 2 * (1 - t), (D / 2 + 0.4) * t], s.hatch);
      }
      // bales of cloth
      for (const [y, z] of [[0.45, 3.9], [0.45, 4.85], [1.3, 4.38]]) s.cyl(0.45, 1.3, [-4.5, y, z], "x", 10);
      s.accent.push(...signBoard(-1.9, 1.9, 3.35, 4.1, f + 0.02));
      sign = [0, 4.15, f];
      s.shade(W, H, D);
      size = { w: W, d: D };
      break;
    }
    case "appliances": {
      // Modern retail block: glazed shopfront, louvred upper floor, fascia sign
      const W = 10, D = 7, H = 7;
      const f = D / 2 + 0.01;
      s.box(W, H, D);
      s.box(W + 0.3, 0.5, D + 0.3, 0, H, 0);
      s.windows(-4.6, 4.6, 0.25, 3.1, f, 6, 1);
      s.poly([[-0.75, 0.25, f + 0.01], [-0.75, 2.6, f + 0.01], [0.75, 2.6, f + 0.01], [0.75, 0.25, f + 0.01]], true);
      s.seg([0, 0.25, f + 0.01], [0, 2.6, f + 0.01]);
      s.box(3.2, 0.15, 1.6, 0, 3.3, f + 0.8);
      s.windows(-4.6, 4.6, 4.6, 6.6, f, 4, 1, 0.08);
      for (let y = 4.75; y < 6.5; y += 0.22) s.seg([-4.5, y, f + 0.25], [4.5, y, f + 0.25], s.hatch);
      s.box(0.9, 0.6, 0.5, W / 2 + 0.3, 2.2, 1).box(0.9, 0.6, 0.5, W / 2 + 0.3, 4.8, -1.2);
      s.accent.push(...signBoard(-4.4, 4.4, 3.55, 4.35, f + 0.02));
      sign = [0, 4.4, f];
      s.shade(W, H, D);
      size = { w: W, d: D };
      break;
    }
    case "two-wheelers": {
      // Glass pavilion with cantilevered roof and bikes on display
      const W = 12, D = 8, H = 5;
      const f = D / 2 + 0.01;
      s.box(W, H, D);
      s.box(W + 1.2, 0.35, D + 2.2, 0, H, 1.1);
      s.windows(-5.6, 5.6, 0, 4.4, f, 8, 2, 0.08);
      for (const x of [-6.2, 6.2]) s.box(0.22, H, 0.22, x, 0, f + 1.8);
      for (let i = 0; i < 4; i++) s.merge(motorbike(), place(-4.2 + i * 2.6, f + 3.4, 0.5), false);
      s.accent.push(...signBoard(-3.5, 3.5, 5.0, 5.35, f + 2.22));
      sign = [0, 5.45, f + 2.2];
      s.shade(W, H, D);
      size = { w: W, d: D };
      break;
    }
    case "cars": {
      // Double-height dealership, portal entrance, brand pylon, cars outside
      const W = 16, D = 11, H = 7.5;
      const f = D / 2 + 0.01;
      s.box(W, H, D);
      s.windows(-7.6, 7.6, 0, 6.6, f, 10, 2, 0.08);
      s.box(4.2, H + 0.6, 1.3, -3.8, 0, f + 0.6);
      s.box(W + 0.4, 0.6, D + 0.4, 0, H, 0);
      s.box(1.6, 10.5, 0.9, W / 2 + 2.6, 0, f + 1.5);
      s.accent.push(...signBoard(W / 2 + 1.95, W / 2 + 3.25, 8.4, 10.1, f + 1.97));
      for (let i = 0; i < 3; i++) s.merge(car(), place(-5 + i * 5, f + 4.8, 0.25), true);
      for (const x of [-7.5, -6.2, -4.9]) {
        s.seg([x, 0, f + 8.5], [x, 6, f + 8.5]);
        s.poly([[x, 6, f + 8.5], [x + 1, 5.6, f + 8.5], [x, 5.2, f + 8.5]], false, s.accent);
      }
      s.accent.push(...signBoard(-1.4, 7.4, 6.75, 7.4, f + 0.02));
      sign = [3, 7.45, f];
      s.shade(W, H, D);
      size = { w: W + 6, d: D };
      break;
    }
    case "commercial": {
      // Industrial depot: gable front, roller shutters, office annex, truck
      const W = 18, D = 12, H = 6.5;
      const f = D / 2 + 0.01;
      s.box(W, H, D);
      s.profileZ([[-W / 2 - 0.3, H], [0, H + 2.4], [W / 2 + 0.3, H]], D + 0.6);
      for (const x0 of [-7.5, 1.5]) {
        s.poly([[x0, 0, f], [x0, 4.8, f], [x0 + 6, 4.8, f], [x0 + 6, 0, f]]);
        s.slats(x0, x0 + 6, 0, 4.8, f, 0.24);
      }
      for (let x = -W / 2 + 0.5; x < W / 2; x += 0.6) s.seg([x, 5.0, f], [x, H, f], s.hatch);
      s.box(4.5, 3.6, 4.5, -W / 2 - 2.6, 0, 2.5);
      s.windows(-W / 2 - 4.4, -W / 2 - 0.8, 1.2, 2.8, 2.5 + 2.26, 3, 1, 0.08);
      s.merge(truck(), place(W / 2 + 3, f + 3, -0.4), true);
      s.accent.push(...signBoard(-3.2, 3.2, 5.3, 6.2, f + 0.02));
      sign = [0, 6.3, f];
      s.shade(W, H, D);
      size = { w: W + 8, d: D };
      break;
    }
  }
  return { sketch: s, sign, size };
}

/** Rectangular sign panel with an inner border, as line segments. */
function signBoard(x0: number, x1: number, y0: number, y1: number, z: number) {
  const out: number[] = [];
  const r = (a: number, b: number, c: number, d: number) => {
    const p: V3[] = [[a, c, z], [b, c, z], [b, d, z], [a, d, z]];
    for (let i = 0; i < 4; i++) out.push(...p[i], ...p[(i + 1) % 4]);
  };
  r(x0, x1, y0, y1);
  r(x0 + 0.12, x1 - 0.12, y0 + 0.12, y1 - 0.12);
  return out;
}

export function tree(s: Sketch, x: number, z: number, h: number, rnd: () => number) {
  s.seg([x - 0.12, 0, z], [x - 0.08, h * 0.45, z], s.hatch).seg([x + 0.12, 0, z], [x + 0.08, h * 0.45, z], s.hatch);
  const m = new THREE.Matrix4().makeRotationY(rnd() * Math.PI).setPosition(x, h * 0.62, z);
  m.scale(new THREE.Vector3(1, 1.15, 1));
  s.shape(new THREE.IcosahedronGeometry(h * 0.32, 0), m);
  if (rnd() > 0.5) s.shape(new THREE.IcosahedronGeometry(h * 0.22, 0), new THREE.Matrix4().setPosition(x + h * 0.22, h * 0.5, z + 0.3));
}

/** Double-stroke each segment with slight jitter and overshoot, preserving draw order. */
export function sketchify(pts: number[], rand: () => number, passes = 2, jitter = 0.025, overshoot = 0.22) {
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 6) {
    const ax = pts[i], ay = pts[i + 1], az = pts[i + 2];
    const bx = pts[i + 3], by = pts[i + 4], bz = pts[i + 5];
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const len = Math.hypot(dx, dy, dz) || 1;
    for (let p = 0; p < passes; p++) {
      const o1 = (Math.min(overshoot, len * 0.12) * rand()) / len;
      const o2 = (Math.min(overshoot, len * 0.12) * rand()) / len;
      const j = () => (rand() - 0.5) * 2 * jitter * (p === 0 ? 0.3 : 1);
      out.push(ax - dx * o1 + j(), ay - dy * o1 + j(), az - dz * o1 + j());
      out.push(bx + dx * o2 + j(), by + dy * o2 + j(), bz + dz * o2 + j());
    }
  }
  return out;
}

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
