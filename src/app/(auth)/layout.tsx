import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Snake and Ladder Online Free Game",
  description:
    "Create a free account or sign in to play Snake and Ladder online with friends. Unlock multiplayer, ranked matches, and match history.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
