import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode intentionally mounts components twice in development
  // to catch side-effects. This causes two WebGL contexts to be created almost
  // simultaneously for the R3F <Canvas>, which triggers browser-level WebGL
  // context loss and blocking. Disabling it is the standard fix for heavy
  // WebGL / Three.js apps in Next.js.
  reactStrictMode: false,
};

export default nextConfig;
