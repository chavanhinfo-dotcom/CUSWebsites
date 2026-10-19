// Stylised 3D models of the real vehicles and appliances the group sells.
// Built in code (no third-party model files) so they stay light; each is shaped after the real
// model's recognisable silhouette and colours. All models face +z, x is width, units are metres.
import * as THREE from "three";
import { Kit, type Materials } from "@/components/diorama/kit";

type P = [number, number];
type V3 = [number, number, number];
type Wheel = { obj: THREE.Object3D; r: number };

// ---------------------------------------------------------------- helpers

/** Side profile in (z, y) extruded across x, centred, with softly rounded edges. */
function side(pts: P[], width: number, bevel = 0.05) {
  const shape = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const depth = Math.max(0.01, width - bevel * 2);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.6, bevelSegments: 3, curveSegments: 14 });
  // shape x → world z, shape y → world y, extrusion → world −x (a proper rotation, so faces stay outward)
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0));
  m.setPosition(depth / 2, 0, 0);
  g.applyMatrix4(m);
  return g;
}

/** Profile bottom edge with semicircular wheel arches cut in. */
function withArches(top: P[], frontZ: number, rearZ: number, baseY: number, arches: { z: number; r: number }[]) {
  const pts: P[] = [...top, [frontZ, baseY]];
  [...arches].sort((a, b) => b.z - a.z).forEach(({ z, r }) => {
    pts.push([z + r, baseY]);
    for (let k = 1; k < 12; k++) {
      const a = (k / 12) * Math.PI;
      pts.push([z + Math.cos(a) * r, baseY + Math.sin(a) * r]);
    }
    pts.push([z - r, baseY]);
  });
  pts.push([rearZ, baseY]);
  return pts;
}

function tube(k: Kit, a: V3, b: V3, r: number, mat: THREE.Material, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  k.add(g, mat, new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
}

function arc(k: Kit, z: number, y: number, r: number, from: number, to: number, w: number, t: number, mat: THREE.Material, x = 0) {
  const g = new THREE.TorusGeometry(r, t, 6, 24, to - from);
  const m = new THREE.Matrix4().makeRotationY(Math.PI / 2).multiply(new THREE.Matrix4().makeRotationZ(from));
  m.setPosition(x, y, z);
  // a flattened torus reads as a mudguard band of width w
  m.multiply(new THREE.Matrix4().makeScale(1, 1, w / (t * 2)));
  k.add(g, mat, m);
}

function solid(g: THREE.Group, k: Kit) {
  const b = k.build();
  b.children.forEach((c) => {
    c.castShadow = true;
    c.receiveShadow = true;
  });
  g.add(b);
}

function wheels(g: THREE.Group): Wheel[] {
  return (g.userData.wheels ??= []);
}

/** Car / truck wheel: tyre, alloy face with spokes, hub. */
function carWheel(g: THREE.Group, M: Materials, x: number, z: number, r: number, w: number, rim: THREE.Material = M.rim, spokes = 5) {
  const wg = new THREE.Group();
  wg.position.set(x, r, z);
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 30), M.tire);
  tyre.rotation.z = Math.PI / 2;
  wg.add(tyre);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.66, r * 0.66, w + 0.012, 24), M.trim);
  face.rotation.z = Math.PI / 2;
  wg.add(face);
  for (const s of [-1, 1]) {
    for (let i = 0; i < spokes; i++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.02, r * 1.18, r * 0.16), rim);
      sp.position.x = s * (w / 2 + 0.008);
      sp.rotation.x = (i / spokes) * Math.PI * 2;
      sp.position.y = 0;
      sp.geometry.translate(0, r * 0.3, 0);
      wg.add(sp);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, 0.02, 16), rim);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = s * (w / 2 + 0.012);
    wg.add(hub);
  }
  wg.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  g.add(wg);
  wheels(g).push({ obj: wg, r });
}

/** Two-wheeler wheel: tyre torus, rim, and wire spokes or alloy spokes. */
function bikeWheel(g: THREE.Group, M: Materials, z: number, r: number, tyre: number, style: "wire" | "alloy", rim: THREE.Material = M.rim) {
  const wg = new THREE.Group();
  wg.position.set(0, r, z);
  const ring = (rad: number, t: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(rad, t, 10, 40), mat);
    m.rotation.y = Math.PI / 2;
    wg.add(m);
  };
  ring(r - tyre, tyre, M.tire);
  ring(r - tyre * 2.1, 0.012, rim);
  if (style === "wire") {
    for (let i = 0; i < 18; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, (r - tyre * 2) * 2, 4), rim);
      s.rotation.x = (i / 18) * Math.PI;
      s.position.x = (i % 2 ? 1 : -1) * 0.02;
      wg.add(s);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, (r - tyre * 2) * 0.95, 0.035), rim);
      s.geometry.translate(0, (r - tyre * 2) * 0.48, 0);
      s.rotation.x = (i / 5) * Math.PI * 2;
      wg.add(s);
    }
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16), M.rim);
  hub.rotation.z = Math.PI / 2;
  wg.add(hub);
  wg.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  g.add(wg);
  wheels(g).push({ obj: wg, r });
}

const BLACK = 0x111114;

// ---------------------------------------------------------------- passenger cars

