import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      // Allow ConvertAPI images just in case you render them in the UI later
      {
        protocol: 'https',
        hostname: '*.convertapi.com', 
      },
    ],
  },
};

export default nextConfig;