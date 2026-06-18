import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solo Practice — Single Player Snake and Ladder Game",
  description:
    "Practice Snake and Ladder alone against a bot. Perfect your strategy before taking on real opponents online. Free single-player Snake and Ladder game.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://snakeladder3d.vercel.app"}/single-player`,
  },
  openGraph: {
    title: "Single Player Snake and Ladder — Practice Mode",
    description: "Sharpen your Snake and Ladder skills solo before competing online. Free, no account needed.",
  },
};

export default function SinglePlayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
