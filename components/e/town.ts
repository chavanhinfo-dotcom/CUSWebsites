// Option E's journey: the group's businesses as clean architectural models, one building per milestone
// (the 1960 cloth shop, showrooms, the distribution warehouse, the commercial dealerships with service
// bays). White volumes, glass fronts (daylight, or lit from inside at dusk) and a dark name board with a
// gold line; fronts and signs are painted on canvas in the template's faces. Each faces +z, centred on its
// front at ground level.
import * as THREE from "three";
import { renderSprite, type RenderSpec } from "./fleet";

export type Kind = "shop" | "showroom" | "workshop" | "warehouse";
export type Fonts = { wide: string; body: string };
// `products`: shown on podiums inside a showroom
export type BuildingSpec = { kind: Kind; w: number; h: number; d: number; name: string; products?: RenderSpec[] };

type Ctx = CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
const setFont = (g: Ctx, f: Fonts, weight: number, px: number, wide: boolean, tracking = 0) => {
  g.font = `${weight} ${px}px ${wide ? f.wide : f.body}`;
  if ("fontStretch" in g) g.fontStretch = wide ? "expanded" : "normal";
  if ("letterSpacing" in g) g.letterSpacing = `${tracking}px`;
};
// the largest size (down to `min`) at which the text fits the width
const fitFont = (g: Ctx, f: Fonts, text: string, maxW: number, px: number, min: number) => {
  for (; px > min; px -= 2) {
    setFont(g, f, 800, px, true);
    if (g.measureText(text).width <= maxW) return;
  }
  setFont(g, f, 800, min, true);
};
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// share of the height taken by the front (glass, shutters) and by the name board above it
const SHARE: Record<Kind, { front: number; board: number }> = {
  shop: { front: 0.58, board: 0.22 },
  showroom: { front: 0.6, board: 0.18 },
  workshop: { front: 0.6, board: 0.16 },
  warehouse: { front: 0.58, board: 0.15 },
};

/**
 * Glazing: in daylight the sky reflected over darker glass; lit (at dusk) a warm showroom interior with
 * downlights. Then mullions, a transom, the door.
 */
function glass(g: Ctx, x: number, y: number, w: number, h: number, panes: number, lit = false) {
  const sky = g.createLinearGradient(0, y, 0, y + h);
  if (lit) {
    sky.addColorStop(0, "#fff6e4");
    sky.addColorStop(0.6, "#ecdcbc");
    sky.addColorStop(0.61, "#cdb68f");
    sky.addColorStop(1, "#9c8564");
  } else {
    sky.addColorStop(0, "#c3ced6");
    sky.addColorStop(0.45, "#76858f");
    sky.addColorStop(1, "#2c343b");
  }
  g.fillStyle = sky;
  g.fillRect(x, y, w, h);
  if (lit) {
    for (let lx = x + 50; lx < x + w - 20; lx += 120) {
      const l = g.createRadialGradient(lx, y + h * 0.24, 0, lx, y + h * 0.24, h * 0.3);
      l.addColorStop(0, "rgba(255,255,255,0.9)");
      l.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = l;
      g.fillRect(lx - h * 0.3, y, h * 0.6, h * 0.6);
    }
  }
  const rf = g.createLinearGradient(x, y, x + w, y + h);
  rf.addColorStop(0, `rgba(255,255,255,${lit ? 0.1 : 0.22})`);
  rf.addColorStop(0.28, "rgba(255,255,255,0)");
  rf.addColorStop(0.5, `rgba(255,255,255,${lit ? 0.06 : 0.12})`);
  rf.addColorStop(0.62, "rgba(255,255,255,0)");
  g.fillStyle = rf;
  g.fillRect(x, y, w, h);
  g.fillStyle = "#1d1f22";
  for (let k = 1; k < panes; k++) g.fillRect(x + (w * k) / panes - 3, y, 6, h);
  g.fillRect(x, y + h * 0.18, w, 5);
  g.lineWidth = 12;
  g.strokeStyle = "#1d1f22";
  g.strokeRect(x + 6, y + 6, w - 12, h - 12);
  const door = Math.floor(panes / 2);
  g.fillStyle = lit ? "rgba(60,45,25,0.18)" : "rgba(20,24,28,0.45)";
  g.fillRect(x + (w * door) / panes + 3, y + h * 0.18 + 5, w / panes - 6, h * 0.82 - 11);
}

