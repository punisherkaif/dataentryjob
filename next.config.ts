import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase payload size for Server Actions when uploading multiple images or archives (ZIP/RAR/7Z)
  experimental: {
    serverActions: {
      bodySizeLimit: '150mb',
    },
    proxyClientMaxBodySize: '150mb',
  },
};

export default nextConfig;
