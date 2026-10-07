"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, reducedMotion } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { company, presence } from "@/lib/content";
import { Pill } from "./ui";

const R = 10;
const INDIA = { lat: 17.6, lon: 76.0 };
const cities = presence.flatMap((s) => s.districts.map((d) => ({ ...d, state: s.state })));

const toVec = (lat: number, lon: number, r = R) => {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)).multiplyScalar(r);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

async function landPoints(count: number) {
  const img = new Image();
  img.src = "/images/land-mask.png";
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = Math.asin(y);
    const lon = (Math.PI * (3 - Math.sqrt(5)) * i) % (Math.PI * 2);
    const latD = THREE.MathUtils.radToDeg(lat);
    const lonD = ((THREE.MathUtils.radToDeg(lon) + 540) % 360) - 180;
    const px = Math.floor(((lonD + 180) / 360) * c.width);
    const py = Math.floor(((90 - latD) / 180) * c.height);
    if (data[(py * c.width + px) * 4] > 128) out.push(latD, lonD);
  }
  return out;
}

/**
 * Pinned hero (260vh). A dotted Earth turns to India and the camera dives down until the four
 * districts separate, then a horizon of light rises and hands over to the white page.
 */
export default function HeroX() {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const zoomCopy = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = host.current!;
    const still = reducedMotion();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    let disposed = false;
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

    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.996, 96, 96),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vN; void main(){
          float l = max(0.0, dot(vN, normalize(vec3(-0.6, 0.7, 0.4))));
          gl_FragColor = vec4(vec3(0.018, 0.02, 0.03) + vec3(0.09, 0.05, 0.02) * pow(l, 3.0), 1.0);
        }`,
      }),
    ));

    // atmosphere: an orange-gold rim lit from the upper left, deep blue on the night side
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.05, 96, 96),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){
          float f = pow(1.0 - abs(dot(vN, vV)), 2.6);
          float lit = smoothstep(-0.4, 0.8, dot(vN, normalize(vec3(-0.65, 0.75, 0.0))));
          vec3 col = mix(vec3(0.12, 0.18, 0.75), vec3(1.0, 0.52, 0.16), lit);
          gl_FragColor = vec4(col, f * (0.35 + 1.1 * lit));
        }`,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    earth.add(rim);

    const dotsMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: renderer.getPixelRatio() }, uIndia: { value: toVec(INDIA.lat, INDIA.lon).normalize() }, uFade: { value: 1 } },
      vertexShader: `uniform float uPx; uniform vec3 uIndia; varying float vHeat; varying float vFace;
        void main(){
          vHeat = smoothstep(0.86, 0.995, dot(normalize(position), uIndia));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec3 n = normalize(normalMatrix * normalize(position));
          vFace = clamp(dot(n, normalize(-mv.xyz)), 0.0, 1.0);
          gl_PointSize = (1.35 + vHeat * 1.0) * uPx * clamp(26.0 / -mv.z, 0.6, 1.7);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform float uFade; varying float vHeat; varying float vFace;
        void main(){
          if (length(gl_PointCoord - 0.5) > 0.5) discard;
          vec3 c = mix(vec3(0.62, 0.6, 0.56), vec3(1.0, 0.66, 0.28), vHeat);
          gl_FragColor = vec4(c, (0.38 + vHeat * 0.5) * smoothstep(0.0, 0.3, vFace) * uFade);
        }`,
      transparent: true,
      depthWrite: false,
    });

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
    const hq = cities.find((c) => "hq" in c && c.hq)!;
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

    landPoints(mobileCount()).then((ll) => {
      if (disposed) return;
      const pos = new Float32Array(ll.length * 1.5);
      for (let i = 0, j = 0; i < ll.length; i += 2, j += 3) toVec(ll[i], ll[i + 1]).toArray(pos, j);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      globe.add(new THREE.Points(g, dotsMat));
    }).catch(() => {});
    function mobileCount() {
      return window.innerWidth < 768 ? 60000 : 110000;
    }

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
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = now / 1000;
      const p = state.p;
      const mobile = el.clientWidth < 768;
      const dive = smooth(0.12, 0.62, p);
      const settle = smooth(0, 0.14, p);

      // idle spin decays as we start diving, so India comes to rest facing us
      spin.rotation.y = still ? 0 : (1 - settle) * (Math.sin(t * 0.12) * 0.35 + 0.25);
      earth.position.set(mobile ? 0 : 6.5 * (1 - dive), mobile ? -4 * (1 - dive) : -0.5 * (1 - dive), 0);

      // camera: wide shot → dive towards Solapur
      globe.updateWorldMatrix(true, false);
      world.copy(solapur).applyMatrix4(globe.matrixWorld);
      const normal = world.clone().sub(earth.position).normalize();
      const widePos = new THREE.Vector3(state.mx * 1.2, 1.2 - state.my * 0.8, mobile ? 46 : 33);
      const wideLook = new THREE.Vector3(0, 0, 0);
      const closePos = world.clone().addScaledVector(normal, mobile ? 1.9 : 1.45).add(new THREE.Vector3(0, -0.45, 0));
      wantPos.lerpVectors(widePos, closePos, dive);
      wantLook.lerpVectors(wideLook, world, dive);
      if (first) { camPos.copy(wantPos); camLook.copy(wantLook); first = false; }
      camPos.lerp(wantPos, 0.08);
      camLook.lerp(wantLook, 0.08);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      const routesOn = smooth(0.38, 0.55, p) * (1 - smooth(0.78, 0.9, p));
      routeMats.forEach((m) => {
        m.uniforms.uOn.value = routesOn;
        m.uniforms.uHead.value = still ? 1 : (t * 0.35 + m.userData.offset) % 1.5;
      });
      pins.forEach(({ pin, ring }, i) => {
        (pin.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(0.74, 0.88, p);
        const k = still ? 0.5 : (t * 0.7 + i * 0.25) % 1;
        ring.scale.setScalar(1 + k * 2.5);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * routesOn;
      });
      dotsMat.uniforms.uFade.value = 1 - smooth(0.74, 0.9, p);
      renderer.render(scene, camera);

      // overlays
      if (copy.current) {
        copy.current.style.opacity = String(1 - smooth(0.05, 0.22, p));
        copy.current.style.transform = `translateY(${-p * 160}px)`;
      }
      if (zoomCopy.current) {
        const o = smooth(0.42, 0.55, p) * (1 - smooth(0.74, 0.84, p));
        zoomCopy.current.style.opacity = String(o);
        zoomCopy.current.style.transform = `translateY(${(1 - o) * 30}px)`;
      }
      if (glow.current) {
        const g = smooth(0.8, 1, p);
        glow.current.style.transform = `translateY(${(1 - g) * 100}%)`;
      }
      const w = el.clientWidth, h = el.clientHeight;
      pins.forEach(({ anchor }, i) => {
        const l = labels.current[i];
        if (!l) return;
        tmp.copy(anchor).applyMatrix4(globe.matrixWorld).project(camera);
        l.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
        l.style.opacity = tmp.z < 1 ? String(routesOn) : "0";
      });
    };
    raf = requestAnimationFrame(frame);

    const ctx = gsap.context(() => {
      gsap.set(".hx-in", { opacity: 0, y: 30 });
      gsap.set(el, { opacity: 0, scale: 1.1 });
    }, root);
    const stop = onIntroDone(() =>
      ctx.add(() => {
        gsap.to(el, { opacity: 1, scale: 1, duration: 2.4, ease: "expo.out" });
        gsap.to(".hx-in", { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.07, delay: 0.3 });
      }),
    );

    return () => {
      disposed = true;
      stop();
      ctx.revert();
      cancelAnimationFrame(raf);
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section id="top" ref={root} className="relative h-[260vh] bg-x-black text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={host} className="absolute inset-0" aria-hidden />

        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {cities.map((c, i) => (
            <div key={c.name} ref={(e) => { labels.current[i] = e; }} className="absolute left-0 top-0 opacity-0">
              <div className="-translate-x-1/2 -translate-y-full pb-2 text-center">
                <p className="micro whitespace-nowrap">{c.name}</p>
                <p className="micro whitespace-nowrap !text-[9px] text-white/50">{"hq" in c && c.hq ? "Head office" : c.state}</p>
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
              Maharashtra and Karnataka since {company.since}.
            </p>
            <div className="hx-in flex flex-wrap gap-2">
              <Pill href="#contact" dark solid>Visit a showroom</Pill>
              <Pill href="#businesses" dark>Our businesses</Pill>
            </div>
          </div>
        </div>

        {/* copy shown once we arrive over the districts */}
        <div ref={zoomCopy} className="pointer-events-none absolute left-4 top-28 max-w-sm opacity-0 md:left-8 md:top-32">
          <p className="micro text-x-gold">Headquarters · {company.hq}</p>
          <p className="wide mt-3 text-[clamp(26px,2.6vw,40px)]">Two states.<br />Four districts.</p>
          <p className="mt-4 text-[14px] leading-relaxed text-white/60">From Solapur to Dharashiv, Bijapur and Bagalkot.</p>
        </div>

        {/* horizon of light that hands over to the white page */}
        <div ref={glow} className="pointer-events-none absolute inset-0" style={{ transform: "translateY(100%)" }} aria-hidden>
          <div className="absolute inset-x-[-20%] top-0 h-[60%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_100%,#2a3fd8_0%,rgba(42,63,216,0.55)_35%,transparent_70%)] blur-2xl" />
          <div className="absolute inset-x-0 top-[38%] bottom-0 bg-gradient-to-b from-transparent via-[#e9ecfb] to-x-white" />
        </div>
      </div>
    </section>
  );
}
