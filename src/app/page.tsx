"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
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
  ChevronDown,
  MonitorSmartphone,
  Wifi,
  Download,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { RANK_COLORS } from "@/types/game";

const FEATURES = [
  { icon: Globe, title: "Real-Time Multiplayer", desc: "Play online Snake and Ladder with up to 5 friends anywhere in the world via Socket.io real-time connections.", color: "#6366f1" },
  { icon: Zap, title: "Stunning 3D Board", desc: "Fully animated 3D snakes, ladders, and pieces using Three.js — the best-looking Snake and Ladder game online.", color: "#f59e0b" },
  { icon: Trophy, title: "Ranked Matches", desc: "Climb from Bronze to Legend with our star-based ranking system. Compete in ranked Snake and Ladder matches.", color: "#ffd700" },
  { icon: ShieldCheck, title: "Secure & Free", desc: "Completely free Snake and Ladder game — no ads, no purchases. Sign in securely with email or OAuth.", color: "#22c55e" },
  { icon: Activity, title: "Match History", desc: "Track every Snake and Ladder game, opponent results, and rank changes in detailed match history.", color: "#06b6d4" },
  { icon: Gamepad2, title: "Local & Solo Play", desc: "Offline Snake and Ladder: pass-and-play for 2–6 players on one device, or solo practice against a bot.", color: "#ec4899" },
];

const HOW_TO_STEPS = [
  { step: "1", title: "Create a Free Account", desc: "Sign up in seconds with your email. No downloads required — Snake and Ladder runs entirely in your browser." },
  { step: "2", title: "Create or Join a Room", desc: "Go to the Multiplayer Lobby, create a room with a custom name, and share the room code with up to 5 friends." },
  { step: "3", title: "Roll the Dice", desc: "Click the dice on your turn. Move your piece along the 10×10 board — land on a ladder to climb up, land on a snake to slide down." },
  { step: "4", title: "Race to Square 100", desc: "First player to reach exactly square 100 wins. Roll a 6 to get an extra turn. If you overshoot 100, you stay put and the turn passes." },
];

const FAQS = [
  {
    q: "How do you play Snake and Ladder online?",
    a: "Create a free account, go to the Multiplayer Lobby, create or join a room with a code, and invite up to 5 friends. Roll the dice on your turn — climb ladders and dodge snakes to be the first to reach square 100!",
  },
  {
    q: "Can I play Snake and Ladder offline?",
    a: "Yes! This is a Progressive Web App (PWA). After your first visit, the game is cached and fully playable offline. You can practice solo or play local multiplayer with 2–6 players on one device with no internet needed.",
  },
  {
    q: "Is this Snake and Ladder game free to play?",
    a: "Completely free — no downloads, no purchases, no ads. Just create a free account to unlock multiplayer and ranked leaderboards. Solo and local play require no account at all.",
  },
  {
    q: "How many players can play Snake and Ladder online?",
    a: "Online multiplayer supports 2–6 players per room. Local pass-and-play also supports 2–6 players on one device. Solo play is also available against a bot.",
  },
  {
    q: "What makes this the best Snake and Ladder game?",
    a: "Full 3D animated board using Three.js, real-time multiplayer with in-game chat, a ranked progression system from Bronze to Legend, offline PWA support, pass-and-play local mode, and correct classic rules — exact 100 required to win, roll a 6 for an extra turn.",
  },
  {
    q: "Can I play Snake and Ladder on mobile?",
    a: "Yes! The game is fully responsive and works on all modern mobile browsers including Chrome, Safari, and Firefox. You can also install it as an app on your home screen via the PWA install prompt for an app-like experience.",
  },
  {
    q: "Do I need to download anything to play?",
    a: "No download required. Snake and Ladder 3D runs entirely in your web browser. You can optionally install it as a PWA from Chrome or Safari for offline access — one tap, no app store needed.",
  },
];

