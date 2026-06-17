import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Offline fallback — single-player works without network
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    // App shell — always serve from cache
    {
      urlPattern: /^\/(?:login|signup|lobby|profile|leaderboard|single-player)?$/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "pages-cache", expiration: { maxEntries: 20 } },
    },
    // Static assets — cache first
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "next-static", expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 30 } },
    },
    // Next.js image optimization
    {
      urlPattern: /\/_next\/image\?.*/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "next-images", expiration: { maxEntries: 100 } },
    },
    // Fonts — cache forever (they don't change)
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "google-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 365 } },
    },
    // 3D assets from /public
    {
      urlPattern: /\/assets\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "game-assets", expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 7 } },
    },
    // Supabase REST (best-effort — gracefully fails offline)
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    // Everything else network-first
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: { cacheName: "offlineCache", expiration: { maxEntries: 200 } },
    },
  ],
});

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  images: {
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
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
