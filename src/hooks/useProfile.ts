"use client";

import { useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { AvatarId } from "@/types/game";
import toast from "react-hot-toast";

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

  const fetchMatchHistory = useCallback(async (userId?: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("match_history_view" as any)
      .select("*")
      .eq("user_id", userId ?? user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(20);
    return (data as unknown[]) ?? [];
  }, [user]);

  return { profile, saving, updateAvatar, updateUsername, fetchMatchHistory };
}
