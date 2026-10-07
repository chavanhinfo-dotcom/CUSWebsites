// Solid low-poly models for the diorama journey: buildings, vehicles, people, scenery.
// Every model faces +z. Buildings return merged static meshes plus any animated parts.
import * as THREE from "three";
import type { Category } from "@/lib/content";
import { Kit, type Materials } from "./kit";

type V3 = [number, number, number];

// ---------------------------------------------------------------- people

/** A small person with swinging legs and arms. `walk(t)` animates the stride. */
export function person(M: Materials, rnd: () => number) {
  const g = new THREE.Group();
  const shirt = M.cloth[Math.floor(rnd() * M.cloth.length)];
  const trousers = M.cloth[Math.floor(rnd() * M.cloth.length)];
  const skin = M.skin[Math.floor(rnd() * M.skin.length)];
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number, parent: THREE.Object3D = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y;
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const limb = (x: number, y: number, len: number, r: number, mat: THREE.Material) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = mesh(new THREE.CapsuleGeometry(r, len, 3, 8), mat, -len / 2 - r, pivot);
    m.position.y = -len / 2 - r * 0.5;
    g.add(pivot);
    return pivot;
  };
  const legL = limb(-0.11, 0.78, 0.5, 0.09, trousers);
  const legR = limb(0.11, 0.78, 0.5, 0.09, trousers);
  mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 10), shirt, 1.08);
  const armL = limb(-0.27, 1.32, 0.4, 0.07, shirt);
  const armR = limb(0.27, 1.32, 0.4, 0.07, shirt);
  mesh(new THREE.SphereGeometry(0.17, 14, 10), skin, 1.6);
  const hair = mesh(new THREE.SphereGeometry(0.175, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.hair, 1.63);
  hair.rotation.x = -0.15;
  g.scale.setScalar(0.95 + rnd() * 0.15);
  g.userData.walk = (t: number, amp = 0.6) => {
    const s = Math.sin(t);
    legL.rotation.x = s * amp;
    legR.rotation.x = -s * amp;
    armL.rotation.x = -s * amp * 0.8;
    armR.rotation.x = s * amp * 0.8;
    g.children[2].position.y = 1.08 + Math.abs(Math.cos(t)) * 0.03;
  };
  return g;
}

// ---------------------------------------------------------------- vehicles

function wheel(g: THREE.Group, M: Materials, x: number, z: number, r: number, w = 0.26) {
  const wg = new THREE.Group();
  wg.position.set(x, r, z);
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 18), M.tire);
  tire.rotation.z = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.58, r * 0.58, w + 0.02, 10), M.rim);
  rim.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wg.add(tire, rim);
  g.add(wg);
  (g.userData.wheels ??= []).push({ obj: wg, r });
}

function solid(g: THREE.Group, k: Kit) {
  const b = k.build();
  b.children.forEach((c) => (c.castShadow = true));
  g.add(b);
}

export function car(M: Materials, color: number) {
  const g = new THREE.Group();
  const k = new Kit();
  const paint = M.paintOf(color);
  k.rbox(1.82, 0.62, 4.2, 0.16, [0, 0.32, 0], paint);
  k.rbox(1.6, 0.58, 2.2, 0.18, [0, 0.86, -0.2], M.glass);
  k.rbox(1.5, 0.1, 1.9, 0.05, [0, 1.38, -0.25], paint);
  k.box(0.38, 0.12, 0.05, [-0.6, 0.66, 2.1], M.headlight).box(0.38, 0.12, 0.05, [0.6, 0.66, 2.1], M.headlight);
  k.box(0.4, 0.12, 0.05, [-0.62, 0.7, -2.1], M.taillight).box(0.4, 0.12, 0.05, [0.62, 0.7, -2.1], M.taillight);
  k.box(1.7, 0.16, 0.12, [0, 0.3, 2.12], M.trim).box(1.7, 0.16, 0.12, [0, 0.3, -2.12], M.trim);
  solid(g, k);
  for (const x of [-0.82, 0.82]) for (const z of [-1.35, 1.35]) wheel(g, M, x, z, 0.36);
  return g;
}