/** Maruti Suzuki Swift (Arena): compact hatch, floating black roof, wraparound glass. */
export function swift(M: Materials, color = 0xb3121c) {
  const g = new THREE.Group();
  const k = new Kit();
  const paint = M.paintOf(color, 0.55);
  const gloss = M.paintOf(BLACK, 0.6);
  k.add(side(withArches([[-1.93, 0.62], [-1.95, 0.95], [-1.78, 1.03], [1.0, 1.02], [1.72, 0.9], [1.93, 0.74], [1.95, 0.45]], 1.88, -1.9, 0.28, [{ z: 1.2, r: 0.37 }, { z: -1.22, r: 0.37 }]), 1.72), paint);
  k.add(side([[-1.74, 1.0], [-1.47, 1.43], [0.22, 1.47], [1.0, 1.0]], 1.56, 0.04), M.glass);
  k.add(side([[-1.46, 1.42], [-1.42, 1.52], [0.2, 1.55], [0.27, 1.45]], 1.5, 0.03), gloss);
  for (const s of [-1, 1]) {
    k.box(0.04, 0.08, 0.14, [s * 0.87, 0.9, 0.05], M.rim); // door handles
    k.box(0.04, 0.08, 0.14, [s * 0.87, 0.9, -0.8], M.rim);
    k.box(0.16, 0.1, 0.12, [s * 0.86, 1.02, 0.86], gloss); // mirrors
    k.box(0.4, 0.11, 0.2, [s * 0.52, 0.78, 1.84], M.headlight, 0, -0.3);
    k.box(0.1, 0.3, 0.16, [s * 0.72, 0.72, -1.9], M.taillight);
  }
  k.rbox(0.82, 0.22, 0.08, 0.04, [0, 0.45, 1.93], M.trim); // honeycomb grille
  k.box(1.6, 0.12, 0.1, [0, 0.28, 1.86], M.trim);
  solid(g, k);
  for (const x of [-0.75, 0.75]) for (const z of [-1.22, 1.2]) carWheel(g, M, x, z, 0.3, 0.2, M.rim);
  return g;
}

/** Grand Vitara (Nexa): mid-size SUV, black cladding, roof rails, three-point LED lamps. */
export function grandVitara(M: Materials, color = 0x24426e) {
  const g = new THREE.Group();
  const k = new Kit();
  const paint = M.paintOf(color, 0.6);
  k.add(side(withArches([[-2.15, 0.7], [-2.18, 1.12], [-2.02, 1.16], [1.25, 1.14], [2.02, 1.03], [2.18, 0.86], [2.18, 0.5]], 2.08, -2.13, 0.36, [{ z: 1.32, r: 0.43 }, { z: -1.3, r: 0.43 }]), 1.8), paint);
  k.add(side([[-2.02, 1.12], [-1.86, 1.55], [0.55, 1.6], [1.25, 1.12]], 1.62, 0.04), M.glass);
  k.add(side([[-1.88, 1.53], [-1.84, 1.66], [0.5, 1.69], [0.6, 1.56]], 1.58, 0.03), paint);
  for (const x of [-0.66, 0.66]) k.box(0.05, 0.06, 2.3, [x, 1.69, -0.65], M.rim); // roof rails
  for (const s of [-1, 1]) {
    for (const z of [1.32, -1.3]) arc(k, z, 0.36, 0.46, 0, Math.PI, 0.1, 0.03, M.trim, s * 0.91); // arch cladding
    k.box(0.05, 0.14, 2.0, [s * 0.91, 0.36, 0.0], M.trim); // sill cladding
    k.box(0.04, 0.08, 0.16, [s * 0.91, 1.02, 0.2], M.rim);
    k.box(0.04, 0.08, 0.16, [s * 0.91, 1.02, -0.85], M.rim);
    k.box(0.18, 0.12, 0.14, [s * 0.92, 1.16, 1.18], M.trim);
    for (let d = 0; d < 3; d++) k.box(0.08, 0.05, 0.05, [s * (0.58 + d * 0.1), 0.98 - d * 0.03, 2.17], M.headlight); // three-point DRL
    k.box(0.32, 0.1, 0.1, [s * 0.66, 0.74, 2.15], M.headlight);
  }
  k.box(1.7, 0.05, 0.06, [0, 1.0, -2.17], M.taillight); // full-width tail bar
  k.rbox(1.1, 0.3, 0.08, 0.04, [0, 0.62, 2.17], M.trim);
  k.box(1.1, 0.04, 0.09, [0, 0.95, 2.17], M.rim); // chrome grille bar
  k.box(1.7, 0.18, 0.1, [0, 0.36, 2.1], M.trim);
  solid(g, k);
  for (const x of [-0.78, 0.78]) for (const z of [-1.3, 1.32]) carWheel(g, M, x, z, 0.35, 0.24, M.rim, 6);
  return g;
}

// ---------------------------------------------------------------- two-wheelers

