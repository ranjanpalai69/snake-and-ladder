"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Star, Wifi, WifiOff, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANK_COLORS, PLAYER_COLORS } from "@/types/game";
import type { GamePlayer } from "@/types/game";

interface PlayerCardProps {
  player: GamePlayer;
  isCurrentTurn: boolean;
  isMe: boolean;
  position: number;
}

function PlayerCard({ player, isCurrentTurn, isMe, position }: PlayerCardProps) {
  const rankColor = RANK_COLORS[player.rank.tier];
  const pieceColor = PLAYER_COLORS[player.color];

  return (
    <motion.div
      layout
      animate={{
        scale: isCurrentTurn ? 1.03 : 1,
        borderColor: isCurrentTurn ? pieceColor : "rgba(255,255,255,0.08)",
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative p-3 rounded-xl border bg-black/40 backdrop-blur-sm transition-all",
        isCurrentTurn && "shadow-lg",
        isMe && "ring-1 ring-violet-500/30"
      )}
      style={{
        boxShadow: isCurrentTurn ? `0 0 16px ${pieceColor}44` : undefined,
      }}
    >
      {isCurrentTurn && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ background: pieceColor }}
        >
          <Crown className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <div className="flex items-center gap-2.5">
        {/* Color token */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: pieceColor, boxShadow: `0 0 10px ${pieceColor}88` }}
        >
          {player.username.slice(0, 1).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white truncate">{player.username}</span>
            {isMe && <span className="text-[10px] text-violet-400 font-medium">(you)</span>}
            {player.isConnected
              ? <Wifi className="w-3 h-3 text-green-400 ml-auto shrink-0" />
              : <WifiOff className="w-3 h-3 text-red-400 ml-auto shrink-0" />
            }
          </div>

          {/* Rank stars */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-medium capitalize" style={{ color: rankColor }}>
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
        </div>
      </div>

      {/* Position bar */}
      <div className="mt-2.5 flex items-center gap-2">
        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: pieceColor }}
            animate={{ width: `${(player.position / 100) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <span className="text-[11px] font-mono text-slate-400 w-7 text-right">
          {player.position}/100
        </span>
      </div>
    </motion.div>
  );
}

interface PlayerPanelProps {
  players: GamePlayer[];
  currentPlayerUserId: string | undefined;
  myUserId: string | undefined;
}

export function PlayerPanel({ players, currentPlayerUserId, myUserId }: PlayerPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Players</h3>
      <AnimatePresence>
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentTurn={currentPlayerUserId === player.userId}
            isMe={player.userId === myUserId}
            position={player.position}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