export function autoRickshaw(M: Materials) {
  const g = new THREE.Group();
  const k = new Kit();
  const yellow = M.paintOf(0xf2c230, 0.2);
  const green = M.paintOf(0x2f6b3a, 0.2);
  k.rbox(1.35, 0.7, 2.4, 0.15, [0, 0.35, 0], green);
  k.rbox(1.35, 0.25, 0.9, 0.1, [0, 0.35, 0.9], yellow);
  k.rbox(1.4, 0.12, 2.3, 0.06, [0, 1.75, -0.1], M.paintOf(0x1b1b1b, 0.1));
  k.box(0.08, 0.7, 0.08, [-0.62, 1.05, 0.95], M.trim).box(0.08, 0.7, 0.08, [0.62, 1.05, 0.95], M.trim);
  k.box(1.2, 0.5, 0.05, [0, 1.15, 1.0], M.glass);
  k.box(0.2, 0.12, 0.05, [0, 0.75, 1.36], M.headlight);
  solid(g, k);
  wheel(g, M, 0, 1.05, 0.3, 0.18);
  wheel(g, M, -0.6, -0.75, 0.3, 0.18);
  wheel(g, M, 0.6, -0.75, 0.3, 0.18);
  return g;
}

export function truck(M: Materials, cab = 0x2e5d8c, cargo = 0xd8c08a) {
  const g = new THREE.Group();
  const k = new Kit();
  k.rbox(2.1, 1.75, 1.7, 0.18, [0, 0.55, 2.0], M.paintOf(cab, 0.4));
  k.box(1.8, 0.7, 0.06, [0, 1.35, 2.86], M.glass);
  k.box(2.0, 0.3, 5.6, [0, 0.45, 0], M.trim);
  k.rbox(2.2, 2.0, 3.9, 0.08, [0, 0.75, -0.95], M.paintOf(cargo, 0.1));
  k.box(0.4, 0.15, 0.05, [-0.7, 0.85, 2.86], M.headlight).box(0.4, 0.15, 0.05, [0.7, 0.85, 2.86], M.headlight);
  solid(g, k);
  for (const x of [-0.92, 0.92]) for (const z of [-2.1, -1.1, 2.0]) wheel(g, M, x, z, 0.44, 0.32);
  return g;
}

export function deliveryVan(M: Materials, logo?: THREE.Texture) {
  const g = new THREE.Group();
  const k = new Kit();
  const body = M.paintOf(0xf3f1ea, 0.3);
  k.rbox(1.95, 1.85, 3.3, 0.2, [0, 0.35, -0.45], body);
  k.rbox(1.95, 1.2, 1.3, 0.25, [0, 0.35, 1.6], body);
  k.box(1.7, 0.55, 0.06, [0, 1.0, 2.24], M.glass);
  k.box(1.98, 0.22, 3.2, [0, 0.95, -0.45], M.gold);
  k.box(0.35, 0.14, 0.05, [-0.65, 0.75, 2.27], M.headlight).box(0.35, 0.14, 0.05, [0.65, 0.75, 2.27], M.headlight);
  solid(g, k);
  if (logo) {
    const mat = new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.6 });
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.9), mat);
      p.position.set(s * 0.99, 1.55, -0.6);
      p.rotation.y = (s * Math.PI) / 2;
      g.add(p);
    }
  }
  for (const x of [-0.86, 0.86]) for (const z of [-1.4, 1.45]) wheel(g, M, x, z, 0.38);
  return g;
}

export function scooter(M: Materials, rnd: () => number, color = 0xc9a24a) {
  const g = new THREE.Group();
  const k = new Kit();
  const paint = M.paintOf(color, 0.6);
  k.rbox(0.5, 0.42, 1.25, 0.18, [0, 0.38, -0.2], paint);
  k.rbox(0.42, 0.08, 0.6, 0.04, [0, 0.8, -0.35], M.tire);
  k.rbox(0.46, 0.9, 0.22, 0.1, [0, 0.35, 0.55], paint);
  k.cyl(0.03, 0.75, [0, 1.3, 0.62], M.trim, "x", 8);
  k.box(0.18, 0.1, 0.05, [0, 1.15, 0.68], M.headlight);
  solid(g, k);
  wheel(g, M, 0, -0.62, 0.28, 0.14);
  wheel(g, M, 0, 0.72, 0.28, 0.14);
  const rider = person(M, rnd);
  rider.position.set(0, 0.25, -0.2);
  rider.userData.walk(0.9, 0.9);
  (rider.children[0] as THREE.Group).rotation.x = -1.3;
  (rider.children[1] as THREE.Group).rotation.x = -1.3;
  (rider.children[3] as THREE.Group).rotation.x = -1.1;
  (rider.children[4] as THREE.Group).rotation.x = -1.1;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), paint);
  helmet.position.y = 1.62;
  rider.add(helmet);
  g.add(rider);
  return g;
}

