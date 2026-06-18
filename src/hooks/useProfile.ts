"use client";

import { useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { AvatarId } from "@/types/game";
import toast from "react-hot-toast";

export interface MatchOpponent {
  user_id: string;
  username: string;
  avatar_id: string;
  final_position: number;
  rank_change: number;
  color: string;
}

export interface MatchHistoryEntry {
  match_id: string;
  user_id: string;
  winner_id: string | null;
  rank_change: number;
  my_final_position: number;
  my_color: string;
  status: "waiting" | "playing" | "finished" | "abandoned";
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  opponents: MatchOpponent[] | null;
  total_players: number;
}

export function useProfile() {
  const { user, profile, setProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const updateAvatar = useCallback(async (avatarId: AvatarId) => {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabaseBrowserClient() as any;
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_id: avatarId })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) toast.error("Failed to update avatar");
    else { setProfile(data as any); toast.success("Avatar updated!"); }
    setSaving(false);
  }, [user, setProfile]);

  const updateUsername = useCallback(async (username: string) => {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabaseBrowserClient() as any;
    const { data, error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) toast.error(error.message.includes("unique") ? "Username taken" : "Failed to update username");
    else { setProfile(data as any); toast.success("Username updated!"); }
    setSaving(false);
  }, [user, setProfile]);

  const fetchMatchHistory = useCallback(async (userId?: string): Promise<MatchHistoryEntry[]> => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("match_history_view" as any)
      .select("*")
      .eq("user_id", userId ?? user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(30);
    return (data as unknown as MatchHistoryEntry[]) ?? [];
  }, [user]);

  return { profile, saving, updateAvatar, updateUsername, fetchMatchHistory };
}
