"use client";

import { motion } from "framer-motion";
import { WifiOff, Gamepad2, RotateCcw, Users } from "lucide-react";

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
          No internet connection. Multiplayer is unavailable, but you can still play offline — solo or with friends on the same device.
        </p>

        <div className="flex flex-col gap-3">
          {/* Use window.location for full-page navigation so the service worker
              serves the cached document, not an RSC fetch that bypasses cache */}
          <button
            onClick={() => { window.location.href = "/single-player"; }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4" /> Play Solo / vs Bot
          </button>
          <button
            onClick={() => { window.location.href = "/local"; }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Users className="w-4 h-4" /> Local Multiplayer (2–6 Players)
          </button>
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
