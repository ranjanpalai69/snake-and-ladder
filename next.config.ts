import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  // Precache the two offline-capable game pages so they're available
  // immediately after SW installation, even before the user has visited them.
  additionalManifestEntries: [
    { url: "/single-player", revision: `build-${Date.now()}` },
    { url: "/local", revision: `build-${Date.now()}` },
  ],
  runtimeCaching: [
    {
      urlPattern: /^\/(?:login|signup|lobby|profile|leaderboard|single-player|local)?$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "pages-cache", expiration: { maxEntries: 20 } },
    },
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "next-static", expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 30 } },
    },
    {
      urlPattern: /\/_next\/image\?.*/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "next-images", expiration: { maxEntries: 100 } },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "google-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 365 } },
    },
    {
      urlPattern: /\/assets\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "game-assets", expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 7 } },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: { cacheName: "offlineCache", expiration: { maxEntries: 200 } },
    },
  ],
});

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Long-lived cache for immutable Next.js chunks
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Moderate cache for public assets
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      // Manifest and icons — cache well
      {
        source: "/(manifest.json|favicon.ico|browserconfig.xml)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