/** Hero Splendor+: India's best-known commuter motorcycle; black with red graphics. */
export function splendor(M: Materials) {
  const g = new THREE.Group();
  const k = new Kit();
  const black = M.paintOf(BLACK, 0.5), red = M.paintOf(0xc4161c, 0.4), matte = M.trim, chrome = M.rim;
  tube(k, [0, 0.98, 0.5], [0, 0.48, -0.15], 0.03, matte);
  tube(k, [0, 0.98, 0.5], [0, 0.42, 0.18], 0.028, matte);
  k.rbox(0.26, 0.26, 0.36, 0.06, [0, 0.2, 0.05], M.metalWall); // engine
  for (let i = 0; i < 4; i++) k.box(0.24, 0.015, 0.16, [0, 0.5 + i * 0.03, 0.2], M.metalWall);
  k.rbox(0.32, 0.22, 0.46, 0.09, [0, 0.72, 0.2], black); // tank
  for (const s of [-1, 1]) {
    k.box(0.01, 0.04, 0.38, [s * 0.165, 0.86, 0.18], red, 0, -0.1);
    k.box(0.02, 0.16, 0.24, [s * 0.13, 0.56, -0.26], black); // side panel
    k.box(0.01, 0.03, 0.18, [s * 0.14, 0.66, -0.26], red);
    tube(k, [s * 0.1, 0.38, -0.62], [s * 0.1, 0.8, -0.34], 0.018, chrome); // rear shocks
    tube(k, [s * 0.08, 0.34, 0.66], [s * 0.08, 1.02, 0.5], 0.022, chrome); // fork
  }
  k.rbox(0.28, 0.09, 0.72, 0.04, [0, 0.82, -0.28], M.tire); // long flat seat
  tube(k, [0, 0.92, -0.5], [0, 0.92, -0.72], 0.015, chrome);
  arc(k, 0.66, 0.34, 0.39, Math.PI * 0.15, Math.PI * 0.85, 0.09, 0.02, black);
  arc(k, -0.62, 0.34, 0.39, Math.PI * 0.35, Math.PI * 1.05, 0.1, 0.02, black);
  k.cyl(0.085, 0.12, [0, 1.0, 0.64], black, "z", 20);
  k.cyl(0.07, 0.02, [0, 1.0, 0.71], M.headlight, "z", 20);
  tube(k, [-0.34, 1.12, 0.48], [0.34, 1.12, 0.48], 0.014, matte);
  k.cyl(0.04, 0.6, [0.16, 0.32, -0.32], chrome, "z", 12, 0.05); // silencer
  k.box(0.07, 0.06, 0.08, [0, 0.82, -0.66], M.taillight);
  solid(g, k);
  bikeWheel(g, M, 0.64, 0.33, 0.04, "alloy", M.trim);
  bikeWheel(g, M, -0.62, 0.33, 0.045, "alloy", M.trim);
  return g;
}

/** Royal Enfield Classic 350: teardrop tank, round headlamp with tiger-eye pilots, split seats, wire wheels. */
export function classic350(M: Materials, color = 0x6b1d1d) {
  const g = new THREE.Group();
  const k = new Kit();
  const paint = M.paintOf(color, 0.6), chrome = M.rim, black = M.paintOf(BLACK, 0.5);
  tube(k, [0, 1.0, 0.52], [0, 0.5, -0.2], 0.034, black);
  tube(k, [0, 1.0, 0.52], [0, 0.42, 0.2], 0.03, black);
  k.rbox(0.28, 0.3, 0.34, 0.05, [0, 0.22, 0.04], M.metalWall); // engine
  for (let i = 0; i < 6; i++) k.cyl(0.11 - i * 0.004, 0.02, [0, 0.55 + i * 0.035, 0.16], M.metalWall, "y", 16); // cylinder fins
  const tank = new THREE.SphereGeometry(1, 24, 16);
  k.add(tank, paint, new THREE.Matrix4().makeScale(0.17, 0.14, 0.32).setPosition(0, 0.9, 0.18)); // teardrop tank
  k.add(new THREE.SphereGeometry(1, 16, 10), chrome, new THREE.Matrix4().makeScale(0.172, 0.05, 0.1).setPosition(0, 0.92, 0.24));
  k.rbox(0.24, 0.07, 0.28, 0.04, [0, 0.88, -0.14], M.tire); // sprung rider saddle
  k.rbox(0.22, 0.07, 0.26, 0.04, [0, 0.83, -0.46], M.tire); // pillion seat
  for (const s of [-1, 1]) {
    tube(k, [s * 0.09, 0.36, 0.7], [s * 0.09, 1.04, 0.54], 0.024, chrome);
    tube(k, [s * 0.11, 0.4, -0.62], [s * 0.11, 0.84, -0.32], 0.02, chrome);
    k.box(0.02, 0.18, 0.2, [s * 0.13, 0.52, -0.22], paint); // side boxes
  }
  arc(k, 0.7, 0.37, 0.43, Math.PI * 0.05, Math.PI * 0.95, 0.12, 0.025, paint); // deep fenders
  arc(k, -0.66, 0.37, 0.43, Math.PI * 0.3, Math.PI * 1.1, 0.13, 0.025, paint);
  k.cyl(0.11, 0.14, [0, 1.02, 0.68], black, "z", 24); // nacelle + round headlamp
  k.cyl(0.095, 0.02, [0, 1.02, 0.76], M.headlight, "z", 24);
  for (const s of [-1, 1]) k.add(new THREE.SphereGeometry(0.03, 10, 8), M.headlight, new THREE.Matrix4().setPosition(s * 0.14, 1.0, 0.7)); // tiger-eye pilots
  tube(k, [-0.38, 1.16, 0.46], [0.38, 1.16, 0.46], 0.015, chrome);
  k.cyl(0.042, 0.78, [0.17, 0.36, -0.42], chrome, "z", 12, 0.05); // peashooter exhaust
  k.box(0.08, 0.06, 0.06, [0, 0.72, -0.86], M.taillight);
  solid(g, k);
  bikeWheel(g, M, 0.7, 0.37, 0.055, "wire");
  bikeWheel(g, M, -0.66, 0.37, 0.06, "wire");
  return g;
}

