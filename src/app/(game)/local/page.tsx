"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, RotateCcw, ArrowLeft, Check, Play } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DynamicGameScene } from "@/components/3d/DynamicScene";
import { WinModal } from "@/components/game/WinModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useGameStore } from "@/stores/gameStore";
import { createInitialGameState, applyMove, rollDice } from "@/lib/game/engine";
import { PLAYER_COLORS, type PlayerColor, type GamePlayer, type AvatarId } from "@/types/game";
import { generateId } from "@/lib/utils";
import { playDiceRoll } from "@/lib/sounds";
import toast from "react-hot-toast";
import Link from "next/link";

const ALL_COLORS = Object.keys(PLAYER_COLORS) as PlayerColor[];
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

interface LocalPlayerSetup {
  id: string;
  name: string;
  color: PlayerColor;
}

function buildLocalGameState(players: LocalPlayerSetup[]) {
  const gamePlayers: GamePlayer[] = players.map((p) => ({
    id: generateId(),
    userId: p.id,
    username: p.name,
    avatarId: "avatar_01" as AvatarId,
    color: p.color,
    position: 0,
    isReady: true,
    isConnected: true,
    rank: { tier: "bronze", stars: 0, totalStars: 0, points: 0 },
    level: 1,
  }));
  return createInitialGameState("local", gamePlayers);
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (players: LocalPlayerSetup[]) => void }) {
  const [count, setCount] = useState(2);
  const [players, setPlayers] = useState<LocalPlayerSetup[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: generateId(),
      name: `Player ${i + 1}`,
      color: ALL_COLORS[i],
    }))
  );

  const activePlayers = players.slice(0, count);
  const usedColors = activePlayers.map((p) => p.color);

  function setName(idx: number, name: string) {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, name } : p)));
  }

  function setColor(idx: number, color: PlayerColor) {
    if (usedColors.slice(0, count).includes(color) && players[idx].color !== color) return;
    setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, color } : p)));
  }

  const canStart = activePlayers.every((p) => p.name.trim().length > 0);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass rounded-2xl p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <Link href="/lobby" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Local Multiplayer</h1>
            <p className="text-xs text-slate-500">Same device, up to 6 players</p>
          </div>
        </div>

        {/* Player count */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Number of Players</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount((n) => Math.max(2, n - 1))}
              disabled={count <= 2}
              className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 text-white flex items-center justify-center hover:bg-white/12 disabled:opacity-30 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                    count === n
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCount((n) => Math.min(6, n + 1))}
              disabled={count >= 6}
              className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 text-white flex items-center justify-center hover:bg-white/12 disabled:opacity-30 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Player rows */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Players</p>
          {activePlayers.map((p, idx) => {
            const hex = PLAYER_COLORS[p.color];
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8"
              >
                {/* Avatar dot */}
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-lg"
                  style={{ background: hex, boxShadow: `0 4px 12px ${hex}66` }}
                >
                  {idx + 1}
                </div>

                {/* Name */}
                <input
                  value={p.name}
                  onChange={(e) => setName(idx, e.target.value.slice(0, 16))}
                  maxLength={16}
                  placeholder={`Player ${idx + 1}`}
                  className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder:text-slate-600 min-w-0"
                />

                {/* Color picker */}
                <div className="flex gap-1.5 shrink-0">
                  {ALL_COLORS.map((c) => {
                    const taken = usedColors.includes(c) && c !== p.color;
                    const selected = p.color === c;
                    return (
                      <button
                        key={c}
                        onClick={() => !taken && setColor(idx, c)}
                        disabled={taken}
                        title={taken ? "Color taken" : c}
                        className="relative w-6 h-6 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        style={{
                          background: PLAYER_COLORS[c],
                          boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${PLAYER_COLORS[c]}` : "none",
                          transform: selected ? "scale(1.15)" : "scale(1)",
                        }}
                      >
                        {selected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white drop-shadow" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Start */}
        <button
          onClick={() => canStart && onStart(activePlayers)}
          disabled={!canStart}
          className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
          }}
        >
          <Play className="w-4 h-4" />
          Start Game — {count} Players
        </button>
      </motion.div>
    </div>
  );
}

// ── Dice reveal overlay ───────────────────────────────────────────────────────
function DiceRevealOverlay({ value }: { value: number }) {
  return (
    <AnimatePresence>
      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.3 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        style={{ background: "rgba(0,0,0,0.55)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <span style={{ fontSize: 100, lineHeight: 1 }}>{DICE_FACES[value - 1]}</span>
          <span className="font-display text-white text-4xl font-black tracking-widest drop-shadow-lg">
            {value}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Turn banner — tells players whose turn it is ──────────────────────────────
function TurnBanner({ playerName, color }: { playerName: string; color: PlayerColor }) {
  const hex = PLAYER_COLORS[color];
  return (
    <motion.div
      key={playerName}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border"
      style={{ background: `${hex}18`, borderColor: `${hex}44` }}
    >
      <div
        className="w-3.5 h-3.5 rounded-full shrink-0"
        style={{ background: hex, boxShadow: `0 0 6px ${hex}88` }}
      />
      <span className="text-sm font-bold" style={{ color: hex }}>
        {playerName}'s turn
      </span>
    </motion.div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────
function LocalGame({
  setupPlayers,
  onBack,
}: {
  setupPlayers: LocalPlayerSetup[];
  onBack: () => void;
}) {
  const { gameState, setGameState, setRolling, isRolling, reset, setShowWinModal, setLastMove, diceReveal, setDiceReveal } =
    useGameStore();

  const animBusyRef = useRef(false);

  // Init on mount
  useEffect(() => {
    reset();
    const gs = buildLocalGameState(setupPlayers);
    setGameState(gs);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoll = useCallback(() => {
    const gs = useGameStore.getState().gameState;
    if (!gs || isRolling || gs.status === "finished") return;
    if (animBusyRef.current) return;

    const currentPlayer = gs.players[gs.currentPlayerIndex];
    if (!currentPlayer) return;

    setRolling(true);
    playDiceRoll();

    setTimeout(() => {
      const latest = useGameStore.getState().gameState;
      if (!latest) { setRolling(false); return; }
      const player = latest.players[latest.currentPlayerIndex];
      if (!player) { setRolling(false); return; }

      const diceValue = rollDice();
      const { newState, move } = applyMove(latest, player.id, diceValue);
      setGameState(newState);
      setRolling(false);
      setDiceReveal(diceValue);

      setTimeout(() => {
        setLastMove(move);
        setDiceReveal(null);
        if (newState.winner) {
          setShowWinModal(true);
        } else if (move.rolledSix && !move.wasBlocked && !newState.winner) {
          toast(`${player.username} rolled 6 — roll again!`, {
            icon: "🎲", duration: 2000,
            style: { background: "#1e1b4b", color: "#e2e8f0", border: "1px solid rgba(99,102,241,0.4)" },
          });
        } else if (move.wasBlocked) {
          toast(`${player.username} overshot 100 — turn passes!`, {
            icon: "⛔", duration: 2000,
            style: { background: "#1e1b4b", color: "#e2e8f0", border: "1px solid rgba(239,68,68,0.4)" },
          });
        }
      }, 1000);
    }, 700);
  }, [isRolling, setGameState, setRolling, setShowWinModal, setLastMove, setDiceReveal]);

  const handleAnimDone = useCallback(() => {
    animBusyRef.current = false;
    setRolling(false);
  }, [setRolling]);

  useEffect(() => {
    if (isRolling) animBusyRef.current = true;
  }, [isRolling]);

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isFinished = gameState.status === "finished";

  return (
    <div className="h-[100dvh] flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 pt-16">
        {/* Board */}
        <div className="flex-1 min-h-0 relative">
          <ErrorBoundary>
            <DynamicGameScene
              singlePlayer
              onRollOverride={handleRoll}
              onAnimDone={handleAnimDone}
            />
          </ErrorBoundary>

          {diceReveal !== null && <DiceRevealOverlay value={diceReveal} />}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-3 p-3 bg-black/40 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-white/8 overflow-y-auto">
          {/* Turn indicator */}
          {!isFinished && currentPlayer && (
            <TurnBanner playerName={currentPlayer.username} color={currentPlayer.color as PlayerColor} />
          )}

          {/* Player list */}
          <div className="space-y-1.5">
            {gameState.players.map((p, idx) => {
              const hex = PLAYER_COLORS[p.color as PlayerColor] ?? "#6366f1";
              const isCurrent = idx === gameState.currentPlayerIndex && !isFinished;
              const isWinner = gameState.winner?.userId === p.userId;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all"
                  style={{
                    background: isCurrent ? `${hex}18` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isCurrent ? `${hex}44` : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: hex }}
                  >
                    {p.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.username}</p>
                    <p className="text-[10px] text-slate-500">Position: {p.position}</p>
                  </div>
                  {isWinner && <span className="text-base">👑</span>}
                  {isCurrent && !isWinner && (
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: hex }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Roll button (click dice on board, or this button) */}
          {!isFinished && currentPlayer && (
            <button
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${PLAYER_COLORS[currentPlayer.color as PlayerColor]}cc, ${PLAYER_COLORS[currentPlayer.color as PlayerColor]}88)`,
              }}
            >
              🎲 {isRolling ? "Rolling…" : `${currentPlayer.username}, Roll!`}
            </button>
          )}

          {/* Restart */}
          <button
            onClick={onBack}
            className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-white hover:bg-white/8 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> New Game / Back
          </button>
        </div>
      </div>

      <WinModal />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LocalPage() {
  const [setupPlayers, setSetupPlayers] = useState<LocalPlayerSetup[] | null>(null);

  function handleStart(players: LocalPlayerSetup[]) {
    setSetupPlayers(players);
  }

  function handleBack() {
    setSetupPlayers(null);
  }

  return (
    <div className="min-h-screen">
      {!setupPlayers && <Navbar />}
      <AnimatePresence mode="wait">
        {!setupPlayers ? (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SetupScreen onStart={handleStart} />
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LocalGame setupPlayers={setupPlayers} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
