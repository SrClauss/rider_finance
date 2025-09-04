import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
  ignoreDuringBuilds: false,
  },
  output: 'standalone',
  /* config options here */
};

export default nextConfig;
