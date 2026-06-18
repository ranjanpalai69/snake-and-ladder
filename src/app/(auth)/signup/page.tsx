"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader2, Swords, Eye, EyeOff, AlertCircle, CheckCircle2, MailCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AVATAR_OPTIONS } from "@/types/game";
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

// ── Password strength ─────────────────────────────────────────────────────────
interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

function getPasswordStrength(pwd: string): PasswordStrength {
  if (pwd.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  return { score: capped, label: labels[capped], color: colors[capped] };
}

function mapSignupError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("user already registered") || lower.includes("already registered"))
    return "An account with this email already exists.";
  if (lower.includes("password should be") || lower.includes("password must be"))
    return "Password must be at least 8 characters.";
  if (lower.includes("invalid email") || lower.includes("unable to validate email"))
    return "Please enter a valid email address.";
  if (lower.includes("signup is disabled"))
    return "New registrations are temporarily disabled.";
  if (lower.includes("too many requests") || lower.includes("rate limit"))
    return "Too many attempts. Please wait a few minutes.";
  if (lower.includes("network") || lower.includes("fetch"))
    return "Network error — please check your connection.";
  return msg;
}

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDiffer = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleResend() {
    if (!pendingConfirmation || resendCooldown > 0) return;
    setResendLoading(true);
    const supabase = getSupabaseBrowserClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingConfirmation,
      options: { emailRedirectTo: `${appUrl}/auth/callback?next=/lobby` },
    });
    setResendLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Confirmation email resent!");
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((n) => { if (n <= 1) { clearInterval(interval); return 0; } return n - 1; });
    }, 1000);
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    const supabase = getSupabaseBrowserClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/auth/callback?next=/lobby` },
    });
    if (error) { toast.error(error.message); setGoogleLoading(false); }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);
    setEmailAlreadyExists(false);

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) { setFieldError("Username must be at least 3 characters."); return; }
    if (trimmedUsername.length > 20) { setFieldError("Username must be 20 characters or less."); return; }
    if (strength.score < 2) { setFieldError("Please choose a stronger password (at least 8 characters)."); return; }
    if (password !== confirmPassword) { setFieldError("Passwords do not match."); return; }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const avatarId = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: trimmedUsername, avatar_id: avatarId },
        emailRedirectTo: `${appUrl}/auth/callback?next=/lobby`,
      },
    });

    if (error) {
      const mapped = mapSignupError(error.message);
      if (error.message.toLowerCase().includes("already registered")) {
        setEmailAlreadyExists(true);
      }
      setFieldError(mapped);
      setLoading(false);
      return;
    }

    // Immediate session → email confirmation disabled in Supabase settings
    if (data.session) {
      toast.success("Account created! Welcome!");
      router.push("/lobby");
      router.refresh();
      return;
    }

    // Email confirmation required
    setPendingConfirmation(email);
    setLoading(false);
  }

  // ── Email confirmation pending screen ────────────────────────────────────────
  if (pendingConfirmation) {
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
              <p className="text-sm text-slate-400">
                We sent a confirmation link to
              </p>
              <p className="text-sm font-semibold text-violet-300 mt-1 break-all">{pendingConfirmation}</p>
              <p className="text-xs text-slate-500 mt-3">
                Click the link in the email to activate your account. Check your spam folder if you don't see it.
              </p>
            </div>

            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50 transition-all"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</span>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                "Resend confirmation email"
              )}
            </button>

            <p className="text-xs text-slate-600">
              Wrong email?{" "}
              <button
                onClick={() => setPendingConfirmation(null)}
                className="text-violet-400 hover:text-violet-300 underline"
              >
                Go back
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Signup form ──────────────────────────────────────────────────────────────
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
          <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
          <p className="text-sm text-slate-400 mt-1">Join and start playing for free</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-600">or create with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            {/* Error banner */}
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs"
                >
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <p>{fieldError}</p>
                    {emailAlreadyExists && (
                      <p className="mt-1">
                        <Link href="/login" className="underline text-red-300 hover:text-red-200">
                          Sign in instead
                        </Link>
                        {" or "}
                        <Link href="/forgot-password" className="underline text-red-300 hover:text-red-200">
                          reset your password
                        </Link>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  minLength={3}
                  maxLength={20}
                  value={username}
                  onChange={(e) => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); setFieldError(null); }}
                  placeholder="CoolPlayer99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">3–20 characters, letters, numbers, underscores only</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldError(null); setEmailAlreadyExists(false); }}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldError(null); }}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : "rgba(255,255,255,0.08)" }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-medium" style={{ color: strength.color || "#94a3b8" }}>
                    {strength.label || "Enter a password"}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldError(null); }}
                  placeholder="Re-enter your password"
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-1 transition-all ${
                    passwordsDiffer
                      ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                      : passwordsMatch
                      ? "border-green-500/50 focus:border-green-500/50 focus:ring-green-500/20"
                      : "border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20"
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {passwordsMatch && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                  {passwordsDiffer && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {passwordsDiffer && (
                <p className="text-[10px] text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || passwordsDiffer}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