/** Ather Rizta: family electric scooter with a long flat seat and LED apron lamp. */
export function rizta(M: Materials, color = 0xf2f2ee) {
  const g = new THREE.Group();
  const k = new Kit();
  const body = M.paintOf(color, 0.35), accent = M.paintOf(0x2c3e5a, 0.5);
  k.add(side([[-0.92, 0.36], [-0.98, 0.56], [-0.88, 0.8], [-0.25, 0.83], [0.08, 0.76], [0.1, 0.42], [-0.3, 0.32]], 0.5, 0.08), body); // rear body
  k.add(side([[0.1, 0.3], [0.1, 0.4], [0.38, 0.42], [0.38, 0.3]], 0.42, 0.03), M.trim); // floorboard
  k.add(side([[0.36, 0.32], [0.62, 0.42], [0.74, 0.92], [0.64, 1.08], [0.48, 1.0], [0.4, 0.46]], 0.5, 0.06), body); // front apron
  k.box(0.32, 0.05, 0.12, [0, 0.8, 0.74], M.headlight, 0, 0.3); // LED apron lamp
  k.rbox(0.36, 0.1, 0.78, 0.05, [0, 0.82, -0.44], accent); // long flat seat
  k.rbox(0.5, 0.1, 0.16, 0.04, [0, 1.06, 0.56], body);
  k.box(0.14, 0.09, 0.02, [0, 1.12, 0.5], M.glass, 0, -0.5); // TFT dash
  tube(k, [-0.34, 1.1, 0.56], [0.34, 1.1, 0.56], 0.016, M.trim);
  tube(k, [0, 0.3, 0.7], [0, 1.02, 0.6], 0.028, M.trim);
  k.box(0.2, 0.05, 0.05, [0, 0.66, -1.0], M.taillight);
  solid(g, k);
  bikeWheel(g, M, 0.68, 0.25, 0.05, "alloy", M.trim);
  bikeWheel(g, M, -0.7, 0.25, 0.05, "alloy", M.trim);
  return g;
}

// ---------------------------------------------------------------- commercial

/** Tata Ace: the small cab-over mini truck with a drop-side load deck. */
export function tataAce(M: Materials, color = 0xf3f3ef) {
  const g = new THREE.Group();
  const k = new Kit();
  const cab = M.paintOf(color, 0.35), deck = M.paintOf(0xb9c0c7, 0.5);
  k.add(side([[0.78, 0.5], [0.78, 1.16], [1.88, 1.16], [1.95, 0.95], [1.95, 0.5]], 1.46), cab);
  k.add(side([[0.8, 1.14], [0.8, 1.78], [1.42, 1.8], [1.86, 1.16]], 1.38, 0.03), M.glass);
  k.box(1.42, 0.07, 0.66, [0, 1.78, 1.1], cab);
  k.box(1.42, 0.64, 0.06, [0, 1.14, 0.8], cab);
  for (const s of [-1, 1]) {
    k.box(0.06, 0.62, 0.05, [s * 0.69, 1.15, 1.4], cab);
    k.box(0.34, 0.12, 0.05, [s * 0.5, 0.86, 1.96], M.headlight);
    k.box(0.08, 0.12, 0.1, [s * 0.72, 1.24, 1.94], M.trim);
  }
  k.box(0.5, 0.12, 0.04, [0, 0.72, 1.97], M.trim);
  k.cyl(0.06, 0.02, [0, 0.92, 1.97], M.rim, "z", 16);
  k.box(1.3, 0.12, 3.6, [0, 0.4, -0.05], M.trim); // chassis
  k.box(1.5, 0.06, 2.55, [0, 0.62, -0.62], deck);
  for (const s of [-1, 1]) k.box(0.04, 0.34, 2.55, [s * 0.74, 0.68, -0.62], deck);
  k.box(1.5, 0.34, 0.04, [0, 0.68, -1.88], deck);
  k.box(1.5, 0.34, 0.04, [0, 0.68, 0.64], deck);
  for (const s of [-1, 1]) k.box(0.08, 0.14, 0.06, [s * 0.6, 0.58, -1.92], M.taillight);
  solid(g, k);
  for (const x of [-0.66, 0.66]) {
    carWheel(g, M, x, 1.35, 0.27, 0.17, M.rim, 4);
    carWheel(g, M, x, -1.15, 0.27, 0.17, M.rim, 4);
  }
  return g;
}

/** Maruti Suzuki Super Carry: semi-bonneted pickup. */
export function superCarry(M: Materials, color = 0xc7ccd1) {
  const g = new THREE.Group();
  const k = new Kit();
  const paint = M.paintOf(color, 0.6), deck = M.paintOf(0x8d949b, 0.5);
  k.add(side([[0.5, 0.5], [0.5, 1.14], [1.62, 1.12], [1.94, 0.94], [1.97, 0.5]], 1.56), paint);
  k.add(side([[0.52, 1.12], [0.52, 1.8], [1.18, 1.82], [1.62, 1.12]], 1.48, 0.03), M.glass);
  k.box(1.5, 0.07, 0.66, [0, 1.8, 0.85], paint);
  k.box(1.52, 0.66, 0.06, [0, 1.12, 0.52], paint);
  for (const s of [-1, 1]) {
    k.box(0.34, 0.12, 0.06, [s * 0.52, 0.88, 1.95], M.headlight);
    k.box(0.06, 0.6, 0.06, [s * 0.74, 1.14, 1.2], paint);
  }
  k.box(0.6, 0.14, 0.04, [0, 0.78, 1.97], M.trim);
  k.box(1.36, 0.12, 3.7, [0, 0.4, -0.06], M.trim);
  k.box(1.6, 0.06, 2.3, [0, 0.62, -0.72], deck);
  for (const s of [-1, 1]) k.box(0.04, 0.4, 2.3, [s * 0.79, 0.68, -0.72], deck);
  k.box(1.6, 0.4, 0.04, [0, 0.68, -1.86], deck);
  solid(g, k);
  for (const x of [-0.7, 0.7]) {
    carWheel(g, M, x, 1.32, 0.29, 0.18, M.rim, 5);
    carWheel(g, M, x, -1.2, 0.29, 0.18, M.rim, 5);
  }
  return g;
}

