"use client";
import { motion } from "framer-motion";

type Cube = [number, number, number];

// Voxel icon designs (x runs down-right, y down-left, z up)
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const VOXELS: Record<string, Cube[]> = {
  appliances: [
    ...range(0, 3).flatMap((z) => [[0, 0, z], [1, 0, z]] as Cube[]), // fridge
    [3, 0, 0], [3, 1, 0], [4, 0, 0], [4, 1, 0], [3, 0, 1], [3, 1, 1], [4, 0, 1], [4, 1, 1], // washer
  ],
  "two-wheelers": [
    [0, 0, 0], [4, 0, 0], // wheels
    [1, 0, 1], [2, 0, 1], [3, 0, 1], [4, 0, 1], // body
    [1, 0, 2], [2, 0, 2], // seat
    [4, 0, 2], [4, 0, 3], // handlebar
  ],
  cars: [
    ...range(0, 4).flatMap((x) => [[x, 0, 0], [x, 1, 0]] as Cube[]),
    ...range(1, 3).flatMap((x) => [[x, 0, 1], [x, 1, 1]] as Cube[]),
  ],
  commercial: [
    ...range(0, 5).flatMap((x) => [[x, 0, 0], [x, 1, 0]] as Cube[]),
    ...range(0, 3).flatMap((x) => [[x, 0, 1], [x, 1, 1], [x, 0, 2], [x, 1, 2]] as Cube[]),
    [5, 0, 1], [5, 1, 1], [5, 0, 2], [5, 1, 2],
  ],
};

const S = 13; // cube edge in px
const CX = Math.cos(Math.PI / 6) * S;
const CY = Math.sin(Math.PI / 6) * S;
const pt = (x: number, y: number, z: number) => [(x - y) * CX, (x + y) * CY - z * S] as const;
const poly = (pts: (readonly [number, number])[]) => pts.map((p) => p.join(",")).join(" ");

/** Isometric voxel icon whose cubes drop into place when scrolled into view and hop on hover. */
export default function IsoVoxel({ kind, size = 96 }: { kind: keyof typeof VOXELS; size?: number }) {
  const cubes = [...VOXELS[kind]].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);
  const all = cubes.flatMap(([x, y, z]) => [pt(x, y, z), pt(x + 1, y + 1, z + 1), pt(x + 1, y, z), pt(x, y + 1, z + 1)]);
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs) - 2, minY = Math.min(...ys) - 2;
  const w = Math.max(...xs) - minX + 2, h = Math.max(...ys) - minY + 2;

  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} width={size} height={(size * h) / w} className="overflow-visible" aria-hidden>
      {cubes.map(([x, y, z], i) => {
        const top = [pt(x, y, z + 1), pt(x + 1, y, z + 1), pt(x + 1, y + 1, z + 1), pt(x, y + 1, z + 1)];
        const left = [pt(x, y + 1, z), pt(x + 1, y + 1, z), pt(x + 1, y + 1, z + 1), pt(x, y + 1, z + 1)];
        const right = [pt(x + 1, y, z), pt(x + 1, y + 1, z), pt(x + 1, y + 1, z + 1), pt(x + 1, y, z + 1)];
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: -28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.035, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
            className="vox-cube"
            style={{ ["--d" as string]: `${i * 18}ms` }}
          >
            <polygon points={poly(left)} fill="#fcfcfc" stroke="#050c22" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points={poly(right)} fill="#050c22" stroke="#050c22" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points={poly(top)} fill="#fcfcfc" stroke="#050c22" strokeWidth="1.2" strokeLinejoin="round" />
          </motion.g>
        );
      })}
    </svg>
  );
}
