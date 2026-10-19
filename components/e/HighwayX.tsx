"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap, reducedMotion } from "@/lib/gsap";
import { about } from "@/lib/content";
import { districtsLine, numberWord, statesOf, useContent } from "./content";
import { LOGO_ASPECT, LOGO_CUTOUT, LOGO_JPEG } from "./logo";
import { Eyebrow, Pill } from "./ui";
import { Kit, makeMaterials } from "@/components/diorama/kit";
import { autoRickshaw, tree } from "@/components/diorama/models";
import { classic350, grandVitara, rizta, splendor, superCarry, swift, tataAce, tataSigna } from "./fleet";
import CloudRush from "./CloudRush";
import { queueBuild, trackAsset } from "./loading";
import { Batch, bakeModel, warmUp } from "./batch";

const FEATURES = [
  { t: "A legacy since 1960", d: "Founded by Late Mr. Ambadas U. Chavan with a trade in yarn and long cloth.", x: "left-[6%]", y: "top-[16%]" },
  { t: "Four businesses", d: "Appliances, two-wheelers, passenger cars and commercial vehicles, under one group.", x: "right-[6%]", y: "top-[16%]" },
  // (its title and text are drawn from the districts, as edited on the admin page)
  { t: "Two states", d: "Solapur and Dharashiv in Maharashtra; Bijapur and Bagalkot in Karnataka.", x: "left-[6%]", y: "top-[46%]", states: true },
  { t: "Three generations", d: "A family vision carried forward, now led into a future-ready model.", x: "right-[6%]", y: "top-[46%]" },
  { t: "Customer first", d: "Growth, service excellence and customer trust, the commitment that has never changed.", x: "left-1/2 -translate-x-1/2", y: "top-[74%]" },
];

const LEAD = about.lead.split(" ");

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
 * The reference's "ship on the ocean", reimagined as a highway seen from directly above. It follows the
 * hero's Solapur close-up: the clouds that closed over Solapur part as the camera comes down onto the
 * group's truck in live traffic; then it slowly climbs, the pillars appear around it, and the view rises
 * into cloud and hands over to the white page.
 */
