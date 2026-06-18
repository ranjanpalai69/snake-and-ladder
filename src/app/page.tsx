"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  Swords,
  Users,
  Trophy,
  Zap,
  Star,
  Globe,
  ArrowRight,
  Gamepad2,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { RANK_COLORS } from "@/types/game";

const FEATURES = [
  { icon: Globe, title: "Real-Time Multiplayer", desc: "Play with up to 5 friends anywhere via Socket.io", color: "#6366f1" },
  { icon: Zap, title: "Stunning 3D Board", desc: "Fully animated 3D snakes, ladders, and pieces via Three.js", color: "#f59e0b" },
  { icon: Trophy, title: "Ranked Matches", desc: "Climb from Bronze to Legend with our star-based ranking system", color: "#ffd700" },
  { icon: ShieldCheck, title: "Secure Auth", desc: "Sign in with email or OAuth via Supabase", color: "#22c55e" },
  { icon: Activity, title: "Match History", desc: "Track every game, opponent, and rank change", color: "#06b6d4" },
  { icon: Gamepad2, title: "Local & Solo Play", desc: "Pass-and-play for 2–6 on one device, or solo practice with a bot", color: "#ec4899" },
];

const RANKS = ["bronze", "silver", "gold", "platinum", "diamond", "legend"] as const;

export default function HomePage() {
  const { user, isLoading } = useAuthStore();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center pt-16 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)" }}
            animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-4xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-900/40 border border-violet-500/30 text-sm text-violet-300 mb-6"
          >
            <Swords className="w-3.5 h-3.5" />
            3D Multiplayer Board Game
          </motion.div>

          <h1 className="font-display text-6xl sm:text-7xl font-black text-white mb-4 leading-none tracking-tight">
            Snake <span className="gradient-text">&amp;</span> Ladder
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            The timeless classic, reimagined in full 3D. Roll dice, climb ladders,
            dodge snakes, and outwit opponents from around the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            {isLoading ? null : user ? (
              <>
                <Link
                  href="/lobby"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-base shadow-xl shadow-violet-900/40 hover:opacity-90 transition-opacity"
                >
                  <Users className="w-5 h-5" /> Multiplayer Lobby
                </Link>
                <Link
                  href="/local"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-emerald-900/40"
                >
                  <Gamepad2 className="w-5 h-5" /> Local Play
                </Link>
                <Link
                  href="/single-player"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/8 border border-white/10 text-white font-semibold text-base hover:bg-white/12 transition-all"
                >
                  <Gamepad2 className="w-5 h-5" /> Play Solo
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-base shadow-xl shadow-violet-900/40 hover:opacity-90 transition-opacity"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/8 border border-white/10 text-white font-semibold text-base hover:bg-white/12 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Rank tier badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 flex items-center gap-3 mt-16 flex-wrap justify-center"
        >
          {RANKS.map((tier, i) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold capitalize"
              style={{
                borderColor: `${RANK_COLORS[tier]}44`,
                background: `${RANK_COLORS[tier]}11`,
                color: RANK_COLORS[tier],
              }}
            >
              <Star className="w-3 h-3" fill={RANK_COLORS[tier]} />
              {tier}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-bold text-white text-center mb-12"
        >
          Built for the <span className="gradient-text">next generation</span>
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass p-5 rounded-2xl group hover:border-white/16 transition-all duration-300"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: `${color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-10 border-violet-500/20"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Ready to play?
          </h2>
          <p className="text-slate-400 mb-8">Create a free account and start climbing the ranks today.</p>
          <Link
            href={user ? "/lobby" : "/signup"}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-display font-bold text-lg shadow-2xl shadow-violet-900/50 hover:opacity-90 transition-opacity"
          >
            {user ? "Go to Lobby" : "Create Account"} <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-600">
        Snake &amp; Ladder — 3D Multiplayer &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
