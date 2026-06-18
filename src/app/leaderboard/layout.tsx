import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Top Snake and Ladder Players Worldwide",
  description:
    "See who ranks first in our global Snake and Ladder leaderboard. Compete in ranked matches and climb from Bronze to Legend. Free online Snake and Ladder game.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://snakeladder3d.vercel.app"}/leaderboard`,
  },
  openGraph: {
    title: "Snake and Ladder Leaderboard — Top Ranked Players",
    description: "Global rankings for the best Snake and Ladder game online. Climb from Bronze to Legend rank.",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