/** A roller shutter, closed or half open on the interior (lit at dusk). */
function shutter(g: Ctx, x: number, y: number, w: number, h: number, open = false, lit = false) {
  const stop = open ? h * 0.45 : h;
  if (open) {
    const inside = g.createLinearGradient(0, y, 0, y + h);
    inside.addColorStop(0, lit ? "#f4f1ea" : "#3a3f44");
    inside.addColorStop(1, lit ? "#a9a49a" : "#1d2023");
    g.fillStyle = inside;
    g.fillRect(x, y, w, h);
  }
  g.fillStyle = "#dcdbd6";
  g.fillRect(x, y, w, stop);
  g.fillStyle = "rgba(0,0,0,0.13)";
  for (let yy = y + 6; yy < y + stop; yy += 9) g.fillRect(x, yy, w, 2);
  g.lineWidth = 10;
  g.strokeStyle = "#2a2c2f";
  g.strokeRect(x + 5, y + 5, w - 10, h - 10);
}

/**
 * The surfaces of a lit showroom interior, painted once and shared by every showroom: a warm white feature
 * wall with a band of light and a gold line, side walls, a ceiling of light strips, a polished floor that
 * catches them, a pool of light (for under each product), and the glass's faint sheen.
 */
let interiorTex: Record<"back" | "side" | "ceil" | "floor" | "pool" | "glass", THREE.Texture> | null = null;
function interiorTextures() {
  if (interiorTex) return interiorTex;
  const tex = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    paint(c.getContext("2d")!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const vgrad = (g: CanvasRenderingContext2D, stops: [number, string][]) => {
    const l = g.createLinearGradient(0, 0, 0, g.canvas.height);
    stops.forEach(([o, c]) => l.addColorStop(o, c));
    g.fillStyle = l;
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  };
  interiorTex = {
    back: tex(256, 256, (g) => {
      vgrad(g, [[0, "#fffdf8"], [0.55, "#f3ede1"], [1, "#e2dacb"]]);
      const l = g.createLinearGradient(0, 0, 0, 70);
      l.addColorStop(0, "rgba(255,255,255,0.95)");
      l.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = l;
      g.fillRect(0, 0, 256, 70);
      g.fillStyle = "rgba(201,162,74,0.7)";
      g.fillRect(0, 118, 256, 3);
    }),
    side: tex(64, 256, (g) => vgrad(g, [[0, "#f8f5ee"], [1, "#d6cec0"]])),
    ceil: tex(256, 256, (g) => {
      g.fillStyle = "#ece9e2";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#ffffff";
      for (let y = 22; y < 256; y += 56) g.fillRect(14, y, 228, 9);
    }),
    floor: tex(256, 256, (g) => {
      vgrad(g, [[0, "#cfc8bc"], [1, "#e0dace"]]);
      g.fillStyle = "rgba(255,255,255,0.22)";
      for (let y = 22; y < 256; y += 56) g.fillRect(18, y, 220, 6);
    }),
    pool: tex(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, "rgba(255,248,232,0.5)");
      r.addColorStop(0.6, "rgba(255,248,232,0.12)");
      r.addColorStop(1, "rgba(255,248,232,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 128, 128);
    }),
    glass: tex(256, 256, (g) => {
      g.fillStyle = "rgba(225,232,240,0.07)";
      g.fillRect(0, 0, 256, 256);
      for (const [x0, wd, a] of [[30, 70, 0.16], [150, 30, 0.1]] as const) {
        const l = g.createLinearGradient(x0, 0, x0 + wd, 0);
        l.addColorStop(0, "rgba(255,255,255,0)");
        l.addColorStop(0.5, `rgba(255,255,255,${a})`);
        l.addColorStop(1, "rgba(255,255,255,0)");
        g.save();
        g.transform(1, 0, -0.45, 1, 60, 0);
        g.fillStyle = l;
        g.fillRect(x0, 0, wd, 256);
        g.restore();
      }
    }),
  };
  return interiorTex;
}

