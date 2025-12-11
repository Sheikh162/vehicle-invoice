import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Stable features (Top Level)
  serverExternalPackages: ["pdf-to-png-converter", "pdfjs-dist"],

  // 2. Trace the worker file (Now Top Level, NOT inside experimental)
  outputFileTracingIncludes: {
    '/api/invoices/analyze': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
  },

  // 3. Images config
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