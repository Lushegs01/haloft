import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Icons are imported by name from a barrel file. Without this, a single
  // icon can pull the whole module graph into a route's bundle.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  images: {
    // AVIF first: listing photos are the heaviest thing a student on a
    // phone downloads, and it lands roughly 25% smaller than WebP for
    // photographic content. Browsers that can't take it get WebP.
    formats: ["image/avif", "image/webp"],
    // Property photos change only when the ops team re-shoots them, so
    // optimised variants can sit in the CDN for a month instead of being
    // regenerated. Every regeneration is billable work on the origin.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Trim the generated set to the widths the layouts actually request.
    deviceSizes: [360, 420, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
