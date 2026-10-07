// Shared materials and a small "kit" for building solid low-poly models.
// Static parts are merged per material so a whole building is only a handful of draw calls.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const std = (color: number, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

function stripeTexture(colors: string[], vertical: boolean, count: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const step = 256 / count;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % colors.length];
    if (vertical) ctx.fillRect(i * step, 0, step, 256);
    else ctx.fillRect(0, i * step, 256, step);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function fieldTexture(a: string, b: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = a;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = b;
  for (let x = 0; x < 128; x += 16) ctx.fillRect(x, 0, 7, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

/** Radial glow used for street-lamp light pools and the arrival ring. */
export function glowTexture(inner = "rgba(255,214,140,0.9)") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, "rgba(255,214,140,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeMaterials() {
  const paints = new Map<number, THREE.MeshStandardMaterial>();
  const M = {
    plaster: std(0xf0e7d8),
    plasterWarm: std(0xe8cfa8),
    white: std(0xf6f4ef, { roughness: 0.7 }),
    concrete: std(0xc9c3b8),
    trim: std(0x2e2d31, { roughness: 0.45, metalness: 0.45 }),
    wood: std(0x8b5a3c),
    roofTile: std(0xb4563a, { flatShading: true }),
    roofMetal: std(0x7f8790, { metalness: 0.45, roughness: 0.45 }),
    metalWall: std(0xc9ced4, { metalness: 0.15, roughness: 0.6 }),
    glass: std(0x23344a, { roughness: 0.05, metalness: 0.9, envMapIntensity: 1.5, emissive: 0xffc77a, emissiveIntensity: 0 }),
    glassClear: new THREE.MeshStandardMaterial({ color: 0xbcd6e8, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.25, depthWrite: false, envMapIntensity: 1.6 }),
    gold: std(0xc9a24a, { metalness: 0.75, roughness: 0.28 }),
    asphalt: std(0x3b3a3e, { roughness: 0.95 }),
    sidewalk: std(0xd4cec3),
    paint: std(0xf4f2ec, { roughness: 0.6 }),
    ground: std(0xb4b583, { roughness: 1 }),
    grass: std(0x8fa866, { roughness: 1 }),
    foliage: [std(0x6a8a48, { flatShading: true }), std(0x7f9e57, { flatShading: true }), std(0x587a40, { flatShading: true }), std(0x8ea65e, { flatShading: true })],
    trunk: std(0x6b4a33),
    tire: std(0x1c1c1f, { roughness: 0.9 }),
    rim: std(0xc4c8cd, { metalness: 0.85, roughness: 0.25 }),
    headlight: std(0xfff5dc, { emissive: 0xfff0c4, emissiveIntensity: 0.4 }),
    taillight: std(0x8a1c1c, { emissive: 0xff2a2a, emissiveIntensity: 0.3 }),
    lampHead: std(0xfff3d6, { emissive: 0xffd48a, emissiveIntensity: 0 }),
    awning: std(0xffffff, { map: stripeTexture(["#f3ead8", "#b4563a"], true, 12) }),
    shutter: std(0xffffff, { map: stripeTexture(["#adb1b6", "#8e9399"], false, 26), metalness: 0.3, roughness: 0.55 }),
    cladding: std(0xffffff, { map: stripeTexture(["#cfd4da", "#b8bec5"], true, 40), metalness: 0.2, roughness: 0.6 }),
    cloud: std(0xffffff, { roughness: 1, flatShading: true }),
    hills: [std(0xb9b39a, { flatShading: true }), std(0xa8a88c, { flatShading: true }), std(0xc4b796, { flatShading: true })],
    fields: [std(0xffffff, { map: fieldTexture("#9cb46a", "#86a058") }), std(0xffffff, { map: fieldTexture("#dcc27a", "#cbae5e") }), std(0xffffff, { map: fieldTexture("#a8bf74", "#bccb84") })],
    cloth: [std(0xb53a30), std(0x2d4a7a), std(0xd29a2c), std(0x5a7d4a), std(0xe6e1d6), std(0x7a3b6b)],
    skin: [std(0x8d5a3c), std(0xa86f4c), std(0x6e4530), std(0xc08a63)],
    hair: std(0x1d1814),
    glow: new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    paintOf(hex: number, metal = 0.5) {
      let m = paints.get(hex);
      if (!m) {
        m = std(hex, { metalness: metal, roughness: 0.32, envMapIntensity: 1.2 });
        paints.set(hex, m);
      }
      return m;
    },
    dispose() {
      Object.values(M).forEach((v) => {
        if (v instanceof THREE.Material) {
          (v as THREE.MeshStandardMaterial).map?.dispose();
          v.dispose();
        } else if (Array.isArray(v)) v.forEach((x) => x.dispose());
      });
      paints.forEach((m) => m.dispose());
    },
  };
  return M;
}
export type Materials = ReturnType<typeof makeMaterials>;

/** Sign board texture with real lettering. */
export function signMaterial(title: string, sub: string, theme: { bg: string; border: string; text: string; accent: string }) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, 1024, 256);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, 996, 228);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.accent;
  ctx.font = "600 44px Manrope, 'Segoe UI', Arial, sans-serif";
  ctx.fillText(sub.toUpperCase().split("").join(" "), 512, 74);
  ctx.fillStyle = theme.text;
  let size = 104;
  do {
    ctx.font = `800 ${size}px Manrope, 'Segoe UI', Arial, sans-serif`;
    size -= 4;
  } while (ctx.measureText(title.toUpperCase()).width > 900 && size > 40);
  ctx.fillText(title.toUpperCase(), 512, 160);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.15, roughness: 0.5 });
}

