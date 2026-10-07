"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap, reducedMotion } from "@/lib/gsap";
import { stopNotes, verticals, type Category } from "@/lib/content";
import { makeMaterials } from "@/components/diorama/kit";
import { car, deliveryVan, handcart, scooter, truck } from "@/components/diorama/models";
import { ease } from "./ui";

const ACTS: { cat: Category; year: number; title: string; text: string }[] = [
  { cat: "heritage", year: 1960, title: "Yarn & Cloth Trading", text: stopNotes.heritage },
  ...verticals.map((v) => ({ cat: v.id as Category, year: v.since, title: v.title, text: v.summary })),
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
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

// Timeline (share of the pinned scroll)
const PARADE_END = 0.42; // five vehicles drive past; the truck stays
const RISE = [0.42, 0.52] as const; // the black floor rises and becomes the businesses panel
const CARDS = [0.5, 0.8] as const; // business cards slide across
const FLIP = [0.8, 0.97] as const; // camera turns to look straight down on the truck

function roadTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#151517";
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = "rgba(255,255,255,0.85)";
  for (let x = 0; x < 512; x += 64) g.fillRect(x, 62, 34, 4);
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.fillRect(0, 6, 512, 2);
  g.fillRect(0, 120, 512, 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(12, 1);
  t.anisotropy = 8;
  return t;
}

/**
 * The centrepiece (pinned 1000vh). A white studio with a black floor:
 *  1. the group's vehicles drive past one per era (cart → van → scooter → car), the truck stays;
 *  2. the black floor rises into the businesses panel while giant type slides behind the truck;
 *  3. the business cards slide across;
 *  4. the camera turns to look straight down, and the truck continues on to the road below.
 */
export default function StoryX() {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(0);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(300, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.z = -14;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);
    const front = new THREE.Mesh(new THREE.BoxGeometry(600, 80, 1), new THREE.MeshBasicMaterial({ color: 0x0a0a0b }));
    front.position.set(0, -40, 6);
    scene.add(front);
    // seen from above: a black ground with a lane-marked road
    const darkGround = new THREE.Mesh(new THREE.PlaneGeometry(600, 300), new THREE.MeshBasicMaterial({ color: 0x0a0a0b, transparent: true, opacity: 0 }));
    darkGround.rotation.x = -Math.PI / 2;
    darkGround.position.y = -0.02;
    scene.add(darkGround);
    const roadTex = roadTexture();
    const road = new THREE.Mesh(new THREE.PlaneGeometry(240, 7), new THREE.MeshBasicMaterial({ map: roadTex, transparent: true, opacity: 0 }));
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.01;
    scene.add(road);

    const M = makeMaterials();
    const rand = rng(11);
    const fleet: THREE.Group[] = [handcart(M, rand), deliveryVan(M), scooter(M, rand, 0xc9a24a), car(M, 0x121214), truck(M, 0x121214, 0xf2f2ef)];
    new THREE.TextureLoader().loadAsync("/brand/logo-mark.png").then((logo) => {
      logo.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.6 });
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.9), mat);
        p.position.set(s * 0.99, 1.55, -0.6);
        p.rotation.y = (s * Math.PI) / 2;
        fleet[1].add(p);
      }
      const big = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), mat);
      big.position.set(1.12, 1.75, -0.95);
      big.rotation.y = Math.PI / 2;
      fleet[4].add(big);
      const big2 = big.clone();
      big2.position.x = -1.12;
      big2.rotation.y = -Math.PI / 2;
      fleet[4].add(big2);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), mat);
      top.position.set(0, 2.77, -0.95);
      top.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      fleet[4].add(top);
    }).catch(() => {});
    fleet.forEach((v) => {
      v.rotation.y = Math.PI / 2;
      v.traverse((o) => ((o as THREE.Mesh).castShadow = true));
      v.visible = false;
      scene.add(v);
    });
    const lengths = [5.2, 4.6, 2.4, 4.4, 7.4];

    let fw = 20, fh0 = 9.5, scale = 1;
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      const mobile = w < 768;
      fh0 = mobile ? 13 : 9.5;
      fw = (fh0 * w) / h;
      scale = Math.min(1.25, (fw * 0.78) / Math.max(...lengths));
      fleet.forEach((v) => v.scale.setScalar(scale));
    };
    resize();
    window.addEventListener("resize", resize);

    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
    });

    const still = reducedMotion();
    const prevX = fleet.map(() => 0);
    let lastAct = -1;
    let raf = 0;
    const white = new THREE.Color(0xfafaf8), black = new THREE.Color(0x0a0a0b), mix = new THREE.Color();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const p = state.p;
      const w = el.clientWidth, h = el.clientHeight;
      const rise = smooth(RISE[0], RISE[1], p);
      const flip = smooth(FLIP[0], FLIP[1], p);

      // floor line: 38% from the bottom during the parade, 62% once the panel has risen
      const floor = lerp(0.38, 0.58, rise);
      const fh = fh0 * lerp(1, 1.25, rise) * lerp(1, 0.75, flip);
      const fwNow = (fh * w) / h;
      const a = lerp(THREE.MathUtils.degToRad(4.5), Math.PI / 2 - 0.0001, flip);
      camera.left = -fwNow / 2;
      camera.right = fwNow / 2;
      camera.top = fh * lerp(1 - floor, 0.5, flip);
      camera.bottom = -fh * lerp(floor, 0.5, flip);
      camera.updateProjectionMatrix();
      const target = new THREE.Vector3(0, lerp(0.15, 0, flip), 0);
      camera.position.set(0, target.y + Math.sin(a) * 60, Math.cos(a) * 60);
      camera.up.set(0, Math.cos(a), -Math.sin(a));
      camera.lookAt(target);

      // parade: each act enters, holds and exits; the last one (truck) stays
      const s = clamp01(p / PARADE_END) * (fleet.length - 0.5);
      fleet.forEach((v, i) => {
        const t = s - i;
        const last = i === fleet.length - 1;
        if (t < -0.02 || (!last && t > 1.02)) {
          v.visible = false;
          return;
        }
        v.visible = true;
        const span = fwNow / 2 + lengths[i] * scale;
        let x: number;
        if (t < 0.4) x = -span + span * (1 - Math.pow(1 - clamp01(t / 0.4), 3));
        else if (last || t < 0.6) x = (Math.min(t, 0.6) - 0.5) * 0.6;
        else x = 0.06 + span * Math.pow(clamp01((t - 0.6) / 0.4), 3);
        if (last) x += flip * 2.2 + smooth(FLIP[1], 1, p) * 6;
        v.position.x = x;
        const dx = x - prevX[i];
        prevX[i] = x;
        (v.userData.wheels ?? []).forEach((wh: { obj: THREE.Object3D; r: number }) => (wh.obj.rotation.x += dx / (wh.r * scale)));
        if (v.userData.walker) v.userData.walker.userData.walk(x * 3, 0.7);
        v.position.y = still ? 0 : Math.abs(Math.sin(now / 90)) * 0.012 * Math.min(1, Math.abs(dx) * 40);
      });
      roadTex.offset.x = -p * 30;

      // top-down dressing
      (darkGround.material as THREE.MeshBasicMaterial).opacity = smooth(0.15, 0.7, flip);
      (road.material as THREE.MeshBasicMaterial).opacity = smooth(0.35, 0.9, flip);
      (shadowFloor.material as THREE.ShadowMaterial).opacity = 0.22 * (1 - flip);
      if (bg.current) bg.current.style.backgroundColor = `#${mix.copy(white).lerp(black, smooth(0.2, 0.8, flip)).getHexString()}`;
      renderer.render(scene, camera);

      // HTML layers follow the floor line
      const floorPx = (1 - floor) * h;
      if (panel.current) {
        panel.current.style.top = `${floorPx}px`;
        panel.current.style.opacity = String(1 - smooth(0, 0.35, flip));
      }
      if (word.current) {
        word.current.style.bottom = `${h - floorPx + (h < 700 ? 8 : 16)}px`;
        word.current.style.transform = `translateX(${lerp(55, -55, smooth(RISE[0] - 0.05, CARDS[1], p))}%)`;
        word.current.style.opacity = String(smooth(RISE[0] - 0.06, RISE[0], p) * (1 - smooth(0, 0.3, flip)));
      }
      if (caption.current) caption.current.style.opacity = String(1 - smooth(RISE[0] - 0.03, RISE[0] + 0.02, p));
      if (head.current) {
        const o = smooth(RISE[0] + 0.03, RISE[1], p);
        head.current.style.opacity = String(o);
        head.current.style.transform = `translateY(${(1 - o) * 40}px)`;
      }
      if (track.current) {
        const k = smooth(CARDS[0], CARDS[1], p);
        const tw = track.current.scrollWidth;
        track.current.style.transform = `translateX(${lerp(w * 0.9, -(tw - w * 0.92), k)}px)`;
        track.current.style.opacity = String(smooth(CARDS[0] - 0.02, CARDS[0] + 0.04, p));
      }

      const idx = Math.min(fleet.length - 1, Math.max(0, Math.floor(s)));
      if (idx !== lastAct) {
        lastAct = idx;
        setAct(idx);
      }
    };
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
      roadTex.dispose();
      M.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const a = ACTS[act];
  return (
    <section id="businesses" ref={root} className="relative h-[1000vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={bg} className="absolute inset-0 bg-x-white" />
        <div ref={word} className="absolute left-0 whitespace-nowrap opacity-0 will-change-transform" aria-hidden>
          <span className="wide text-[clamp(110px,19vw,330px)] text-[#e6e6e3]">Our businesses</span>
        </div>
        <div ref={host} className="absolute inset-0" aria-hidden />

        {/* the black floor panel */}
        <div ref={panel} className="absolute inset-x-0 bottom-0 overflow-hidden text-white" style={{ top: "62%" }}>
          {/* era captions during the parade */}
          <div ref={caption} className="absolute inset-x-0 top-0 grid grid-cols-[auto_1fr] items-start gap-6 px-4 pt-8 md:grid-cols-[1fr_1.2fr_auto] md:px-8 md:pt-12">
            <p className="micro text-white/50">
              {String(act + 1).padStart(2, "0")} <span className="text-white/25">/ 0{ACTS.length}</span>
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={a.cat}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease }}
                className="max-md:col-span-2"
              >
                <p className="micro text-x-gold">Since {a.year}</p>
                <h3 className="wide mt-3 text-[clamp(28px,3.4vw,52px)]">{a.title}</h3>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">{a.text}</p>
              </motion.div>
            </AnimatePresence>
            <div className="hidden gap-1.5 md:flex">
              {ACTS.map((x, i) => (
                <span key={x.cat} className={`h-1 rounded-full transition-all duration-500 ${i === act ? "w-10 bg-x-gold" : "w-4 bg-white/20"}`} />
              ))}
            </div>
          </div>

          {/* the businesses, once the floor has risen */}
          <div ref={head} className="absolute inset-x-0 top-0 grid gap-6 px-4 pt-8 opacity-0 md:grid-cols-[1.3fr_1fr] md:px-8 md:pt-12">
            <h2 className="wide text-[clamp(24px,2.9vw,48px)]">
              Everything you drive.<br />Everything you use.<br /><span className="text-white/35">Under one group.</span>
            </h2>
            <p className="hidden max-w-md self-end text-[15px] leading-relaxed text-white/60 md:block">
              From the kitchen to the highway: four businesses, one standard of service, from the first enquiry to every visit after.
            </p>
          </div>
          <div ref={track} className="absolute bottom-[7%] left-0 flex opacity-0 will-change-transform">
            {verticals.map((v) => (
              <article key={v.id} className="w-[78vw] shrink-0 border-l border-white/15 px-6 sm:w-[46vw] lg:w-[25vw]">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-white stroke-[1.4]" strokeLinecap="round" strokeLinejoin="round">{icons[v.id]}</svg>
                <h3 className="wide mt-5 text-[19px] !leading-[1.05]">{v.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/55">{v.summary}</p>
                <p className="micro mt-4 text-x-gold">Since {v.since} · {v.brands.slice(0, 3).join(" · ")}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