export function motorbike(M: Materials, color: number) {
  const g = new THREE.Group();
  const k = new Kit();
  const paint = M.paintOf(color, 0.6);
  for (const z of [-0.68, 0.7]) {
    k.add(new THREE.TorusGeometry(0.32, 0.08, 8, 20), M.tire, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(0, 0.4, z));
    k.cyl(0.12, 0.1, [0, 0.4, z], M.rim, "x", 10);
  }
  k.rbox(0.42, 0.3, 0.6, 0.12, [0, 0.82, 0.12], paint);
  k.rbox(0.32, 0.1, 0.65, 0.05, [0, 0.92, -0.4], M.tire);
  k.rbox(0.36, 0.32, 0.55, 0.08, [0, 0.4, -0.05], M.trim);
  k.cyl(0.03, 0.8, [0, 1.15, 0.55], M.trim, "x", 8);
  k.cyl(0.03, 0.75, [0, 0.8, 0.62], M.rim, "y", 6);
  solid(g, k);
  return g;
}

export function handcart(M: Materials, rnd: () => number) {
  const g = new THREE.Group();
  const k = new Kit();
  k.box(1.5, 0.12, 2.1, [0, 0.78, -0.2], M.wood);
  k.box(1.5, 0.32, 0.07, [0, 0.9, -1.22], M.wood).box(0.07, 0.32, 2.1, [-0.72, 0.9, -0.2], M.wood).box(0.07, 0.32, 2.1, [0.72, 0.9, -0.2], M.wood);
  const bales: [number, number, number, number][] = [[-0.35, 1.15, -0.65, 0], [0.35, 1.15, -0.65, 1], [0, 1.15, 0.1, 2], [0, 1.55, -0.3, 3]];
  for (const [x, y, z, c] of bales) k.cyl(0.26, 0.95, [x, y, z], M.cloth[c], "x", 12);
  k.cyl(0.035, 1.6, [-0.55, 0.88, 1.45], M.wood, "z", 6).cyl(0.035, 1.6, [0.55, 0.88, 1.45], M.wood, "z", 6);
  solid(g, k);
  for (const x of [-0.88, 0.88]) {
    const wg = new THREE.Group();
    wg.position.set(x, 0.6, -0.2);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 6, 22), M.wood);
    rim.rotation.y = Math.PI / 2;
    wg.add(rim);
    for (let a = 0; a < Math.PI; a += Math.PI / 4) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 5), M.wood);
      s.rotation.x = a;
      wg.add(s);
    }
    wg.children.forEach((c) => (c.castShadow = true));
    g.add(wg);
    (g.userData.wheels ??= []).push({ obj: wg, r: 0.6 });
  }
  // the trader pulling the cart
  const p = person(M, rnd);
  p.position.set(0, 0, 2.35);
  g.add(p);
  g.userData.walker = p;
  return g;
}

// ---------------------------------------------------------------- scenery

export function tree(k: Kit, M: Materials, x: number, z: number, h: number, rnd: () => number) {
  k.cyl(0.14 * h * 0.25, h * 0.5, [x, h * 0.25, z], M.trunk, "y", 6, 0.1 * h * 0.25);
  const leaf = M.foliage[Math.floor(rnd() * M.foliage.length)];
  const blob = (dx: number, dy: number, dz: number, r: number) =>
    k.add(new THREE.IcosahedronGeometry(r, 1), leaf, new THREE.Matrix4().makeScale(1, 0.85, 1).setPosition(x + dx, dy, z + dz));
  blob(0, h * 0.62, 0, h * 0.3);
  blob(h * 0.18, h * 0.5, h * 0.08, h * 0.2);
  blob(-h * 0.15, h * 0.52, -h * 0.1, h * 0.2);
  if (rnd() > 0.5) blob(0, h * 0.82, 0, h * 0.18);
}

