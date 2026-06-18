import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { calculateNewRank, calculateXpGain, calculateLevel } from "@/lib/game/engine";
import type { GameState } from "@/types/game";

export async function persistMatchResult(state: GameState, status = "finished") {
  const supabase = getSupabaseAdminClient() as any;

  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      room_id: state.roomId,
      winner_id: state.winner?.userId ?? null,
      status,
      started_at: state.startedAt ? new Date(state.startedAt).toISOString() : null,
      finished_at: state.finishedAt ? new Date(state.finishedAt ?? Date.now()).toISOString() : null,
      game_data: state,
    })
    .select("id")
    .single();

  if (error || !match) {
    console.error("[persist] match insert error:", error);
    return;
  }

  const winnerId = state.winner?.userId;

  for (const player of state.players) {
    const won = player.userId === winnerId;
    const xpGain = calculateXpGain(won);
    const newRank = calculateNewRank(player.rank, won);

    await supabase.from("match_players").insert({
      match_id: match.id,
      user_id: player.userId,
      color: player.color,
      avatar_id: player.avatarId,
      final_position: player.position,
      rank_change: newRank.points - player.rank.points,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, total_matches, wins, losses")
      .eq("id", player.userId)
      .single();

    if (profile) {
      const newXp = (profile.xp ?? 0) + xpGain;
      const { level } = calculateLevel(newXp);

      await supabase
        .from("profiles")
        .update({
          rank_tier: newRank.tier,
          rank_stars: newRank.stars,
          rank_points: newRank.points,
          xp: newXp,
          level,
          total_matches: (profile.total_matches ?? 0) + 1,
          wins: won ? (profile.wins ?? 0) + 1 : (profile.wins ?? 0),
          losses: won ? (profile.losses ?? 0) : (profile.losses ?? 0) + 1,
        })
        .eq("id", player.userId);
    }
  }
}