/** Tata Signa: heavy cab-over truck with roof deflector, pulling a container. */
export function tataSigna(M: Materials, container = 0xeceae4, withContainer = true) {
  const g = new THREE.Group();
  const k = new Kit();
  const cab = M.paintOf(0xf4f4f1, 0.4), box = M.paintOf(container, 0.25), black = M.paintOf(BLACK, 0.4);
  k.rbox(2.4, 2.2, 1.7, 0.16, [0, 0.72, 2.75], cab);
  k.add(side([[1.92, 2.9], [1.92, 3.5], [3.0, 3.05], [3.0, 2.9]], 2.3, 0.04), cab); // roof air deflector
  k.box(2.1, 0.78, 0.06, [0, 1.94, 3.6], M.glass, 0, -0.08); // windscreen
  k.box(2.16, 0.42, 0.06, [0, 1.28, 3.61], black); // signature black grille band
  for (let i = 0; i < 4; i++) k.box(1.9, 0.025, 0.07, [0, 1.34 + i * 0.09, 3.63], M.rim);
  k.cyl(0.11, 0.03, [0, 1.48, 3.66], M.rim, "z", 20);
  for (const s of [-1, 1]) {
    k.box(0.42, 0.18, 0.06, [s * 0.86, 0.88, 3.62], M.headlight);
    k.box(0.04, 0.62, 0.8, [s * 1.2, 1.8, 2.8], M.glass); // door windows
    k.box(0.06, 0.5, 0.06, [s * 1.36, 2.1, 3.3], black); // mirror arms
    k.box(0.1, 0.36, 0.16, [s * 1.4, 2.0, 3.34], black);
    k.box(0.3, 0.06, 0.4, [s * 1.08, 0.5, 2.95], M.trim); // steps
  }
  k.box(2.46, 0.24, 0.3, [0, 0.62, 3.55], M.trim); // bumper
  k.box(1.1, 0.26, 7.8, [0, 0.68, -0.35], M.trim); // chassis
  if (withContainer) {
    k.box(2.5, 2.7, 5.6, [0, 0.98, -1.15], box);
    for (const s of [-1, 1]) for (let z = -3.8; z <= 1.5; z += 0.32) k.box(0.03, 2.6, 0.06, [s * 1.255, 1.03, z], M.metalWall);
    k.box(2.52, 0.08, 5.62, [0, 3.66, -1.15], M.metalWall);
    for (const s of [-1, 1]) k.box(0.2, 0.18, 0.06, [s * 1.0, 1.2, -3.98], M.taillight);
  }
  solid(g, k);
  for (const x of [-1.04, 1.04]) {
    carWheel(g, M, x, 2.85, 0.5, 0.34, M.rim, 8);
    carWheel(g, M, x, -1.75, 0.5, 0.34, M.rim, 8);
    carWheel(g, M, x, -2.85, 0.5, 0.34, M.rim, 8);
  }
  return g;
}

// ---------------------------------------------------------------- Samsung appliances

function screenTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 288;
  const ctx = c.getContext("2d")!;
  const gr = ctx.createLinearGradient(0, 0, 512, 288);
  gr.addColorStop(0, "#0b1a4a");
  gr.addColorStop(0.45, "#3a2a8a");
  gr.addColorStop(0.75, "#c2477f");
  gr.addColorStop(1, "#f2a24a");
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 512, 288);
  const rg = ctx.createRadialGradient(330, 120, 10, 330, 120, 220);
  rg.addColorStop(0, "rgba(255,255,255,0.45)");
  rg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, 512, 288);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Samsung lineup on a showroom dolly: Bespoke 4-door refrigerator, front-load washing machine and a
 * Neo QLED TV. Fronts face −x so they face the camera once the group is turned to drive along +x.
 */
export function samsungLineup(M: Materials) {
  const g = new THREE.Group();
  const k = new Kit();
  const beige = M.paintOf(0xd8ccb6, 0.2), navy = M.paintOf(0x2c3a52, 0.3), white = M.paintOf(0xf5f5f2, 0.2), steel = M.rim;
  k.box(1.25, 0.14, 4.1, [0, 0.18, 0], M.trim); // dolly deck
  // Bespoke refrigerator
  k.box(0.78, 1.85, 0.92, [0, 0.32, 1.3], white);
  k.box(0.02, 0.98, 0.44, [-0.4, 1.18, 1.53], beige);
  k.box(0.02, 0.98, 0.44, [-0.4, 1.18, 1.07], beige);
  k.box(0.02, 0.8, 0.44, [-0.4, 0.35, 1.53], navy);
  k.box(0.02, 0.8, 0.44, [-0.4, 0.35, 1.07], navy);
  for (const z of [1.31, 1.29]) k.box(0.04, 0.6, 0.02, [-0.42, 1.36, z], steel);
  // front-load washer
  k.box(0.66, 0.86, 0.62, [0, 0.32, 0.15], white);
  k.box(0.02, 0.12, 0.6, [-0.34, 1.02, 0.15], navy);
  k.add(new THREE.TorusGeometry(0.2, 0.035, 10, 32), steel, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(-0.35, 0.68, 0.15));
  k.add(new THREE.CircleGeometry(0.19, 32), M.glass, new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(-0.345, 0.68, 0.15));
  // Neo QLED TV
  k.box(0.32, 0.04, 0.5, [0.05, 0.32, -1.2], M.trim);
  k.box(0.05, 0.1, 0.06, [0.05, 0.36, -1.2], M.trim);
  k.box(0.04, 0.84, 1.46, [0.05, 0.46, -1.2], M.paintOf(0x16171b, 0.5));
  solid(g, k);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.78), new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false }));
  screen.position.set(0.025, 0.88, -1.2);
  screen.rotation.y = -Math.PI / 2;
  g.add(screen);
  for (const z of [-1.8, 1.8]) for (const x of [-0.5, 0.5]) carWheel(g, M, x, z, 0.1, 0.06, M.rim, 3);
  return g;
}

