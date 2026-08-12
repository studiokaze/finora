import type { NextConfig } from "next";

// This project sits inside C:\Users\Lenovo which contains other lockfiles.
// Pin the workspace root so Next.js does not walk up and mis-infer the
// monorepo root (which breaks output file tracing on Vercel).
const projectRoot = import.meta.dirname;

const nextConfig: NextConfig = {
  // Native SWC/Turbopack bindings are blocked by a WDAC policy on this machine,
  // so local builds run webpack (see package.json scripts). turbopack.root is
  // kept for environments where turbopack IS available (Vercel/CI).
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
