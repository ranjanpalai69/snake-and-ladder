"use client";

import { motion } from "framer-motion";
import { Users, Lock, Globe, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import type { RoomSummary } from "@/types/room";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: RoomSummary;
  index: number;
}

export function RoomCard({ room, index }: RoomCardProps) {
  const { joinRoom } = useSocket();
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  const isFull = room.playerCount >= room.maxPlayers;
  const fillPct = (room.playerCount / room.maxPlayers) * 100;

  async function handleJoin() {
    setJoining(true);
    const joined = await joinRoom(room.code);
    if (joined) router.push(`/game/${joined.id}`);
    else setJoining(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative p-4 rounded-xl border bg-black/30 backdrop-blur-sm transition-all duration-200",
        isFull ? "border-white/5 opacity-60" : "border-white/10 hover:border-violet-500/30 hover:bg-white/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {room.visibility === "private"
              ? <Lock className="w-3.5 h-3.5 text-slate-500" />
              : <Globe className="w-3.5 h-3.5 text-violet-400" />
            }
            <h3 className="font-semibold text-white text-sm truncate">{room.name}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Host: {room.hostUsername}</p>
        </div>

        <button
          onClick={handleJoin}
          disabled={isFull || joining}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            isFull
              ? "bg-white/5 text-slate-500 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40"
          )}
        >
          {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {isFull ? "Full" : "Join"}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-slate-500" />
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
            animate={{ width: `${fillPct}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          {room.playerCount}/{room.maxPlayers}
        </span>
      </div>

      <div className="absolute top-2 right-2">
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full",
          room.status === "waiting"
            ? "bg-green-900/30 text-green-400 border border-green-500/20"
            : "bg-amber-900/30 text-amber-400 border border-amber-500/20"
        )}>
          {room.status === "waiting" ? "Open" : "In Game"}
        </span>
      </div>
    </motion.div>
  );
}
