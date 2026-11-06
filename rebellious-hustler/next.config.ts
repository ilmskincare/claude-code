import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stock, prices and settings change in the admin and must show at once; nothing is cached at build time.
  cacheComponents: false,
  devIndicators: false,
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "sharp"],
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
  images: {
    // Product photos live in a public Vercel Blob store in production and under /api/files locally.
    remotePatterns: [{ protocol: "https", hostname: "**.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