// ---------------------------------------------------------------- photographic renders

let shadowTex: THREE.Texture | null = null;
function contactShadow() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(0.55, "rgba(0,0,0,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

export type RenderSpec = {
  url: string;
  height: number;
  aspect: number;
  len: number;
  mirror?: boolean;
  // optional: the picture's own wheels, cut out of it as discs, which turn as it drives. `px` is the picture's
  // size in pixels; each wheel gives its disc image, its centre and disc size in the picture, and the
  // rolling radius in pixels
  px?: number[];
  wheels?: { url: string; cx: number; cy: number; size: number; r: number }[];
  // optional: the same vehicle seen from directly above (spanning the same length as the side picture,
  // `width` metres across), shown instead of the side picture when the camera looks straight down
  top?: { url: string; width: number };
};

// each picture is loaded once and shared by every copy of it (the journey's showrooms show several)
const pictures = new Map<string, THREE.Texture>();
function picture(url: string) {
  let t = pictures.get(url);
  if (!t) {
    t = new THREE.TextureLoader().load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    pictures.set(url, t);
  }
  return t;
}

let streakTex: THREE.Texture | null = null;
function streakTexture() {
  if (streakTex) return streakTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 8;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(17,17,18,0)");
  g.addColorStop(1, "rgba(17,17,18,0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 8);
  streakTex = new THREE.CanvasTexture(c);
  return streakTex;
}

/**
 * An official product render (transparent cut-out in /public/models), shown whole as a billboard sized in
 * metres. The picture is never cut up: movement comes from the vehicle as one piece riding on its
 * suspension (a light road bounce, a slight pitch as it speeds up and brakes), its contact shadow and faint
 * speed lines. The group drives along local +z like the 3D models; the scene calls
 * `userData.move(dx, scale)` every frame with the distance moved.
 */
export function renderSprite(spec: RenderSpec) {
  const { url, height, aspect, mirror = true } = spec;
  const width = height * aspect;
  const g = new THREE.Group();

  // faces the camera (+z world once the parade has turned the group by π/2)
  const rig = new THREE.Group();
  rig.rotation.y = -Math.PI / 2;
  g.add(rig);
  const body = new THREE.Group(); // suspension: pivots on the ground line so it bounces and pitches naturally
  rig.add(body);

  const tex = picture(url);
  const pic = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, toneMapped: false, depthWrite: false }),
  );
  pic.position.y = height / 2;
  if (mirror) pic.scale.x = -1;
  pic.renderOrder = 2;
  body.add(pic);

  // the picture's own wheels: each disc lies exactly over its place in the picture and turns about its axle
  // by the distance travelled, so it rolls rather than slides. The wheels stay planted on the road (they
  // hang off the rig, not the sprung body); the body rides over them on its suspension, its wheel wells
  // painted dark in the picture so no gap ever shows
  const spun = (spec.wheels ?? []).map((w) => {
    const [pw, ph] = spec.px!;
    const m = height / ph; // metres per pixel
    const t = picture(w.url);
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(w.size * m, w.size * m),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.02, toneMapped: false, depthWrite: false }),
    );
    const x = (w.cx / pw - 0.5) * width;
    disc.position.set(mirror ? -x : x, height - w.cy * m, 0.002);
    if (mirror) disc.scale.x = -1;
    disc.renderOrder = 3;
    rig.add(disc);
    return { disc, r: w.r * m };
  });
  // with separate wheels the body's pitch is kept gentle, so its arches never close on the tyres
  const pitch = spun.length ? 0.012 : 0.025;

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.95, Math.max(0.6, width * 0.22)),
    new THREE.MeshBasicMaterial({ map: contactShadow(), transparent: true, depthWrite: false }),
  );
  shadow.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  shadow.position.y = 0.012;
  g.add(shadow);

  // two faint speed lines trailing behind (world −x)
  const streakMat = new THREE.MeshBasicMaterial({ map: streakTexture(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const streaks = [0.3, 0.55].map((f, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.02), streakMat);
    m.position.set(-width / 2 - 0.1, height * f, -0.01);
    m.userData.base = 0.7 + i * 0.3;
    rig.add(m);
    return m;
  });

  // the view from above: a flat picture lying on the road, swapped in for the side picture by `setTopDown`
  // (image right = forward, image top = the vehicle's left, which is screen-up from the overhead camera)
  if (spec.top) {
    const t = picture(spec.top.url);
    const above = new THREE.Mesh(
      new THREE.PlaneGeometry(width, spec.top.width),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.02, toneMapped: false, depthWrite: false }),
    );
    above.rotation.x = -Math.PI / 2;
    above.position.y = 0.05;
    above.renderOrder = 2;
    above.visible = false;
    rig.add(above);
    const sideMats = [pic.material, ...spun.map((w) => w.disc.material)] as THREE.MeshBasicMaterial[];
    const aboveMat = above.material as THREE.MeshBasicMaterial;
    // 0 = the side picture, 1 = the view from above; in between the two cross-fade, as the camera tips over
    g.userData.setView = (t: number) => {
      const side = 1 - t;
      sideMats.forEach((m) => (m.opacity = side));
      aboveMat.opacity = t;
      body.visible = side > 0.002;
      spun.forEach((w) => (w.disc.visible = side > 0.002));
      above.visible = t > 0.002;
      shadow.visible = t < 0.002;
      streaks.forEach((m) => (m.visible = t < 0.002));
    };
    g.userData.setTopDown = (on: boolean) => g.userData.setView(on ? 1 : 0);
  }

  const st = { v: 0, phase: Math.random() * 10, t: 0 };
  g.userData.move = (dx: number, scale: number) => {
    const local = dx / Math.max(1e-4, scale); // metres travelled this frame
    spun.forEach((w) => (w.disc.rotation.z -= local / w.r)); // clockwise while driving to the right
    const prev = st.v;
    st.v += (local - st.v) * 0.2;
    const accel = st.v - prev;
    const speed = Math.min(1, Math.abs(st.v) * 8);
    st.t += 1;
    // suspension: a soft road bounce scaled by speed, plus pitch about the wheel line
    const bounce = Math.sin(st.t * 0.21 + st.phase) * 0.006 + Math.sin(st.t * 0.53 + st.phase * 2) * 0.003;
    body.position.y = bounce * speed;
    body.rotation.z += (THREE.MathUtils.clamp(accel * 4, -pitch, pitch) - body.rotation.z) * 0.1;
    streakMat.opacity = speed * 0.3;
    streaks.forEach((m, i) => {
      const len = (0.2 + speed * 0.7) * m.userData.base;
      m.scale.x = len;
      m.position.x = -width / 2 - 0.2 - len / 2 - i * 0.15;
    });
  };
  g.userData.body = body; // (so a load can ride the same suspension)
  return g;
}

