import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import { Sparkles, Lock, AlertCircle, ShieldCheck, Check, Clock, Eye, EyeOff, Hash, GraduationCap, Layers, User } from "lucide-react";
import { checkPasswordStrength } from "../utils/security";
import { UserProfile } from "../types";
import {
  supabase,
  getOrCreateSupabaseProfile,
  findEmailByRollNumber,
  isSupabaseConfigured,
  handleAndLogGoogleAuthError,
} from "../lib/supabase";

interface LoginProps {
  onLogin: (profileData?: Partial<UserProfile>) => void;
  accentColorClass: string;
  redirectReason?: string | null;
  onCancel?: () => void;
}

const BRANCH_OPTIONS = [
  "CSE",
  "CSE (AI&ML)",
  "CSE (Data Science)",
  "IT",
  "AI&ML",
  "AI&DS",
  "ECE",
  "EIE",
  "EEE",
  "Mechanical",
  "Civil",
  "Other"
];

const SECTION_OPTIONS = [
  "A",
  "B",
  "C",
  "D",
  "Other"
];

function formatAuthErrorMessage(error: any, isSignup: boolean): string {
  if (!error) return isSignup ? "Unable to create your account right now. Please try again." : "Invalid email or password. Please verify your credentials.";
  const msg = typeof error === "string" ? error : error?.message || "";
  const lower = msg.toLowerCase();
  if (lower.includes("already registered") || lower.includes("unique constraint") || lower.includes("user already exists") || lower.includes("already in use")) {
    return "An account with this email address already exists. Please sign in instead.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Invalid email or password. Please verify your credentials and try again.";
  }
  if (lower.includes("invalid email") || lower.includes("valid email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 8 characters long.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Network connection issue. Please check your internet connection and try again.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  return isSignup ? "Unable to create your account right now. Please try again." : "Invalid email or password. Please verify your credentials and try again.";
}

export default function Login({ onLogin, accentColorClass, redirectReason, onCancel }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (isSignUp) {
      const trimmedName = name.trim();
      const trimmedRollNumber = rollNumber.trim().toUpperCase();
      const trimmedEmail = email.trim();

      if (!trimmedName) {
        setIsLoading(false);
        setErrorMessage("Please enter your full name.");
        return;
      }

      if (!trimmedRollNumber) {
        setIsLoading(false);
        setErrorMessage("Please enter your roll number.");
        return;
      }

      if (!branch) {
        setIsLoading(false);
        setErrorMessage("Please select your branch.");
        return;
      }

      if (!section) {
        setIsLoading(false);
        setErrorMessage("Please select your section.");
        return;
      }

      if (!trimmedEmail) {
        setIsLoading(false);
        setErrorMessage("Please enter your email address.");
        return;
      }

      if (!password) {
        setIsLoading(false);
        setErrorMessage("Please enter a password.");
        return;
      }

      // Validate password strength if signing up
      if (passwordStrength.score < 2) {
        setIsLoading(false);
        setErrorMessage("Password must be at least 8 characters with letters and numbers.");
        return;
      }

      if (confirmPassword !== password) {
        setIsLoading(false);
        setErrorMessage("Passwords do not match.");
        return;
      }

      try {
        // Supabase Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: trimmedName,
              full_name: trimmedName,
              roll_number: trimmedRollNumber,
              rollNumber: trimmedRollNumber,
              branch: branch,
              section: section,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          setErrorMessage(formatAuthErrorMessage(error, true));
          return;
        }

        if (data?.user) {
          // Automatically create/fetch profile inside existing 'Profiles' table
          const profileData = await getOrCreateSupabaseProfile(
            data.user.id,
            data.user.email || trimmedEmail,
            trimmedName,
            data.user.created_at,
            undefined,
            {
              rollNumber: trimmedRollNumber,
              roll_number: trimmedRollNumber,
              branch: branch,
              section: section,
            }
          );

          setFailedAttempts(0);
          setIsLoading(false);
          onLogin(profileData);
          return;
        }

        // If email confirmation is required by Supabase project settings
        setIsLoading(false);
        setErrorMessage("Account created! If email confirmation is enabled, please verify your email or sign in.");
      } catch (err: any) {
        console.error("Sign up error:", err);
        setIsLoading(false);
        setErrorMessage(formatAuthErrorMessage(err, true));
      }
    } else {
      // Sign In with Email or Roll Number & Password
      const identifier = email.trim();
      if (!identifier) {
        setIsLoading(false);
        setErrorMessage("Please enter your email address or roll number.");
        return;
      }

      if (!password) {
        setIsLoading(false);
        setErrorMessage("Please enter your password.");
        return;
      }

      let authEmail = identifier;

      // If user entered a roll number (no '@' present)
      if (!identifier.includes("@")) {
        try {
          const resolvedEmail = await findEmailByRollNumber(identifier);
          if (!resolvedEmail) {
            setIsLoading(false);
            setErrorMessage(`No student account found for Roll Number "${identifier}". Please verify your roll number or sign in with your email address.`);
            return;
          }
          authEmail = resolvedEmail;
        } catch (findErr) {
          console.warn("Notice: could not resolve roll number:", findErr);
          setIsLoading(false);
          setErrorMessage("Unable to verify roll number. Please try signing in with your email address.");
          return;
        }
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
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
            setErrorMessage(formatAuthErrorMessage(error, false));
          }
          return;
        }

        if (data?.user) {
          // Fetch or store profile in existing 'Profiles' table
          const profileData = await getOrCreateSupabaseProfile(
            data.user.id,
            data.user.email || authEmail
          );

          setFailedAttempts(0);
          setIsLoading(false);
          onLogin(profileData);
          return;
        }
      } catch (err: any) {
        console.error("Authentication error:", err);
        setIsLoading(false);
        setErrorMessage(formatAuthErrorMessage(err, false));
      }
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
    <div className="relative min-h-screen bg-[#0d0d0e] text-[#fcfcfc] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className={`relative z-10 w-full ${isSignUp ? "max-w-lg sm:max-w-xl" : "max-w-sm"} transition-all duration-300`}>
        {/* Header Logo */}
        <div className="flex justify-center mb-5">
          <Logo variant="login" />
        </div>

        <div className="text-center mb-6 space-y-1">
          <h1 className="font-serif-studio text-3xl sm:text-4xl font-medium tracking-tight text-white">AstraMind AI</h1>
          <p className="text-xs text-white/50 tracking-wide">
            {isSignUp ? "Create your student account" : "Sign in to your workspace"}
          </p>
        </div>

        {/* Redirect Notice if Protected Route Access Attempted */}
        {redirectReason && (
          <div className="mb-4 p-3 rounded-2xl bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#c4b5fd] text-xs font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-[#a78bfa]" />
            <span>{redirectReason}</span>
          </div>
        )}

        <div className="relative">
          <div className="relative bg-[#151517] border border-white/[0.06] rounded-[28px] p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
            
            {/* Mode Toggle */}
            <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/[0.06] text-xs font-medium mb-5">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
                  !isSignUp ? "bg-white text-[#0d0d0e] font-semibold shadow-md" : "text-white/50 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMessage(null); }}
                className={`flex-1 py-1.5 rounded-full transition-all cursor-pointer ${
                  isSignUp ? "bg-white text-[#0d0d0e] font-semibold shadow-md" : "text-white/50 hover:text-white"
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
              {isSignUp ? (
                <>
                  {/* SECTION 1: PERSONAL INFORMATION */}
                  <div className="space-y-3">
                    <div className="pb-1.5 border-b border-white/[0.06] flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#a78bfa]" />
                      <span className="text-[10px] font-mono-studio uppercase tracking-[0.15em] font-semibold text-white/40">
                        Personal Information
                      </span>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                        <span>Full Name</span>
                        <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ravi Charan"
                        required
                        disabled={isLoading}
                        className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                        <span>Email Address</span>
                        <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@college.edu or name@example.com"
                        required
                        disabled={isLoading}
                        className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* SECTION 2: ACADEMIC INFORMATION */}
                  <div className="space-y-3 pt-1">
                    <div className="pb-1.5 border-b border-white/[0.06] flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-[#a78bfa]" />
                      <span className="text-[10px] font-mono-studio uppercase tracking-[0.15em] font-semibold text-white/40">
                        Academic Information
                      </span>
                    </div>

                    {/* Roll Number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-[#a78bfa]" />
                          <span>Roll Number</span>
                        </span>
                        <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        onBlur={() => setRollNumber((prev) => prev.trim())}
                        placeholder="e.g. 231FA04001"
                        required
                        disabled={isLoading}
                        className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all uppercase tracking-wider font-mono-studio disabled:opacity-50"
                      />
                    </div>

                    {/* Branch & Section Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Branch */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                          <span>Branch</span>
                          <span className="text-rose-400 font-bold">*</span>
                        </label>
                        <select
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          required
                          disabled={isLoading}
                          className="w-full h-11 bg-[#101012] border border-white/[0.08] rounded-2xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <option value="" disabled className="bg-[#101012] text-white/30">
                            Select Branch
                          </option>
                          {BRANCH_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#101012] text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Section */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                          <span>Section</span>
                          <span className="text-rose-400 font-bold">*</span>
                        </label>
                        <select
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          required
                          disabled={isLoading}
                          className="w-full h-11 bg-[#101012] border border-white/[0.08] rounded-2xl px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <option value="" disabled className="bg-[#101012] text-white/30">
                            Select Section
                          </option>
                          {SECTION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#101012] text-white">
                              {opt === "Other" ? "Other" : `Section ${opt}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ACCOUNT SECURITY */}
                  <div className="space-y-3 pt-1">
                    <div className="pb-1.5 border-b border-white/[0.06] flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#a78bfa]" />
                      <span className="text-[10px] font-mono-studio uppercase tracking-[0.15em] font-semibold text-white/40">
                        Account Security
                      </span>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                        <span>Password</span>
                        <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          disabled={isLoading}
                          className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-4 pr-11 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                          title={showPassword ? "Hide password" : "Show password"}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-white/40 hover:text-white" />
                          ) : (
                            <Eye className="w-4 h-4 text-white/40 hover:text-white" />
                          )}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {password.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-white/40">Password Strength:</span>
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

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                        <span>Confirm Password</span>
                        <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          required
                          disabled={isLoading}
                          className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-4 pr-11 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-white/40 hover:text-white" />
                          ) : (
                            <Eye className="w-4 h-4 text-white/40 hover:text-white" />
                          )}
                        </button>
                      </div>

                      {/* Inline Password Match Validation */}
                      {confirmPassword.length > 0 && (
                        confirmPassword !== password ? (
                          <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Passwords do not match.</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 pt-0.5">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>Passwords match.</span>
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* SIGN IN FORM */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#a78bfa]" />
                        <span>Email Address or Roll Number</span>
                      </span>
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@college.edu or 231FA04001"
                      required
                      disabled={isLoading}
                      className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                    />
                    <div className="flex items-center justify-between text-[11px] text-white/40 px-1 pt-0.5">
                      <span>Log in using your college Roll Number or Email</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/40 flex items-center justify-between">
                      <span>Password</span>
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-4 pr-11 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-white/40 hover:text-white" />
                        ) : (
                          <Eye className="w-4 h-4 text-white/40 hover:text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !email ||
                  !password ||
                  lockoutTime > 0 ||
                  (isSignUp && (!name || !rollNumber || !branch || !section || !confirmPassword))
                }
                className={`w-full h-11 flex items-center justify-center gap-2 rounded-full mt-3 font-semibold text-xs sm:text-sm transition-all shadow-md ${
                  email &&
                  password &&
                  !isLoading &&
                  lockoutTime === 0 &&
                  (!isSignUp || (name && rollNumber && branch && section && confirmPassword))
                    ? "bg-white text-[#0d0d0e] hover:bg-slate-200 active:scale-[0.98] cursor-pointer"
                    : "bg-white/[0.06] text-white/30 cursor-not-allowed border border-white/[0.04]"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>{isSignUp ? "Creating Student Account..." : "Signing in..."}</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isSignUp ? "Create Student Account" : "Access Workspace"}</span>
                  </>
                )}
              </button>

              {!isSignUp && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.06]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[#151517] px-3 text-white/40 font-mono-studio text-[10px] uppercase tracking-wider">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-11 flex items-center justify-center gap-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </>
              )}

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
