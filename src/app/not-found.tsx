import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found — Snake and Ladder 3D",
  description: "The page you're looking for doesn't exist. Head back and play Snake and Ladder online for free.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-6xl font-black text-white mb-4">404</h1>
        <p className="text-slate-400 mb-2">This page doesn&apos;t exist.</p>
        <p className="text-slate-600 text-sm mb-8">Head back and play Snake and Ladder online for free.</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
          Play Snake &amp; Ladder
        </Link>
      </div>
    </div>
  );
}
