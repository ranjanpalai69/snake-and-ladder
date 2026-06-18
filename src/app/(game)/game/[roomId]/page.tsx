"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Copy, ArrowLeft, Loader2 } from "lucide-react";
import { PLAYER_COLORS, type PlayerColor } from "@/types/game";
import { DynamicGameScene } from "@/components/3d/DynamicScene";
import { PlayerPanel } from "@/components/game/PlayerPanel";
import { GameControls } from "@/components/game/GameControls";
import { ChatPanel } from "@/components/game/ChatPanel";
import { WinModal } from "@/components/game/WinModal";
import { Navbar } from "@/components/layout/Navbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSocket } from "@/hooks/useSocket";
import { useRoomStore } from "@/stores/roomStore";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";

// ── Reconnecting overlay ──────────────────────────────────────────────────────
function ReconnectingOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin" />
        </div>
        <p className="font-display text-white font-semibold text-lg">Reconnecting...</p>
        <p className="text-slate-400 text-sm">Restoring your game session</p>
      </motion.div>
    </div>
  );
}

const ALL_COLORS = Object.keys(PLAYER_COLORS) as PlayerColor[];

// ── Waiting room ──────────────────────────────────────────────────────────────
function WaitingRoom() {
  const { currentRoom } = useRoomStore();
  const { user } = useAuthStore();
  const { setReady, leaveRoom, chooseColor } = useSocket();
  const router = useRouter();

  if (!currentRoom) return null;

  const myPlayer = currentRoom.players.find((p) => p.userId === user?.id);
  const takenColors = currentRoom.players
    .filter((p) => p.userId !== user?.id)
    .map((p) => p.color);

  function copyCode() {
    navigator.clipboard.writeText(currentRoom!.code);
    toast.success("Room code copied!");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-2xl p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { leaveRoom(); router.push("/lobby"); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display font-bold text-white">{currentRoom.name}</h2>
            <p className="text-xs text-slate-500">
              {currentRoom.players.length}/{currentRoom.maxPlayers} players joined
            </p>
          </div>
        </div>

        {/* Room code */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/8">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-0.5">Invite Code</p>
            <p className="font-mono text-2xl font-bold tracking-[0.3em] text-white">{currentRoom.code}</p>
          </div>
          <button onClick={copyCode} className="p-2.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all">
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Color picker — only shown to the local player */}
        {myPlayer && !myPlayer.isReady && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Your Color</p>
            <div className="flex gap-2 flex-wrap">
              {ALL_COLORS.map((c) => {
                const hex = PLAYER_COLORS[c];
                const taken = takenColors.includes(c);
                const selected = myPlayer.color === c;
                return (
                  <motion.button
                    key={c}
                    whileHover={!taken ? { scale: 1.15 } : {}}
                    whileTap={!taken ? { scale: 0.95 } : {}}
                    onClick={() => !taken && chooseColor(c)}
                    disabled={taken}
                    title={taken ? `${c} taken` : `Choose ${c}`}
                    className="relative w-9 h-9 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: hex,
                      boxShadow: selected ? `0 0 0 3px white, 0 0 0 5px ${hex}` : "none",
                    }}
                  >
                    {taken && (
                      <span className="absolute inset-0 flex items-center justify-center text-white/60 text-lg font-bold">×</span>
                    )}
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Player slots */}
        <div className="space-y-2">
          {currentRoom.players.map((player) => {
            const hex = PLAYER_COLORS[player.color] ?? "#6366f1";
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg"
                  style={{ background: hex, boxShadow: `0 4px 12px ${hex}66` }}
                >
                  {player.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{player.username}</p>
                  <p className="text-[11px] capitalize" style={{ color: hex }}>{player.color}</p>
                </div>
                {player.userId === currentRoom.hostId && (
                  <span className="text-[10px] text-violet-400 font-medium px-1.5 py-0.5 rounded-full bg-violet-900/30">Host</span>
                )}
                {player.isReady
                  ? <span className="flex items-center gap-1 text-xs text-green-400 font-medium"><Check className="w-3 h-3" />Ready</span>
                  : <span className="text-xs text-slate-500">Not ready</span>
                }
              </motion.div>
            );
          })}
          {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/8">
              <div className="w-9 h-9 rounded-full bg-white/5" />
              <span className="text-sm text-slate-600 italic">Waiting for player...</span>
            </div>
          ))}
        </div>

        <button
          onClick={setReady}
          disabled={!!myPlayer?.isReady}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{
            background: myPlayer?.isReady ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: myPlayer?.isReady ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
            color: myPlayer?.isReady ? "#22c55e" : "white",
          }}
        >
          <Check className="w-4 h-4" />
          {myPlayer?.isReady ? "Waiting for others..." : "Ready Up"}
        </button>

        {currentRoom.players.length < 2 && (
          <p className="text-xs text-slate-500 text-center">Need at least 2 players to start</p>
        )}
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function GamePageInner() {
  const params = useParams<{ roomId: string }>();
  const { gameState, isReconnecting } = useGameStore();
  const { currentRoom, persistedRoomId, isConnected } = useRoomStore();
  const { user } = useAuthStore();
  const { leaveRoom } = useSocket();
  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // Don't redirect immediately — give reconnect time to fire (3 seconds)
    const roomId = params.roomId;
    const hasContext = !!currentRoom || !!gameState || persistedRoomId === roomId;

    if (!hasContext && !isReconnecting) {
      redirectTimerRef.current = setTimeout(() => {
        router.replace("/lobby");
      }, 3000);
    } else if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [currentRoom, gameState, isReconnecting, persistedRoomId, params.roomId]);

  const isPlaying = gameState?.status === "playing" || gameState?.status === "finished";

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <>
        <Navbar />
        {isReconnecting || (!currentRoom && persistedRoomId === params.roomId && !isConnected) ? (
          <div className="min-h-screen flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
              <p className="text-white font-semibold">Reconnecting to your game...</p>
              <p className="text-slate-500 text-sm mt-1">Please wait</p>
            </motion.div>
          </div>
        ) : currentRoom ? (
          <WaitingRoom />
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-slate-400">Redirecting to lobby...</p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <DynamicGameScene />
          {isReconnecting && <ReconnectingOverlay />}
        </div>

        {/* Right sidebar */}
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="w-80 flex flex-col gap-3 p-4 bg-black/40 border-l border-white/8 overflow-y-auto"
        >
          <PlayerPanel
            players={gameState.players}
            currentPlayerUserId={gameState.players[gameState.currentPlayerIndex]?.userId}
            myUserId={user?.id}
          />
          <GameControls />
          <ChatPanel />
        </motion.div>
      </div>

      <WinModal />
    </div>
  );
}

export default function GamePage() {
  return (
    <ErrorBoundary>
      <GamePageInner />
    </ErrorBoundary>
  );
}