const RANKS = ["bronze", "silver", "gold", "platinum", "diamond", "legend"] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/4 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-white text-sm sm:text-base">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuthStore();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        aria-label="Hero — Snake and Ladder game online"
        className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center pt-16 overflow-hidden"
      >
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-900/40 border border-violet-500/30 text-sm text-violet-300 mb-6"
          >
            <Swords className="w-3.5 h-3.5" />
            Free 3D Multiplayer Board Game
          </motion.div>

          <h1 className="font-display text-6xl sm:text-7xl font-black text-white mb-4 leading-none tracking-tight">
            Snake <span className="gradient-text">&amp;</span> Ladder
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            The best Snake and Ladder game online — free, 3D, and real-time multiplayer.
            Roll dice, climb ladders, dodge snakes, and race to square 100 with friends worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            {isLoading ? null : user ? (
              <>
                <Link
                  href="/lobby"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-base shadow-xl shadow-violet-900/40 hover:opacity-90 transition-opacity"
                >
                  <Users className="w-5 h-5" /> Play Online
                </Link>
                <Link
                  href="/local"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-emerald-900/40"
                >
                  <MonitorSmartphone className="w-5 h-5" /> Local Play
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
                  Play Free Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/local"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-semibold text-base hover:opacity-90 transition-opacity"
                >
                  <MonitorSmartphone className="w-5 h-5" /> Offline Play
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
      <section aria-label="Features" className="max-w-6xl mx-auto px-4 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-bold text-white text-center mb-4"
        >
          The <span className="gradient-text">best Snake and Ladder game</span> online
        </motion.h2>
        <p className="text-center text-slate-400 mb-12 max-w-xl mx-auto text-sm">
          Free to play, no download needed. Works on Chrome, Firefox, and Safari — desktop and mobile.
        </p>

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

      {/* How to Play */}
      <section aria-label="How to play Snake and Ladder online" className="max-w-4xl mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-bold text-white text-center mb-4"
        >
          How to play <span className="gradient-text">Snake and Ladder</span> online
        </motion.h2>
        <p className="text-center text-slate-400 mb-12 max-w-lg mx-auto text-sm">
          Get started in under a minute. No downloads, no installs.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {HOW_TO_STEPS.map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 font-display font-bold text-violet-300 text-lg">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Play modes mini-grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass p-5 rounded-2xl text-center">
            <Wifi className="w-7 h-7 text-violet-400 mx-auto mb-2" />
            <p className="font-semibold text-white text-sm mb-1">Online Multiplayer</p>
            <p className="text-xs text-slate-500">2–6 players, real-time</p>
          </div>
          <div className="glass p-5 rounded-2xl text-center">
            <MonitorSmartphone className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-white text-sm mb-1">Local Play</p>
            <p className="text-xs text-slate-500">2–6 players, one device, offline</p>
          </div>
          <div className="glass p-5 rounded-2xl text-center">
            <Download className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="font-semibold text-white text-sm mb-1">Install as App</p>
            <p className="text-xs text-slate-500">PWA — works offline, no store</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="FAQ — Snake and Ladder game" className="max-w-3xl mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl font-bold text-white text-center mb-12"
        >
          Frequently asked <span className="gradient-text">questions</span>
        </motion.h2>

        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
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
            Ready to play Snake and Ladder?
          </h2>
          <p className="text-slate-400 mb-8">
            Free forever. No download. Play online with friends or offline on any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={user ? "/lobby" : "/signup"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-display font-bold text-lg shadow-2xl shadow-violet-900/50 hover:opacity-90 transition-opacity"
            >
              {user ? "Go to Lobby" : "Play Free Now"} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/local"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/8 border border-white/10 text-white font-semibold text-base hover:bg-white/12 transition-all"
            >
              <MonitorSmartphone className="w-5 h-5" /> Play Offline
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-10 px-4 text-center">
        <p className="text-sm text-slate-500 mb-2">
          Snake &amp; Ladder 3D — the best free online Snake and Ladder game. Play multiplayer or offline.
        </p>
        <p className="text-xs text-slate-700">
          Works on Google Chrome, Mozilla Firefox, Apple Safari &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