export function streetLamp(k: Kit, glow: Kit, M: Materials, base: THREE.Vector3, head: THREE.Vector3) {
  k.cyl(0.08, 5, [base.x, 2.5, base.z], M.trim, "y", 8, 0.06);
  const mid = base.clone().lerp(head, 0.5);
  const len = base.distanceTo(head);
  const yaw = Math.atan2(head.x - base.x, head.z - base.z);
  k.add(new THREE.BoxGeometry(0.06, 0.06, len), M.trim, new THREE.Matrix4().makeRotationY(yaw).setPosition(mid.x, 4.95, mid.z));
  k.add(new THREE.BoxGeometry(0.5, 0.12, 0.28), M.lampHead, new THREE.Matrix4().makeRotationY(yaw).setPosition(head.x, 4.88, head.z));
  glow.add(new THREE.PlaneGeometry(6, 6), M.glow, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(head.x, 0.05, head.z));
}

export function cloud(M: Materials, rnd: () => number) {
  const k = new Kit();
  const n = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const r = 2 + rnd() * 2.2;
    k.add(new THREE.IcosahedronGeometry(r, 1), M.cloud, new THREE.Matrix4().makeScale(1.2, 0.7, 1).setPosition(i * 2.4 - n * 1.2, rnd() * 1.2, (rnd() - 0.5) * 2));
  }
  const g = k.build(false);
  g.children.forEach((c) => (c.receiveShadow = false));
  return g;
}

// ---------------------------------------------------------------- buildings

export type BuildingOut = {
  group: THREE.Group;
  animated: THREE.Object3D[];
  walkers: { from: V3; to: V3 }[];
  size: { w: number; d: number };
};

/**
 * `sign` is the lettered sign material; `pylon` an optional second (portrait) sign for dealerships.
 */
