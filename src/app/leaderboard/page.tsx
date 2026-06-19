"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Target, Crown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RANK_COLORS } from "@/types/game";

interface LeaderboardRow {
  id: string;
  username: string;
  avatar_id: string;
  rank_tier: string;
  rank_stars: number;
  rank_points: number;
  level: number;
  wins: number;
  total_matches: number;
  win_rate: number;
  global_rank: number;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    (async () => {
      try {
        const { data, error } = await supabase
          .from("leaderboard_view" as any)
          .select("*")
          .order("rank_points", { ascending: false })
          .limit(50);
        if (error) console.error("[leaderboard]", error.message);
        setRows((data as LeaderboardRow[]) ?? []);
      } catch (err) {
        console.error("[leaderboard] fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-900/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white">Leaderboard</h1>
              <p className="text-slate-400 text-sm">Top players ranked by points</p>
            </div>
          </div>
        </motion.div>

        {/* Top 3 podium */}
        {!loading && rows.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-10">
            {[rows[1], rows[0], rows[2]].map((row, podiumIdx) => {
              const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const heights = [72, 96, 56];
              const colors = ["#C0C0C0", "#FFD700", "#CD7F32"];
              const rankColor = RANK_COLORS[row.rank_tier as keyof typeof RANK_COLORS] ?? "#CD7F32";

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: podiumIdx * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  {rank === 1 && <Crown className="w-5 h-5 text-yellow-400 animate-bounce" />}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${rankColor}cc, ${rankColor}44)`,
                      boxShadow: `0 4px 20px ${rankColor}66`,
                    }}
                  >
                    {row.username.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-white">{row.username}</p>
                  <div
                    className="w-20 rounded-t-lg flex items-center justify-center"
                    style={{ height: heights[podiumIdx], background: `${colors[podiumIdx]}22`, border: `1px solid ${colors[podiumIdx]}44` }}
                  >
                    <span className="font-display font-bold text-xl" style={{ color: colors[podiumIdx] }}>
                      #{rank}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-xs text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-white/8">
            <span className="w-8">#</span>
            <span>Player</span>
            <span className="text-right pr-4">Pts</span>
            <span className="text-right pr-4">W/L</span>
            <span className="text-right">Rate</span>
          </div>

          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-14 border-b border-white/5 animate-pulse bg-white/3" />
              ))
            : rows.map((row, i) => {
                const rankColor = RANK_COLORS[row.rank_tier as keyof typeof RANK_COLORS] ?? "#CD7F32";
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center px-4 py-3 border-b border-white/5 hover:bg-white/4 transition-colors"
                  >
                    <span className="w-8 text-slate-500 font-mono text-sm font-medium">
                      {i < 3
                        ? <span style={{ color: ["#FFD700","#C0C0C0","#CD7F32"][i] }}>{i + 1}</span>
                        : i + 1}
                    </span>

                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${rankColor}cc, ${rankColor}44)`,
                        }}
                      >
                        {row.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{row.username}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] capitalize" style={{ color: rankColor }}>{row.rank_tier}</span>
                          <div className="flex gap-px">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star key={s} className="w-2 h-2" fill={s < row.rank_stars ? rankColor : "transparent"} stroke={rankColor} strokeWidth={2} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className="text-right pr-4 font-mono text-sm text-violet-400 font-semibold">{row.rank_points}</span>
                    <span className="text-right pr-4 text-xs text-slate-400">{row.wins}/{row.total_matches - row.wins}</span>
                    <span className="text-right text-xs font-medium" style={{ color: row.win_rate >= 50 ? "#22c55e" : "#ef4444" }}>
                      {row.win_rate}%
                    </span>
                  </motion.div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}
