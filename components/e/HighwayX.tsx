"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap, reducedMotion } from "@/lib/gsap";
import { company } from "@/lib/content";
import { Kit, makeMaterials } from "@/components/diorama/kit";
import { autoRickshaw, car, scooter, tree, truck } from "@/components/diorama/models";

const FEATURES = [
  { t: "A legacy since 1960", d: "Founded by Late Mr. Ambadas U. Chavan with a trade in yarn and long cloth.", x: "left-[6%]", y: "top-[16%]" },
  { t: "Four businesses", d: "Appliances, two-wheelers, passenger cars and commercial vehicles, under one group.", x: "right-[6%]", y: "top-[16%]" },
  { t: "Two states", d: "Solapur and Dharashiv in Maharashtra; Bijapur and Bagalkot in Karnataka.", x: "left-[6%]", y: "top-[46%]" },
  { t: "Three generations", d: "A family vision carried forward, now led into a future-ready model.", x: "right-[6%]", y: "top-[46%]" },
  { t: "Customer first", d: "Growth, service excellence and customer trust, the commitment that has never changed.", x: "left-1/2 -translate-x-1/2", y: "top-[74%]" },
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function highwayTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2b2c30";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  g.fillStyle = "#f2c230";
  g.fillRect(250, 0, 4, 512);
  g.fillRect(258, 0, 4, 512);
  g.fillStyle = "rgba(255,255,255,0.9)";
  for (let y = 0; y < 512; y += 128) {
    g.fillRect(126, y, 4, 64);
    g.fillRect(382, y, 4, 64);
  }
  g.fillRect(8, 0, 4, 512);
  g.fillRect(500, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/**
 * The reference's "ship on the ocean", reimagined as a highway seen from directly above.
 * The camera tracks the group's gold truck through live traffic and slowly climbs; the pillars
 * appear around it, then the view rises into cloud and hands over to the white page.
 */
export default function HighwayX() {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLDivElement>(null);
  const feats = useRef<(HTMLDivElement | null)[]>([]);
  const clouds = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0xb7b38f);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.5;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    camera.up.set(0, 0, -1);

    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6d6450, 1.5));
    const sun = new THREE.DirectionalLight(0xfff2dc, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
    scene.add(sun, sun.target);

    const M = makeMaterials();
    const rand = rng(23);
    const LEN = 600;

    // ground: verges, fields and the highway
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, LEN * 2), new THREE.MeshStandardMaterial({ color: 0xb9b28c, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const tex = highwayTexture();
    tex.repeat.set(1, LEN / 14);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, LEN * 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    road.receiveShadow = true;
    scene.add(road);
    for (const x of [-7.6, 7.6]) {
      const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(1.2, LEN * 2), new THREE.MeshStandardMaterial({ color: 0xd8cfb4, roughness: 1 }));
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.position.set(x, 0.015, 0);
      shoulder.receiveShadow = true;
      scene.add(shoulder);
    }
    const scen = new Kit();
    for (let i = 0; i < 160; i++) {
      const side = rand() > 0.5 ? 1 : -1;
      const x = side * (10 + rand() * 60);
      const z = (rand() - 0.5) * LEN * 1.6;
      const w = 10 + rand() * 18, d = 14 + rand() * 30;
      scen.add(new THREE.PlaneGeometry(w, d), M.fields[i % M.fields.length], new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(x, 0.01, z));
    }
    for (let i = 0; i < 520; i++) {
      const side = rand() > 0.5 ? 1 : -1;
      const x = side * (9.5 + Math.pow(rand(), 2) * 60);
      const z = (rand() - 0.5) * LEN * 1.6;
      tree(scen, M, x, z, 3 + rand() * 3.5, rand);
    }
    scene.add(scen.build());

    // traffic: left lanes travel "up" the screen (−z), right lanes come down (+z)
    const LANES = [-5.25, -1.75, 1.75, 5.25];
    const colors = [0xeeeeea, 0x121214, 0x9aa0a8, 0xb5332e, 0x2e4f7a, 0xd8d3c4];
    type V = { g: THREE.Group; lane: number; z: number; speed: number; dir: number };
    const traffic: V[] = [];
    for (let i = 0; i < 46; i++) {
      const lane = i % 4;
      const kind = i % 7;
      const g =
        kind === 2 ? autoRickshaw(M) :
        kind === 4 ? truck(M, colors[i % colors.length], 0xf1ead9) :
        kind === 5 ? scooter(M, rand, colors[(i + 2) % colors.length]) :
        car(M, colors[i % colors.length]);
      const dir = lane < 2 ? -1 : 1;
      g.rotation.y = dir < 0 ? Math.PI : 0;
      g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
      scene.add(g);
      traffic.push({ g, lane, z: (rand() - 0.5) * 240, speed: (kind === 4 ? 7 : 10) + rand() * 4, dir });
    }
    // the group's truck, tracked by the camera
    const hero = truck(M, 0xc9a24a, 0x121214);
    hero.rotation.y = Math.PI;
    hero.scale.setScalar(1.15);
    hero.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    hero.position.set(LANES[1], 0, 0);
    scene.add(hero);

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
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
    let raf = 0, last = performance.now(), travel = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = state.p;
      const speed = still ? 0 : 9;
      travel += speed * dt;
      const heroZ = -travel - p * 220;
      hero.position.z = heroZ;
      (hero.userData.wheels ?? []).forEach((w: { obj: THREE.Object3D; r: number }) => (w.obj.rotation.x -= (speed * dt) / w.r));

      traffic.forEach((v) => {
        if (!still) v.z += v.dir * v.speed * dt;
        const rel = ((v.z - heroZ + 130) % 260 + 260) % 260 - 130; // keep traffic around the camera
        if (v.lane === 1 && Math.abs(rel) < 9) v.z += 18 * Math.sign(rel || 1);
        v.g.position.set(LANES[v.lane], 0, heroZ + rel);
        (v.g.userData.wheels ?? []).forEach((w: { obj: THREE.Object3D; r: number }) => (w.obj.rotation.x += (v.speed * dt) / w.r));
      });

      // camera: straight down on the truck, climbing as you scroll
      const w = el.clientWidth, h = el.clientHeight;
      const span = THREE.MathUtils.lerp(w < 768 ? 22 : 16, w < 768 ? 120 : 110, smooth(0.05, 0.85, p));
      const aspect = w / h;
      camera.left = (-span * aspect) / 2;
      camera.right = (span * aspect) / 2;
      camera.top = span / 2;
      camera.bottom = -span / 2;
      camera.updateProjectionMatrix();
      camera.position.set(hero.position.x * 0.6, 120, heroZ - span * 0.06);
      camera.lookAt(hero.position.x * 0.6, 0, heroZ - span * 0.06);
      sun.position.set(camera.position.x - 30, 80, heroZ + 40);
      sun.target.position.set(camera.position.x, 0, heroZ);
      renderer.render(scene, camera);

      if (headline.current) {
        const o = smooth(0.06, 0.16, p) * (1 - smooth(0.32, 0.4, p));
        headline.current.style.opacity = String(o);
        headline.current.style.transform = `translate(-50%, -50%) scale(${0.92 + o * 0.08})`;
      }
      feats.current.forEach((f, i) => {
        if (!f) return;
        const a = 0.36 + i * 0.07;
        const o = smooth(a, a + 0.06, p) * (1 - smooth(0.82, 0.88, p));
        f.style.opacity = String(o);
        f.style.transform = `translateY(${(1 - o) * 24}px)`;
      });
      if (clouds.current) {
        const c = smooth(0.82, 1, p);
        clouds.current.style.opacity = String(c);
        clouds.current.style.transform = `scale(${1.4 - c * 0.4})`;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener("resize", resize);
      scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      tex.dispose();
      M.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section ref={root} className="relative h-[420vh] bg-x-black">
      <div className="sticky top-0 h-[100svh] overflow-hidden text-white">
        <div ref={host} className="absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,11,0.55))]" />

        <div ref={headline} className="pointer-events-none absolute left-1/2 top-1/2 w-[min(92vw,1100px)] text-center opacity-0 will-change-transform">
          <h2 className="wide text-[clamp(38px,6vw,100px)] [text-shadow:0_6px_40px_rgba(0,0,0,0.45)]">
            Built on trust.<br />Driven by service.
          </h2>
          <p className="micro mt-6 text-x-gold">{company.motto}</p>
        </div>

        {FEATURES.map((f, i) => (
          <div
            key={f.t}
            ref={(e) => { feats.current[i] = e; }}
            className={`pointer-events-none absolute ${f.x} ${f.y} w-[min(300px,42vw)] rounded-xl bg-x-black/55 p-4 opacity-0 backdrop-blur-md md:p-5`}
          >
            <span className="mb-3 block h-1.5 w-1.5 rounded-full bg-x-gold" />
            <h3 className="wide text-[clamp(13px,1.3vw,18px)] !leading-[1.1]">{f.t}</h3>
            <p className="mt-2 hidden text-[13px] leading-relaxed text-white/70 sm:block">{f.d}</p>
          </div>
        ))}

        {/* rising into cloud */}
        <div ref={clouds} className="pointer-events-none absolute inset-0 opacity-0 will-change-transform" aria-hidden>
          {[
            "left-[-20%] top-[-10%] h-[70%] w-[80%]", "right-[-25%] top-[10%] h-[80%] w-[85%]", "left-[5%] bottom-[-20%] h-[75%] w-[90%]",
            "left-[30%] top-[25%] h-[60%] w-[50%]", "inset-0",
          ].map((c, i) => (
            <div key={i} className={`absolute ${c} rounded-full bg-[radial-gradient(closest-side,#fafaf8,rgba(250,250,248,0.85)_55%,transparent)] ${i === 4 ? "!rounded-none bg-x-white/80" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
