"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dices, ArrowRight, Skull, ArrowUp } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import { PLAYER_COLORS } from "@/types/game";

interface GameControlsProps {
  /** Override the default socket-based roll (used by single-player) */
  onRollOverride?: () => void;
  /** Override isMyTurn (single-player is always true) */
  isMyTurnOverride?: boolean;
}

export function GameControls({ onRollOverride, isMyTurnOverride }: GameControlsProps) {
  const { gameState, isMyTurn: socketIsMyTurn, isRolling, myPlayer, currentPlayer } = useGame();
  const { rollDice: socketRoll } = useSocket();

  const isMyTurn = isMyTurnOverride !== undefined ? isMyTurnOverride : socketIsMyTurn;
  const handleRoll = onRollOverride ?? socketRoll;

  if (!gameState || gameState.status === "finished") return null;

  const pieceColor = myPlayer ? PLAYER_COLORS[myPlayer.color] : "#6366f1";
  const currentColor = currentPlayer ? PLAYER_COLORS[currentPlayer.color] : "#6366f1";
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border"
        style={{ borderColor: `${currentColor}44`, background: `${currentColor}11` }}
      >
        <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: currentColor }} />
        <span className="text-sm font-medium text-white">
          {isMyTurn ? "Your turn" : `${currentPlayer?.username ?? "..."}'s turn`}
        </span>
        {isRolling && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="ml-auto text-xs text-slate-400"
          >
            Rolling...
          </motion.span>
        )}
      </div>

      <motion.button
        whileHover={{ scale: isMyTurn && !isRolling ? 1.02 : 1 }}
        whileTap={{ scale: isMyTurn && !isRolling ? 0.97 : 1 }}
        disabled={!isMyTurn || isRolling}
        onClick={handleRoll}
        className={cn(
          "w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 font-display font-bold text-base transition-all duration-200",
          isMyTurn && !isRolling
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40"
            : "bg-white/5 text-slate-500 cursor-not-allowed"
        )}
        style={isMyTurn && !isRolling ? { boxShadow: `0 0 24px ${pieceColor}44` } : {}}
      >
        <motion.div
          animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
          transition={{ repeat: isRolling ? Infinity : 0, duration: 0.4 }}
        >
          <Dices className="w-5 h-5" />
        </motion.div>
        {isRolling ? "Rolling..." : isMyTurn ? "Roll Dice" : "Wait..."}
      </motion.button>

      <AnimatePresence>
        {lastMove && (
          <motion.div
            key={lastMove.timestamp}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-slate-500 px-1"
          >
            {lastMove.hadSnake ? (
              <><Skull className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400">Snake! Fell {lastMove.from} → {lastMove.to}</span></>
            ) : lastMove.hadLadder ? (
              <><ArrowUp className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Ladder! Climbed {lastMove.from} → {lastMove.to}</span></>
            ) : (
              <><ArrowRight className="w-3.5 h-3.5" /><span>Rolled {lastMove.diceValue} — moved to {lastMove.to}</span></>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
