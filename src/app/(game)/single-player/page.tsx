"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Bot, User } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DynamicGameScene } from "@/components/3d/DynamicScene";
import { GameControls } from "@/components/game/GameControls";
import { WinModal } from "@/components/game/WinModal";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { createInitialGameState, applyMove, rollDice } from "@/lib/game/engine";
import type { GamePlayer, AvatarId } from "@/types/game";
import { generateId } from "@/lib/utils";
import { playDiceRoll } from "@/lib/sounds";

const BOT_ID = "bot-player";

function buildSoloState(userId: string, username: string, avatarId: AvatarId, withBot: boolean) {
  const human: GamePlayer = {
    id: generateId(),
    userId,
    username,
    avatarId,
    color: "blue",
    position: 0,
    isReady: true,
    isConnected: true,
    rank: { tier: "bronze", stars: 0, totalStars: 0, points: 0 },
    level: 1,
  };

  if (!withBot) return createInitialGameState("solo", [human]);

  const bot: GamePlayer = {
    id: generateId(),
    userId: BOT_ID,
    username: "Bot",
    avatarId: "avatar_02",
    color: "red",
    position: 0,
    isReady: true,
    isConnected: true,
    rank: { tier: "bronze", stars: 0, totalStars: 0, points: 0 },
    level: 1,
  };
  return createInitialGameState("solo", [human, bot]);
}