// the Samsung appliances in the lineup picture (public/models/samsung-lineup.webp, 479 × 190 px): each one's
// box [x0, y0, x1, y1] in pixels, inside its white halo, and its real height in metres
const LINEUP_PX = [479, 190];
const APPLIANCES = [
  { box: [248, 2, 342, 187], height: 1.85 }, // Bespoke AI 4-door refrigerator
  { box: [54, 80, 119, 183], height: 0.98 }, // Bespoke AI washer
  { box: [349, 72, 432, 187], height: 0.85 }, // dishwasher
];
/** Ground to the top of the delivery's load (its refrigerator), in metres. */
export const DELIVERY_HEIGHT = 2.4;

/**
 * Home appliances on their way to a customer: a Maruti Super Carry with a Samsung refrigerator, washer and
 * dishwasher in its cargo bed. Each is cut out of the lineup picture, sized to its real dimensions and stood
 * on the load floor, the tallest against the cab; the bed's drop side hides their feet as it would, and each
 * is held down with a ratchet strap. The load rides the truck's suspension, with its body.
 */
export function applianceDelivery() {
  const spec = RENDERS.superCarry;
  const g = renderSprite(spec);
  const body = g.userData.body as THREE.Group;
  const [pw, ph] = spec.px!;
  const m = spec.height / ph; // metres per pixel of the truck's picture
  const width = spec.height * spec.aspect;
  const X = (px: number) => (px / pw - 0.5) * width; // along the truck (forward = +)
  const Y = (py: number) => spec.height - py * m; // above the road
  const floor = Y(203); // the load floor, behind the drop side (which runs from 137 to 210 px)
  const rail = Y(140); // the top of the drop side
  const pic = picture(RENDERS.samsung.url);
  const load = new THREE.MeshBasicMaterial({ map: pic, transparent: true, alphaTest: 0.02, toneMapped: false, depthWrite: false });
  // (transparent, so they are drawn in the same pass as the pictures, in the order set below)
  const strap = new THREE.MeshBasicMaterial({ color: 0xa8782a, transparent: true, toneMapped: false, depthWrite: false });
  const buckle = new THREE.MeshBasicMaterial({ color: 0x2a2a2c, transparent: true, toneMapped: false, depthWrite: false });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, order: number) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    o.renderOrder = order; // drawn behind the truck's picture, so its cab and drop side stand in front
    body.add(o);
  };
  let x = X(396) - 0.03; // from the back of the cab
  for (const a of APPLIANCES) {
    const [x0, y0, x1, y1] = a.box;
    const H = a.height, W = (H * (x1 - x0)) / (y1 - y0);
    const geo = new THREE.PlaneGeometry(W, H);
    const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
    const u0 = x0 / LINEUP_PX[0], u1 = x1 / LINEUP_PX[0], v0 = 1 - y1 / LINEUP_PX[1], v1 = 1 - y0 / LINEUP_PX[1];
    uv.setXY(0, u0, v1);
    uv.setXY(1, u1, v1);
    uv.setXY(2, u0, v0);
    uv.setXY(3, u1, v0);
    add(geo, load, x - W / 2, floor + H / 2, -0.02, 1);
    // the strap over its top and down its side to the bed's hooks, its ratchet just above the drop side
    const sx = x - W * 0.62;
    add(new THREE.PlaneGeometry(0.028, H + 0.015), strap, sx, floor + H / 2 + 0.0075, -0.012, 1.5);
    add(new THREE.PlaneGeometry(0.05, 0.075), buckle, sx, rail + 0.12, -0.008, 1.6);
    x -= W + 0.03;
  }
  return g;
}

