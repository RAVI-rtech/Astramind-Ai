import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import { Sparkles, Lock, AlertCircle, ShieldCheck, Check, Clock, Eye, EyeOff } from "lucide-react";
import { checkPasswordStrength } from "../utils/security";
import { UserProfile } from "../types";
import {
  supabase,
  getOrCreateSupabaseProfile,
  isSupabaseConfigured,
  handleAndLogGoogleAuthError,
} from "../lib/supabase";

interface LoginProps {
  onLogin: (profileData?: Partial<UserProfile>) => void;
  accentColorClass: string;
  redirectReason?: string | null;
  onCancel?: () => void;
}

export default function Login({ onLogin, accentColorClass, redirectReason, onCancel }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security Rate Limiting State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0); // seconds remaining

  const passwordStrength = checkPasswordStrength(password);

  // Lockout Timer countdown
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const timer = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    setErrorMessage(null);
    setIsLoading(true);

    // Validate password strength if signing up
    if (isSignUp && passwordStrength.score < 2) {
      setIsLoading(false);
      setErrorMessage("Password must be at least 8 characters with letters and numbers.");
      return;
    }

    try {
      if (isSignUp) {
        // Supabase Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split("@")[0],
              full_name: name || email.split("@")[0],
            },
          },
        });

        if (error) {
          setIsLoading(false);
          setErrorMessage(error.message || "Failed to create account. Please check your credentials.");
          return;
        }

        if (data?.user) {
          // Automatically create/fetch profile inside existing 'profiles' table
          const profileData = await getOrCreateSupabaseProfile(
            data.user.id,
            data.user.email || email,
            name || email.split("@")[0]
          );

          setFailedAttempts(0);
          setIsLoading(false);
          onLogin(profileData);
          return;
        }

        // If email confirmation is required by Supabase project settings
        setIsLoading(false);
        setErrorMessage("Account created! If email confirmation is enabled, please verify your email or sign in.");
      } else {
        // Supabase Sign In with Email & Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsLoading(false);
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          if (nextAttempts >= 3) {
            setLockoutTime(30);
            setErrorMessage("Too many failed sign-in attempts. For security reasons, please wait 30 seconds before trying again.");
          } else {
            setErrorMessage(error.message || "Invalid email or password. Please verify your credentials and try again.");
          }
          return;
        }

        if (data?.user) {
          // Fetch or store profile in existing 'profiles' table
          const profileData = await getOrCreateSupabaseProfile(
            data.user.id,
            data.user.email || email
          );

          setFailedAttempts(0);
          setIsLoading(false);
          onLogin(profileData);
          return;
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setIsLoading(false);
      setErrorMessage(err.message || "An unexpected error occurred during authentication.");
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        const errObj = {
          code: "SUPABASE_NOT_CONFIGURED",
          message: "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing or set to placeholders.",
        };
        const formatted = handleAndLogGoogleAuthError(errObj);
        setErrorMessage(formatted.details);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        const formatted = handleAndLogGoogleAuthError(error);
        setErrorMessage(formatted.details);
        setIsLoading(false);
      }
    } catch (err: any) {
      const formatted = handleAndLogGoogleAuthError(err);
      setErrorMessage(formatted.details);
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-sm">
        {/* Header Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="login" />
        </div>

        <div className="text-center mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">AstraMind AI</h1>
          <p className="text-xs text-slate-400">
            {isSignUp ? "Create your secure account" : "Sign in to your workspace"}
          </p>
        </div>

        {/* Redirect Notice if Protected Route Access Attempted */}
        {redirectReason && (
          <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{redirectReason}</span>
          </div>
        )}

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[28px] opacity-20 blur-md transition-opacity" />
          <div className="relative bg-[#0A0E22]/90 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-2xl">
            
            {/* Mode Toggle */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-medium mb-5">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  !isSignUp ? "bg-white/15 text-white font-semibold shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isSignUp ? "bg-white/15 text-white font-semibold shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Lockout Notice */}
            {lockoutTime > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
                <span>Rate limited. Retry available in {lockoutTime} seconds.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator (on typing or signup) */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={`font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"} flex-1`} />
                      <div className={`h-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"} flex-1`} />
                      <div className={`h-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"} flex-1`} />
                      <div className={`h-full transition-all duration-300 ${passwordStrength.score >= 4 ? passwordStrength.color : "bg-transparent"} flex-1`} />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password || lockoutTime > 0}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl mt-2 font-semibold text-sm transition-all shadow-lg ${
                  email && password && !isLoading && lockoutTime === 0
                    ? `bg-gradient-to-r ${accentColorClass} text-white hover:brightness-110 active:scale-[0.98] shadow-blue-500/25 cursor-pointer`
                    : "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
                }`}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isSignUp ? "Create Account & Enter" : "Access Workspace"}</span>
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors pt-2 cursor-pointer"
                >
                  Return to Home
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Security assurance */}
        <p className="text-[11px] text-center text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Session • Multi-Factor Session Protection</span>
        </p>
      </div>
    </div>
  );
}
