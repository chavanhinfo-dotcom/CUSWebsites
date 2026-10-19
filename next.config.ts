import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
    // `next dev` gets its own cache folder, so running `next build` while the dev server is up can't
    // overwrite the files it is serving (which shows up as "Could not find the module … in the React
    // Client Manifest" / "__webpack_modules__[moduleId] is not a function").
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
