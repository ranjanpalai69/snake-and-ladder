import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Multiplayer — Offline Snake and Ladder Game for 2–6 Players",
  description:
    "Play offline Snake and Ladder on one device with 2–6 players. No internet needed — pass-and-play on your phone, tablet, or computer. Free forever.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://snakeladder3d.vercel.app"}/local`,
  },
  openGraph: {
    title: "Offline Snake and Ladder — Local Pass-and-Play (2–6 Players)",
    description:
      "No internet? No problem. Play Snake and Ladder offline with 2–6 players on a single device. Free Snake and Ladder game with no downloads.",
  },
};

export default function LocalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
