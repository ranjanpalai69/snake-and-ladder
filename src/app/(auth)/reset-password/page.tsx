"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, Swords, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDiffer = confirmPassword.length > 0 && password !== confirmPassword;

  // The auth callback exchanges the recovery code for a session before redirecting here.
  // We just need to verify we have a valid session of type "recovery".
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCheckingSession(false);
      if (session) {
        setSessionReady(true);
      } else {
        // No session — link is invalid or expired
        setError("This password reset link is invalid or has expired. Please request a new one.");
      }
    });
  }, []);

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (strength.score < 2) { setError("Please choose a stronger password (at least 8 characters)."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("same as old"))
        setError("New password must be different from your current password.");
      else if (lower.includes("at least"))
        setError("Password must be at least 8 characters.");
      else
        setError(error.message);
      setLoading(false);
      return;
    }

    toast.success("Password updated successfully!", { duration: 4000 });
    router.push("/lobby");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
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
            <Swords className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Set new password</h1>
          <p className="text-sm text-slate-400 mt-1">Choose a strong password for your account.</p>
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
                <div>
                  <p>{error}</p>
                  {error.includes("invalid or has expired") && (
                    <a href="/forgot-password" className="underline text-red-300 hover:text-red-200 mt-1 block">
                      Request a new reset link
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {sessionReady && (
            <form onSubmit={handleReset} className="space-y-4" noValidate>
              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    autoFocus
                    minLength={8}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
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
                      {strength.label}
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
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
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

              {/* Password requirements hint */}
              <div className="space-y-1 text-[10px] text-slate-600">
                {[
                  ["8+ characters", password.length >= 8],
                  ["Uppercase & lowercase letters", /[A-Z]/.test(password) && /[a-z]/.test(password)],
                  ["At least one number", /[0-9]/.test(password)],
                ].map(([label, met]) => (
                  <div key={label as string} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${met ? "bg-green-400" : "bg-slate-700"}`} />
                    <span className={met ? "text-green-400" : ""}>{label as string}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || passwordsDiffer || strength.score < 2}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Update Password</>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
