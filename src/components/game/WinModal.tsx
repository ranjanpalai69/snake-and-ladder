"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, ArrowRight, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { PLAYER_COLORS, RANK_COLORS } from "@/types/game";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

export function WinModal() {
  const { showWinModal, gameState, setShowWinModal, reset } = useGameStore();
  const { user } = useAuthStore();
  const { leaveRoom } = useSocket();
  const router = useRouter();

  const winner = gameState?.winner;
  const isLocalGame = gameState?.roomId === "local";
  const isWinner = !isLocalGame && winner?.userId === user?.id;

  function handlePlayAgain() {
    try { leaveRoom(); } catch {}
    reset();
    setShowWinModal(false);
    router.push(isLocalGame ? "/local" : "/lobby");
  }

  if (!showWinModal || !winner) return null;

  const winnerColor = PLAYER_COLORS[winner.color];
  const rankColor = RANK_COLORS[winner.rank.tier];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      >
        {/* Stars particle burst */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ["#ffd700", "#6366f1", "#22c55e", "#ef4444"][i % 4],
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
                y: [0, -80 - Math.random() * 100],
                x: [(Math.random() - 0.5) * 200],
              }}
              transition={{ duration: 1.5, delay: Math.random() * 0.5, ease: "easeOut" }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full max-w-md mx-4 bg-gradient-to-b from-slate-900 to-black rounded-2xl border overflow-hidden"
          style={{ borderColor: `${winnerColor}66` }}
        >
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: winnerColor }} />

          <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center gap-4">
            {/* Trophy */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `${winnerColor}22`, border: `2px solid ${winnerColor}66` }}
            >
              <Trophy className="w-10 h-10" style={{ color: winnerColor }} />
            </motion.div>

            <div>
              <h2 className="font-display text-3xl font-bold text-white mb-1">
                {isWinner ? "You Win!" : `${winner.username} Wins!`}
              </h2>
              <p className="text-slate-400 text-sm">
                {isWinner
                  ? "Outstanding! You reached position 100!"
                  : `${winner.username} reached position 100 first.`}
              </p>
            </div>

            {/* Rank display */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: `${rankColor}22`, border: `1px solid ${rankColor}44` }}
            >
              <span className="text-sm font-semibold capitalize" style={{ color: rankColor }}>
                {winner.rank.tier}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5"
                    fill={i < winner.rank.stars ? rankColor : "transparent"}
                    stroke={rankColor}
                    strokeWidth={2}
                  />
                ))}
              </div>
            </div>

            {/* Final standings */}
            <div className="w-full space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider text-left">Final Standings</p>
              {gameState?.players
                .slice()
                .sort((a, b) => b.position - a.position)
                .map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                    <span className="text-sm font-bold text-slate-500 w-4">#{idx + 1}</span>
                    <div
                      className="w-5 h-5 rounded-full shrink-0"
                      style={{ background: PLAYER_COLORS[p.color] }}
                    />
                    <span className="text-sm text-white font-medium flex-1 text-left">{p.username}</span>
                    <span className="text-xs font-mono text-slate-400">{p.position}/100</span>
                  </div>
                ))}
            </div>

            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-4 h-4" /> {isLocalGame ? "New Game" : "Play Again"}
              </button>
              <button
                onClick={() => { try { leaveRoom(); } catch {} reset(); setShowWinModal(false); router.push("/"); }}
                className="flex-1 py-3 rounded-xl bg-white/8 text-slate-300 font-semibold flex items-center justify-center gap-2 hover:bg-white/12 transition-all"
              >
                <ArrowRight className="w-4 h-4" /> Home
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
