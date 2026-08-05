import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone only for Docker builds; Vercel manages its own output.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
};

export default nextConfig;
