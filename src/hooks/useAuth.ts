"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAuth() {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setLoading, reset } =
    useAuthStore();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setLoading(false); reset(); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setProfile(data);
      } else if (error) {
        console.error("[auth] fetchProfile error:", error.message);
        // Keep the Zustand-persisted profile from localStorage rather than wiping it
      }
    } catch {
      // Network unavailable offline — persisted profile from localStorage remains intact
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    reset();
  }

  return { user, session, profile, isLoading, signOut };
}
