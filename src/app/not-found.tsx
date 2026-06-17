import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-6xl font-black text-white mb-4">404</h1>
        <p className="text-slate-400 mb-8">This page doesn&apos;t exist.</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
