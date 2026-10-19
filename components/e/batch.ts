// Draw-call reduction for option E's 3D scenes.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Part = { geo: THREE.BufferGeometry; mat: THREE.Material };

/**
 * Bakes a model (a group of many meshes, e.g. a vehicle with separate wheels, lights and panels) into one
 * merged geometry per material, in the group's own space. The model's geometries are disposed; reuse the
 * parts in InstancedMeshes to draw every copy of the model with one call per material.
 */
export function bakeModel(model: THREE.Object3D): Part[] {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  model.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const owned = new Set<THREE.BufferGeometry>();
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible || Array.isArray(m.material)) return;
    owned.add(m.geometry);
    let g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    if (g.index) {
      const flat = g.toNonIndexed();
      g.dispose();
      g = flat;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", g.getAttribute("position"));
    if (g.getAttribute("normal")) out.setAttribute("normal", g.getAttribute("normal"));
    else out.computeVertexNormals();
    out.setAttribute("uv", g.getAttribute("uv") ?? new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
    const list = byMat.get(m.material) ?? [];
    list.push(out);
    byMat.set(m.material, list);
  });
  owned.forEach((g) => g.dispose());
  const parts: Part[] = [];
  byMat.forEach((geos, mat) => {
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (merged) parts.push({ geo: merged, mat });
  });
  return parts;
}

/** A batch of copies of one baked model: one InstancedMesh per material. */
export class Batch {
  readonly meshes: THREE.InstancedMesh[];
  constructor(parts: Part[], count: number, scene: THREE.Object3D) {
    this.meshes = parts.map(({ geo, mat }) => {
      const m = new THREE.InstancedMesh(geo, mat, count);
      m.castShadow = !mat.transparent;
      m.receiveShadow = true;
      m.frustumCulled = false; // copies spread along the road; per-copy culling is not worth it here
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(m);
      return m;
    });
  }
  set(i: number, matrix: THREE.Matrix4) {
    for (const m of this.meshes) m.setMatrixAt(i, matrix);
  }
  commit() {
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    for (const m of this.meshes) {
      m.geometry.dispose();
      m.dispose();
      m.removeFromParent();
    }
  }
}

/**
 * Compiles every shader a scene needs and uploads its geometry and textures, by drawing it once (hidden
 * objects included), then waits until the GPU has actually finished compiling. Browsers compile shaders in
 * the background; drawing with one that is not ready blocks until it is, which froze the page for seconds
 * when a section was reached soon after the intro. `done` is called once everything is ready (the
 * preloader waits for it).
 */
export function warmUp(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, done: () => void) {
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (!o.visible) {
      hidden.push(o);
      o.visible = true;
    }
  });
  renderer.render(scene, camera); // creates every program, including the shadow passes, and uploads buffers
  const ready = compileReady(renderer, scene, camera); // resolves when those programs have finished compiling
  hidden.forEach((o) => (o.visible = false));
  ready.then(done, done);
}

/**
 * Resolves once a scene's shaders have compiled. Browsers with KHR_parallel_shader_compile compile in the
 * background and are polled (`compileAsync`); without it (Safari, software renderers) compiling is
 * synchronous and already done, and `compileAsync` would only log an "extension not supported" warning.
 */
export function compileReady(renderer: THREE.WebGLRenderer, scene: THREE.Object3D, camera: THREE.Camera) {
  if (renderer.extensions.has("KHR_parallel_shader_compile")) return renderer.compileAsync(scene, camera).then(() => undefined);
  renderer.compile(scene, camera);
  return Promise.resolve();
}
