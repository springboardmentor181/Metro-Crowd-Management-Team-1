import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean container image for Docker deployment.
  output: "standalone",
};

export default nextConfig;