export default function HighwayX() {
  // the group in a few numbers (on the "About the group" panel), and its states, from the edited content
  const { company, figures: FIGURES, districts } = useContent();
  const states = statesOf(districts);
  const features = FEATURES.map((f) => ("states" in f ? { ...f, t: `${numberWord(states.length)} state${states.length === 1 ? "" : "s"}`, d: districtsLine(districts) } : f));
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLDivElement>(null);
  const feats = useRef<(HTMLDivElement | null)[]>([]);
  const clouds = useRef<HTMLDivElement>(null);
  const cloudSolid = useRef<HTMLDivElement>(null);
  const rush = useRef<((t: number) => void) | null>(null);
  const logo = useRef<HTMLImageElement>(null);
  const aboutPanel = useRef<HTMLDivElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const thumbClip = useRef<HTMLDivElement>(null);

  // built through the load queue, one scene per task, while the preloader is still up
  useEffect(() => queueBuild(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return;
    }
    // capped at 1.5: the heaviest scene on the page, and its soft top-down view gains little from more pixels
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
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
    sun.shadow.mapSize.set(1024, 1024); // soft shadows seen from high above; a larger map is not visible
    Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
    scene.add(sun, sun.target);

    const M = makeMaterials();
    const rand = rng(23);

    // The world is three tiles of road and countryside that leapfrog ahead of the camera, so the drive never
    // runs off the end however long the visitor stays. TILE is a whole number of the road texture's 14 m
    // repeats, so the lane markings continue across the joins.
    const TILE = 238;
    const tex = highwayTexture();
    tex.repeat.set(1, TILE / 14);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xb9b28c, roughness: 1 });
    const roadMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0xd8cfb4, roughness: 1 });
    const flatPlane = (w: number, d: number, x: number, y: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, 0);
      m.receiveShadow = true;
      return m;
    };
    const tiles = [0, 1, 2].map((i) => {
      const tile = new THREE.Group();
      tile.add(flatPlane(1000, TILE, 0, 0, groundMat), flatPlane(14, TILE, 0, 0.02, roadMat));
      for (const x of [-7.6, 7.6]) tile.add(flatPlane(1.2, TILE, x, 0.015, shoulderMat));
      // fields and trees reach well out to the sides, so the wide view from high up is never bare
      const scen = new Kit();
      for (let f = 0; f < 80; f++) {
        const side = rand() > 0.5 ? 1 : -1;
        const x = side * (10 + rand() * 130);
        const z = (rand() - 0.5) * (TILE - 20);
        const w = 10 + rand() * 18, d = 14 + rand() * 30;
        scen.add(new THREE.PlaneGeometry(w, d), M.fields[f % M.fields.length], new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(x, 0.01, z));
      }
      // trees near the road cast shadows; the far ones (tiny from up here) skip the shadow pass, which halves
      // the cost of drawing them
      const far = new Kit();
      for (let t = 0; t < 190; t++) {
        const side = rand() > 0.5 ? 1 : -1;
        const x = side * (9.5 + Math.pow(rand(), 2) * 130);
        const z = (rand() - 0.5) * (TILE - 6);
        tree(Math.abs(x) < 45 ? scen : far, M, x, z, 3 + rand() * 3.5, rand);
      }
      tile.add(scen.build(), far.build(false));
      tile.position.z = (1 - i) * TILE;
      scene.add(tile);
      return tile;
    });
    // keep the three tiles centred on the camera: one behind, one under, one ahead
    const placeTiles = (z: number) => {
      tiles.forEach((t) => {
        while (t.position.z - z > TILE * 1.5) t.position.z -= TILE * 3;
        while (z - t.position.z > TILE * 1.5) t.position.z += TILE * 3;
      });
    };

    // traffic: left lanes travel "up" the screen (−z), right lanes come down (+z)
    const LANES = [-5.25, -1.75, 1.75, 5.25];
    const carColors = [0xb3121c, 0xf2f2ee, 0x9aa0a8, 0x24426e, 0x121214, 0x6e7378];
    // Each traffic vehicle is dozens of meshes; drawn one by one (twice, with shadows) that was ~2,500 draw
    // calls a frame. Identical vehicles (same model and colour) are baked once and drawn as instanced
    // batches, one call per material. Seen from straight above, their wheels never visibly turn anyway.
    type V = { batch: string; slot: number; lane: number; z: number; speed: number; dir: number };
    const traffic: V[] = [];
    const models = new Map<string, { make: () => THREE.Group; count: number }>();
    for (let i = 0; i < 46; i++) {
      const lane = i % 4;
      // a realistic mix of the models the group sells, plus auto-rickshaws
      const kind = i % 9;
      const color =
        kind === 0 ? carColors[i % carColors.length] :
        kind === 3 ? carColors[(i + 3) % carColors.length] :
        kind === 4 ? [0xeceae4, 0x2e4f7a, 0xa83a2c][i % 3] :
        kind === 5 ? [0x6b1d1d, 0x2f4a3a, 0x121214][i % 3] : 0;
      const key = `${kind}:${color}`;
      const make = () =>
        kind === 0 ? swift(M, color) :
        kind === 1 ? splendor(M) :
        kind === 2 ? autoRickshaw(M) :
        kind === 3 ? grandVitara(M, color) :
        kind === 4 ? tataSigna(M, color) :
        kind === 5 ? classic350(M, color) :
        kind === 6 ? tataAce(M) :
        kind === 7 ? rizta(M) :
        superCarry(M);
      const entry = models.get(key) ?? { make, count: 0 };
      models.set(key, entry);
      traffic.push({ batch: key, slot: entry.count++, lane, z: (rand() - 0.5) * 240, speed: (kind === 4 ? 6.5 : kind === 6 || kind === 8 ? 8 : 10) + rand() * 4, dir: lane < 2 ? -1 : 1 });
    }
    const batches = new Map<string, Batch>();
    models.forEach(({ make, count }, key) => batches.set(key, new Batch(bakeModel(make()), count, scene)));
    const vm = new THREE.Matrix4(), vq = new THREE.Quaternion(), vp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const facing = { [-1]: new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.PI), [1]: new THREE.Quaternion() } as Record<number, THREE.Quaternion>;
    // the group's truck, tracked by the camera
    const hero = tataSigna(M, 0x121214);
    hero.rotation.y = Math.PI;
    hero.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    // the group's logo on the truck's roof: the supplied file itself, on its own white ground like a roof
    // sign, in its true proportions and shown unlit (no shading or tone mapping alters its colours). It exists
    // from the start (its image fills in when loaded), so the warm-up compiles its shader too
    const logoDone = trackAsset();
    const logoTex = new THREE.TextureLoader().load(LOGO_JPEG, (t) => { renderer.initTexture(t); logoDone(); }, undefined, logoDone);
    logoTex.colorSpace = THREE.SRGBColorSpace;
    logoTex.anisotropy = 8;
    const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, toneMapped: false });
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2 / LOGO_ASPECT), logoMat);
    // just above the container's roof (3.66–3.74 m), facing up and reading upright to the overhead camera
    // (the truck is turned to face up the screen, so the sign's top points along the truck's rear)
    roof.position.set(0, 3.76, -1.15);
    roof.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)));
    hero.add(roof);
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
      // The section scrolls 680vh. The opening (clouds and logo clearing, descent: timeline 0–0.22) gets
      // 190vh; the drive (0.22–1) 330vh; the last 160vh hold the road for the "About the group" panel
      // (`outro` 0–1), which ends rising into cloud.
      const px = state.p * 680;
      const p = px < 190 ? (px / 190) * 0.22 : Math.min(1, 0.22 + ((px - 190) / 330) * 0.78);
      const outro = clamp01((px - 520) / 160);
      const speed = still ? 0 : 9;
      travel += speed * dt;
      const heroZ = -travel - p * 220;
      hero.position.z = heroZ;
      placeTiles(heroZ);
      (hero.userData.wheels ?? []).forEach((w: { obj: THREE.Object3D; r: number }) => (w.obj.rotation.x -= (speed * dt) / w.r));

      traffic.forEach((v) => {
        if (!still) v.z += v.dir * v.speed * dt;
        const rel = ((v.z - heroZ + 130) % 260 + 260) % 260 - 130; // keep traffic around the camera
        if (v.lane === 1 && Math.abs(rel) < 12) v.z += 24 * Math.sign(rel || 1);
        vq.copy(facing[v.dir]);
        vm.compose(vp.set(LANES[v.lane], 0, heroZ + rel), vq, one);
        batches.get(v.batch)!.set(v.slot, vm);
      });
      batches.forEach((b) => b.commit());

      // camera: comes down out of the clouds onto the truck, then climbs as you scroll
      const w = el.clientWidth, h = el.clientHeight;
      const near = w < 768 ? 22 : 16;
      const descend = THREE.MathUtils.lerp(260, near, smooth(0, 0.2, p));
      const span = THREE.MathUtils.lerp(descend, w < 768 ? 120 : 110, smooth(0.28, 0.88, p));
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
        const o = smooth(0.18, 0.26, p) * (1 - smooth(0.4, 0.47, p));
        headline.current.style.opacity = String(o);
        headline.current.style.transform = `translate(-50%, -50%) scale(${0.92 + o * 0.08})`;
      }
      feats.current.forEach((f, i) => {
        if (!f) return;
        const a = 0.46 + i * 0.065;
        // out before the closing clouds begin (0.86), so the cards never fade through the haze
        const o = smooth(a, a + 0.06, p) * (1 - smooth(0.81, 0.85, p));
        f.style.opacity = String(o);
        f.style.transform = `translateY(${(1 - o) * 24}px)`;
      });
      // second half of the hero's cloud plunge: the puffs rush on past and clear as the camera comes down
      // (they start clearing from the first pixel, so the view never sits on plain white)
      rush.current?.(0.5 + 0.5 * clamp01(p / 0.2));
      if (logo.current) {
        // the group's logo (faded in at the end of the hero) stays exactly as it is, the same size and sharpness,
        // and thins away together with the cloud around it as the road appears below
        logo.current.style.opacity = String(1 - smooth(0.03, 0.12, p));
      }
      if (aboutPanel.current) {
        // "About the group" settles over the live road once the feature cards have gone, and stays until the
        // next section; its lead reads in word by word as you scroll
        const o = smooth(0.88, 0.96, p);
        aboutPanel.current.style.opacity = String(o);
        aboutPanel.current.style.transform = `translate(-50%, calc(-50% + ${(1 - o) * 30}px)) scale(${0.97 + o * 0.03})`;
        aboutPanel.current.style.visibility = o > 0.003 ? "visible" : "hidden";
        aboutPanel.current.style.pointerEvents = o > 0.9 ? "auto" : "none";
        const r = smooth(0, 0.6, outro) * words.current.length;
        words.current.forEach((wd, i) => wd && (wd.style.opacity = String(0.28 + 0.72 * clamp01(r - i))));
        if (thumbClip.current) thumbClip.current.style.clipPath = `inset(0 ${(1 - smooth(0.9, 1, p)) * 100}% 0 0)`;
      }
      if (clouds.current) {
        // rises back into cloud behind the panel at the very end, meeting the next section's white
        const close = smooth(0.7, 1, outro);
        clouds.current.style.opacity = String(close);
        clouds.current.style.transform = `scale(${1.4 - close * 0.4})`;
        // ends fully on the page's white, so it meets the next section without an edge
        if (cloudSolid.current) cloudSolid.current.style.opacity = String(close);
        // the panel's shadow fades with it, so none is cut off at the section's edge as it scrolls away
        if (aboutPanel.current) aboutPanel.current.style.boxShadow = `0 40px 90px -30px rgba(0,0,0,${0.55 * (1 - close)})`;
      }
    };
    // lay out one frame and draw it once now (behind the preloader): compiling the shaders and shadow maps
    // on first sight froze the page for seconds as this section scrolled into view
    frame(performance.now());
    cancelAnimationFrame(raf);
    warmUp(renderer, scene, camera, trackAsset());
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (logo.current) logo.current.style.opacity = "0"; // fixed to the screen: hidden while we are elsewhere
    });
    io.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener("resize", resize);
      batches.forEach((b) => b.dispose());
      scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      tex.dispose();
      logoTex.dispose();
      [groundMat, roadMat, shoulderMat, logoMat].forEach((m) => m.dispose());
      M.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // (below the opening: built straight after it is revealed, not before)
  }, { defer: true }), []);

  return (
    <section ref={root} className="relative h-[780vh] bg-x-black">
      <div className="sticky top-0 h-[100svh] overflow-hidden text-white">
        <div ref={host} className="absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,11,0.55))]" />

        <div ref={headline} className="pointer-events-none absolute left-1/2 top-1/2 w-[min(92vw,1100px)] text-center opacity-0 will-change-transform">
          <h2 className="wide text-[clamp(38px,6vw,100px)] [text-shadow:0_6px_40px_rgba(0,0,0,0.45)]">
            Built on trust.<br />Driven by service.
          </h2>
          <p className="micro mt-6 text-x-gold">{company.motto}</p>
        </div>

        {features.map((f, i) => (
          <div
            key={i}
            ref={(e) => { feats.current[i] = e; }}
            className={`pointer-events-none absolute ${f.x} ${f.y} w-[min(300px,42vw)] rounded-xl bg-x-black/80 p-4 opacity-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-md md:p-5`}
          >
            <span className="mb-3 block h-1.5 w-1.5 rounded-full bg-x-gold" />
            <h3 className="wide text-[clamp(13px,1.3vw,18px)] !leading-[1.1]">{f.t}</h3>
            <p className="mt-2 hidden text-[13px] leading-relaxed text-white/80 sm:block">{f.d}</p>
          </div>
        ))}

        {/* opening: the hero's clouds rushing on past (fully covered before the first frame, to match its end) */}
        <CloudRush api={rush} initial={0.5} />
        <img
          ref={logo}
          src={LOGO_CUTOUT}
          alt=""
          aria-hidden
          decoding="async"
          className="pointer-events-none fixed left-1/2 top-1/2 w-[min(55vw,336px)] opacity-0 will-change-transform"
          style={{ transform: "translate(-50%, -50%) scale(0.9)" }}
        />

        {/* rising into cloud at the end */}
        <div ref={clouds} className="pointer-events-none absolute inset-0 opacity-0 will-change-transform" aria-hidden>
          {[
            "left-[-20%] top-[-10%] h-[70%] w-[80%]", "right-[-25%] top-[10%] h-[80%] w-[85%]", "left-[5%] bottom-[-20%] h-[75%] w-[90%]",
            "left-[30%] top-[25%] h-[60%] w-[50%]",
          ].map((c, i) => (
            <div key={i} className={`absolute ${c} rounded-full bg-[radial-gradient(closest-side,#fafaf8,rgba(250,250,248,0.85)_55%,transparent)]`} />
          ))}
          {/* overhangs the view a little, so no hairline of the dark section shows at its edges */}
          <div ref={cloudSolid} className="absolute -inset-2 bg-x-white opacity-0" />
        </div>

        {/* "About the group", on frosted glass over the live road */}
        <div
          ref={aboutPanel}
          className="pointer-events-none invisible absolute left-1/2 top-1/2 max-h-[calc(100svh-96px)] w-[min(94vw,1180px)] overflow-hidden rounded-2xl bg-x-white/90 p-5 text-x-black opacity-0 ring-1 ring-black/5 backdrop-blur-xl will-change-transform md:mt-6 md:p-9"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="grid gap-4 md:grid-cols-[1.05fr_1fr] md:items-end md:gap-12">
            <h2 className="wide text-[clamp(24px,3.1vw,54px)] lg:whitespace-nowrap">
              <span className="block text-x-grey">We build trust.</span>
              <span className="block text-x-grey">We move people.</span>
              <span className="block">We own the</span>
              <span className="block">journey.</span>
            </h2>
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex items-center gap-3">
                <div ref={thumbClip} className="h-9 w-16 shrink-0 overflow-hidden rounded-md md:h-12 md:w-20" style={{ clipPath: "inset(0 100% 0 0)" }}>
                  <img src="/images/bike-road.jpg" alt="" loading="lazy" decoding="async" className="h-full w-full scale-110 object-cover" />
                </div>
                <Eyebrow>About the group</Eyebrow>
              </div>
              <p className="text-[clamp(13px,1.1vw,17px)] font-medium leading-[1.5]">
                {LEAD.map((wd, i) => (
                  <span key={i} ref={(e) => { words.current[i] = e; }} style={{ opacity: 0.28 }}>
                    {wd}{" "}
                  </span>
                ))}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-sm text-[12px] leading-relaxed text-x-mute md:text-[13px]">{about.closing}</p>
                <Pill href="#leadership">Our leadership</Pill>
              </div>
            </div>
          </div>

          <div className="mt-5 md:mt-8">
            <p className="micro mb-2 text-x-gold md:mb-3">Since {company.since} · {company.hq}</p>
            <dl className="grid grid-cols-2 border-y border-x-line md:grid-cols-4">
              {FIGURES.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-end justify-between gap-2 px-3 py-3 md:gap-3 md:px-5 md:py-5 ${i % 2 ? "border-l border-x-line" : ""} ${i === 2 ? "md:border-l md:border-x-line" : ""} ${i < 2 ? "border-b border-x-line md:border-b-0" : ""}`}
                >
                  <dd className="wide text-[clamp(22px,3vw,52px)] !leading-[0.85] tabular-nums">
                    {f.value}
                    <span className="text-x-gold">{f.suffix}</span>
                  </dd>
                  <dt className="micro max-w-[80px] text-right !text-[9px] text-x-mute md:max-w-[96px] md:!text-[10px]">{f.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      {/* anchor for the menu's "About" link: where the panel is fully in view */}
      <div id="about" className="absolute left-0 h-px w-px" style={{ top: "505vh" }} aria-hidden />
    </section>
  );
}
