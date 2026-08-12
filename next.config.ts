import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * ── The one compromise, stated plainly ──────────────────────
 *
 * `script-src` includes 'unsafe-inline'. Next's App Router emits inline
 * bootstrap and flight-data scripts on every page, so the alternatives
 * are a per-request nonce or nothing. A nonce has to be minted in
 * middleware and threaded into the response, which makes every page
 * dynamic — and the public catalogue is statically rendered and cached
 * precisely so one campus can serve an intake off a handful of renders
 * (see src/lib/data/campus.ts). Trading that for a nonce is a real cost
 * for a partial gain.
 *
 * What the policy still buys, all of which matters:
 *   - `default-src 'self'` and an explicit `connect-src`: an injected
 *     script cannot exfiltrate to an arbitrary host.
 *   - `object-src 'none'`: no Flash/PDF plugin embedding.
 *   - `base-uri 'self'`: a `<base>` tag cannot re-point every relative URL.
 *   - `form-action 'self' https://checkout.paystack.com`: a form cannot
 *     be repointed at an attacker's collector.
 *   - `frame-ancestors 'self'`: clickjacking, and the modern spelling of
 *     X-Frame-Options.
 *   - `upgrade-insecure-requests`: no mixed content on a page handling
 *     payment redirects.
 *
 * If the catalogue ever moves to dynamic rendering, replace
 * 'unsafe-inline' with a nonce and 'strict-dynamic'.
 *
 * Paystack is allowed where it has to be: the checkout redirect is a
 * top-level navigation, and its inline script runs on Paystack's own
 * origin, so only `form-action` and `connect-src` need to name it.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  // Tailwind and next-themes both set inline styles; there is no
  // equivalent of a nonce that keeps them working.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co",
  "frame-src 'self' https://checkout.paystack.com https://www.google.com",
  "form-action 'self' https://checkout.paystack.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Kept alongside frame-ancestors for browsers that predate CSP 2.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
  },
  // Puts the site in its own browsing-context group, so a window it opens
  // (the Paystack checkout) cannot reach back through window.opener.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Documents and data are same-origin only. Deliberately NOT applied to
  // /_next/image or the listing photos below, which other origins (an
  // email client rendering a receipt, a link preview) do need to fetch.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Legacy Adobe cross-domain policy files. There are none; say so.
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

/** Images have to stay fetchable cross-origin; everything else does not. */
const imageHeaders = [
  { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
];

/**
 * Nothing about a booking, a payment or an admin screen may be cached by
 * a browser or a shared proxy. These routes already render dynamically;
 * this is the header that stops an intermediary deciding otherwise.
 */
const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, max-age=0",
  },
  { key: "Pragma", value: "no-cache" },
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
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/_next/image", headers: imageHeaders },
      // Tier 5 of the caching model in src/lib/data/campus.ts: never.
      { source: "/admin/:path*", headers: noStoreHeaders },
      { source: "/api/:path*", headers: noStoreHeaders },
      { source: "/payment/:path*", headers: noStoreHeaders },
      { source: "/auth/:path*", headers: noStoreHeaders },
      { source: "/:campus/dashboard", headers: noStoreHeaders },
      { source: "/:campus/property/:slug/booking", headers: noStoreHeaders },
    ];
  },
};

export default nextConfig;