type V3 = [number, number, number];

export class Kit {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();

  add(g: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    if (m) g.applyMatrix4(m);
    const flat = g.index ? g.toNonIndexed() : g;
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", flat.getAttribute("position"));
    out.setAttribute("normal", flat.getAttribute("normal"));
    if (flat.getAttribute("uv")) out.setAttribute("uv", flat.getAttribute("uv"));
    else out.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(flat.getAttribute("position").count * 2), 2));
    if (flat !== g) flat.dispose();
    g.dispose();
    const list = this.parts.get(mat) ?? [];
    list.push(out);
    this.parts.set(mat, list);
    return this;
  }

  /** Box resting on y. */
  box(w: number, h: number, d: number, at: V3, mat: THREE.Material, ry = 0, rx = 0) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(at[0], at[1] + h / 2, at[2]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0)),
      new THREE.Vector3(1, 1, 1),
    );
    return this.add(new THREE.BoxGeometry(w, h, d), mat, m);
  }

  rbox(w: number, h: number, d: number, r: number, at: V3, mat: THREE.Material) {
    return this.add(new RoundedBoxGeometry(w, h, d, 2, r), mat, new THREE.Matrix4().makeTranslation(at[0], at[1] + h / 2, at[2]));
  }

  cyl(r: number, h: number, at: V3, mat: THREE.Material, axis: "x" | "y" | "z" = "y", seg = 12, r2 = r) {
    const m = new THREE.Matrix4();
    if (axis === "x") m.makeRotationZ(Math.PI / 2);
    if (axis === "z") m.makeRotationX(Math.PI / 2);
    m.setPosition(at[0], at[1], at[2]);
    return this.add(new THREE.CylinderGeometry(r2, r, h, seg), mat, m);
  }

  plane(w: number, h: number, at: V3, mat: THREE.Material, ry = 0) {
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(at[0], at[1], at[2]);
    return this.add(new THREE.PlaneGeometry(w, h), mat, m);
  }

  /** Prism from a (z, y) profile extruded across x (gable roofs with ridge along x). */
  prismX(pts: [number, number][], width: number, x: number, mat: THREE.Material) {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y))), { depth: width, bevelEnabled: false });
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    m.setPosition(x - width / 2, 0, 0);
    return this.add(g, mat, m);
  }

  /** Prism from an (x, y) profile extruded along z (gable roofs with ridge along z). */
  prismZ(pts: [number, number][], depth: number, z: number, mat: THREE.Material) {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth, bevelEnabled: false });
    return this.add(g, mat, new THREE.Matrix4().makeTranslation(0, 0, z - depth / 2));
  }

  /** Framed glazing on a front face at z (glass slightly recessed behind mullions). */
  glazing(x0: number, x1: number, y0: number, y1: number, z: number, cols: number, rows: number, glass: THREE.Material, frame: THREE.Material, t = 0.12) {
    this.box(x1 - x0, y1 - y0, 0.06, [(x0 + x1) / 2, y0, z - 0.04], glass);
    for (let c = 0; c <= cols; c++) this.box(t, y1 - y0, 0.14, [x0 + ((x1 - x0) * c) / cols, y0, z], frame);
    for (let r = 0; r <= rows; r++) this.box(x1 - x0 + t, t, 0.14, [(x0 + x1) / 2, y0 + ((y1 - y0) * r) / rows - t / 2, z], frame);
    return this;
  }

  build(shadows = true) {
    const group = new THREE.Group();
    this.parts.forEach((geos, mat) => {
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(merged, mat);
      const transparent = (mat as THREE.Material).transparent;
      mesh.castShadow = shadows && !transparent;
      mesh.receiveShadow = !transparent;
      group.add(mesh);
    });
    this.parts.clear();
    return group;
  }
}
