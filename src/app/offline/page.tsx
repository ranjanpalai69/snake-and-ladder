"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { WifiOff, Gamepad2, RotateCcw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mx-auto mb-6"
        >
          <WifiOff className="w-10 h-10 text-slate-500" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold text-white mb-3">You&apos;re Offline</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          No internet connection detected. Multiplayer is unavailable, but you can still practice solo!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/single-player"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Gamepad2 className="w-4 h-4" /> Play Solo (Offline)
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/8 border border-white/10 text-white font-semibold hover:bg-white/12 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
