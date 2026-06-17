"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { AVATAR_OPTIONS, type AvatarId } from "@/types/game";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const AVATAR_COLORS: Record<AvatarId, string> = {
  avatar_01: "#6366f1",
  avatar_02: "#ef4444",
  avatar_03: "#22c55e",
  avatar_04: "#f59e0b",
  avatar_05: "#06b6d4",
  avatar_06: "#ec4899",
};

const AVATAR_LABELS: Record<AvatarId, string> = {
  avatar_01: "Cosmic",
  avatar_02: "Blaze",
  avatar_03: "Viper",
  avatar_04: "Storm",
  avatar_05: "Glacier",
  avatar_06: "Neon",
};

interface AvatarPickerProps {
  currentAvatarId: AvatarId;
}

export function AvatarPicker({ currentAvatarId }: AvatarPickerProps) {
  const { updateAvatar, saving } = useProfile();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Choose Avatar</h3>
      <div className="grid grid-cols-3 gap-3">
        {AVATAR_OPTIONS.map((avatarId) => {
          const color = AVATAR_COLORS[avatarId];
          const isSelected = currentAvatarId === avatarId;

          return (
            <motion.button
              key={avatarId}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => updateAvatar(avatarId)}
              disabled={saving || isSelected}
              className={cn(
                "relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
                isSelected
                  ? "border-white/40 shadow-lg"
                  : "border-white/10 hover:border-white/20"
              )}
              style={{
                background: `${color}18`,
                boxShadow: isSelected ? `0 0 20px ${color}66` : undefined,
                borderColor: isSelected ? color : undefined,
              }}
            >
              {/* Avatar visual — 3D-style sphere with gradient */}
              <div
                className="w-14 h-14 rounded-full relative overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${color}ee, ${color}55)`,
                  boxShadow: `0 4px 20px ${color}88, inset 0 -4px 8px rgba(0,0,0,0.3)`,
                }}
              >
                {/* Shine */}
                <div className="absolute top-2 left-2.5 w-3 h-3 rounded-full bg-white/40 blur-sm" />
                {/* Eyes */}
                <div className="absolute bottom-4 left-3.5 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/80" />
                  <div className="w-2 h-2 rounded-full bg-white/80" />
                </div>
              </div>

              <span className="text-[10px] font-semibold text-slate-300">{AVATAR_LABELS[avatarId]}</span>

              {/* Selected check */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: color }}
                >
                  {saving ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Check className="w-3 h-3 text-white" />}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
