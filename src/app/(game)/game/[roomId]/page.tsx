"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ArrowLeft, Loader2, Bell, Dices, Users, MessageSquare, UserMinus, Send } from "lucide-react";
import { PLAYER_COLORS, type PlayerColor, type GamePlayer } from "@/types/game";
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
import { getSocket } from "@/lib/socket/client";
import toast from "react-hot-toast";

// ── Dice reveal overlay ───────────────────────────────────────────────────────
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

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

// ── Disconnected player management ────────────────────────────────────────────
function DisconnectedPlayerActions({
  players,
  myUserId,
  hostId,
}: {
  players: GamePlayer[];
  myUserId: string | undefined;
  hostId: string | undefined;
}) {
  const disconnected = players.filter((p) => !p.isConnected);
  if (disconnected.length === 0) return null;

  const isHost = myUserId === hostId;

  function kickPlayer(targetUserId: string) {
    getSocket().emit("game:kick_player", { targetUserId }, (res) => {
      if (!res.success) toast.error(res.error ?? "Cannot remove player");
    });
  }

  function inviteRejoin(targetUserId: string) {
    getSocket().emit("game:invite_rejoin", { targetUserId });
    toast("Rejoin invite sent!", { icon: "📨", duration: 2000 });
  }

  return (
    <div className="rounded-xl bg-amber-950/30 border border-amber-500/30 p-3 space-y-2">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Disconnected</p>
      {disconnected.map((p) => {
        const hex = PLAYER_COLORS[p.color] ?? "#6366f1";
        return (
          <div key={p.userId} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 opacity-60"
              style={{ background: hex }}
            >
              {p.username.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 text-xs text-slate-400 truncate">{p.username}</span>
            <button
              onClick={() => inviteRejoin(p.userId)}
              title="Send rejoin invite"
              className="p-1.5 rounded-lg text-violet-400 hover:bg-violet-500/20 transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
            {isHost && (
              <button
                onClick={() => kickPlayer(p.userId)}
                title="Remove player & continue"
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <UserMinus className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const { currentRoom, countdown } = useRoomStore();
  const { user } = useAuthStore();
  const { setReady, leaveRoom, chooseColor, pingReady, startGame } = useSocket();
  const router = useRouter();

  const [showRemind, setShowRemind] = useState(false);
  const [remindCooldown, setRemindCooldown] = useState(0);
  const remindTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remindCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myPlayer = currentRoom?.players.find((p) => p.userId === user?.id);
  const hasUnreadyPlayers =
    (currentRoom?.players.length ?? 0) >= 2 && currentRoom?.players.some((p) => !p.isReady);

  useEffect(() => {
    if (!myPlayer?.isReady || !hasUnreadyPlayers) {
      setShowRemind(false);
      return;
    }
    remindTimerRef.current = setTimeout(() => setShowRemind(true), 5000);
    return () => { if (remindTimerRef.current) clearTimeout(remindTimerRef.current); };
  }, [myPlayer?.isReady, hasUnreadyPlayers]);

  const handleRemind = useCallback(() => {
    if (remindCooldown > 0) return;
    pingReady();
    setRemindCooldown(30);
    remindCooldownRef.current = setInterval(() => {
      setRemindCooldown((n) => {
        if (n <= 1) { clearInterval(remindCooldownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  }, [remindCooldown, pingReady]);

  useEffect(() => {
    return () => {
      if (remindTimerRef.current) clearTimeout(remindTimerRef.current);
      if (remindCooldownRef.current) clearInterval(remindCooldownRef.current);
    };
  }, []);

  if (!currentRoom) return null;

  const takenColors = currentRoom.players.filter((p) => p.userId !== user?.id).map((p) => p.color);

  function copyCode() {
    navigator.clipboard.writeText(currentRoom!.code);
    toast.success("Room code copied!");
  }

  const minPlayers = 2;
  const needMore = currentRoom.players.length < minPlayers;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-2xl p-6 space-y-5 relative overflow-hidden"
      >
        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-4"
            >
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
                All players ready!
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-900/60"
                >
                  <span className="font-display text-6xl font-black text-white">{countdown}</span>
                </motion.div>
              </AnimatePresence>
              <p className="text-slate-400 text-sm">Game starting…</p>
            </motion.div>
          )}
        </AnimatePresence>

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
          <button
            onClick={copyCode}
            className="p-2.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Color picker — only shown before ready */}
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

        {/* Player slots — only real players, no bots */}
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
                  <span className="text-[10px] text-violet-400 font-medium px-1.5 py-0.5 rounded-full bg-violet-900/30">
                    Host
                  </span>
                )}
                {player.isReady ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <Check className="w-3 h-3" />Ready
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Not ready</span>
                )}
              </motion.div>
            );
          })}

          {/* Empty slots — human placeholders only */}
          {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, i) => (
            <motion.div
              key={`empty-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/8"
            >
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-sm text-slate-600 italic">Waiting for player…</span>
            </motion.div>
          ))}
        </div>

        {/* Ready button — all players mark readiness */}
        <button
          onClick={setReady}
          disabled={!!myPlayer?.isReady}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{
            background: myPlayer?.isReady
              ? "rgba(34,197,94,0.15)"
              : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: myPlayer?.isReady ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
            color: myPlayer?.isReady ? "#22c55e" : "white",
          }}
        >
          <Check className="w-4 h-4" />
          {myPlayer?.isReady ? "Ready!" : "Ready Up"}
        </button>

        {/* Host: Start Game button / Non-host: waiting message */}
        {user?.id === currentRoom.hostId ? (
          <button
            onClick={() => startGame()}
            disabled={needMore}
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-35"
            style={{
              background: needMore ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #16a34a, #15803d)",
              border: needMore ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(34,197,94,0.3)",
              color: needMore ? "#64748b" : "white",
            }}
          >
            <Dices className="w-4 h-4" />
            {needMore ? `Need ${minPlayers - currentRoom.players.length} more player(s)` : "Start Game"}
          </button>
        ) : (
          <p className="text-xs text-slate-500 text-center py-1">
            Waiting for the host to start the game…
          </p>
        )}

        {/* Remind button */}
        {showRemind && (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleRemind}
            disabled={remindCooldown > 0}
            className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.35)",
              color: "#fbbf24",
            }}
          >
            <Bell className="w-4 h-4" />
            {remindCooldown > 0 ? `Reminder sent (${remindCooldown}s)` : "Remind others to get ready"}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

// ── Mobile bottom panel with tabs ─────────────────────────────────────────────
function MobileGamePanel({
  players,
  currentPlayerUserId,
  myUserId,
  hostId,
}: {
  players: GamePlayer[];
  currentPlayerUserId: string | undefined;
  myUserId: string | undefined;
  hostId: string | undefined;
}) {
  const [tab, setTab] = useState<"controls" | "players" | "chat">("controls");
  const { unreadChatCount, clearUnread } = useGameStore();

  const tabs = [
    { key: "controls" as const, label: "Controls", Icon: Dices, badge: 0 },
    { key: "players" as const, label: "Players", Icon: Users, badge: 0 },
    { key: "chat" as const, label: "Chat", Icon: MessageSquare, badge: tab !== "chat" ? unreadChatCount : 0 },
  ];

  return (
    <div
      className="lg:hidden flex flex-col shrink-0 bg-black/60 backdrop-blur-md border-t border-white/8"
      style={{ maxHeight: "260px" }}
    >
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-white/8">
        {tabs.map(({ key, label, Icon, badge }) => (
          <button
            key={key}
            onClick={() => { setTab(key); if (key === "chat") clearUnread(); }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors relative ${
              tab === key
                ? "text-violet-400 border-b-2 border-violet-500"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{label}</span>
            {badge > 0 && (
              <span className="absolute top-1 right-2 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {tab === "controls" && <GameControls />}
        {tab === "players" && (
          <>
            <DisconnectedPlayerActions players={players} myUserId={myUserId} hostId={hostId} />
            <PlayerPanel
              players={players}
              currentPlayerUserId={currentPlayerUserId}
              myUserId={myUserId}
            />
          </>
        )}
        {tab === "chat" && <ChatPanel onActive={clearUnread} />}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function GamePageInner() {
  const params = useParams<{ roomId: string }>();
  const { gameState, isReconnecting, setGameState, diceReveal } = useGameStore();
  const { currentRoom, persistedRoomId, isConnected } = useRoomStore();
  const { user } = useAuthStore();
  const { leaveRoom } = useSocket();
  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Clear stale game state from a different room (e.g., old single-player or previous match)
  useEffect(() => {
    if (gameState && gameState.roomId !== params.roomId) {
      setGameState(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId]);

  // Warn before browser refresh when game is active in THIS room
  useEffect(() => {
    const isActive =
      gameState?.status === "playing" && gameState?.roomId === params.roomId;
    if (!isActive) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [gameState?.status, gameState?.roomId, params.roomId]);

  // Redirect to lobby if no context for this room after grace period
  useEffect(() => {
    const roomId = params.roomId;
    const hasContext =
      !!currentRoom ||
      (gameState?.roomId === roomId) ||
      persistedRoomId === roomId;

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
  }, [currentRoom, gameState, isReconnecting, persistedRoomId, params.roomId, router]);

  // Only treat as "in-game" when the active gameState belongs to THIS room
  const isPlaying =
    (gameState?.status === "playing" || gameState?.status === "finished") &&
    gameState?.roomId === params.roomId;

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
        {isReconnecting ||
        (!currentRoom && persistedRoomId === params.roomId && !isConnected) ? (
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
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

  const currentPlayerUserId = gameState.players[gameState.currentPlayerIndex]?.userId;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <Navbar />

      {/* Game area — stacks vertically on mobile, side-by-side on desktop */}
      <div className="flex flex-1 overflow-hidden pt-16 flex-col lg:flex-row">

        {/* 3D board — full-width on mobile, flex-1 on desktop */}
        <div className="flex-1 relative min-h-0">
          <DynamicGameScene />
          {isReconnecting && <ReconnectingOverlay />}
          {diceReveal !== null && <DiceRevealOverlay value={diceReveal} />}
        </div>

        {/* Desktop sidebar — hidden on mobile */}
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="hidden lg:flex w-80 flex-col gap-3 p-4 bg-black/40 border-l border-white/8 overflow-y-auto"
        >
          <DisconnectedPlayerActions
            players={gameState.players}
            myUserId={user?.id}
            hostId={currentRoom?.hostId}
          />
          <PlayerPanel
            players={gameState.players}
            currentPlayerUserId={currentPlayerUserId}
            myUserId={user?.id}
          />
          <GameControls />
          <div className="flex-1 min-h-0">
            <ChatPanel onActive={() => useGameStore.getState().clearUnread()} />
          </div>
        </motion.div>

        {/* Mobile bottom panel — hidden on desktop */}
        <MobileGamePanel
          players={gameState.players}
          currentPlayerUserId={currentPlayerUserId}
          myUserId={user?.id}
          hostId={currentRoom?.hostId}
        />
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
