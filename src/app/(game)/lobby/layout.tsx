import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multiplayer Lobby — Play Snake and Ladder Online with Friends",
  description:
    "Join or create a Snake and Ladder online room. Invite up to 5 friends, chat in real-time, and compete in ranked matches. Free, no download required.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://snakeladder3d.vercel.app"}/lobby`,
  },
  openGraph: {
    title: "Snake and Ladder Online — Multiplayer Lobby",
    description: "Create a room and challenge friends to a Snake and Ladder game online. Up to 6 players, real-time.",
  },
};

export default function LobbyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
