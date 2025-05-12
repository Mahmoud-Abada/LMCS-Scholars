import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Ignores all TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Also ignore ESLint errors if needed
  },
};

export default nextConfig;
