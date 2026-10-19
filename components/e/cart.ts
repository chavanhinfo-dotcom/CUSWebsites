// Option E's 1960 act: a traditional wooden hand-cart (thela) of yarn and cloth, pulled by a trader in
// kurta, dhoti and Gandhi cap. Built for realism from the side-on studio camera: grained planks, an
// iron-tyred spoked wheel, jute bales roped down, bolts of dyed cotton, and a walking stride with knees.
// Faces +z (like the other models); `userData.wheels` and `userData.walker.userData.walk(t, amp)` follow the
// diorama models' contract, and `userData.dispose()` frees its own materials and textures.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

function canvasTexture(w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat: [number, number] = [1, 1]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

// weathered wood: long grain streaks with darker knots, running along u
function woodPaint(base: string) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    const r = seeded(7);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const y = r() * h;
      g.strokeStyle = r() > 0.5 ? `rgba(40,22,10,${0.08 + r() * 0.18})` : `rgba(255,220,170,${0.04 + r() * 0.08})`;
      g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + i) * (1 + r() * 3));
      g.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const x = r() * w, y = r() * h;
      const k = g.createRadialGradient(x, y, 0, x, y, 6 + r() * 8);
      k.addColorStop(0, "rgba(35,18,8,0.55)");
      k.addColorStop(1, "rgba(35,18,8,0)");
      g.fillStyle = k;
      g.fillRect(x - 16, y - 16, 32, 32);
    }
  };
}

