"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Users, Clock, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useProfile, type MatchHistoryEntry, type MatchOpponent } from "@/hooks/useProfile";
import { useAuthStore } from "@/stores/authStore";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

function formatDuration(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt || !finishedAt) return "";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return "";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function ordinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function RankChangeBadge({ pts }: { pts: number }) {
  if (pts === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-semibold">
      <Minus className="w-2.5 h-2.5" /> 0
    </span>
  );
  return pts > 0
    ? <span className="inline-flex items-center gap-0.5 text-[10px] text-green-400 font-bold"><TrendingUp className="w-2.5 h-2.5" />+{pts}</span>
    : <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400 font-bold"><TrendingDown className="w-2.5 h-2.5" />{pts}</span>;
}

function PlayerRow({
  username,
  finalPosition,
  rankChange,
  color,
  isWinner,
  isMe,
}: {
  username: string;
  finalPosition: number;
  rankChange: number;
  color: string;
  isWinner: boolean;
  isMe: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs",
      isMe ? "bg-white/8" : "bg-transparent",
    )}>
      {/* Color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
        style={{ background: color }}
      />

      {/* Name */}
      <span className={cn("flex-1 font-semibold truncate", isMe ? "text-white" : "text-slate-300")}>
        {isMe ? "You" : username}
        {isMe && <span className="text-slate-500 font-normal ml-1 text-[10px]">({username})</span>}
        {isWinner && <span className="ml-1 text-yellow-400 text-[10px]">👑</span>}
      </span>

      {/* Position */}
      <span className="text-slate-500 text-[10px] shrink-0">
        pos&nbsp;<span className="text-slate-300 font-bold">{finalPosition}</span>
      </span>

      {/* Rank change */}
      <span className="shrink-0"><RankChangeBadge pts={rankChange} /></span>
    </div>
  );
}

function MatchCard({ match, myUserId, myUsername, index }: {
  match: MatchHistoryEntry;
  myUserId: string;
  myUsername: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const won = match.winner_id === myUserId;
  const draw = !match.winner_id;
  const abandoned = match.status === "abandoned";

  const resultLabel = abandoned ? "Abandoned" : draw ? "Draw" : won ? "Victory" : "Defeat";
  const duration = formatDuration(match.started_at, match.finished_at);
  const opponents = match.opponents ?? [];
  const totalPlayers = match.total_players ?? opponents.length + 1;

  // Build full sorted player list: self first if winner, otherwise by position desc
  const allPlayers: Array<MatchOpponent & { isMe: boolean }> = [
    {
      user_id: myUserId,
      username: myUsername,
      avatar_id: "",
      final_position: match.my_final_position,
      rank_change: match.rank_change,
      color: match.my_color,
      isMe: true,
    },
    ...opponents.map((o) => ({ ...o, isMe: false })),
  ].sort((a, b) => b.final_position - a.final_position);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        won && !abandoned ? "border-green-500/25 bg-green-900/8"
          : abandoned ? "border-white/5 bg-white/2"
          : draw ? "border-white/8 bg-white/3"
          : "border-red-500/25 bg-red-900/8"
      )}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/4 transition-colors"
      >
        {/* Result icon */}
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          won && !abandoned ? "bg-green-500/20" : draw || abandoned ? "bg-white/8" : "bg-red-500/20"
        )}>
          {won && !abandoned
            ? <Trophy className="w-4 h-4 text-yellow-400" />
            : abandoned
            ? <Minus className="w-4 h-4 text-slate-500" />
            : <Skull className="w-4 h-4 text-red-400" />
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Result + rank change */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold",
              won && !abandoned ? "text-green-400" : abandoned ? "text-slate-500" : draw ? "text-slate-400" : "text-red-400"
            )}>
              {resultLabel}
            </span>

            {match.rank_change !== 0 && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                match.rank_change > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
              )}>
                {match.rank_change > 0 ? "+" : ""}{match.rank_change} pts
              </span>
            )}

            {/* player count */}
            <span className="flex items-center gap-0.5 text-[10px] text-slate-600 ml-auto">
              <Users className="w-2.5 h-2.5" />{totalPlayers}p
            </span>
          </div>

          {/* Opponents summary */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[11px] text-slate-500 truncate">
              vs&nbsp;
              {opponents.length
                ? opponents.map((o) => o.username).join(", ")
                : <em className="text-slate-600">no opponents recorded</em>}
            </span>
          </div>
        </div>

        {/* Time + expand */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="flex items-center gap-0.5 text-[10px] text-slate-600">
            <Clock className="w-2.5 h-2.5" />
            {formatTimeAgo(match.finished_at ?? match.created_at)}
          </span>
          {duration && (
            <span className="text-[9px] text-slate-700">{duration}</span>
          )}
          <span className="text-slate-600 mt-0.5">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-0.5">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5 font-semibold">
                All players — final positions
              </p>
              {allPlayers.map((p) => (
                <PlayerRow
                  key={p.user_id}
                  username={p.username}
                  finalPosition={p.final_position}
                  rankChange={p.rank_change}
                  color={p.color}
                  isWinner={p.user_id === match.winner_id}
                  isMe={p.isMe}
                />
              ))}
              {/* Match meta */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                {match.started_at && (
                  <span className="text-[9px] text-slate-700">
                    Started: {new Date(match.started_at).toLocaleString()}
                  </span>
                )}
                <span className="text-[9px] text-slate-700 ml-auto font-mono">
                  #{match.match_id.slice(0, 8)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MatchHistory() {
  const { fetchMatchHistory } = useProfile();
  const { user, profile } = useAuthStore();
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMatchHistory().then((data) => {
      setHistory(data);
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
        <p className="text-xs text-slate-600 mt-1">Play a multiplayer game to see your history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Last {history.length} matches
        </p>
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <span className="text-green-400 font-bold">{history.filter(m => m.winner_id === user?.id).length}W</span>
          <span>·</span>
          <span className="text-red-400 font-bold">{history.filter(m => m.winner_id && m.winner_id !== user?.id).length}L</span>
          <span>·</span>
          <span className="text-slate-500 font-bold">{history.filter(m => !m.winner_id && m.status !== "abandoned").length}D</span>
        </div>
      </div>

      {history.map((match, i) => (
        <MatchCard
          key={match.match_id}
          match={match}
          myUserId={user?.id ?? ""}
          myUsername={profile?.username ?? "You"}
          index={i}
        />
      ))}
    </div>
  );
}
