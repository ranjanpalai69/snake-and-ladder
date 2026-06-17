"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Users, Lock, Globe, Loader2 } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";
import type { CreateRoomPayload } from "@/types/room";
import { cn } from "@/lib/utils";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const { createRoom } = useSocket();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateRoomPayload>({
    name: "",
    maxPlayers: 2,
    visibility: "public",
  });

  async function handleCreate() {
    if (!form.name.trim()) return;
    setLoading(true);
    const room = await createRoom(form);
    if (room) {
      onClose();
      router.push(`/game/${room.id}`);
    }
    setLoading(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" />
                <h2 className="font-display font-bold text-white">Create Room</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Room name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Room Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={32}
                  placeholder="My awesome game..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>

              {/* Max players */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Max Players <span className="text-slate-600 normal-case font-normal">(2–6)</span>
                </label>
                <div className="flex gap-1.5">
                  {([2, 3, 4, 5, 6] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm((f) => ({ ...f, maxPlayers: n }))}
                      className={cn(
                        "flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold border transition-all",
                        form.maxPlayers === n
                          ? "bg-violet-600/30 border-violet-500/60 text-violet-300"
                          : "bg-white/5 border-white/8 text-slate-400 hover:border-white/20"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Visibility
                </label>
                <div className="flex gap-2">
                  {(["public", "private"] as const).map((v) => {
                    const Icon = v === "public" ? Globe : Lock;
                    return (
                      <button
                        key={v}
                        onClick={() => setForm((f) => ({ ...f, visibility: v }))}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border capitalize transition-all",
                          form.visibility === v
                            ? "bg-violet-600/30 border-violet-500/60 text-violet-300"
                            : "bg-white/5 border-white/8 text-slate-400 hover:border-white/20"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" /> {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
