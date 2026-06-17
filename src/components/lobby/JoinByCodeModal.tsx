"use client";

import { useState, FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Hash, Loader2 } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

interface JoinByCodeModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinByCodeModal({ open, onClose }: JoinByCodeModalProps) {
  const { joinRoom } = useSocket();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    const room = await joinRoom(code.toUpperCase());
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
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-violet-400" />
                <h2 className="font-display font-bold text-white">Join by Code</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoin} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">6-Digit Room Code</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  placeholder="ABC123"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono text-center tracking-[0.4em] text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-all uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={code.length < 6 || loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Joining..." : "Join Room"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
