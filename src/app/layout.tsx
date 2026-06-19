import type { Metadata, Viewport } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "700", "900"],
  display: "swap",
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://snakeladder3d.vercel.app";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "Snake and Ladder 3D",
      url: SITE_URL,
      description:
        "The best free Snake and Ladder game online. Play in stunning 3D with up to 6 players, offline mode, ranked matches, and real-time chat.",
      applicationCategory: "Game",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and WebGL",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Online Multiplayer up to 6 players",
        "Offline single-player mode",
        "Local pass-and-play multiplayer",
        "3D animated board with snakes and ladders",
        "Real-time chat",
        "Ranked leaderboard",
        "PWA — installable on any device",
      ],
      screenshot: `${SITE_URL}/opengraph-image`,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "127",
        bestRating: "5",
      },
    },
    {
      "@type": "VideoGame",
      "@id": `${SITE_URL}/#game`,
      name: "Snake and Ladder 3D",
      description:
        "Classic Snake and Ladder board game reimagined in 3D. Play online with friends or offline solo — free forever.",
      url: SITE_URL,
      genre: ["Board game", "Multiplayer", "Strategy"],
      numberOfPlayers: { "@type": "QuantitativeValue", minValue: 1, maxValue: 6 },
      playMode: ["MultiPlayer", "SinglePlayer", "CoOp"],
      gamePlatform: ["Web browser", "Mobile browser", "Progressive Web App"],
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How do you play Snake and Ladder online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Create a free account, go to the Multiplayer Lobby, create or join a room with a code, and invite up to 5 friends. Roll the dice on your turn — climb ladders and dodge snakes to be the first to reach square 100!",
          },
        },
        {
          "@type": "Question",
          name: "Can I play Snake and Ladder offline?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! This is a Progressive Web App (PWA). After your first visit, the game is cached and playable offline. You can practice solo or play local multiplayer with 2–6 players on one device with no internet needed.",
          },
        },
        {
          "@type": "Question",
          name: "Is this Snake and Ladder game free to play?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Completely free — no downloads, no purchases, no ads. Just create a free account to unlock multiplayer and ranked leaderboards. Solo and local play require no account at all.",
          },
        },
        {
          "@type": "Question",
          name: "How many players can play Snake and Ladder online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Online multiplayer supports 2–6 players per room. Local pass-and-play also supports 2–6 players on one device. Solo play is also available against a bot.",
          },
        },
        {
          "@type": "Question",
          name: "What makes this the best Snake and Ladder game?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Full 3D animated board using Three.js, real-time multiplayer with in-game chat, a ranked progression system from Bronze to Legend, offline PWA support, pass-and-play local mode, and correct rules — exact 100 required to win, roll a 6 for an extra turn.",
          },
        },
        {
          "@type": "Question",
          name: "Can I play Snake and Ladder on mobile?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! The game is fully responsive and works on all modern mobile browsers (Chrome, Safari, Firefox). You can also install it as an app on your home screen via the PWA prompt.",
          },
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Snake and Ladder 3D",
      url: SITE_URL,
      logo: `${SITE_URL}/assets/icons/icon-512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Snake and Ladder 3D",
      description: "Free online Snake and Ladder game with 3D graphics and multiplayer",
      publisher: { "@id": `${SITE_URL}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/leaderboard?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
      inLanguage: "en-US",
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Snake and Ladder Game Online — Free 3D Multiplayer | Play Now",
    template: "%s | Snake and Ladder 3D",
  },
  description:
    "Play the best Snake and Ladder game online for free! Stunning 3D board, real-time multiplayer up to 6 players, offline mode, in-game chat, and ranked leaderboard. Works on Chrome, Firefox, and Safari.",
  keywords: [
    "snake and ladder game",
    "snake and ladder game online",
    "offline snake and ladder game",
    "best snake and ladder game",
    "snake and ladder multiplayer",
    "3D snake and ladder game",
    "free snake and ladder game",
    "snake and ladder game online free",
    "snake and ladder online with friends",
    "snake and ladder board game online",
    "snakes and ladders game",
    "snakes and ladders online free",
    "snake ladder game play",
    "snake and ladder game for 2 players",
    "snake and ladder game for 6 players",
    "play snake and ladder online",
  ],
  authors: [{ name: "Snake and Ladder 3D" }],
  creator: "Snake and Ladder 3D",
  publisher: "Snake and Ladder 3D",
  category: "games",
  classification: "Game/BoardGame",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "Snake and Ladder Game Online — Free 3D Multiplayer",
    description:
      "Play the best free Snake and Ladder game online! Real-time 3D multiplayer with up to 6 players, offline support, chat, and ranked leaderboards.",
    siteName: "Snake and Ladder 3D",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Snake and Ladder 3D — Free Online Multiplayer Board Game",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snake and Ladder Game Online — Free 3D Multiplayer",
    description: "Play the best free Snake and Ladder game online with stunning 3D graphics and real-time multiplayer!",
    images: ["/opengraph-image"],
    creator: "@snakeladder3d",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/icons/snake-ladder-favicon.png",
    shortcut: "/assets/icons/snake-ladder-favicon.png",
    apple: "/assets/icons/snake-ladder-favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Snake & Ladder",
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#6366f1",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030305" },
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${orbitron.variable}`}>
      <head>
        {/* Preconnect to speed up font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* DNS prefetch for third-party services */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Favicon */}
        <link rel="icon" href="/assets/icons/snake-ladder-favicon.png" type="image/png" />
        <link rel="icon" href="/assets/icons/snake-ladder-favicon.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/icons/snake-ladder-favicon.png" />
        {/* Structured data — JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </head>
      <body className="bg-grid min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
