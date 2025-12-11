import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Force Vercel to keep these packages intact (do not bundle)
  serverExternalPackages: ["pdf-to-png-converter", "canvas", "pdfjs-dist"],
  
  // 2. Allow images from UploadThing
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