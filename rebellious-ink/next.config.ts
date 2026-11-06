import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Live operational data on every request; opt-in caching per query only.
  cacheComponents: false,
  // The floating dev-tools button overlaps controls at phone width and blocks pointer events in tests.
  devIndicators: false,
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  experimental: { serverActions: { bodySizeLimit: "40mb" } },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
