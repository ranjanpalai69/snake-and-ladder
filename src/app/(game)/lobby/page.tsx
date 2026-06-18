"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Hash, Gamepad2, Users, Trophy, Globe, Swords, ArrowRight, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { RoomCard } from "@/components/lobby/RoomCard";
import { CreateRoomModal } from "@/components/lobby/CreateRoomModal";
import { JoinByCodeModal } from "@/components/lobby/JoinByCodeModal";
import { useRoomStore } from "@/stores/roomStore";

type LobbyView = "select" | "multiplayer" | "solo";

function ModeSelection({ onSelect }: { onSelect: (mode: LobbyView) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-900/30 border border-violet-500/20 text-sm text-violet-300 mb-4">
          <Swords className="w-3.5 h-3.5" /> Choose your mode
        </div>
        <h1 className="font-display text-4xl font-black text-white">How do you want to play?</h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Multiplayer */}
        <motion.button
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect("multiplayer")}
          className="group relative overflow-hidden p-8 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/40 to-indigo-900/30 text-left hover:border-violet-400/40 transition-all duration-300 cursor-pointer"
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center mb-5"
            >
              <Users className="w-8 h-8 text-violet-300" />
            </motion.div>

            <h2 className="font-display text-2xl font-bold text-white mb-2">Multiplayer</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Challenge up to 3 friends in real-time. Create a room, share the code, and battle for supremacy.
            </p>

            <div className="flex flex-wrap gap-2">
              {["2-6 Players", "Real-time", "Ranked", "Chat"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-violet-900/40 text-violet-300 text-xs font-medium border border-violet-500/20">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-5 text-violet-400 text-sm font-semibold">
              Enter Lobby <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.button>

        {/* Local Multiplayer */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/local"
            className="group relative overflow-hidden p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/30 to-teal-900/20 text-left hover:border-emerald-400/40 transition-all duration-300 cursor-pointer block h-full"
          >
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.12) 0%, transparent 70%)" }}
            />
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/25 flex items-center justify-center mb-5"
              >
                <MonitorSmartphone className="w-8 h-8 text-emerald-300" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Local Play</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                2–6 players on one device. Choose names, pick colors, and pass the phone around!
              </p>
              <div className="flex flex-wrap gap-2">
                {["2-6 Players", "One Device", "No Account", "Pass & Play"].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-emerald-900/30 text-emerald-300 text-xs font-medium border border-emerald-500/15">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-5 text-emerald-400 text-sm font-semibold">
                Play Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Single Player */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/single-player"
              className="group relative overflow-hidden p-8 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-900/30 to-orange-900/20 text-left hover:border-amber-400/40 transition-all duration-300 cursor-pointer block"
            >
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(ellipse at 70% 50%, rgba(245,158,11,0.12) 0%, transparent 70%)",
                }}
              />

              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-500/25 flex items-center justify-center mb-5"
                >
                  <Gamepad2 className="w-8 h-8 text-amber-300" />
                </motion.div>

                <h2 className="font-display text-2xl font-bold text-white mb-2">Solo Practice</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Play alone at your own pace. Perfect for learning the board, strategizing, or just relaxing.
                </p>

                <div className="flex flex-wrap gap-2">
                  {["Offline Ready", "No Wait", "Unlimited Plays", "Practice"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-amber-900/30 text-amber-300 text-xs font-medium border border-amber-500/15">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-5 text-amber-400 text-sm font-semibold">
                  Play Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-8 flex items-center justify-center gap-4"
      >
        <Link href="/leaderboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors">
          <Trophy className="w-4 h-4" /> Leaderboard
        </Link>
        <span className="text-slate-700">·</span>
        <Link href="/profile" className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors">
          <Globe className="w-4 h-4" /> My Profile
        </Link>
      </motion.div>
    </div>
  );
}

function MultiplayerLobby() {
  const { publicRooms } = useRoomStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Multiplayer Lobby</h1>
          <p className="text-slate-400 text-sm mt-1">{publicRooms.length} public rooms available</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setJoinOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm font-semibold hover:bg-white/12 transition-all"
          >
            <Hash className="w-4 h-4" /> Join by Code
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-900/40"
          >
            <Plus className="w-4 h-4" /> Create Room
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Public Rooms</h2>
          </div>

          {publicRooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No public rooms yet</p>
              <p className="text-slate-600 text-sm mt-1">Be the first to create one!</p>
            </motion.div>
          ) : (
            publicRooms.map((room, i) => <RoomCard key={room.id} room={room} index={i} />)
          )}
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => setCreateOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-300 hover:bg-violet-600/30 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Create Room
              </button>
              <button
                onClick={() => setJoinOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:bg-white/8 transition-all text-sm font-medium"
              >
                <Hash className="w-4 h-4" /> Join Private Room
              </button>
              <Link
                href="/single-player"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:bg-white/8 transition-all text-sm font-medium"
              >
                <Gamepad2 className="w-4 h-4" /> Play Solo Instead
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-2">How to Play</h3>
            <ul className="text-xs text-slate-400 space-y-1.5 mt-2">
              <li className="flex gap-2"><span className="text-violet-400 font-bold">1.</span> Create or join a room</li>
              <li className="flex gap-2"><span className="text-violet-400 font-bold">2.</span> Click Ready when all players join</li>
              <li className="flex gap-2"><span className="text-violet-400 font-bold">3.</span> Roll the dice on your turn</li>
              <li className="flex gap-2"><span className="text-violet-400 font-bold">4.</span> Avoid snakes, use ladders!</li>
              <li className="flex gap-2"><span className="text-violet-400 font-bold">5.</span> First to reach 100 wins</li>
            </ul>
          </motion.div>
        </div>
      </div>

      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinByCodeModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}

export default function LobbyPage() {
  const [view, setView] = useState<LobbyView>("select");

  return (
    <div className="min-h-screen">
      <Navbar />

      <AnimatePresence mode="wait">
        {view === "select" ? (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ModeSelection onSelect={setView} />
          </motion.div>
        ) : (
          <motion.div key="multiplayer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MultiplayerLobby />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