/** The 1960 shopfront: shelves of cloth bolts behind a wooden counter, the shutter rolled up. */
function shopfront(g: Ctx, W: number, H: number) {
  g.fillStyle = "#4a3220";
  g.fillRect(0, 0, W, H);
  const ix = 24, iy = H * 0.14, iw = W - 48, ih = H - iy - 8;
  const warm = g.createLinearGradient(0, iy, 0, iy + ih);
  warm.addColorStop(0, "#f2d5a2");
  warm.addColorStop(1, "#b98448");
  g.fillStyle = warm;
  g.fillRect(ix, iy, iw, ih);
  const r = seeded(1960);
  const cloth = ["#b23a48", "#2f5d8a", "#d9a441", "#3f7d5a", "#ece5d2", "#7a4b8c", "#c96f3b", "#1f6f78"];
  for (const sy of [0.32, 0.52, 0.72]) {
    const y = iy + ih * sy;
    for (let x = ix + 12; x < ix + iw - 40; ) {
      const bw = 24 + r() * 18, bh = 18 + r() * 16;
      g.fillStyle = cloth[Math.floor(r() * cloth.length)];
      g.fillRect(x, y - bh, bw, bh);
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(x + bw - 4, y - bh, 4, bh);
      x += bw + 3;
    }
    g.fillStyle = "#6b4a2b";
    g.fillRect(ix, y, iw, 6);
  }
  g.fillStyle = "#6b4a2b";
  g.fillRect(ix, iy + ih * 0.8, iw, ih * 0.2);
  g.fillStyle = "#9a9a96";
  g.fillRect(0, 0, W, H * 0.14);
  g.fillStyle = "rgba(0,0,0,0.2)";
  for (let y = 4; y < H * 0.14; y += 7) g.fillRect(0, y, W, 2);
}