// woven fibre (jute or cotton): crossing threads with uneven tone
function weavePaint(base: string, thread: number, dark: number, light: number) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    const r = seeded(13);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += thread) for (let x = 0; x < w; x += thread) {
      const over = ((x + y) / thread) % 2 === 0;
      g.fillStyle = over ? `rgba(0,0,0,${dark * (0.6 + r() * 0.8)})` : `rgba(255,255,255,${light * (0.6 + r() * 0.8)})`;
      g.fillRect(x, y, thread * (over ? 1 : 0.6), thread * (over ? 0.6 : 1));
    }
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`;
      g.fillRect(0, r() * h, w, 1 + r() * 3);
    }
  };
}

// the end of a rolled bolt: tight concentric turns of cloth
function boltEndPaint(base: string) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let r = w / 2; r > 4; r -= 3) {
      g.strokeStyle = `rgba(0,0,0,${0.12 + ((r * 7) % 5) * 0.03})`;
      g.lineWidth = 1;
      g.beginPath();
      g.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = "#6b4a2b";
    g.beginPath();
    g.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
    g.fill();
  };
}

export function realCart() {
  const g = new THREE.Group();
  const mats: THREE.Material[] = [];
  const texs: THREE.Texture[] = [];
  const tex = (t: THREE.Texture) => (texs.push(t), t);
  const mat = <M extends THREE.Material>(m: M) => (mats.push(m), m);
  const std = (color: number, roughness: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    mat(new THREE.MeshStandardMaterial({ color, roughness, ...extra }));
  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };

  // ---- materials
  const woodMap = tex(canvasTexture(512, 128, woodPaint("#7b5434"), [1, 1]));
  const wood = mat(new THREE.MeshStandardMaterial({ map: woodMap, bumpMap: woodMap, bumpScale: 0.015, roughness: 0.82 }));
  const darkWoodMap = tex(canvasTexture(512, 128, woodPaint("#5a3b22")));
  const darkWood = mat(new THREE.MeshStandardMaterial({ map: darkWoodMap, bumpMap: darkWoodMap, bumpScale: 0.012, roughness: 0.78 }));
  const iron = std(0x2f2f31, 0.5, { metalness: 0.75 });
  const juteMap = tex(canvasTexture(128, 128, weavePaint("#b4955f", 4, 0.22, 0.12), [5, 4]));
  const jute = mat(new THREE.MeshStandardMaterial({ map: juteMap, bumpMap: juteMap, bumpScale: 0.02, roughness: 1 }));
  const ropeMap = tex(canvasTexture(64, 16, (c, w, h) => {
    c.fillStyle = "#8f7046";
    c.fillRect(0, 0, w, h);
    for (let x = -h; x < w; x += 6) { c.strokeStyle = "rgba(40,25,10,0.45)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, h); c.lineTo(x + h, 0); c.stroke(); }
  }, [8, 1]));
  const rope = mat(new THREE.MeshStandardMaterial({ map: ropeMap, roughness: 1 }));
  const cottonMap = tex(canvasTexture(128, 128, weavePaint("#efeadc", 2, 0.05, 0.05), [6, 6]));
  const cloth = (hex: string, roughness = 0.95) => {
    const m = tex(canvasTexture(128, 128, weavePaint(hex, 2, 0.09, 0.05), [8, 3]));
    return mat(new THREE.MeshStandardMaterial({ map: m, bumpMap: cottonMap, bumpScale: 0.004, roughness }));
  };
  const boltEnd = (hex: string) => mat(new THREE.MeshStandardMaterial({ map: tex(canvasTexture(128, 128, boltEndPaint(hex))), roughness: 0.95 }));
  const kurta = mat(new THREE.MeshStandardMaterial({ color: 0xf2eee4, map: cottonMap, bumpMap: cottonMap, bumpScale: 0.003, roughness: 0.96 }));
  const dhoti = mat(new THREE.MeshStandardMaterial({ color: 0xe9e2d0, map: cottonMap, bumpMap: cottonMap, bumpScale: 0.003, roughness: 0.97 }));
  const cap = std(0xfbfaf6, 0.9);
  const skin = mat(new THREE.MeshPhysicalMaterial({ color: 0x8c5b3c, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xc58a62) }));
  const hair = std(0x161210, 0.7);
  const leather = std(0x4a2f1c, 0.75);

  // ---- the cart: plank bed on two beams, low side rails, an axle and two iron-tyred wheels
  const BED_Y = 0.8, BED_Z0 = -1.32, BED_Z1 = 0.92, HALF = 0.7;
  const bedLen = BED_Z1 - BED_Z0, bedMid = (BED_Z0 + BED_Z1) / 2;
  const plankW = 0.19;
  for (let i = 0; i < 7; i++) {
    const p = mesh(new THREE.BoxGeometry(plankW - 0.012, 0.045, bedLen - (i % 2) * 0.03), i % 3 === 1 ? darkWood : wood, g, -HALF + plankW / 2 + i * (plankW + 0.003), BED_Y, bedMid);
    // grain runs along the plank: swap its UVs so the streaks follow its length
    const uv = p.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getY(k), uv.getX(k));
  }
  for (const x of [-0.6, 0.6]) mesh(new THREE.BoxGeometry(0.09, 0.12, bedLen + 0.08), darkWood, g, x, BED_Y - 0.08, bedMid);
  for (const z of [BED_Z0 + 0.08, bedMid, BED_Z1 - 0.08]) mesh(new THREE.BoxGeometry(1.36, 0.07, 0.08), darkWood, g, 0, BED_Y - 0.07, z);
  // side rails on stakes, and a tail board
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.05, 0.05, bedLen), wood, g, s * HALF, BED_Y + 0.22, bedMid);
    for (const z of [BED_Z0 + 0.06, BED_Z0 + 0.8, BED_Z1 - 0.7, BED_Z1 - 0.06]) mesh(new THREE.BoxGeometry(0.045, 0.24, 0.045), darkWood, g, s * HALF, BED_Y + 0.12, z);
  }
  mesh(new THREE.BoxGeometry(HALF * 2, 0.2, 0.04), wood, g, 0, BED_Y + 0.12, BED_Z0);
  // axle and its iron straps
  const AXLE_Z = -0.32, R = 0.5;
  const axle = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 12), iron, g, 0, R, AXLE_Z);
  axle.rotation.z = Math.PI / 2;
  for (const x of [-0.6, 0.6]) mesh(new THREE.BoxGeometry(0.11, 0.3, 0.06), iron, g, x, (R + BED_Y) / 2 - 0.04, AXLE_Z);

  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.position.set(s * 0.86, R, AXLE_Z);
    g.add(w);
    const ring = (radius: number, tube: number, m: THREE.Material, width: number) => {
      const t = mesh(new THREE.TorusGeometry(radius, tube, 10, 64), m, w);
      t.rotation.y = Math.PI / 2;
      t.scale.z = width / (tube * 2);
    };
    ring(R - 0.012, 0.016, iron, 0.075); // iron tyre
    ring(R - 0.06, 0.04, darkWood, 0.07); // wooden felloe
    const hub = mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.24, 18), darkWood, w);
    hub.rotation.z = Math.PI / 2;
    for (const x of [-0.1, 0.1]) {
      const band = mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.025, 18), iron, w, x);
      band.rotation.z = Math.PI / 2;
    }
    const cap0 = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 10), iron, w, s * 0.14);
    cap0.rotation.z = Math.PI / 2;
    for (let i = 0; i < 12; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.x = (i / 12) * Math.PI * 2;
      w.add(pivot);
      const len = R - 0.1 - 0.1;
      mesh(new THREE.CylinderGeometry(0.017, 0.026, len, 8), wood, pivot, 0, 0.1 + len / 2);
    }
    (g.userData.wheels ??= []).push({ obj: w, r: R });
  }

  // ---- the load: two jute bales roped down, a cotton bale on top, and bolts of dyed cloth
  const bale = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, rot = 0) => {
    const b = mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * 0.22), m, g, x, y, z);
    b.rotation.y = rot;
    for (const t of [-0.28, 0.28]) {
      const band = mesh(new RoundedBoxGeometry(w + 0.02, h + 0.02, 0.035, 2, 0.012), rope, b, 0, 0, t * d);
      band.castShadow = false;
    }
    return b;
  };
  bale(0.64, 0.5, 0.86, jute, -0.33, BED_Y + 0.27, -0.78, 0.03);
  bale(0.64, 0.48, 0.86, jute, 0.33, BED_Y + 0.26, -0.76, -0.04);
  bale(0.9, 0.38, 0.7, cloth("#f1ecdf"), 0.0, BED_Y + 0.71, -0.8, 0.06);
  const bolts: [string, string, number, number][] = [
    ["#2b3f73", "#34508e", -0.34, 0], // indigo
    ["#f0ebde", "#f6f2e8", 0.0, 0], // unbleached cotton
    ["#9c2f23", "#b23a2c", 0.34, 0], // madder red
    ["#d39a2a", "#e0ab3c", -0.17, 1], // turmeric
    ["#2f5d46", "#3a6e54", 0.17, 1], // leaf green
  ];
  // rolled lengthwise, so the side view shows each bolt's length and colour
  for (const [side, end, x, tier] of bolts) {
    const r = 0.16;
    const b = mesh(new THREE.CylinderGeometry(r, r, 0.86, 28, 1), [cloth(side), boltEnd(end), boltEnd(end)], g, x, BED_Y + 0.02 + r + tier * r * 1.72, 0.44);
    b.rotation.x = Math.PI / 2;
  }

  // ---- the trader, leaning into the shafts
  const man = new THREE.Group();
  man.position.set(0, 0, 2.05);
  g.add(man);
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  man.add(hips);
  const torso = new THREE.Group();
  torso.rotation.x = 0.2; // leaning forward into the load
  hips.add(torso);
  const lathe = (pts: [number, number][], m: THREE.Material, parent: THREE.Object3D, depth = 0.72, seg = 28) => {
    const o = mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), m, parent);
    o.scale.z = depth;
    return o;
  };
  // kurta: shoulders to mid-thigh, slightly flared, with a placket
  lathe([[0.001, 0.56], [0.07, 0.56], [0.17, 0.52], [0.205, 0.46], [0.2, 0.32], [0.185, 0.12], [0.2, -0.08], [0.235, -0.3], [0.001, -0.3]], kurta, torso);
  mesh(new THREE.BoxGeometry(0.035, 0.22, 0.01), mat(new THREE.MeshStandardMaterial({ color: 0xe2dccd, roughness: 1 })), torso, 0, 0.42, 0.148);
  // neck and head
  mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.12, 14), skin, torso, 0, 0.6, 0.01);
  const head = new THREE.Group();
  head.position.set(0, 0.74, 0.03);
  head.rotation.x = -0.12; // looking ahead, not at the ground
  torso.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.1, 28, 22), skin, head);
  skull.scale.set(0.9, 1.12, 1.0);
  const jaw = mesh(new THREE.SphereGeometry(0.075, 20, 14), skin, head, 0, -0.06, 0.025);
  jaw.scale.set(0.95, 0.8, 1);
  const nose = mesh(new THREE.ConeGeometry(0.018, 0.05, 10), skin, head, 0, 0.0, 0.1);
  nose.rotation.x = Math.PI / 2 + 0.3;
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.022, 10, 8), skin, head, s * 0.088, 0.0, 0.0);
    ear.scale.set(0.5, 1.2, 0.9);
    mesh(new THREE.SphereGeometry(0.008, 8, 6), hair, head, s * 0.032, 0.03, 0.093); // eyes
    const brow = mesh(new THREE.BoxGeometry(0.035, 0.007, 0.01), hair, head, s * 0.033, 0.052, 0.092);
    brow.rotation.z = -s * 0.15;
  }
  const mo = mesh(new THREE.CapsuleGeometry(0.009, 0.06, 4, 8), hair, head, 0, -0.04, 0.098);
  mo.rotation.z = Math.PI / 2;
  const hairBack = mesh(new THREE.SphereGeometry(0.102, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), hair, head, 0, 0.012, -0.012);
  hairBack.scale.set(0.92, 1.1, 1.02);
  // Gandhi cap: a boat-shaped fold of white khadi, ridge front to back
  const capGeo = new THREE.BoxGeometry(0.19, 0.085, 0.235, 1, 1, 1);
  const pos = capGeo.getAttribute("position") as THREE.BufferAttribute;
  for (let k = 0; k < pos.count; k++) if (pos.getY(k) > 0) pos.setX(k, pos.getX(k) * 0.12);
  capGeo.computeVertexNormals();
  const topi = mesh(capGeo, cap, head, 0, 0.115, -0.005);
  topi.rotation.x = -0.08;

  // arms: holding the shafts low at the sides, elbows slightly bent
  const hands: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.215, 0.48, 0);
    shoulder.rotation.set(0.22, 0, s * 0.16);
    torso.add(shoulder);
    lathe([[0.001, 0.02], [0.058, 0.0], [0.055, -0.14], [0.05, -0.29], [0.001, -0.29]], kurta, shoulder, 1, 16);
    const elbow = new THREE.Group();
    elbow.position.y = -0.29;
    elbow.rotation.x = -0.35;
    shoulder.add(elbow);
    lathe([[0.001, 0.02], [0.052, 0.0], [0.05, -0.1], [0.001, -0.1]], kurta, elbow, 1, 16); // three-quarter sleeve
    mesh(new THREE.CylinderGeometry(0.038, 0.03, 0.24, 12), skin, elbow, 0, -0.13);
    const hand = mesh(new THREE.SphereGeometry(0.042, 14, 10), skin, elbow, 0, -0.28, 0.01);
    hand.scale.set(0.8, 1.15, 1.05);
    hands.push(hand);
  }

  // legs: thigh and shin under the dhoti, bare ankles, leather chappals
  const legs: { hip: THREE.Group; knee: THREE.Group }[] = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.095, 0, 0);
    hips.add(hip);
    lathe([[0.001, 0.04], [0.105, 0.03], [0.1, -0.2], [0.082, -0.45], [0.001, -0.45]], dhoti, hip, 0.95, 18);
    const knee = new THREE.Group();
    knee.position.y = -0.45;
    hip.add(knee);
    lathe([[0.001, 0.02], [0.085, 0.0], [0.072, -0.2], [0.001, -0.2]], dhoti, knee, 0.95, 16); // dhoti to mid-calf
    mesh(new THREE.CylinderGeometry(0.048, 0.034, 0.42, 12), skin, knee, 0, -0.22);
    const foot = new THREE.Group();
    foot.position.y = -0.43;
    knee.add(foot);
    const f = mesh(new RoundedBoxGeometry(0.085, 0.05, 0.22, 2, 0.022), skin, foot, 0, -0.005, 0.06);
    f.castShadow = true;
    mesh(new THREE.BoxGeometry(0.1, 0.018, 0.25), leather, foot, 0, -0.035, 0.06);
    legs.push({ hip, knee });
  }

  // ---- shafts: from the bed's front beams, converging to the trader's hands
  man.updateMatrixWorld(true);
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  hands.forEach((h, i) => {
    const s = i === 0 ? -1 : 1;
    const end = h.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    end.z += 0.12; // the shaft runs on just past the grip
    const start = new THREE.Vector3(s * 0.6, BED_Y - 0.08, BED_Z1 - 0.3);
    const dir = end.clone().sub(start);
    const shaft = mesh(new THREE.CylinderGeometry(0.03, 0.04, dir.length(), 10), darkWood, g);
    shaft.position.copy(start).addScaledVector(dir, 0.5);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  });

  // stride: thighs swing, knees fold on the way through, a slight rise and fall at the hips
  man.userData.walk = (t: number, amp = 0.6) => {
    legs.forEach(({ hip, knee }, i) => {
      const ph = t + i * Math.PI;
      hip.rotation.x = Math.sin(ph) * amp * 0.62 - 0.05;
      knee.rotation.x = Math.max(0, Math.sin(ph + 1.3)) * amp * 1.25;
    });
    hips.position.y = 0.95 - Math.abs(Math.sin(t)) * 0.022;
    torso.rotation.y = Math.sin(t) * 0.035;
  };
  man.userData.walk(0, 0.6);
  g.userData.walker = man;

  g.userData.dispose = () => {
    mats.forEach((m) => m.dispose());
    texs.forEach((t) => t.dispose());
  };
  return g;
}
