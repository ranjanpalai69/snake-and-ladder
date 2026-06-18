"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Bot, User } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DynamicGameScene } from "@/components/3d/DynamicScene";
import { GameControls } from "@/components/game/GameControls";
import { WinModal } from "@/components/game/WinModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { createInitialGameState, applyMove, rollDice } from "@/lib/game/engine";
import type { GamePlayer, AvatarId } from "@/types/game";
import { generateId } from "@/lib/utils";
import { playDiceRoll } from "@/lib/sounds";
import toast from "react-hot-toast";

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
const SP_DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function SinglePlayerPageInner() {
  const { gameState, setGameState, setRolling, isRolling, reset, setShowWinModal, setLastMove, diceReveal, setDiceReveal } = useGameStore();
  const { user, profile } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"pick" | "play">("pick");
  const [withBot, setWithBot] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const animBusyRef = useRef(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Warn before browser refresh/close during active game
  useEffect(() => {
    const active = mode === "play" && !!gameState && gameState.status !== "finished";
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [mode, gameState?.status]);

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
    const gs = useGameStore.getState().gameState;
    if (!gs || isRolling || gs.status === "finished") return;
    if (animBusyRef.current) return;

    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (currentPlayer?.userId === BOT_ID) return;

    setRolling(true);
    playDiceRoll();

    setTimeout(() => {
      const latest = useGameStore.getState().gameState;
      if (!latest) { setRolling(false); return; }
      const player = latest.players[latest.currentPlayerIndex];
      if (!player || player.userId === BOT_ID) { setRolling(false); return; }
      const diceValue = rollDice();
      const { newState, move } = applyMove(latest, player.id, diceValue);
      setGameState(newState);
      setRolling(false);
      setDiceReveal(diceValue);
      setTimeout(() => {
        setLastMove(move);
        setDiceReveal(null);
        if (newState.winner) setShowWinModal(true);
        else if (move.rolledSix) toast("Rolled 6 — roll again!", { icon: "🎲", duration: 2000, style: { background: "#1e1b4b", color: "#e2e8f0", border: "1px solid rgba(99,102,241,0.4)" } });
        else if (move.wasBlocked) toast("Overshot! Stay and try again.", { icon: "⛔", duration: 2000, style: { background: "#1e1b4b", color: "#e2e8f0", border: "1px solid rgba(239,68,68,0.4)" } });
      }, 1000);
    }, 700);
  }, [isRolling, setGameState, setRolling, setShowWinModal, setLastMove, setDiceReveal]);

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
        setGameState(newState);
        setRolling(false);
        setDiceReveal(diceValue);
        setTimeout(() => {
          setLastMove(move);
          setDiceReveal(null);
          if (newState.winner) setShowWinModal(true);
        }, 1000);
      }, 700);
    }, 1200);

    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
  // Also re-trigger when moveHistory length changes so bot fires again on extra turn (rolled 6 / blocked)
  }, [gameState?.currentPlayerIndex, gameState?.moveHistory?.length, gameState?.status, withBot, isRolling]);

  function handleRestart() {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    reset();
    animBusyRef.current = false;
    setMode("pick");
  }

  function tryLeave() {
    // If game is active, show in-app warning; otherwise leave immediately
    if (mode === "play" && gameState && gameState.status !== "finished") {
      setShowLeaveWarning(true);
    } else {
      handleRestart();
    }
  }

  // ── Turn label ────────────────────────────────────────────────────────────
  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
  const isHumanTurn = currentPlayer?.userId !== BOT_ID;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (mode === "pick") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <ModePicker onSelect={(bot) => startGame(bot)} />
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Mode + turn indicator */}
      <div className="glass rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          {withBot ? <Bot className="w-4 h-4 text-violet-400" /> : <User className="w-4 h-4 text-blue-400" />}
          <h2 className="font-display text-sm font-bold text-white">
            {withBot ? "vs Bot" : "Solo Practice"}
          </h2>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentPlayer?.id ?? "solo"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs font-medium ${isHumanTurn ? "text-blue-400" : "text-violet-400"}`}
          >
            {withBot
              ? isHumanTurn
                ? "Your turn — roll the dice!"
                : "Bot is thinking..."
              : "Roll the dice and reach 100!"}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Player cards */}
      {gameState && (
        <div className="space-y-1.5">
          {gameState.players.map((p) => {
            const isBot = p.userId === BOT_ID;
            const isCurrent = gameState.players[gameState.currentPlayerIndex]?.id === p.id;
            const colorHex = p.color === "blue" ? "#3B82F6" : "#EF4444";
            return (
              <motion.div
                key={p.id}
                animate={{ scale: isCurrent ? 1.02 : 1, opacity: isCurrent ? 1 : 0.65 }}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                  isCurrent ? "border-violet-500/50 bg-violet-900/20" : "border-white/8 bg-white/5"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: colorHex }}
                >
                  {isBot ? "🤖" : p.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{isBot ? "Bot" : p.username}</p>
                  <p className="text-[10px] text-slate-500">Square {p.position}</p>
                </div>
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Roll controls */}
      <GameControls onRollOverride={handleRoll} isMyTurnOverride={isHumanTurn && !animBusyRef.current} />

      {/* Move history */}
      {gameState && (
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Move History</p>
          {[...gameState.moveHistory].reverse().slice(0, 30).map((move, i) => {
            const player = gameState.players.find(p => p.id === move.playerId);
            const isBot = player?.userId === BOT_ID;
            return (
              <div key={i} className="flex items-center gap-1.5 text-xs p-1.5 rounded-lg bg-white/5">
                {withBot && (
                  <span className={`text-[10px] font-bold w-8 shrink-0 ${isBot ? "text-violet-400" : "text-blue-400"}`}>
                    {isBot ? "Bot" : "You"}
                  </span>
                )}
                <span className="font-mono text-violet-300 shrink-0">{move.diceValue}</span>
                <span className="text-slate-400 truncate">
                  {move.wasBlocked ? `${move.from} (blocked)` : `${move.from}→${move.to}`}
                </span>
                {move.rolledSix && <span className="text-yellow-400 shrink-0">×2</span>}
                {move.hadSnake && <span className="text-red-400 shrink-0">🐍</span>}
                {move.hadLadder && <span className="text-green-400 shrink-0">🪜</span>}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={tryLeave}
        className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 shrink-0 mt-auto"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Back to menu
      </button>
    </>
  );

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <Navbar />

      {/* Game area */}
      <div className="flex flex-1 overflow-hidden pt-16 flex-col lg:flex-row">

        {/* 3D board — fills all space not taken by sidebar */}
        <div className="flex-1 relative min-h-0">
          <DynamicGameScene
            singlePlayer
            onRollOverride={handleRoll}
            onAnimDone={handleAnimDone}
          />
          <AnimatePresence>
            {diceReveal !== null && (
              <motion.div
                key={diceReveal}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                <div className="flex flex-col items-center gap-3">
                  <span style={{ fontSize: 100, lineHeight: 1 }}>{SP_DICE_FACES[diceReveal - 1]}</span>
                  <span className="font-display text-white text-4xl font-black tracking-widest drop-shadow-lg">
                    {diceReveal}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop sidebar */}
        <motion.div
          initial={{ x: 288 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="hidden lg:flex w-72 flex-col gap-3 p-4 bg-black/40 border-l border-white/8 overflow-y-auto shrink-0"
        >
          <SidebarContent />
        </motion.div>

        {/* Mobile bottom panel */}
        <div
          className="lg:hidden flex flex-col shrink-0 bg-black/60 backdrop-blur-md border-t border-white/8 overflow-y-auto"
          style={{ maxHeight: "220px" }}
        >
          <div className="p-3 space-y-2">
            <SidebarContent />
          </div>
        </div>
      </div>

      <WinModal />

      {/* ── Leave warning modal ────────────────────────────────────────── */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-5 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg">Leave game?</p>
              <p className="text-sm text-slate-400 mt-1">Your progress will be lost. This can't be undone.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveWarning(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
              >
                Stay
              </button>
              <button
                onClick={() => { setShowLeaveWarning(false); handleRestart(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600/80 hover:bg-red-600 text-white transition-all"
              >
                Leave
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function SinglePlayerPage() {
  return (
    <ErrorBoundary>
      <SinglePlayerPageInner />
    </ErrorBoundary>
  );
}