/** `lit`: the dusk version, its windows lit from inside. */
export function building(spec: BuildingSpec, fonts: Fonts, lit = false) {
  const { kind, w, h, d } = spec;
  const shop = kind === "shop";
  const g = new THREE.Group();
  const mats: THREE.Material[] = [];
  const texs: THREE.Texture[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const mat = <T extends THREE.Material>(m: T) => (mats.push(m), m);
  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, shade = true) => {
    geos.push(geo);
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = shade;
    g.add(o);
    return o;
  };
  const canvas = (cw: number, ch: number) => {
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = Math.max(8, Math.round(ch));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    texs.push(t);
    return { c, t, g: c.getContext("2d") as Ctx };
  };

  const BASE = 0.16;
  const fh = h * SHARE[kind].front, bh = h * SHARE[kind].board;
  const fw = w - 0.8;
  const room = kind === "showroom" || kind === "workshop"; // a real showroom behind clear glass
  const gw = kind === "workshop" ? fw * 0.46 : fw; // the glazed width (a workshop's showroom is on its left)
  const T = 0.3; // wall thickness
  const wall = mat(new THREE.MeshStandardMaterial({ color: shop ? 0xefe6d2 : 0xfbfaf7, roughness: 0.92 }));
  const pale = mat(new THREE.MeshStandardMaterial({ color: 0xe4e3de, roughness: 0.95 }));
  const box = (bw: number, bh2: number, bd: number, m: THREE.Material, x: number, y: number, z: number, shade = true) => mesh(new THREE.BoxGeometry(bw, bh2, bd), m, x, y, z, shade);

  // the plot with its forecourt, the volume, a roof cap and (on the modern buildings) the plant on the roof
  box(w + 3, BASE, d + 5.5, mat(new THREE.MeshStandardMaterial({ color: 0xf6f5f1, roughness: 1 })), 0, BASE / 2, (3.5 - d) / 2);
  if (room) {
    // a hollow shell: back, sides and roof, the wall above the glass, and the piers either side of it
    box(w, h, T, wall, 0, BASE + h / 2, -d + T / 2);
    box(T, h, d, wall, -w / 2 + T / 2, BASE + h / 2, -d / 2);
    box(T, h, d, wall, w / 2 - T / 2, BASE + h / 2, -d / 2);
    box(w, T, d, wall, 0, BASE + h - T / 2, -d / 2);
    box(w, h - fh - 0.05, T, wall, 0, BASE + fh + 0.05 + (h - fh - 0.05) / 2, -T / 2);
    box(0.4, fh + 0.05, T, wall, -w / 2 + 0.2, BASE + (fh + 0.05) / 2, -T / 2);
    box(0.4, fh + 0.05, T, wall, w / 2 - 0.2, BASE + (fh + 0.05) / 2, -T / 2);
  } else {
    box(w, h, d, wall, 0, BASE + h / 2, -d / 2);
  }
  box(w - 0.5, 0.1, d - 0.5, pale, 0, BASE + h + 0.05, -d / 2);
  if (!shop) {
    for (const x of [-w * 0.22, w * 0.18]) box(1.4, 0.9, 1.1, pale, x, BASE + h + 0.5, -d * 0.6);
  }

  if (room) {
    // ---- inside: a lit showroom (warm white walls with a gold line, a ceiling of light strips, a polished
    // floor), its products on white podiums under pools of light, seen through clear glass
    const I = interiorTextures();
    const litMat = (t: THREE.Texture) => mat(new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    const rx0 = -w / 2 + T, rx1 = kind === "showroom" ? w / 2 - T : -fw / 2 + gw;
    const rw = rx1 - rx0, rcx = (rx0 + rx1) / 2;
    const rd = d - T - 0.05, rh = h - T, rz = -0.05 - rd / 2;
    const face = (pw: number, ph: number, m: THREE.Material, x: number, y: number, z: number, rx: number, ry: number) => {
      const o = mesh(new THREE.PlaneGeometry(pw, ph), m, x, y, z, false);
      o.rotation.set(rx, ry, 0);
      return o;
    };
    face(rw, rd, litMat(I.floor), rcx, BASE + 0.015, rz, -Math.PI / 2, 0);
    face(rw, rd, litMat(I.ceil), rcx, BASE + rh - 0.01, rz, Math.PI / 2, 0);
    face(rw, rh, litMat(I.back), rcx, BASE + rh / 2, -d + T + 0.01, 0, 0);
    const sideMat = litMat(I.side);
    face(rd, rh, sideMat, rx0 + 0.01, BASE + rh / 2, rz, 0, Math.PI / 2);
    face(rd, rh, sideMat, rx1 - 0.01, BASE + rh / 2, rz, 0, -Math.PI / 2);
    if (kind === "workshop") box(T, h, d, wall, rx1 + T / 2, BASE + h / 2, -d / 2); // the wall between showroom and bays

    // the products, evenly along the room, a few metres in from the glass
    const products = spec.products ?? [];
    // (lit like the room: a bright top, a softer edge)
    const podium = [0xd9d4ca, 0xf7f5f0, 0xd9d4ca].map((c) => mat(new THREE.MeshBasicMaterial({ color: c, toneMapped: false })));
    const poolMat = mat(new THREE.MeshBasicMaterial({ map: I.pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    const slot = rw / Math.max(1, products.length);
    products.forEach((p, k) => {
      const len = p.height * p.aspect;
      const s = Math.min(1, (slot * 0.86) / len, (rh * 0.62) / p.height);
      const x = rx0 + slot * (k + 0.5), z = -0.05 - rd * 0.4;
      const r = Math.min(slot * 0.47, (len * s) / 2 + 0.5);
      mesh(new THREE.CylinderGeometry(r, r, 0.12, 48), podium, x, BASE + 0.08, z);
      const pool = mesh(new THREE.PlaneGeometry(r * 2.8, r * 2.8), poolMat, x, BASE + 0.03, z, false);
      pool.rotation.x = -Math.PI / 2;
      const v = renderSprite(p);
      v.rotation.y = Math.PI / 2; // its picture faces out through the glass
      v.scale.setScalar(s);
      v.position.set(x, BASE + 0.14, z);
      g.add(v);
    });

    // the glazing: clear glass with a faint sheen, slim dark mullions, a transom, rails, the door handles
    const gx = -fw / 2 + gw / 2, gy = BASE + 0.05 + fh / 2;
    const glassPane = mesh(new THREE.PlaneGeometry(gw, fh), mat(new THREE.MeshBasicMaterial({ map: I.glass, transparent: true, depthWrite: false, toneMapped: false })), gx, gy, 0.03, false);
    glassPane.renderOrder = 6;
    const frame = mat(new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.4, metalness: 0.6 }));
    const panes = Math.max(2, Math.round(gw / 2.8));
    for (let k = 0; k <= panes; k++) box(0.08, fh, 0.12, frame, -fw / 2 + (gw * k) / panes, gy, 0.04, false);
    box(gw, 0.07, 0.12, frame, gx, BASE + 0.05 + fh * 0.84, 0.04, false);
    box(gw, 0.12, 0.14, frame, gx, BASE + 0.11, 0.04, false);
    box(gw + 0.1, 0.12, 0.14, frame, gx, BASE + 0.05 + fh, 0.04, false);
    const door = -fw / 2 + (gw * Math.floor(panes / 2)) / panes;
    const steel = mat(new THREE.MeshStandardMaterial({ color: 0xd9d8d2, roughness: 0.3, metalness: 0.8 }));
    for (const dx of [-0.14, 0.14]) box(0.04, 1.1, 0.06, steel, door + dx, BASE + 1.15, 0.1, false);
  }

  // the painted parts of the front (the shop's open front, the warehouse's shutters, a workshop's service
  // bays), and the name board above it all (painted, so they read crisply at any size)
  const fx0 = kind === "workshop" ? -fw / 2 + gw + T : -fw / 2;
  const frontW = fw / 2 - fx0, frontX = (fx0 + fw / 2) / 2;
  const front = kind === "showroom" ? null : canvas(1536, (1536 * fh) / frontW);
  if (front) {
    if (kind === "workshop") box(frontW + 0.4, fh + 0.05, T, wall, frontX, BASE + (fh + 0.05) / 2, -T / 2);
    mesh(new THREE.PlaneGeometry(frontW, fh), mat(new THREE.MeshBasicMaterial({ map: front.t, toneMapped: false })), frontX, BASE + fh / 2 + 0.05, 0.02, false);
  }
  const board = canvas(2048, (2048 * bh) / w);
  mesh(new THREE.PlaneGeometry(w, bh), mat(new THREE.MeshBasicMaterial({ map: board.t, toneMapped: false })), 0, BASE + fh + 0.28 + bh / 2, 0.03, false);
  if (!shop) mesh(new THREE.BoxGeometry(w, 0.1, 0.1), mat(new THREE.MeshBasicMaterial({ color: 0xc9a24a, toneMapped: false })), 0, BASE + fh + 0.16, 0.06, false);

  // the cloth shop's striped awning
  if (shop) {
    const stripes = canvas(512, 64);
    for (let x = 0; x < 512; x += 32) {
      stripes.g.fillStyle = (x / 32) % 2 ? "#c9a24a" : "#f4eddc";
      stripes.g.fillRect(x, 0, 32, 64);
    }
    const awn = mesh(new THREE.PlaneGeometry(fw * 0.96, 1.9), mat(new THREE.MeshStandardMaterial({ map: stripes.t, roughness: 0.9, side: THREE.DoubleSide })), 0, BASE + fh - 0.4, 0.85);
    awn.rotation.x = -1.0;
  }

  const paintFront = () => {
    if (!front) return;
    const { g: c, c: cv } = front;
    const W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    if (shop) return shopfront(c, W, H);
    c.fillStyle = "#2a2c2f";
    c.fillRect(0, 0, W, H);
    if (kind === "workshop") {
      // two service bays, one open on its lit workshop
      const bw = (W - 36) / 2;
      shutter(c, 12, 0, bw, H, true, lit);
      shutter(c, 24 + bw, 0, bw, H);
      return;
    }
    // the warehouse: a small office, then three loading shutters
    const ow = Math.round(W * 0.2);
    glass(c, 0, 0, ow, H, 2, lit);
    const bw = (W - ow - 36) / 3;
    for (let k = 0; k < 3; k++) shutter(c, ow + 12 + k * (bw + 12), 0, bw, H, k === 1, lit);
  };

  const paintBoard = () => {
    const { g: c, c: cv } = board;
    const W = cv.width, H = cv.height;
    const name = spec.name.toUpperCase();
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (shop) {
      // a painted wooden signboard
      c.fillStyle = "#5a3b22";
      c.fillRect(0, 0, W, H);
      c.strokeStyle = "#d9b98a";
      c.lineWidth = 8;
      c.strokeRect(18, 14, W - 36, H - 28);
      fitFont(c, fonts, name, W * 0.8, Math.round(H * 0.46), 20);
      c.fillStyle = "#f3e6c8";
    } else {
      c.fillStyle = "#121213";
      c.fillRect(0, 0, W, H);
      fitFont(c, fonts, name, W * 0.8, Math.round(H * 0.44), 20);
      c.fillStyle = "#fafaf8";
    }
    c.fillText(name, W / 2, H / 2 + 4);
  };

  const repaint = () => {
    paintFront();
    paintBoard();
    texs.forEach((t) => (t.needsUpdate = true));
  };
  repaint();

  return {
    group: g,
    /** height of the roof, for the pin above it */
    top: BASE + h,
    repaint,
    /** the painted textures (to upload them right after a repaint, rather than on first sight) */
    textures: texs,
    dispose() {
      mats.forEach((m) => m.dispose());
      texs.forEach((t) => t.dispose());
      geos.forEach((x) => x.dispose());
    },
  };
}
