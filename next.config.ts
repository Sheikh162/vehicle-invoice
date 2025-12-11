import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Critical: Tells Vercel to treat these as external packages so binaries are preserved
  serverExternalPackages: ["pdf-to-png-converter"], 
  
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
    ],
  },
};

export default nextConfig;