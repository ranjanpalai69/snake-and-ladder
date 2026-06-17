"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { StatsCard } from "@/components/profile/StatsCard";
import { MatchHistory } from "@/components/profile/MatchHistory";
import { useAuthStore } from "@/stores/authStore";
import { useProfile } from "@/hooks/useProfile";
import type { AvatarId } from "@/types/game";

export default function ProfilePage() {
  const { profile } = useAuthStore();
  const { updateUsername, saving } = useProfile();
  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [activeTab, setActiveTab] = useState<"stats" | "history" | "avatar">("stats");

  if (!profile) return null;

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    if (!newUsername.trim()) return;
    await updateUsername(newUsername.trim());
    setEditingName(false);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar display */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl"
              style={{
                background: `radial-gradient(circle at 35% 35%, #6366f1dd, #4338ca55)`,
                boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
              }}
            >
              {profile.username.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              {editingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    minLength={3}
                    maxLength={20}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-lg font-bold outline-none focus:border-violet-500/50 w-40"
                  />
                  <button type="submit" disabled={saving} className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => setEditingName(false)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/8">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-white">{profile.username}</h1>
                  <button
                    onClick={() => { setNewUsername(profile.username); setEditingName(true); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-400 mt-0.5 capitalize">
                {profile.rank_tier} · Level {profile.level} · {profile.total_matches} matches
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          {(["stats", "history", "avatar"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "history" ? "Match History" : tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          {activeTab === "stats" && <StatsCard profile={profile} />}
          {activeTab === "history" && <MatchHistory />}
          {activeTab === "avatar" && <AvatarPicker currentAvatarId={profile.avatar_id as AvatarId} />}
        </motion.div>
      </div>
    </div>
  );
}