/** Official renders shipped in /public/models (aspect = width / height of the cut-out). */
export const RENDERS = {
  // side-on studio renders facing right, the direction of travel
  // our own studio-style illustration of the Kinetic Honda ZX (public/models/kinetic-honda-zx-side.svg),
  // measured from a side photograph and drawn to its published dimensions: 1 unit = 1 mm, so the picture
  // is 1.83 m long and 1.30 m tall to the top of the mirror
  kinetic: { url: "/models/kinetic-honda-zx-side.webp", height: 1.3, aspect: 1830 / 1300, len: 1.85, mirror: false },
  splendor: { url: "/models/hero-splendor-plus-side.webp", height: 1.29, aspect: 833 / 509, len: 2.1, mirror: false },
  // Ather 450, cut out from a studio photo: floor shadow removed and levelled so both tyres touch the ground
  // (sized from its 1296 mm wheelbase: 1.85 m long, 1.37 m to the top of the mirror)
  ather: { url: "/models/ather-450-side.webp", height: 1.37, aspect: 715 / 530, len: 1.9, mirror: false },
  // Maruti Suzuki Victoris, cut out from a studio render: floor ellipse removed, glass backed in studio grey,
  // levelled; sized from its 2600 mm wheelbase (4.17 m long as pictured, 1.69 m to the roof fin)
  // its two wheels are cut from the same picture and turn as it drives
  victoris: {
    url: "/models/maruti-victoris-side.webp", height: 1.69, aspect: 1215 / 491, len: 4.2, mirror: false, px: [1215, 491],
    wheels: [
      // centres are the true axles (from the alloys' 5-fold symmetry and the lug-nut circle), so they turn true
      { url: "/models/maruti-victoris-side-wheel-0.webp", cx: 238.31, cy: 386.73, size: 208, r: 103 },
      { url: "/models/maruti-victoris-side-wheel-1.webp", cx: 1001.28, cy: 386.73, size: 205, r: 101.3 },
    ],
  },
  // Maruti Suzuki Brezza, cut out the same way; sized from its 2500 mm wheelbase (3.83 m long as pictured,
  // 1.72 m to the roof rails). Wheel centres are the true axles, fitted to each alloy's outer edge
  brezza: {
    url: "/models/maruti-brezza-side.webp", height: 1.72, aspect: 1056 / 474, len: 3.9, mirror: false, px: [1056, 474],
    wheels: [
      { url: "/models/maruti-brezza-side-wheel-0.webp", cx: 191.36, cy: 380.41, size: 187, r: 92.5 },
      { url: "/models/maruti-brezza-side-wheel-1.webp", cx: 880.14, cy: 382.61, size: 183, r: 90.3 },
    ],
  },
  // Maruti Suzuki Super Carry, cut out from a studio turntable frame (its floor shadow, rendered pure black,
  // removed exactly) and levelled on the tyres; sized from its 2110 mm wheelbase: 3.83 m long, 1.91 m tall,
  // matching the published 3800 × 1883 mm
  superCarry: {
    url: "/models/maruti-super-carry-side.webp", height: 1.91, aspect: 656 / 327, len: 3.85, mirror: false, px: [656, 327],
    wheels: [
      { url: "/models/maruti-super-carry-side-wheel-0.webp", cx: 140.38, cy: 280.3, size: 95, r: 46.1 },
      { url: "/models/maruti-super-carry-side-wheel-1.webp", cx: 502.02, cy: 278.75, size: 98, r: 47.7 },
    ],
  },
  // Tata Yodha crew cab with a load of sacks, cut out of an outdoor photo along a traced outline; a true side
  // view (both axles level). Sized from its 3150 mm wheelbase: 5.2 m long, 1.85 m to the cab roof
  yodha: {
    url: "/models/tata-yodha-side.webp", height: 1.874, aspect: 564 / 204, len: 5.2, mirror: false, px: [564, 204],
    wheels: [
      { url: "/models/tata-yodha-side-wheel-0.webp", cx: 136.83, cy: 165.12, size: 80, r: 39 },
      { url: "/models/tata-yodha-side-wheel-1.webp", cx: 479.77, cy: 165.04, size: 80, r: 39 },
    ],
  },
  // our own studio-style illustration of a Tata Prima 5530.S tractor (metallic blue cab, black lower front)
  // with a dark green tri-axle tipper trailer, after a reference photo: public/models/prima-tractor-*.svg,
  // 1 unit = 1 cm, rendered at 1.5 px per cm. The side picture is 16.1 × 3.65 m; its five black steel wheels
  // (one drawing, 1.04 m across) turn as it drives; the top view takes over for the overhead shot
  prima: {
    url: "/models/prima-tractor-side.webp", height: 3.65, aspect: 2415 / 548, len: 15.9, mirror: false, px: [2415, 548],
    wheels: [300, 496.5, 693, 1642.5, 2152.5].map((cx) => ({ url: "/models/prima-tractor-wheel.webp", cx, cy: 469.5, size: 159, r: 78 })),
    top: { url: "/models/prima-tractor-top.webp", width: 3.18 },
  },
  bullet: { url: "/models/royal-enfield-bullet-350-side.webp", height: 1.33, aspect: 824 / 518, len: 2.1, mirror: false },
  // Harley-Davidson X440 (sold through Hero MotoCorp's Premia showrooms), from the official studio render: its
  // floor shadow removed and levelled on both tyres; sized from its 2168 mm overall length (1.24 m to the top
  // of the mirror)
  harley: { url: "/models/harley-x440-side.webp", height: 1.24, aspect: 839 / 480, len: 2.17, mirror: false },
  samsung: { url: "/models/samsung-lineup.webp", height: 1.95, aspect: 479 / 190, len: 5.4, mirror: false },
};

// ---------------------------------------------------------------- convoys

/** Lines models up nose-to-tail along +z; returns the group and its total length. */
export function convoy(items: { g: THREE.Group; len: number }[], gap = 0.9) {
  const g = new THREE.Group();
  let z = 0;
  const total = items.reduce((s, it) => s + it.len, 0) + gap * (items.length - 1);
  items.forEach((it, i) => {
    it.g.position.z = total / 2 - z - it.len / 2;
    z += it.len + gap;
    g.add(it.g);
    wheels(g).push(...(it.g.userData.wheels ?? []));
    if (i === 0 && it.g.userData.walker) g.userData.walker = it.g.userData.walker;
  });
  g.userData.move = (dx: number, scale: number) => items.forEach((it) => it.g.userData.move?.(dx, scale));
  return { g, len: total };
}
