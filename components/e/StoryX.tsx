"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap, reducedMotion } from "@/lib/gsap";
import { stopNotes, verticals, type Category } from "@/lib/content";
import { realCart } from "./cart";
import { DELIVERY_HEIGHT, RENDERS, applianceDelivery, convoy, renderSprite } from "./fleet";
import { Pill, ease } from "./ui";
import { queueBuild, trackAsset } from "./loading";
import { warmUp } from "./batch";

const vert = (id: string) => verticals.find((v) => v.id === id)!;
// One act per era; each drives past as a convoy of the real models sold. The last act (the Tata Signa) stays.
const ACTS: { cat: Category; year: number; title: string; text: string; models: string[] }[] = [
  { cat: "heritage", year: 1960, title: "Yarn & Cloth Trading", text: stopNotes.heritage, models: ["Hand-cart of yarn & long cloth"] },
  { cat: "appliances", year: 1984, title: "Home Appliances", text: vert("appliances").summary, models: ["Samsung Bespoke AI refrigerator", "Bespoke AI washer", "Dishwasher", "Delivered on a Maruti Suzuki Super Carry"] },
  { cat: "two-wheelers", year: 1990, title: "Two-Wheelers", text: vert("two-wheelers").summary, models: ["Kinetic Honda", "Hero Splendor+", "Royal Enfield Bullet 350", "Ather 450"] },
  { cat: "cars", year: 2004, title: "Passenger Cars", text: vert("cars").summary, models: ["Maruti Suzuki Brezza · Arena", "Maruti Suzuki Victoris · Arena"] },
  { cat: "commercial", year: 2013, title: "Small Commercial", text: "Tata SCV since 2013 and Maruti Commercial since 2017: the small trucks and pickups that keep local business moving.", models: ["Tata Yodha", "Maruti Suzuki Super Carry"] },
  { cat: "commercial", year: 2016, title: "The Full Range", text: "Tata Commercial's full range since 2016, from light pickups to heavy-duty trucks.", models: ["Tata Prima 5530.S"] },
];

