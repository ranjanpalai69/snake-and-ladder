"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Skull, Users, Clock } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/stores/authStore";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MatchHistoryRow {
  match_id: string;
  user_id: string;
  opponent_usernames: string[];
  winner_id: string | null;
  rank_change: number;
  finished_at: string | null;
  created_at: string;
}

export function MatchHistory() {
  const { fetchMatchHistory } = useProfile();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<MatchHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMatchHistory().then((data) => {
      setHistory(data as MatchHistoryRow[]);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Skull className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No matches played yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((match, i) => {
        const won = match.winner_id === user?.id;
        const draw = !match.winner_id;

        return (
          <motion.div
            key={match.match_id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              won
                ? "border-green-500/20 bg-green-900/10"
                : draw
                ? "border-white/8 bg-white/3"
                : "border-red-500/20 bg-red-900/10"
            )}
          >
            {/* Result icon */}
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              won ? "bg-green-500/20" : draw ? "bg-white/8" : "bg-red-500/20"
            )}>
              {won
                ? <Trophy className="w-4 h-4 text-green-400" />
                : <Skull className="w-4 h-4 text-red-400" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-xs font-bold",
                  won ? "text-green-400" : "text-red-400"
                )}>
                  {won ? "Victory" : draw ? "Draw" : "Defeat"}
                </span>
                {match.rank_change !== 0 && (
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                    match.rank_change > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                  )}>
                    {match.rank_change > 0 ? "+" : ""}{match.rank_change} pts
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-400 truncate">
                  {match.opponent_usernames?.join(", ") || "Unknown"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-600 shrink-0">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(match.finished_at ?? match.created_at)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
