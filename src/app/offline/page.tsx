"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { WifiOff, Gamepad2, Users, RotateCcw, Loader2 } from "lucide-react";

// Load game pages from cached JS chunks — no HTML navigation needed.
// All _next/static chunks are precached by the SW, so these dynamic imports
// resolve from cache even when offline.
const SinglePlayerPage = dynamic(
  () => import("@/app/(game)/single-player/page"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    ),
  }
);

const LocalPage = dynamic(
  () => import("@/app/(game)/local/page"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    ),
  }
);

export default function OfflinePage() {
  const [mode, setMode] = useState<"home" | "solo" | "local">("home");

  if (mode === "solo") return <SinglePlayerPage />;
  if (mode === "local") return <LocalPage />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mx-auto mb-6"
        >
          <WifiOff className="w-10 h-10 text-slate-500" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold text-white mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          No internet — multiplayer is unavailable. You can still play solo or
          with friends on this device.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode("solo")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4" /> Play Solo / vs Bot
          </button>
          <button
            onClick={() => setMode("local")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Users className="w-4 h-4" /> Local Multiplayer (2–6 Players)
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/8 border border-white/10 text-white font-semibold hover:bg-white/12 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
