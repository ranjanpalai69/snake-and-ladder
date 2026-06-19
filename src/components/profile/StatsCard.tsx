"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Gamepad2, TrendingUp, Star, Zap } from "lucide-react";
import type { Database } from "@/types/supabase";
import { RANK_COLORS } from "@/types/game";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface StatsCardProps {
  profile: Profile;
}

export function StatsCard({ profile }: StatsCardProps) {
  const rankColor = RANK_COLORS[profile.rank_tier as keyof typeof RANK_COLORS] ?? "#CD7F32";
  const winRate = profile.total_matches > 0
    ? ((profile.wins / profile.total_matches) * 100).toFixed(1)
    : "0.0";
  const xpPercent = (profile.xp % 200) / 200 * 100;

  const stats = [
    { label: "Total Matches", value: profile.total_matches, icon: Gamepad2, color: "#6366f1" },
    { label: "Wins", value: profile.wins, icon: Trophy, color: "#22c55e" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "#f59e0b" },
    { label: "Rank Points", value: profile.rank_points, icon: TrendingUp, color: rankColor },
  ];

  return (
    <div className="space-y-4">
      {/* Level & XP */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white">Level {profile.level}</span>
          </div>
          <span className="text-xs text-slate-400">{profile.xp % 200} / 200 XP</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Rank */}
      <div
        className="p-4 rounded-xl border flex items-center gap-3"
        style={{
          borderColor: `${rankColor}44`,
          background: `${rankColor}11`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${rankColor}22` }}
        >
          <Star className="w-6 h-6" style={{ color: rankColor }} />
        </div>
        <div>
          <p className="text-xs text-slate-400">Current Rank</p>
          <p className="text-base font-display font-bold capitalize" style={{ color: rankColor }}>
            {profile.rank_tier}
          </p>
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-3 h-3"
                fill={i < profile.rank_stars ? rankColor : "transparent"}
                stroke={rankColor}
                strokeWidth={2}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-xl bg-white/5 border border-white/8"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-display font-bold text-white">{value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
