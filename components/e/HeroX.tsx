"use client";
import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import * as THREE from "three";
import { gsap, reducedMotion } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { headOffice, joinList, numberWord, statesOf, useContent } from "./content";
import { Pill } from "./ui";
import CloudRush from "./CloudRush";
import { queueBuild, trackAsset } from "./loading";
import { compileReady } from "./batch";
import { LOGO_CUTOUT } from "./logo";

const R = 10;
const INDIA = { lat: 17.6, lon: 76.0 };

const toVec = (lat: number, lon: number, r = R) => {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)).multiplyScalar(r);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// The sharp satellite patch around Solapur (public/textures/earth/solapur-region.webp), in degrees.
const REGION = { lon0: 69, lon1: 83, lat0: 10.5, lat1: 24.5 };

// Lighting shared by the Earth and the Solapur patch: day map lit by the sun, a sun glint on water,
// blue scattering towards the limb, and the night map (city lights) on the dark side.
const VERT = `varying vec3 vNw; varying vec3 vVw; varying vec2 vUv;
  void main(){
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNw = normalize(mat3(modelMatrix) * normal);
    vVw = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const SHADE = `uniform vec3 uSun; varying vec3 vNw; varying vec3 vVw; varying vec2 vUv;
  vec3 shade(vec3 day, vec3 night){
    vec3 n = normalize(vNw), v = normalize(vVw);
    float l = dot(n, uSun);
    float dayAmt = smoothstep(-0.12, 0.22, l);
    vec3 lit = day * (0.05 + 1.2 * max(l, 0.0));
    float water = smoothstep(0.03, 0.14, day.b - day.r);
    lit += vec3(1.0, 0.94, 0.82) * pow(max(dot(n, normalize(uSun + v)), 0.0), 70.0) * water * 0.6 * dayAmt;
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    lit = mix(lit, vec3(0.3, 0.52, 1.0) * (0.2 + max(l, 0.0)), fres * 0.7 * dayAmt);
    return mix(night, lit, dayAmt);
  }`;

/**
 * Pinned hero (460vh). A photographic Earth (NASA Blue Marble and Black Marble, public domain) turns to India
 * and the camera dives down until the four districts separate, zooms on down onto Solapur over a sharp
 * regional satellite patch, then plunges into cloud and hands over to the highway (HighwayX opens out of the
 * same clouds).
 */
const TEXTURES = ["/textures/earth/earth-day.webp", "/textures/earth/earth-night.webp", "/textures/earth/earth-clouds.webp", "/textures/earth/solapur-region.webp"];

export default function HeroX() {
  // start downloading the Earth imagery with the page itself (emitted as <link rel="preload"> in the
  // HTML), instead of waiting for the scripts to run
  // (crossOrigin matches three.js's TextureLoader, which requests images anonymously; without it the browser
  // ignores the preload and downloads every image twice)
  TEXTURES.forEach((href) => preload(href, { as: "image", fetchPriority: "high", crossOrigin: "anonymous" }));
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const zoomCopy = useRef<HTMLDivElement>(null);
  const hqCopy = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const clouds = useRef<((t: number) => void) | null>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  // the districts pinned on the globe, and the wording drawn from them (as edited on the admin page)
  const { company, districts: cities } = useContent();
  const citiesKey = JSON.stringify(cities);
  const hqCity = headOffice(cities);
  const states = statesOf(cities);
  const others = cities.filter((c) => c !== hqCity).map((c) => c.name);
  const plural = (n: number, word: string) => `${numberWord(n)} ${word}${n === 1 ? "" : "s"}`;

  // built through the load queue, which holds it until the live content (with the districts) is in
  useEffect(() => queueBuild(() => {
    const el = host.current!;
    const still = reducedMotion();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 300);

    const earth = new THREE.Group();
    scene.add(earth);
    const spin = new THREE.Group(); // idle rotation, decays to zero as we dive
    earth.add(spin);
    const globe = new THREE.Group();
    globe.rotation.set(THREE.MathUtils.degToRad(INDIA.lat), -Math.PI / 2 - THREE.MathUtils.degToRad(INDIA.lon), 0, "XYZ");
    spin.add(globe);

    // ---- a photographic Earth ----------------------------------------------------------------------
    const loader = new THREE.TextureLoader();
    const aniso = renderer.capabilities.getMaxAnisotropy();
    // the preloader waits for each texture; once loaded it is uploaded to the GPU straight away, so the
    // reveal does not stutter on first use
    const texture = (url: string, color = true) => {
      const done = trackAsset();
      const t = loader.load(
        url,
        (tex) => {
          renderer.initTexture(tex);
          done();
        },
        undefined,
        done,
      );
      if (color) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      return t;
    };
    const dayMap = texture(TEXTURES[0]);
    const nightMap = texture(TEXTURES[1]);
    const cloudMap = texture(TEXTURES[2], false);
    const regionMap = texture(TEXTURES[3]);
    // morning sun from the upper left (world space), so India is lit and the terminator shows on the right
    const sun = { value: new THREE.Vector3(-0.55, 0.38, 0.74).normalize() };

    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R, 160, 160),
      new THREE.ShaderMaterial({
        uniforms: { uSun: sun, uDay: { value: dayMap }, uNight: { value: nightMap } },
        vertexShader: VERT,
        fragmentShader: `${SHADE}
          uniform sampler2D uDay; uniform sampler2D uNight;
          void main(){
            gl_FragColor = vec4(shade(texture2D(uDay, vUv).rgb, texture2D(uNight, vUv).rgb * 1.4), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    ));

    // the sharp regional image around Solapur, feathered at its edges into the world map
    const deg = THREE.MathUtils.degToRad;
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.0003, 96, 96, deg(REGION.lon0 + 180), deg(REGION.lon1 - REGION.lon0), deg(90 - REGION.lat1), deg(REGION.lat1 - REGION.lat0)),
      new THREE.ShaderMaterial({
        uniforms: {
          uSun: sun,
          uRegion: { value: regionMap },
          uNight: { value: nightMap },
          uBounds: { value: new THREE.Vector4(REGION.lon0, REGION.lon1, REGION.lat0, REGION.lat1) },
        },
        vertexShader: VERT,
        fragmentShader: `${SHADE}
          uniform sampler2D uRegion; uniform sampler2D uNight; uniform vec4 uBounds;
          void main(){
            vec2 g = vec2((mix(uBounds.x, uBounds.y, vUv.x) + 180.0) / 360.0, (mix(uBounds.z, uBounds.w, vUv.y) + 90.0) / 180.0);
            float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
            gl_FragColor = vec4(shade(texture2D(uRegion, vUv).rgb, texture2D(uNight, g).rgb * 1.4), smoothstep(0.0, 0.14, edge));
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
      }),
    ));

    // the real cloud layer, drifting slowly; it thins as we dive (it is too coarse to look at up close)
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: { uSun: sun, uClouds: { value: cloudMap }, uOpacity: { value: 0.95 } },
      vertexShader: VERT,
      fragmentShader: `uniform vec3 uSun; uniform sampler2D uClouds; uniform float uOpacity; varying vec3 vNw; varying vec2 vUv;
        void main(){
          float c = texture2D(uClouds, vUv).r;
          float l = dot(normalize(vNw), uSun);
          vec3 col = mix(vec3(0.02, 0.03, 0.05), vec3(1.0) * (0.12 + 0.95 * max(l, 0.0)), smoothstep(-0.12, 0.22, l));
          gl_FragColor = vec4(col, smoothstep(0.12, 0.85, c) * uOpacity);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
    });
    const cloudLayer = new THREE.Mesh(new THREE.SphereGeometry(R * 1.008, 128, 128), cloudMat);
    globe.add(cloudLayer);

    // a thin blue atmosphere around the limb, brightest on the sunlit side
    earth.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.028, 96, 96),
      new THREE.ShaderMaterial({
        uniforms: { uSun: sun },
        vertexShader: VERT,
        fragmentShader: `uniform vec3 uSun; varying vec3 vNw; varying vec3 vVw;
          void main(){
            vec3 n = normalize(vNw);
            float f = pow(1.0 - abs(dot(n, normalize(vVw))), 3.2);
            float lit = smoothstep(-0.35, 0.5, dot(n, uSun));
            gl_FragColor = vec4(vec3(0.35, 0.6, 1.0), f * (0.12 + 1.1 * lit));
          }`,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ));

    // stars
    {
      const pos: number[] = [];
      for (let i = 0; i < 2400; i++) {
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).setLength(150 + Math.random() * 60);
        pos.push(v.x, v.y, v.z);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.75 })));
    }

    const pins: { pin: THREE.Mesh; ring: THREE.Mesh; anchor: THREE.Vector3 }[] = [];
    const routeMats: THREE.ShaderMaterial[] = [];
    const pinGroup = new THREE.Group();
    globe.add(pinGroup);
    cities.forEach((c) => {
      const p = toVec(c.lat, c.lon, R * 1.0005);
      const hq = "hq" in c && c.hq;
      const pin = new THREE.Mesh(new THREE.SphereGeometry(hq ? 0.012 : 0.009, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true }));
      pin.position.copy(p);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.014, 0.018, 40), new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      ring.position.copy(p);
      ring.lookAt(p.clone().multiplyScalar(2));
      pinGroup.add(pin, ring);
      pins.push({ pin, ring, anchor: p });
    });
    const hq = cities.find((c) => c.hq) ?? cities[0];
    const from = toVec(hq.lat, hq.lon);
    cities.filter((c) => c !== hq).forEach((c, i) => {
      const to = toVec(c.lat, c.lon);
      const mid = from.clone().add(to).multiplyScalar(0.5).normalize().multiplyScalar(R + from.distanceTo(to) * 0.35);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uHead: { value: 0 }, uOn: { value: 0 } },
        vertexShader: `varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `uniform float uHead; uniform float uOn; varying float vU; void main(){
          float trail = smoothstep(uHead - 0.5, uHead, vU) * step(vU, uHead);
          gl_FragColor = vec4(1.0, 0.72, 0.38, max(0.25, trail) * uOn);
        }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      mat.userData.offset = i * 0.3;
      routeMats.push(mat);
      pinGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(from, mid, to), 48, 0.0022, 5, false), mat));
    });

    const hqIndex = cities.indexOf(hq);

    const state = { p: 0, mx: 0, my: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
    });
    const move = (e: PointerEvent) => {
      state.mx = e.clientX / window.innerWidth - 0.5;
      state.my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", move);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const solapur = toVec(hq.lat, hq.lon);
    const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
    const wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();
    const tmp = new THREE.Vector3(), world = new THREE.Vector3();
    let first = true;
    let raf = 0;
    let revealed = false; // nothing is drawn behind the opaque preloader (its time goes to loading)
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!revealed) return;
      const t = now / 1000;
      // The section scrolls 360vh. The opening (globe → districts, timeline 0–0.48) keeps its original pace of
      // 115vh; the Solapur zoom and the plunge into cloud (0.48–1) get the remaining 245vh, about twice as
      // much as before, so they don't rush past.
      const px = state.p * 360;
      const p = px < 115 ? (px / 115) * 0.48 : 0.48 + ((px - 115) / 245) * 0.52;
      const mobile = el.clientWidth < 768;
      // scroll timeline: spin settles → dive to the four districts → zoom on down onto Solapur → clouds close over it
      const dive = smooth(0.08, 0.41, p);
      const settle = smooth(0, 0.09, p);
      const zoom = smooth(0.48, 0.76, p);

      // idle spin decays as we start diving, so India comes to rest facing us
      spin.rotation.y = still ? 0 : (1 - settle) * (Math.sin(t * 0.12) * 0.35 + 0.25);
      earth.position.set(mobile ? 0 : 6.5 * (1 - dive), mobile ? -4 * (1 - dive) : -0.5 * (1 - dive), 0);

      // camera: wide shot → dive towards Solapur
      globe.updateWorldMatrix(true, false);
      world.copy(solapur).applyMatrix4(globe.matrixWorld);
      const normal = world.clone().sub(earth.position).normalize();
      const widePos = new THREE.Vector3(state.mx * 1.2, 1.2 - state.my * 0.8, mobile ? 46 : 33);
      const wideLook = new THREE.Vector3(0, 0, 0);
      // height above Solapur: the district view, then (geometrically, so the zoom feels even) down to the city
      const base = mobile ? 1.9 : 1.45;
      // …and keeps plunging towards the city as the clouds rush in
      // (the close-up stops where the satellite imagery is still sharp: about 380 km up on desktop, higher on
      // phones, whose narrow view would otherwise magnify the image too far)
      const height = base * Math.pow((mobile ? 1.3 : 0.6) / base, zoom) * (1 - 0.7 * smooth(0.78, 1, p));
      const near = height / base; // 1 over the districts, smaller as we close in
      const closePos = world.clone().addScaledVector(normal, height).add(new THREE.Vector3(0, -0.45 * (height / base), 0));
      wantPos.lerpVectors(widePos, closePos, dive);
      wantLook.lerpVectors(wideLook, world, dive);
      if (first) { camPos.copy(wantPos); camLook.copy(wantLook); first = false; }
      camPos.lerp(wantPos, 0.08);
      camLook.lerp(wantLook, 0.08);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      // the other districts and their routes fade as we zoom past them; Solapur stays until the hand-over
      const routesOn = smooth(0.25, 0.37, p) * (1 - smooth(0.5, 0.6, p));
      const hqOn = smooth(0.25, 0.37, p) * (1 - smooth(0.8, 0.86, p));
      routeMats.forEach((m) => {
        m.uniforms.uOn.value = routesOn;
        m.uniforms.uHead.value = still ? 1 : (t * 0.35 + m.userData.offset) % 1.5;
      });
      pins.forEach(({ pin, ring }, i) => {
        const isHq = i === hqIndex;
        (pin.material as THREE.MeshBasicMaterial).opacity = isHq ? 1 - smooth(0.84, 0.92, p) : 1 - smooth(0.5, 0.62, p);
        // pins and rings keep a constant size on screen as the camera closes in
        pin.scale.setScalar(near);
        const k = still ? 0.5 : (t * 0.7 + i * 0.25) % 1;
        ring.scale.setScalar((1 + k * 2.5) * near);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * (isHq ? hqOn : routesOn);
      });
      // the global cloud layer drifts, and thins as we come down through the atmosphere
      if (!still) cloudLayer.rotation.y = t * 0.004;
      cloudMat.uniforms.uOpacity.value = 0.95 * (1 - 0.85 * smooth(0.1, 0.4, p));
      renderer.render(scene, camera);
      if (scrim.current) {
        // darkens the left side behind the captions so they stay legible over bright satellite imagery
        const z = smooth(0.28, 0.37, p) * (1 - smooth(0.47, 0.54, p));
        const q = smooth(0.62, 0.7, p) * (1 - smooth(0.82, 0.88, p));
        scrim.current.style.opacity = String(Math.max(z, q));
      }

      // overlays
      if (copy.current) {
        copy.current.style.opacity = String(1 - smooth(0.033, 0.15, p));
        copy.current.style.transform = `translateY(${-p * 240}px)`;
      }
      if (zoomCopy.current) {
        const o = smooth(0.28, 0.37, p) * (1 - smooth(0.47, 0.54, p));
        zoomCopy.current.style.opacity = String(o);
        zoomCopy.current.style.transform = `translateY(${(1 - o) * 30}px)`;
      }
      if (hqCopy.current) {
        const o = smooth(0.62, 0.7, p) * (1 - smooth(0.82, 0.88, p));
        hqCopy.current.style.opacity = String(o);
        hqCopy.current.style.transform = `translateY(${(1 - o) * 30}px)`;
      }
      // first half of the cloud plunge: puffs rush past until the view is white at the very end of the hero
      clouds.current?.(0.5 * clamp01((p - 0.78) / 0.22));
      if (logo.current) {
        // a little way into the cloud the group's logo softly emerges, fully there as the view turns white;
        // it is fixed to the screen, like the highway's copy, so while the two sections hand over the two copies
        // sit exactly on top of each other and read as one logo that never moves
        const o = smooth(0.79, 0.95, p);
        logo.current.style.opacity = String(o);
        logo.current.style.transform = `translate(-50%, -50%) scale(${0.75 + o * 0.15})`;
        logo.current.style.filter = `blur(${(1 - o) * 8}px)`;
      }
      const w = el.clientWidth, h = el.clientHeight;
      pins.forEach(({ anchor }, i) => {
        const l = labels.current[i];
        if (!l) return;
        tmp.copy(anchor).applyMatrix4(globe.matrixWorld).project(camera);
        l.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
        l.style.opacity = tmp.z < 1 ? String(i === hqIndex ? hqOn : routesOn) : "0";
      });
    };
    // compile the shaders now, behind the preloader (which waits until they are ready), not on first sight
    const compiled = trackAsset();
    compileReady(renderer, scene, camera).then(compiled, compiled);
    // render only while the hero is on screen, so it does not compete with the scenes further down
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(frame);
      else if (logo.current) logo.current.style.opacity = "0"; // it is fixed to the screen: hide it once we are past
    });
    io.observe(root.current!);

    const ctx = gsap.context(() => {
      gsap.set(".hx-in", { opacity: 0, y: 30 });
      gsap.set(el, { opacity: 0, scale: 1.1 });
    }, root);
    const stop = onIntroDone(() =>
      ctx.add(() => {
        revealed = true;
        gsap.to(el, { opacity: 1, scale: 1, duration: 2.4, ease: "expo.out" });
        gsap.to(".hx-in", { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.07, delay: 0.3 });
      }),
    );

    return () => {
      stop();
      ctx.revert();
      cancelAnimationFrame(raf);
      io.disconnect();
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose?.();
      });
      [dayMap, nightMap, cloudMap, regionMap].forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [citiesKey]);

  return (
    <section id="top" ref={root} className="relative h-[460vh] bg-x-black text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={host} className="absolute inset-0" aria-hidden />

        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {cities.map((c, i) => (
            <div key={`${i}-${c.name}`} ref={(e) => { labels.current[i] = e; }} className="absolute left-0 top-0 opacity-0">
              <div className="-translate-x-1/2 -translate-y-full pb-2 text-center">
                <p className="micro whitespace-nowrap">{c.name}</p>
                <p className="micro whitespace-nowrap !text-[9px] text-white/50">{c.hq ? "Head office" : c.state}</p>
                <span className="mx-auto mt-1.5 block h-6 w-px bg-white/50" />
              </div>
            </div>
          ))}
        </div>

        {/* opening copy, bottom left */}
        <div ref={copy} className="absolute inset-x-0 bottom-0 px-4 pb-10 will-change-transform md:px-8 md:pb-14">
          <p className="hx-in micro mb-5 text-white/70">One group · Est. {company.since}</p>
          <h1 className="wide text-[clamp(44px,6.6vw,112px)]">
            <span className="hx-in block">Every road</span>
            <span className="hx-in block">of the journey.</span>
          </h1>
          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <p className="hx-in max-w-md text-[15px] leading-relaxed text-white/65">
              Home appliances, two-wheelers, passenger cars and commercial vehicles. {company.tagline}, serving
              {" "}{joinList(states)} since {company.since}.
            </p>
            <div className="hx-in flex flex-wrap gap-2">
              <Pill href="#contact" dark solid>Visit a showroom</Pill>
              <Pill href="#businesses" dark>Our businesses</Pill>
            </div>
          </div>
        </div>

        {/* darkens the left side behind the captions over the bright satellite imagery */}
        <div ref={scrim} className="pointer-events-none absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-black/70 via-black/35 to-transparent opacity-0 md:w-[50%]" aria-hidden />

        {/* copy shown once we arrive over the districts */}
        <div ref={zoomCopy} className="pointer-events-none absolute left-4 top-28 max-w-sm opacity-0 md:left-8 md:top-32">
          <p className="micro text-x-gold">Headquarters · {company.hq}</p>
          <p className="wide mt-3 text-[clamp(26px,2.6vw,40px)]">{plural(states.length, "state")}.<br />{plural(cities.length, "district")}.</p>
          {others.length > 0 && <p className="mt-4 text-[14px] leading-relaxed text-white/60">From {hqCity.name} to {joinList(others)}.</p>}
        </div>

        {/* copy for the final zoom onto the head office */}
        <div ref={hqCopy} className="pointer-events-none absolute left-4 top-28 max-w-sm opacity-0 md:left-8 md:top-32">
          <p className="micro text-x-gold">Head office · Est. {company.since}</p>
          <p className="wide mt-3 text-[clamp(26px,2.6vw,40px)]">{hqCity.name}.<br />Where it began.</p>
          <p className="mt-4 text-[14px] leading-relaxed text-white/60">A yarn and cloth trade in {company.since}; today the home of four businesses across {plural(states.length, "state").toLowerCase()}.</p>
        </div>

        {/* the camera plunges into cloud over Solapur; the highway section flies on out of the same clouds */}
        <CloudRush api={clouds} initial={0} />
        {/* the logo exactly as supplied (its ground made clear, so it sits on the cloud) */}
        <img
          ref={logo}
          src={LOGO_CUTOUT}
          alt=""
          aria-hidden
          decoding="async"
          className="pointer-events-none fixed left-1/2 top-1/2 w-[min(55vw,336px)] opacity-0 will-change-transform"
          style={{ transform: "translate(-50%, -50%) scale(0.75)" }}
        />
      </div>
    </section>
  );
}
