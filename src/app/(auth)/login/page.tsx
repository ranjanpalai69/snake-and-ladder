"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, Swords, Eye, EyeOff, AlertCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function mapAuthError(msg: string): { message: string; action?: "resend" | "signup" } {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials") || lower.includes("wrong password"))
    return { message: "Email or password is incorrect." };
  if (lower.includes("email not confirmed"))
    return { message: "Your email hasn't been confirmed yet.", action: "resend" };
  if (lower.includes("user not found"))
    return { message: "No account found with this email.", action: "signup" };
  if (lower.includes("too many requests") || lower.includes("rate limit"))
    return { message: "Too many attempts. Please wait a few minutes and try again." };
  if (lower.includes("network") || lower.includes("fetch"))
    return { message: "Network error — please check your connection." };
  return { message: msg };
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/lobby";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldError, setFieldError] = useState<{ message: string; action?: "resend" | "signup" } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleResendConfirmation() {
    if (!email) return;
    setResendLoading(true);
    const supabase = getSupabaseBrowserClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${appUrl}/auth/callback?next=/lobby` },
    });
    setResendLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email resent! Check your inbox.");
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setFieldError(mapAuthError(error.message));
      setLoading(false);
    } else {
      toast.success("Welcome back!");
      router.push(redirectTo);
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = getSupabaseBrowserClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
    if (error) { toast.error(error.message); setGoogleLoading(false); }
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* System-level auth error (OAuth callback failure) */}
      <AnimatePresence>
        {authError === "auth_callback_failed" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Authentication failed. Please try again or use a different method.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
      >
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-slate-600">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {/* Inline error banner */}
        <AnimatePresence>
          {fieldError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <p>{fieldError.message}</p>
                {fieldError.action === "resend" && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="underline text-red-300 hover:text-red-200 disabled:opacity-50"
                  >
                    {resendLoading ? "Sending…" : "Resend confirmation email"}
                  </button>
                )}
                {fieldError.action === "signup" && (
                  <Link href="/signup" className="underline text-red-300 hover:text-red-200">
                    Create an account instead
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(null); }}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPass ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldError(null); }}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mb-3 shadow-xl shadow-violet-900/50">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to continue playing</p>
        </div>

        <Suspense fallback={<div className="glass rounded-2xl p-6 h-48 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-slate-500 mt-6">
          New here?{" "}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