export function building(cat: Category, M: Materials, sign: THREE.Material, rnd: () => number): BuildingOut {
  const k = new Kit();
  const animated: THREE.Object3D[] = [];
  const extra = new THREE.Group();
  let walkers: { from: V3; to: V3 }[] = [];
  let size = { w: 8, d: 8 };

  switch (cat) {
    case "heritage": {
      const W = 7, D = 6, H = 5.8, f = D / 2;
      k.box(W + 0.5, 0.3, D + 0.5, [0, 0, 0], M.concrete);
      k.box(W, H, D, [0, 0.3, 0], M.plasterWarm);
      k.box(W + 0.25, 0.2, D + 0.25, [0, 3.25, 0], M.white);
      k.prismX([[-f - 0.6, H + 0.3], [0, H + 2.3], [f + 0.6, H + 0.3]], W + 0.7, 0, M.roofTile);
      k.box(3.2, 2.5, 0.08, [-1.3, 0.3, f + 0.02], M.shutter);
      k.glazing(0.9, 2.9, 1.0, 2.6, f + 0.05, 2, 2, M.glass, M.wood, 0.1);
      k.box(W + 0.4, 0.08, 1.9, [0, 3.0, f + 0.9], M.awning, 0, 0.28);
      for (const x of [-3.4, 3.4]) k.cyl(0.07, 2.95, [x, 1.78, f + 1.75], M.wood, "y", 6);
      for (const x of [-2.4, 0, 2.4]) {
        k.glazing(x - 0.55, x + 0.55, 4.3, 5.5, f + 0.05, 1, 2, M.glass, M.white, 0.1);
        k.box(0.5, 1.25, 0.06, [x - 0.85, 4.28, f + 0.25], M.wood, 0.5).box(0.5, 1.25, 0.06, [x + 0.85, 4.28, f + 0.25], M.wood, -0.5);
      }
      k.plane(4.2, 1.05, [0, 3.92, f + 0.03], sign);
      for (const [y, z, c] of [[0.75, 3.7, 0], [0.75, 4.65, 1], [1.55, 4.18, 2]] as [number, number, number][]) k.cyl(0.45, 1.3, [-4.6, y, z], M.cloth[c], "x", 14);
      k.cyl(0.35, 0.5, [3.9, 0.25, f + 0.6], M.roofTile, "y", 10, 0.28);
      tree(k, M, 3.9, f + 0.6, 1.6, rnd);
      walkers = [{ from: [-3, 0, f + 2.6], to: [3, 0, f + 2.6] }, { from: [2.5, 0, f + 3.4], to: [-2.5, 0, f + 3.4] }];
      size = { w: W, d: D };
      break;
    }
    case "appliances": {
      const W = 10, D = 7, H = 7, f = D / 2;
      k.box(W + 0.6, 0.25, D + 2.4, [0, 0, 1], M.concrete);
      k.box(W, H, D, [0, 0.25, 0], M.white);
      k.box(W + 0.3, 0.5, D + 0.3, [0, H + 0.25, 0], M.trim);
      k.glazing(-4.6, 4.6, 0.3, 3.2, f + 0.05, 6, 1, M.glass, M.trim);
      k.plane(9.2, 2.3, [0, 4.42, f + 0.04], sign);
      k.glazing(-4.6, 4.6, 5.0, 6.9, f + 0.05, 4, 1, M.glass, M.trim);
      for (let y = 5.1; y < 6.9; y += 0.3) k.box(9.3, 0.06, 0.25, [0, y, f + 0.3], M.white);
      k.box(3.4, 0.15, 1.7, [0, 3.3, f + 0.85], M.trim);
      for (const [y, z] of [[2.2, 1], [4.8, -1.2]]) {
        k.box(0.9, 0.6, 0.55, [W / 2 + 0.3, y, z], M.white);
        k.cyl(0.2, 0.05, [W / 2 + 0.58, y + 0.3, z], M.trim, "x", 12);
      }
      for (const x of [-4.2, 4.2]) tree(k, M, x, f + 1.6, 1.8, rnd);
      walkers = [{ from: [-4, 0, f + 1.8], to: [4, 0, f + 1.8] }, { from: [3, 0, f + 0.9], to: [-1, 0, f + 0.9] }, { from: [-2, 0, f + 2.2], to: [1.5, 0, f + 2.2] }];
      size = { w: W, d: D + 2 };
      break;
    }
    case "two-wheelers": {
      const W = 12, D = 8, H = 4.6, f = D / 2;
      k.box(W + 2, 0.25, D + 5, [0, 0, 1.8], M.concrete);
      k.box(W, H, 0.3, [0, 0.25, -f], M.white);
      k.box(0.3, H, D, [-W / 2, 0.25, 0], M.white);
      k.box(0.06, H, D, [W / 2, 0.25, 0], M.glassClear);
      k.box(W, H, 0.06, [0, 0.25, f], M.glassClear);
      for (let i = 0; i <= 6; i++) k.box(0.12, H, 0.14, [-W / 2 + (W * i) / 6, 0.25, f], M.trim);
      k.box(W + 1.4, 0.4, D + 2.4, [0, H + 0.25, 1.1], M.white);
      for (const x of [-W / 2 - 0.4, W / 2 + 0.4]) k.cyl(0.12, H, [x, H / 2 + 0.25, f + 2], M.trim, "y", 10);
      k.plane(7.6, 1.9, [0, H + 1.6, f + 2.32], sign);
      k.box(7.8, 2.0, 0.12, [0, H + 0.6, f + 2.24], M.trim);
      const colors = [0x8c1d1d, 0x1f2f4f, 0x2b2b2b, 0xc9a24a, 0x4a6b3a];
      for (let i = 0; i < 4; i++) {
        const b = motorbike(M, colors[i]);
        b.position.set(-3.8 + i * 2.5, 0.25, f + 2.9);
        b.rotation.y = 0.55;
        extra.add(b);
      }
      for (let i = 0; i < 3; i++) {
        const b = motorbike(M, colors[(i + 2) % colors.length]);
        b.position.set(-3.5 + i * 3.4, 0.25, 0.5);
        b.rotation.y = -0.5;
        extra.add(b);
      }
      walkers = [{ from: [-5, 0, f + 4.6], to: [5, 0, f + 4.6] }, { from: [2, 0, 1.5], to: [-3, 0, 1.5] }];
      size = { w: W, d: D + 4 };
      break;
    }
    case "cars": {
      const W = 16, D = 11, H = 7.4, f = D / 2;
      k.box(W + 6, 0.2, D + 11, [1.5, 0, 4], M.concrete);
      k.box(W, H, 0.3, [0, 0.2, -f], M.white);
      k.box(0.3, H, D, [-W / 2, 0.2, 0], M.white);
      k.box(0.3, H, D, [W / 2, 0.2, 0], M.white);
      k.box(W, H, 0.06, [0, 0.2, f], M.glassClear);
      for (let i = 0; i <= 8; i++) k.box(0.14, H, 0.16, [-W / 2 + (W * i) / 8, 0.2, f], M.trim);
      k.box(W, 0.14, 0.16, [0, 3.9, f], M.trim);
      k.box(W + 0.5, 0.7, D + 0.5, [0, H + 0.2, 0], M.white);
      k.box(4.4, H + 1, 1.4, [-3.8, 0.2, f + 0.6], M.gold);
      k.box(3.6, H - 0.6, 1.5, [-3.8, 0.2, f + 0.62], M.glassClear);
      k.plane(9.2, 2.3, [3.3, H + 0.55, f + 0.3], sign);
      k.box(1.8, 11, 1, [W / 2 + 3, 0.2, f + 2], M.trim);
      k.plane(1.5, 1.5 / 4 * 4, [W / 2 + 3, 9.6, f + 2.51], M.gold);
      for (let i = 0; i < 6; i++) k.box(0.12, 0.02, 4.6, [-6 + i * 3, 0.21, f + 6.5], M.paint);
      const paints = [0xb5332e, 0xeeeeea, 0x9aa0a8, 0x2e4f7a, 0x1f2023, 0x7a5c3a];
      for (let i = 0; i < 5; i++) {
        const c = car(M, paints[i]);
        c.position.set(-4.5 + i * 3, 0.2, f + 6.5);
        c.rotation.y = Math.PI;
        extra.add(c);
      }
      for (let i = 0; i < 3; i++) {
        const c = car(M, paints[(i + 2) % paints.length]);
        c.position.set(-4 + i * 5, 0.2, -1);
        c.rotation.y = 0.6;
        extra.add(c);
      }
      for (let i = 0; i < 3; i++) {
        const x = -W / 2 - 1.5 - i * 1.4;
        k.cyl(0.05, 6.5, [x, 3.45, f + 9.5], M.rim, "y", 6);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8, 6, 1), i === 1 ? M.gold : M.paintOf(0x0b2859, 0));
        flag.geometry.translate(0.6, 0, 0);
        flag.position.set(x, 6.2, f + 9.5);
        (flag.material as THREE.Material).side = THREE.DoubleSide;
        extra.add(flag);
        animated.push(flag);
      }
      walkers = [{ from: [-6, 0, f + 2], to: [6, 0, f + 2] }, { from: [4, 0, f + 9], to: [-4, 0, f + 9] }, { from: [-2, 0, 2], to: [3, 0, 2] }];
      size = { w: W + 6, d: D + 10 };
      break;
    }
    case "commercial": {
      const W = 18, D = 12, H = 6.5, f = D / 2;
      k.box(W + 10, 0.2, D + 9, [2, 0, 3], M.concrete);
      k.box(W, H, D, [0, 0.2, 0], M.cladding);
      k.prismZ([[-W / 2 - 0.4, H + 0.2], [0, H + 2.6], [W / 2 + 0.4, H + 0.2]], D + 0.8, 0, M.roofMetal);
      k.box(W + 0.4, 0.3, 0.3, [0, H + 0.05, f + 0.15], M.trim);
      for (const x0 of [-7.5, 1.5]) {
        k.box(6, 4.8, 0.1, [x0 + 3, 0.2, f + 0.03], M.shutter);
        k.box(6.3, 0.3, 0.4, [x0 + 3, 5.0, f + 0.15], M.trim);
      }
      k.box(W, 1.1, 2.6, [0, 0.2, f + 1.3], M.concrete);
      k.plane(7.2, 1.8, [0, H + 0.95, f + 0.42], sign);
      k.box(5, 3.6, 5, [-W / 2 - 2.8, 0.2, 2.5], M.white);
      k.glazing(-W / 2 - 4.9, -W / 2 - 0.7, 1.3, 3.0, 5.05, 3, 1, M.glass, M.trim);
      const t1 = truck(M, 0x2e5d8c, 0xd8c08a);
      t1.position.set(-4.5, 0.2, f + 5.4);
      t1.rotation.y = Math.PI;
      const t2 = truck(M, 0xeeeeea, 0x8a2e2a);
      t2.position.set(W / 2 + 3.5, 0.2, f + 2);
      t2.rotation.y = 0.5;
      extra.add(t1, t2);
      walkers = [{ from: [-6, 0, f + 3.3], to: [6, 0, f + 3.3] }, { from: [3, 0, f + 4], to: [-1, 0, f + 4] }];
      size = { w: W + 10, d: D + 8 };
      break;
    }
  }

  const group = new THREE.Group();
  group.add(k.build(), extra);
  return { group, animated, walkers, size };
}
