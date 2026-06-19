"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Mail, Loader2, AlertCircle, MailCheck, ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!email) return;
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("rate limit") || lower.includes("too many"))
        setError("Too many requests. Please wait a few minutes.");
      else if (lower.includes("user not found") || lower.includes("invalid email"))
        setError("No account found with this email address.");
      else
        setError(error.message);
      return;
    }

    setSent(true);
    startCooldown();
  }

  function startCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) { clearInterval(interval); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    await submit();
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="glass rounded-2xl p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-400">We sent a password reset link to</p>
              <p className="text-sm font-semibold text-violet-300 mt-1 break-all">{email}</p>
              <p className="text-xs text-slate-500 mt-3">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
            </div>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50 transition-all"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend reset link"}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mb-3 shadow-xl shadow-violet-900/50">
            <Image src="/assets/icons/snake-ladder-favicon.png" alt="Snake & Ladder" width={30} height={30} className="rounded-sm" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Forgot password?</h1>
          <p className="text-sm text-slate-400 mt-1 text-center">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mt-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