const icons: Record<string, React.ReactNode> = {
  appliances: <path d="M7 3h10v18H7zM7 10h10M10 6v2M10 13v3" />,
  "two-wheelers": (<><circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" /><path d="M5.5 16.5 9 11h6l3.5 5.5M15 11l-1.5-4H17" /></>),
  cars: (<><path d="M3 15v-3l2.5-5h13L21 12v3z" /><circle cx="7" cy="16.5" r="2" /><circle cx="17" cy="16.5" r="2" /></>),
  commercial: (<><path d="M2 5h12v10H2zM14 9h4.5L22 12.5V15h-8z" /><circle cx="6" cy="17" r="2" /><circle cx="18" cy="17" r="2" /></>),
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Timeline (share of the pinned scroll), after unitedcarriers.com's services sequence.
const PARADE_END = 0.48; // six acts drive through; the Tata Prima stops centre stage
const CAPTION_OUT = [0.47, 0.5] as const; // era captions fade before the floor moves
const RISE = [0.5, 0.58] as const; // the black floor rises into the businesses panel
const TRACK = [0.56, 0.78] as const; // the heading, then the business cards, slide across in one row
const PANEL_OUT = [0.77, 0.8] as const; // the row and its button clear
const ROADIFY = [0.79, 0.835] as const; // the black panel slides up beneath the truck and narrows into a road
const TILT = [0.835, 0.88] as const; // the camera tips over, from the side to straight down on the truck
const DRIVE = [0.88, 1] as const; // from above: along the road, into the bend, off onto the branch and away right
// (then, over one more screen of scroll, the camera dives into the dark road and the journey emerges from
// it: see JourneyX)

// Act motion: fast at the screen edges, a slow cruise through the centre (c ∈ [-1, 1]).
const glide = (u: number) => {
  const c = 2 * u - 1;
  return c * c * c * 0.82 + c * 0.18;
};

// the overhead picture of the truck (public/models/prima-tractor-top.webp), length ÷ width
const TOP_ASPECT = 2415 / 477;

// keyframed value (piecewise linear between [x, y] points, held at the ends)
const keyed = (k: [number, number][], x: number) => {
  if (x <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (x <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
  return k[k.length - 1][1];
};

/**
 * The road seen from above, drawn as a map in world units (pixels at zoom 1): a straight that bends down
 * into a vertical road, with a branch leaving to the right at a T-junction (chevron-hatched island,
 * rounded corners), three lanes of faint dashes, and the truck's overhead picture. Returns what the
 * frame loop needs to drive along it.
 */
function drawRoad(svg: SVGSVGElement, w: number, h: number) {
  const mobile = w < 768;
  const truckLen = w * (mobile ? 0.78 : 0.43);
  const truckWid = truckLen / TOP_ASPECT;
  const R = Math.min(h * 0.6, truckWid * 3.15); // road width
  const A = w * 0.75; // where the bend begins, ahead of the truck's first position (x = 0)
  const Rb = 1.73 * R; // bend radius (centreline)
  const V = A + Rb; // the vertical road's centreline
  const B = 0.98 * R; // the branch's centreline, below the straight
  const L = 3 * w; // straight behind the truck
  const END = Rb + 10 * h; // the vertical road runs on well past the frame
  const main = (o: number) => `M ${-L} ${-o} L ${A} ${-o} A ${Rb + o} ${Rb + o} 0 0 1 ${V + o} ${Rb} L ${V + o} ${END}`;
  const BX = V + 12 * w; // the branch runs off the frame to the right
  // the fillet where the bend's outer edge meets the branch's top edge
  const Ro = Rb + R / 2;
  const ti = Math.acos((Rb - (B - R / 2)) / Ro);
  const t1 = ti - 0.35;
  const P1 = [A + Ro * Math.sin(t1), Rb - Ro * Math.cos(t1)];
  const P2 = [A + Ro * Math.sin(ti) + 0.6 * R, B - R / 2];
  const C1 = [P1[0] + 0.4 * R * Math.cos(t1), P1[1] + 0.4 * R * Math.sin(t1)];
  const Q = [V + R / 2, B + R / 2]; // inside corner below the branch
  const f = 0.28 * R;
  // the truck's own route: along the straight, into the bend, then bearing left at the junction onto the
  // branch's centreline (an arc of radius r2 leaving the bend at angle tr) and away to the right
  const r2 = 1.1 * R;
  const tr = Math.acos(1 - B / (Rb + r2));
  const X2 = A + (Rb + r2) * Math.sin(tr);
  const route = `M ${-L} 0 L ${A} 0 A ${Rb} ${Rb} 0 0 1 ${A + Rb * Math.sin(tr)} ${Rb - Rb * Math.cos(tr)} A ${r2} ${r2} 0 0 0 ${X2} ${B} L ${BX} ${B}`;
  const dash = `stroke-dasharray="${0.145 * R} ${0.325 * R}"`;
  const line = (d: string, extra = "") => `<path d="${d}" fill="none" ${extra}/>`;
  const lanes = (o: number) => line(main(o), `stroke="rgba(255,255,255,0.17)" stroke-width="${0.017 * R}" ${dash}`);
  const branchLane = (y: number) => line(`M ${V + 0.8 * R} ${y} L ${BX} ${y}`, `stroke="rgba(255,255,255,0.17)" stroke-width="${0.017 * R}" ${dash}`);
  // faint edge lines, kept clear of the junction: the inside of the bend all the way, the outside only on
  // the straight and below the junction, and both sides of the branch
  const eo = 0.46 * R;
  const edge = (d: string) => line(d, `stroke="rgba(255,255,255,0.06)" stroke-width="${0.01 * R}"`);
  const edges = [main(-eo), `M ${-L} ${-eo} L ${A} ${-eo}`, `M ${V + eo} ${B + R / 2 + 0.28 * R} L ${V + eo} ${END}`, `M ${V + R / 2 + 0.28 * R} ${B + eo} L ${BX} ${B + eo}`, `M ${A + Ro * Math.sin(ti) + 0.6 * R} ${B - eo} L ${BX} ${B - eo}`].map(edge).join("");
  // the hatched island between the road running on down and the branch's nearside lane (clear of the route)
  const gore = `M ${V + 0.12 * R} ${B + 0.22 * R} Q ${V + 0.1 * R} ${B + 0.5 * R} ${V + 0.22 * R} ${B + 0.78 * R} Q ${V + 0.3 * R} ${B + 0.5 * R} ${V + 0.72 * R} ${B + 0.42 * R} Z`;
  svg.innerHTML = `
    <defs>
      <pattern id="hatch" width="${0.06 * R}" height="${0.06 * R}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="${0.025 * R}" height="${0.06 * R}" fill="rgba(255,255,255,0.16)"/>
      </pattern>
    </defs>
    <g data-world>
      <path data-route d="${route}" fill="none" stroke="none"/>
      <g data-surface fill="#0a0a0b">
        <path d="M ${-L} ${-R / 2} L ${A} ${-R / 2} A ${Rb + R / 2} ${Rb + R / 2} 0 0 1 ${V + R / 2} ${Rb} L ${V + R / 2} ${END} L ${V - R / 2} ${END} L ${V - R / 2} ${Rb} A ${Rb - R / 2} ${Rb - R / 2} 0 0 0 ${A} ${R / 2} L ${-L} ${R / 2} Z"/>
        <rect x="${V}" y="${B - R / 2}" width="${BX - V}" height="${R}"/>
        <path d="M ${P1[0]} ${P1[1]} C ${C1[0]} ${C1[1]} ${P2[0] - 0.4 * R} ${P2[1]} ${P2[0]} ${P2[1]} L ${P2[0]} ${B} L ${A + Rb * Math.sin(t1)} ${Rb - Rb * Math.cos(t1)} Z"/>
        <path d="M ${Q[0] - 0.03 * R} ${Q[1] - 0.03 * R} L ${Q[0] + f} ${Q[1] - 0.03 * R} L ${Q[0] + f} ${Q[1]} Q ${Q[0]} ${Q[1]} ${Q[0]} ${Q[1] + f} L ${Q[0] - 0.03 * R} ${Q[1] + f} Z"/>
      </g>
      <g data-lanes>
        <path d="${gore}" fill="url(#hatch)" stroke="rgba(255,255,255,0.22)" stroke-width="${0.008 * R}"/>
        ${edges}
        ${lanes(0.19 * R)}${lanes(-0.19 * R)}
        ${branchLane(B - 0.19 * R)}${branchLane(B + 0.19 * R)}
      </g>
      <image data-truck href="/models/prima-tractor-top.webp" width="${truckLen}" height="${truckWid}" preserveAspectRatio="none"/>
    </g>`;
  const path = svg.querySelector("[data-route]") as SVGPathElement;
  const zOut = mobile ? 0.45 : 0.55;
  // the closing view, held still while the truck drives off: the junction a little below the middle on
  // desktop (the straight across the top, the branch to the right), centre-right on a phone
  const jx = V - ((mobile ? 0.62 : 0.5) * w - w / 2) / zOut;
  const jy = B - ((mobile ? 0.5 : 0.62) * h - h / 2) / zOut;
  return {
    R, A, L, truckLen, mobile, zOut, jx, jy,
    // the point the closing dive pushes into: plain asphalt on the branch, clear of the markings
    tx: V + (mobile ? 0.9 : 1.6) * R,
    ty: B,
    sExit: L + A + (Rb + r2) * tr, // where the route joins the branch's straight
    // how far past the junction the truck must go to leave the frame on the right
    offscreen: jx + w / 2 / zOut + truckLen * 0.6 - X2,
    world: svg.querySelector("[data-world]") as SVGGElement,
    surface: svg.querySelector("[data-surface]") as SVGGElement,
    lanes: svg.querySelector("[data-lanes]") as SVGGElement,
    truck: svg.querySelector("[data-truck]") as SVGImageElement,
    at: (s: number) => path.getPointAtLength(s),
  };
}

/**
 * The centrepiece (pinned), modelled on unitedcarriers.com's services sequence. A white studio with a
 * black floor:
 *  1. the group's vehicles drive past one per era (cart → van → scooter → car), the truck stays;
 *  2. the black floor rises into the businesses panel while giant type slides behind the truck, and the
 *     heading and the business cards slide across in one row;
 *  3. the panel slides up beneath the truck and narrows into a road, and the camera tips over to look
 *     straight down on it;
 *  4. from above, the truck drives on, round a bend, and turns down at a T-junction.
 */
export default function StoryX() {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const roadSvg = useRef<SVGSVGElement>(null);
  const speed = useRef<HTMLParagraphElement>(null);
  const [act, setAct] = useState(0);

  // built through the load queue, one scene per task, while the preloader is still up
  useEffect(() => queueBuild(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(-6, 16, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -10, near: 1, far: 60 });
    sun.shadow.radius = 5;
    scene.add(sun);

    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.22 });
    const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(300, 40), shadowMat);
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.z = -14;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);
    const front = new THREE.Mesh(new THREE.BoxGeometry(600, 80, 1), new THREE.MeshBasicMaterial({ color: 0x0a0a0b }));
    front.position.set(0, -40, 6);
    scene.add(front);
    // lane markings on the studio floor: they run beneath the parade so the vehicles read as driving
    const laneTex = (() => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 16;
      const g = c.getContext("2d")!;
      g.fillStyle = "rgba(17,17,18,0.55)";
      g.fillRect(0, 4, 150, 8);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = THREE.RepeatWrapping;
      t.repeat.set(60, 1);
      return t;
    })();
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(180, 0.35), new THREE.MeshBasicMaterial({ map: laneTex, transparent: true, depthWrite: false }));
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.006, 3.2);
    scene.add(lane);

    // official product renders (Hero, Royal Enfield, Samsung) as billboards; the rest are 3D models
    const acts = [
      { g: realCart(), len: 3.8 },
      { g: applianceDelivery(), len: RENDERS.superCarry.len }, // Samsung appliances out on delivery
      convoy([{ g: renderSprite(RENDERS.kinetic), len: RENDERS.kinetic.len }, { g: renderSprite(RENDERS.splendor), len: RENDERS.splendor.len }, { g: renderSprite(RENDERS.bullet), len: RENDERS.bullet.len }, { g: renderSprite(RENDERS.ather), len: RENDERS.ather.len }], 0.7),
      convoy([{ g: renderSprite(RENDERS.brezza), len: RENDERS.brezza.len }, { g: renderSprite(RENDERS.victoris), len: RENDERS.victoris.len }], 1.2),
      convoy([{ g: renderSprite(RENDERS.yodha), len: RENDERS.yodha.len }, { g: renderSprite(RENDERS.superCarry), len: RENDERS.superCarry.len }], 1.2),
      // the Tata Prima tractor with its tipper trailer (side view, then the view from above)
      { g: renderSprite(RENDERS.prima), len: RENDERS.prima.len },
    ];
    const fleet: THREE.Group[] = acts.map((a) => a.g);
    const lengths = acts.map((a) => a.len);
    fleet.forEach((v) => {
      v.rotation.y = Math.PI / 2;
      v.traverse((o) => { const m = o as THREE.Mesh; m.castShadow = !(m.material as THREE.Material | undefined)?.transparent; });
      v.visible = false;
      scene.add(v);
    });
    // overall height of each act (metres), used with its length to fit it in frame
    const heights = [1.9, DELIVERY_HEIGHT, 1.4, 1.75, 1.95, 3.65];
    let fw = 20, fh0 = 9.5;
    let floorBase = 0.38;
    // how far the black floor rises for the businesses panel (higher on short screens, so the heading and
    // the cards beneath it both fit)
    let floorTop = 0.58;
    let scales = lengths.map(() => 1);
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      const mobile = w < 768;
      fh0 = mobile ? 11 : 9.5;
      fw = (fh0 * w) / h;
      // fit every act by width AND height (the stage above the floor, minus room for the header)
      floorBase = mobile ? 0.5 : 0.38;
      floorTop = mobile ? 0.6 : h < 760 ? 0.63 : 0.58;
      const stage = fh0 * (1 - floorBase) * (mobile ? 0.6 : 0.62);
      // (the hand-cart may be shown larger: it is the smallest act, and its detail is worth seeing)
      scales = lengths.map((l, i) => Math.min(i === 0 ? (mobile ? 1.0 : 1.7) : mobile ? 1.0 : 1.3, (fw * (mobile ? 0.92 : 0.72)) / l, stage / heights[i]));
      fleet.forEach((v, i) => v.scale.setScalar(scales[i]));
      map = drawRoad(roadSvg.current!, w, h);
    };
    let map: ReturnType<typeof drawRoad>;
    resize();
    window.addEventListener("resize", resize);

    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      // (ends one screen before the section does: that last screen is the dissolve into the journey)
      scrollTrigger: { trigger: root.current, start: "top top", end: "bottom 200%", scrub: 0.8 },
    });

    const still = reducedMotion();
    const prevX = fleet.map(() => 0);
    const edge = new THREE.Vector3();
    const CRUISE = 4.2; // m/s: the fleet keeps driving even while the page is not being scrolled
    let lastNow = performance.now();
    let laneTravel = 0;
    let lastAct = -1;
    let raf = 0;
    let lastP = 0;
    let kmh = 0;
    let floorSide = 0; // the floor line on screen, as last seen from the side
    const picLen = RENDERS.prima.height * RENDERS.prima.aspect; // the truck's pictures span this length

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const p = state.p;
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      const w = el.clientWidth, h = el.clientHeight;
      const rise = smooth(RISE[0], RISE[1], p);
      const tilt = smooth(TILT[0], TILT[1], p);
      const roadK = smooth(ROADIFY[0], ROADIFY[1], p);
      const roadOn = p >= ROADIFY[0]; // the road band has taken the black over from the 3D floor
      const aerial = p >= TILT[1]; // the road map (and its truck) has taken over from the 3D scene
      const last = fleet.length - 1;
      const anchorX = map.mobile ? 0.5 : 0.415; // where the truck sits across the screen, seen from above
      // the hand-over to the journey, over the section's last screen of scroll (0 → 1), read from the scroll
      // position itself rather than the eased progress, so this scene and the journey always move together
      const dive = clamp01((2 * window.innerHeight - root.current!.getBoundingClientRect().bottom) / window.innerHeight);

      // ---- camera: a near side-on studio view that tips over, about the truck, to look straight down,
      // framing the truck's overhead picture exactly where the road map draws it
      const floor = lerp(floorBase, Math.max(floorTop, floorBase + 0.1), rise);
      fleet[last].userData.setView?.(smooth(0.42, 0.62, tilt)); // its side picture gives way to the view from above
      const fh = fh0 * lerp(1, 1.2, rise);
      const fwSide = (fh * w) / h;
      const fwTop = (picLen * scales[last] * w) / map.truckLen;
      const fhTop = (fwTop * h) / w;
      camera.left = lerp(-fwSide / 2, -anchorX * fwTop, tilt);
      camera.right = lerp(fwSide / 2, (1 - anchorX) * fwTop, tilt);
      camera.top = lerp(fh * (1 - floor), fhTop / 2, tilt);
      camera.bottom = lerp(-fh * floor, -fhTop / 2, tilt);
      const a = THREE.MathUtils.degToRad(lerp(4.5, 89.9, tilt));
      const ty = lerp(0.15, 0, tilt);
      camera.position.set(0, ty + Math.sin(a) * 60, Math.cos(a) * 60);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, ty, 0);
      camera.updateProjectionMatrix();
      const fwNow = camera.right - camera.left;

      // ---- parade: one act on stage at a time; the last one (Tata Signa) stops centre stage
      const s = lerp(0.2, fleet.length - 0.5, clamp01(p / PARADE_END));
      fleet.forEach((v, i) => {
        const OVERLAP = 0.14;
        let u = (s - i + OVERLAP) / (1 + 2 * OVERLAP);
        const isLast = i === last;
        if (isLast) u = Math.min(u, 0.5);
        if (u < 0 || u > 1 || (isLast && aerial)) {
          v.visible = false;
          prevX[i] = 0;
          return;
        }
        v.visible = true;
        const scale = scales[i];
        const D = fwNow / 2 + (lengths[i] * scale) / 2 + 0.4;
        const x = isLast && tilt > 0 ? 0 : D * glide(u);
        const firstFrame = !v.userData.seen;
        v.userData.seen = true;
        v.position.x = x;
        const dx = firstFrame ? 0 : x - prevX[i];
        prevX[i] = x;
        // wheels turn with the on-screen motion plus a steady cruise, so nothing sits frozen mid-frame
        const roll = still ? 0 : Math.max(-0.5, Math.min(0.5, dx)) + CRUISE * dt * scale;
        (v.userData.wheels ?? []).forEach((wh: { obj: THREE.Object3D; r: number }) => (wh.obj.rotation.x += roll / (wh.r * scale)));
        // the trader's steps: an unhurried pace (a stride per ~2 m of travel), a little longer to match
        if (v.userData.walker) v.userData.walker.userData.walk((x + laneTravel * scale) * 1.8, 0.78);
        v.userData.move?.(roll, scale);
        v.position.y = still || tilt > 0 ? 0 : Math.abs(Math.sin(now / 90)) * 0.012 * Math.min(1, Math.abs(roll) * 40);
      });
      if (!still) laneTravel += CRUISE * dt;
      laneTex.offset.x = laneTravel / 3;
      (lane.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(RISE[0] - 0.02, RISE[0] + 0.02, p);

      // ---- set dressing: the 3D black floor hands over to the road band (identical at that moment), and
      // the studio floor's shadows fade as the band slides up
      front.visible = !roadOn;
      shadowMat.opacity = 0.22 * (1 - roadK);
      renderer.render(scene, camera);

      // ---- HTML layers follow the floor line: the black floor's far top edge as it appears on screen (seen
      // slightly from above, it sits a little below the y = 0 line), so the panel and its heading start
      // exactly where the black does
      if (tilt === 0) floorSide = ((1 - edge.set(0, 0, 5.5).project(camera).y) / 2) * h;
      const floorPx = floorSide;
      if (panel.current) panel.current.style.top = `${floorPx}px`;
      if (word.current) {
        word.current.style.bottom = `${h - floorPx + (h < 700 ? 8 : 16)}px`;
        word.current.style.transform = `translateX(${lerp(40, -60, smooth(RISE[0], TRACK[1], p))}%)`;
        word.current.style.opacity = String(smooth(RISE[0], RISE[1], p) * (1 - smooth(PANEL_OUT[0], PANEL_OUT[1], p)));
      }
      if (caption.current) {
        const o = 1 - smooth(CAPTION_OUT[0], CAPTION_OUT[1], p);
        caption.current.style.opacity = String(o);
        caption.current.style.visibility = o < 0.01 ? "hidden" : "visible";
      }
      // the heading, the paragraph and the cards slide across in one row; the button stays put
      const shown = smooth(TRACK[0], TRACK[0] + 0.02, p) * (1 - smooth(PANEL_OUT[0], PANEL_OUT[1], p));
      if (track.current) {
        const k = clamp01((p - TRACK[0]) / (TRACK[1] - TRACK[0]));
        const tw = track.current.scrollWidth;
        track.current.style.transform = `translateX(${lerp(w, -(tw - w), k)}px)`;
        track.current.style.opacity = String(shown);
        track.current.style.visibility = shown < 0.01 ? "hidden" : "visible";
      }
      if (pill.current) {
        pill.current.style.opacity = String(shown);
        pill.current.style.visibility = shown < 0.01 ? "hidden" : "visible";
      }

      // ---- the road: the band rises from the floor line and narrows onto the truck; then, seen from
      // above, the map takes over (the band and the map's straight are the same pixels at that moment)
      const R = map.R;
      if (band.current) {
        const top = lerp(floorPx, h / 2 - R / 2, roadK), bottom = lerp(h, h / 2 + R / 2, roadK);
        band.current.style.display = roadOn && !aerial ? "block" : "none";
        band.current.style.top = `${top}px`;
        band.current.style.height = `${bottom - top}px`;
      }
      if (roadSvg.current) roadSvg.current.style.display = roadOn ? "block" : "none";
      if (roadOn) {
        // where the truck is on its route (arc length), and how the map is framed: following the truck, then
        // easing out to a still view of the junction as it bears off onto the branch and leaves on the right
        const s0 = map.L;
        const sA = s0 + map.A;
        const u = clamp01((p - DRIVE[0]) / (DRIVE[1] - DRIVE[0]));
        const s = p < DRIVE[0]
          ? lerp(s0 - 0.3 * w, s0, clamp01((p - ROADIFY[0]) / (DRIVE[0] - ROADIFY[0])))
          : keyed([[0, s0], [0.25, s0 + map.A - 0.32 * w], [0.42, sA], [0.62, map.sExit], [1, map.sExit + map.offscreen]], u);
        const z = lerp(1, map.zOut, smooth(0.25, 0.5, u));
        // the truck's picture spans from a point behind it on the route to a point ahead
        const half = map.truckLen * 0.4;
        const fp = map.at(s + half), bp = map.at(Math.max(0, s - half));
        const cx = (fp.x + bp.x) / 2, cy = (fp.y + bp.y) / 2;
        const ang = (Math.atan2(fp.y - bp.y, fp.x - bp.x) * 180) / Math.PI;
        const hold = smooth(0.22, 0.5, u);
        // then the dive: the camera glides forward into the empty branch road until its dark asphalt fills
        // the screen (an even, exponential push in), and the journey emerges from that darkness
        const e = smooth(0, 0.55, dive);
        const camX = lerp(lerp(cx - (anchorX * w - w / 2) / z, map.jx, hold), map.tx, e);
        const camY = lerp(lerp(cy, map.jy, hold), map.ty, e);
        const zz = z * Math.pow(16, e);
        map.world.setAttribute("transform", `translate(${w / 2} ${h / 2}) scale(${zz}) translate(${-camX} ${-camY})`);
        map.truck.setAttribute("transform", `translate(${cx} ${cy}) rotate(${ang}) translate(${-map.truckLen / 2} ${-map.truckLen / TOP_ASPECT / 2})`);
        map.truck.style.display = aerial ? "inline" : "none";
        map.surface.style.display = aerial ? "inline" : "none";
        map.lanes.style.opacity = String(roadK * (1 - smooth(0, 0.28, dive)));
      }

      // ---- the speed readout (as the reference's), from how fast the page is being scrolled
      const vel = Math.abs(p - lastP) / Math.max(dt, 1 / 240);
      lastP = p;
      kmh += (Math.min(99, vel * (root.current?.offsetHeight ?? 0) * 0.012) - kmh) * 0.1;
      if (speed.current) speed.current.textContent = `${String(Math.round(kmh)).padStart(2, "0")} km/h`;

      if (speed.current) speed.current.style.opacity = String(1 - smooth(0, 0.3, dive));

      const idx = Math.min(last, Math.max(0, Math.floor(s)));
      if (idx !== lastAct) {
        lastAct = idx;
        setAct(idx);
      }
    };
    // compile every vehicle's shaders and upload the scene now, behind the preloader, instead of on first sight
    frame(performance.now());
    cancelAnimationFrame(raf);
    warmUp(renderer, scene, camera, trackAsset());
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(frame);
    });
    io.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener("resize", resize);
      scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      shadowMat.dispose();
      fleet[0].userData.dispose?.();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // (further down the page: built after the opening is revealed, not before)
  }, { defer: true }), []);

  const a = ACTS[act];
  return (
    <section id="businesses" ref={root} className="relative h-[1200vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={bg} className="absolute inset-0 bg-x-white" />
        <div ref={word} className="absolute left-0 whitespace-nowrap opacity-0 will-change-transform" aria-hidden>
          <span className="wide text-[clamp(110px,19vw,330px)] text-[#e6e6e3]">Our businesses</span>
        </div>
        {/* the road, beneath the 3D scene so the truck rides on it: first a band that the black panel becomes,
            then the map seen from above */}
        <div ref={band} className="absolute inset-x-0 bg-x-black" style={{ display: "none" }} aria-hidden />
        <svg ref={roadSvg} className="absolute inset-0 h-full w-full" style={{ display: "none" }} aria-hidden />
        <div ref={host} className="absolute inset-0" aria-hidden />
        {/* the speed readout, top left (as the reference's) */}
        <p ref={speed} className="micro pointer-events-none absolute left-4 top-[88px] z-10 tabular-nums text-x-mute md:left-8 md:top-[100px]" aria-hidden>00 km/h</p>

        {/* the black floor panel */}
        <div ref={panel} className="absolute inset-x-0 bottom-0 overflow-hidden text-white" style={{ top: "62%" }}>
          {/* era captions during the parade */}
          <div ref={caption} className="absolute inset-x-0 top-0 grid grid-cols-[auto_1fr] items-start gap-6 px-4 pt-8 md:grid-cols-[1fr_1.2fr_auto] md:px-8 md:pt-12">
            <p className="micro text-white/50">
              {String(act + 1).padStart(2, "0")} <span className="text-white/25">/ {String(ACTS.length).padStart(2, "0")}</span>
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={act}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease }}
                className="max-md:col-span-2"
              >
                <p className="micro text-x-gold">Since {a.year}</p>
                <h3 className="wide mt-3 text-[clamp(28px,3.4vw,52px)]">{a.title}</h3>
                {/* on short screens the paragraph gives way, so the full list of models on stage stays visible */}
                <p className="mt-4 hidden max-w-xl text-[15px] leading-relaxed text-white/60 md:block [@media(max-height:720px)]:!hidden">{a.text}</p>
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                  {a.models.map((m) => (
                    <li key={m} className="micro flex items-center gap-2 text-white/85">
                      <span className="h-px w-3 bg-x-gold" />
                      {m}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
            <div className="hidden gap-1.5 md:flex">
              {ACTS.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === act ? "w-10 bg-x-gold" : "w-4 bg-white/20"}`} />
              ))}
            </div>
          </div>

          {/* the businesses, once the floor has risen: the heading, its paragraph and the cards in one row that
              slides across (so they never run over each other), above a button that stays put */}
          <div className="absolute inset-x-0 bottom-[140px] top-0 flex items-center md:bottom-[92px]">
            <div ref={track} className="flex w-max items-center opacity-0 will-change-transform" style={{ visibility: "hidden" }}>
              <h2 className="wide w-[88vw] shrink-0 px-4 text-[clamp(26px,3.3vw,56px)] sm:w-[66vw] md:px-8 lg:w-[60vw] [@media(max-height:700px)]:text-[clamp(24px,2.9vw,46px)]">
                Everything you drive.<br />Everything you use.<br /><span className="text-white/35">Under one group.</span>
              </h2>
              <p className="w-[80vw] shrink-0 px-6 text-[15px] leading-relaxed text-white/60 sm:w-[46vw] lg:mr-[8vw] lg:w-[26vw]">
                From the kitchen to the highway: four businesses, one standard of service, from the first enquiry to every visit after.
              </p>
              {verticals.map((v) => (
                <article key={v.id} className="w-[80vw] shrink-0 border-l border-white/15 px-6 sm:w-[46vw] lg:w-[25vw]">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-white stroke-[1.4] [@media(max-height:760px)]:h-6 [@media(max-height:760px)]:w-6" strokeLinecap="round" strokeLinejoin="round">{icons[v.id]}</svg>
                  <h3 className="wide mt-5 text-[clamp(18px,1.6vw,24px)] !leading-[1.05] [@media(max-height:760px)]:mt-3">{v.title}</h3>
                  <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/60 [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:text-[13px]">{v.summary}</p>
                  <p className="micro mt-4 text-x-gold [@media(max-height:760px)]:mt-3">Since {v.since} · {v.brands.slice(0, 3).join(" · ")}</p>
                </article>
              ))}
            </div>
          </div>
          {/* (on phones, clear of the design switcher pinned to the bottom-left corner) */}
          <div ref={pill} className="absolute inset-x-0 bottom-[84px] flex justify-center opacity-0 md:bottom-8" style={{ visibility: "hidden" }}>
            <Pill href="#dealerships" dark>Our showrooms</Pill>
          </div>
        </div>
      </div>
    </section>
  );
}
