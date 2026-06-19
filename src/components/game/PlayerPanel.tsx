"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Star, Wifi, WifiOff, MapPin, Send, SkipForward, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANK_COLORS, PLAYER_COLORS } from "@/types/game";
import type { GamePlayer } from "@/types/game";

interface PlayerPanelProps {
  players: GamePlayer[];
  currentPlayerUserId: string | undefined;
  myUserId: string | undefined;
  onSkipTurn?: (targetUserId: string) => void;
  onKickPlayer?: (targetUserId: string) => void;
  onInviteRejoin?: (targetUserId: string) => void;
}

export function PlayerPanel({
  players,
  currentPlayerUserId,
  myUserId,
  onSkipTurn,
  onKickPlayer,
  onInviteRejoin,
}: PlayerPanelProps) {
  const hasActions = !!(onSkipTurn || onKickPlayer || onInviteRejoin);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        Players ({players.length})
      </h3>
      <AnimatePresence>
        {players.map((player) => {
          const rankColor = RANK_COLORS[player.rank.tier];
          const pieceColor = PLAYER_COLORS[player.color];
          const isCurrentTurn = currentPlayerUserId === player.userId;
          const isMe = player.userId === myUserId;
          const disconnected = !player.isConnected;
          const showActionRow = disconnected && hasActions;

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Player card */}
              <motion.div
                layout
                animate={{
                  scale: isCurrentTurn && !disconnected ? 1.03 : 1,
                  borderColor: disconnected
                    ? "rgba(239,68,68,0.3)"
                    : isCurrentTurn
                    ? pieceColor
                    : "rgba(255,255,255,0.08)",
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative p-3 rounded-xl border backdrop-blur-sm transition-all",
                  disconnected ? "bg-red-950/20" : "bg-black/40",
                  !disconnected && isCurrentTurn && "shadow-lg",
                  isMe && "ring-1 ring-violet-500/30"
                )}
                style={{
                  boxShadow:
                    isCurrentTurn && !disconnected
                      ? `0 0 16px ${pieceColor}44`
                      : undefined,
                  opacity: disconnected ? 0.8 : 1,
                }}
              >
                {/* Turn indicator */}
                {isCurrentTurn && !disconnected && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{ background: pieceColor }}
                  >
                    <Crown className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                {isCurrentTurn && disconnected && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <SkipForward className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                <div className="flex items-center gap-2.5">
                  {/* Color token */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{
                      background: pieceColor,
                      boxShadow: disconnected ? "none" : `0 0 10px ${pieceColor}88`,
                      opacity: disconnected ? 0.55 : 1,
                    }}
                  >
                    {player.username.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-sm font-semibold truncate",
                          disconnected ? "text-slate-400" : "text-white"
                        )}
                      >
                        {player.username}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-violet-400 font-medium shrink-0">
                          (you)
                        </span>
                      )}
                      {disconnected ? (
                        <WifiOff className="w-3 h-3 text-red-400 ml-auto shrink-0" />
                      ) : (
                        <Wifi className="w-3 h-3 text-green-400 ml-auto shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="text-[10px] font-medium capitalize"
                        style={{ color: rankColor }}
                      >
                        {player.rank.tier}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5"
                            fill={i < player.rank.stars ? rankColor : "transparent"}
                            stroke={rankColor}
                            strokeWidth={2}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 ml-1">Lv.{player.level}</span>
                    </div>

                    {disconnected && (
                      <p className="text-[10px] text-red-400 font-medium mt-0.5">
                        {isCurrentTurn ? "Disconnected — skipping turn…" : "Disconnected"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Position bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: disconnected ? `${pieceColor}66` : pieceColor }}
                      animate={{ width: `${(player.position / 100) * 100}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 w-7 text-right">
                    {player.position}/100
                  </span>
                </div>
              </motion.div>

              {/* Action row — only for disconnected players when handlers are provided */}
              {showActionRow && (
                <div className="flex gap-1.5 mt-1 px-0.5">
                  {onInviteRejoin && (
                    <button
                      onClick={() => onInviteRejoin(player.userId)}
                      title="Send rejoin invite"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-violet-400 border border-violet-500/25 hover:bg-violet-500/10 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      Invite
                    </button>
                  )}
                  {onSkipTurn && isCurrentTurn && (
                    <button
                      onClick={() => onSkipTurn(player.userId)}
                      title="Skip their turn now"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-amber-300 border border-amber-500/25 hover:bg-amber-500/10 transition-colors"
                    >
                      <SkipForward className="w-3 h-3" />
                      Skip
                    </button>
                  )}
                  {onKickPlayer && !isMe && (
                    <button
                      onClick={() => onKickPlayer(player.userId)}
                      title="Remove from match"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-colors"
                    >
                      <UserMinus className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