// ── Mode picker ───────────────────────────────────────────────────────────────
function ModePicker({ onSelect }: { onSelect: (withBot: boolean) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="font-display text-3xl font-black text-white text-center mb-8">
          Solo <span className="gradient-text">Practice</span>
        </h1>

        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(false)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border border-blue-500/25 bg-gradient-to-r from-blue-900/40 to-indigo-900/30 hover:border-blue-400/50 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-600/25 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-blue-300" />
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-white">Play Solo</p>
            <p className="text-sm text-slate-400 mt-0.5">Practice alone, no opponent</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(true)}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-900/40 to-purple-900/30 hover:border-violet-400/50 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-600/25 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-violet-300" />
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-white">Play vs Bot</p>
            <p className="text-sm text-slate-400 mt-0.5">Challenge an AI opponent</p>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SinglePlayerPage() {
  const { gameState, setGameState, setRolling, isRolling, reset, setShowWinModal, setLastMove } = useGameStore();
  const { user, profile } = useAuthStore();

  const [mode, setMode] = useState<"pick" | "play">("pick");
  const [withBot, setWithBot] = useState(false);
  const animBusyRef = useRef(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init game after mode selected
  const startGame = useCallback((bot: boolean) => {
    if (!user || !profile) return;
    reset();
    const gs = buildSoloState(user.id, profile.username, profile.avatar_id as AvatarId, bot);
    setGameState(gs);
    setWithBot(bot);
    setMode("play");
  }, [user, profile, reset, setGameState]);

  // ── Human roll ────────────────────────────────────────────────────────────
  const handleRoll = useCallback(() => {
    if (!gameState || isRolling || gameState.status === "finished") return;
    if (animBusyRef.current) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    // Don't let human roll when it's bot's turn
    if (currentPlayer?.userId === BOT_ID) return;

    setRolling(true);
    playDiceRoll();

    setTimeout(() => {
      const player = gameState.players[gameState.currentPlayerIndex];
      const diceValue = rollDice();
      const { newState, move } = applyMove(gameState, player.id, diceValue);
      setLastMove(move);
      setGameState(newState);
      // Rolling stays true until animation finishes (onAnimDone)
      if (newState.winner) setShowWinModal(true);
    }, 700);
  }, [gameState, isRolling, setGameState, setRolling, setShowWinModal, setLastMove]);

  // Called by ThreeScene when all animations complete
  const handleAnimDone = useCallback(() => {
    animBusyRef.current = false;
    setRolling(false);
  }, [setRolling]);

  // Track animation busy state
  useEffect(() => {
    if (isRolling) animBusyRef.current = true;
  }, [isRolling]);

  // ── Bot auto-roll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!withBot || !gameState || gameState.status === "finished") return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer?.userId !== BOT_ID) return;
    if (isRolling || animBusyRef.current) return;

    // Bot waits 1.2s then rolls
    botTimerRef.current = setTimeout(() => {
      setRolling(true);
      playDiceRoll();

      setTimeout(() => {
        // Re-read from store to get latest state
        const gs = useGameStore.getState().gameState;
        if (!gs) return;
        const player = gs.players[gs.currentPlayerIndex];
        if (player?.userId !== BOT_ID) { setRolling(false); return; }

        const diceValue = rollDice();
        const { newState, move } = applyMove(gs, player.id, diceValue);
        setLastMove(move);
        setGameState(newState);
        if (newState.winner) setShowWinModal(true);
      }, 700);
    }, 1200);

    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
  }, [gameState?.currentPlayerIndex, gameState?.status, withBot, isRolling]);

  function handleRestart() {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    reset();
    animBusyRef.current = false;
    setMode("pick");
  }

  // ── Turn label ────────────────────────────────────────────────────────────
  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
  const isHumanTurn = currentPlayer?.userId !== BOT_ID;

  if (mode === "pick") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <ModePicker onSelect={(bot) => startGame(bot)} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 pt-16 overflow-hidden">
        <div className="flex-1 relative">
          <DynamicGameScene
            singlePlayer
            onRollOverride={handleRoll}
            onAnimDone={handleAnimDone}
          />
        </div>

        <motion.div
          initial={{ x: 280 }}
          animate={{ x: 0 }}
          className="w-72 flex flex-col gap-4 p-4 bg-black/40 border-l border-white/8 overflow-y-auto"
        >
          {/* Mode indicator */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              {withBot ? <Bot className="w-4 h-4 text-violet-400" /> : <User className="w-4 h-4 text-blue-400" />}
              <h2 className="font-display text-sm font-bold text-white">
                {withBot ? "vs Bot" : "Solo Practice"}
              </h2>
            </div>
            {withBot && gameState && (
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPlayer?.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs font-medium ${isHumanTurn ? "text-blue-400" : "text-violet-400"}`}
                >
                  {isHumanTurn ? "Your turn — roll the dice!" : "Bot is thinking..."}
                </motion.p>
              </AnimatePresence>
            )}
            {!withBot && <p className="text-xs text-slate-400">Roll the dice and reach square 100!</p>}
          </div>

          {/* Player panels */}
          {withBot && gameState && (
            <div className="space-y-2">
              {gameState.players.map((p) => {
                const isBot = p.userId === BOT_ID;
                const isCurrent = gameState.players[gameState.currentPlayerIndex]?.id === p.id;
                return (
                  <motion.div
                    key={p.id}
                    animate={{ scale: isCurrent ? 1.02 : 1, opacity: isCurrent ? 1 : 0.7 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isCurrent ? "border-violet-500/50 bg-violet-900/20" : "border-white/8 bg-white/5"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold`}
                      style={{ background: p.color === "blue" ? "#3B82F6" : "#EF4444" }}>
                      {isBot ? "🤖" : p.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white">{isBot ? "Bot" : p.username}</p>
                      <p className="text-[10px] text-slate-500">Cell {p.position}</p>
                    </div>
                    {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Roll controls */}
          <GameControls onRollOverride={handleRoll} isMyTurnOverride={isHumanTurn && !animBusyRef.current} />

          {/* Move history */}
          {gameState && (
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Move History</p>
              {[...gameState.moveHistory].reverse().slice(0, 20).map((move, i) => {
                const player = gameState.players.find(p => p.id === move.playerId);
                const isBot = player?.userId === BOT_ID;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-white/5">
                    {withBot && (
                      <span className={`text-[10px] font-bold w-10 shrink-0 ${isBot ? "text-violet-400" : "text-blue-400"}`}>
                        {isBot ? "Bot" : "You"}
                      </span>
                    )}
                    <span className="font-mono text-violet-300 w-3">{move.diceValue}</span>
                    <span className="text-slate-400">{move.from}→{move.to}</span>
                    {move.hadSnake && <span className="text-red-400 ml-auto">🐍</span>}
                    {move.hadLadder && <span className="text-green-400 ml-auto">🪜</span>}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Back to menu
          </button>
        </motion.div>
      </div>

      <WinModal />
    </div>
  );
}
