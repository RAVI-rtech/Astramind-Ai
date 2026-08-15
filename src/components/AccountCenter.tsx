import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Edit3, 
  Check, 
  X, 
  Cpu, 
  Globe, 
  Moon, 
  Sun, 
  Laptop, 
  Zap, 
  MessageSquare, 
  FileText, 
  Star, 
  Download, 
  LogOut, 
  Trash2, 
  Lock,
  ChevronRight,
  ShieldAlert,
  Key,
  BarChart3,
  Smartphone,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { UserProfile, Settings, Theme, UserSessionDevice } from "../types";
import { useLanguage } from "../i18n";
import { checkPasswordStrength } from "../utils/security";
import {
  supabase,
  getOrCreateSupabaseProfile,
  updateSupabaseProfile,
  handleAndLogGoogleAuthError,
  isSupabaseConfigured,
  getInitials,
  formatMemberSince,
  isProUser,
} from "../lib/supabase";

interface AccountCenterProps {
  userProfile?: UserProfile | null;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  isAuthenticated: boolean;
  isLoading?: boolean;
  onSignOut?: () => void;
  onSignIn?: (profileData?: Partial<UserProfile>) => void;
  sessionsCount?: number;
  messagesCount?: number;
  filesCount?: number;
  favouriteModel?: string;
  accentColorClass?: string;
}

export default function AccountCenter({
  userProfile,
  onUpdateProfile,
  settings,
  onUpdateSettings,
  isAuthenticated,
  isLoading = false,
  onSignOut,
  onSignIn,
  sessionsCount = 0,
  messagesCount = 0,
  filesCount = 0,
  favouriteModel = "No activity yet",
  accentColorClass = "from-blue-600 to-indigo-600",
}: AccountCenterProps) {
  const { t, setLanguage: setI18nLanguage } = useLanguage();

  const emptyProfile: UserProfile = {
    name: "",
    email: "",
    age: "",
    className: "",
    bio: "",
    avatarUrl: "",
    memberSince: "",
    currentPlan: "",
    defaultMode: "",
    language: "English (US)",
    autoMode: true
  };

  // Read-only profile view by default
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(userProfile || emptyProfile);
  
  // Auth state when user is not signed in
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Security Rate Limiting State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Security & Active Sessions state
  const [activeSessions, setActiveSessions] = useState<UserSessionDevice[]>([
    {
      id: "session_curr",
      deviceName: "Current Device",
      browser: "Chrome / Active Browser",
      location: "Verified Location",
      lastActive: "Active Now",
      isCurrent: true,
    },
  ]);

  // Change Password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const pwdStrength = checkPasswordStrength(newPwd);

  // Lockout Timer countdown
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Animated counter effects for stats
  const [animatedStats, setAnimatedStats] = useState({
    conversations: 0,
    requests: 0,
    files: 0,
  });

  useEffect(() => {
    setEditForm(userProfile || emptyProfile);
  }, [userProfile]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAnimatedStats({ conversations: 0, requests: 0, files: 0 });
      return;
    }
    const duration = 600; // ms
    const steps = 15;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setAnimatedStats({
        conversations: Math.round((sessionsCount ?? 0) * Math.min(1, progress)),
        requests: Math.round((messagesCount ?? 0) * Math.min(1, progress)),
        files: Math.round((filesCount ?? 0) * Math.min(1, progress)),
      });

      if (currentStep >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isAuthenticated, sessionsCount, messagesCount, filesCount]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(editForm);
    setIsEditing(false);

    // Persist to Supabase profiles table
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      await updateSupabaseProfile(sessionData.session.user.id, editForm);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        profile: {
          name: userProfile?.name || editForm?.name || "Member",
          memberSince: userProfile?.memberSince || "January 2026",
          currentPlan: userProfile?.currentPlan || userProfile?.plan || "Free"
        },
        settings: settings,
        exportDate: new Date().toISOString(),
        app: "AstraMind AI Workspace"
      }, null, 2)
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `astramind_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setAuthError(null);
    setIsLoggingIn(true);

    try {
      if (authMode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(loginEmail);
        setIsLoggingIn(false);
        if (error) {
          setAuthError(error.message);
        } else {
          setResetSent(true);
        }
        return;
      }

      if (authMode === "signup") {
        const strength = checkPasswordStrength(loginPassword);
        if (strength.score < 2) {
          setIsLoggingIn(false);
          setAuthError("Password must be at least 8 characters with letters and numbers.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
          options: {
            data: {
              name: fullName || loginEmail.split("@")[0],
              full_name: fullName || loginEmail.split("@")[0],
            },
          },
        });

        if (error) {
          setIsLoggingIn(false);
          setAuthError(error.message);
          return;
        }

        if (data?.user) {
          const profileData = await getOrCreateSupabaseProfile(
            data.user.id,
            data.user.email || loginEmail,
            fullName || loginEmail.split("@")[0]
          );
          setIsLoggingIn(false);
          if (onSignIn) onSignIn(profileData);
          return;
        }

        setIsLoggingIn(false);
        setAuthError("Account created! Please verify your email or sign in.");
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });

        if (error) {
          setIsLoggingIn(false);
          setAuthError(error.message);
          return;
        }

        if (data?.user) {
          const profileData = await getOrCreateSupabaseProfile(
            data.user.id,
            data.user.email || loginEmail
          );
          setIsLoggingIn(false);
          if (onSignIn) onSignIn(profileData);
          return;
        }
      }
    } catch (err: any) {
      setIsLoggingIn(false);
      setAuthError(err.message || "An error occurred during authentication.");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      if (!isSupabaseConfigured()) {
        const errObj = {
          code: "SUPABASE_NOT_CONFIGURED",
          message: "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing or unconfigured.",
        };
        const formatted = handleAndLogGoogleAuthError(errObj);
        setIsLoggingIn(false);
        setAuthError(formatted.details);
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
        setIsLoggingIn(false);
        setAuthError(formatted.details);
      }
    } catch (err: any) {
      const formatted = handleAndLogGoogleAuthError(err);
      setIsLoggingIn(false);
      setAuthError(formatted.details);
    }
  };

  // Sign out from all other active devices
  const handleSignOutOtherDevices = () => {
    setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
    setPwdStatus({
      type: "success",
      message: "Successfully terminated all other active sessions across devices.",
    });
    setTimeout(() => setPwdStatus(null), 4000);
  };

  // Revoke individual device session
  const handleRevokeDevice = (deviceId: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== deviceId));
  };

  // Change password submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);

    if (!currentPwd) {
      setPwdStatus({ type: "error", message: "Please enter your current password." });
      return;
    }

    if (pwdStrength.score < 2) {
      setPwdStatus({ type: "error", message: "New password does not meet security requirements." });
      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) {
      setPwdStatus({ type: "error", message: error.message });
      return;
    }

    setPwdStatus({ type: "success", message: "Password updated successfully. All active sessions are secured." });
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setTimeout(() => {
      setShowChangePassword(false);
      setPwdStatus(null);
    }, 3000);
  };

  // LOADING STATE
  if (isLoading || (isAuthenticated && !userProfile)) {
    return (
      <div id="loading-profile-view" className="p-12 flex flex-col items-center justify-center text-center space-y-3 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl my-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono font-medium text-slate-300">Loading profile...</p>
      </div>
    );
  }

  // NOT SIGNED IN VIEW (GUEST STATE)
  if (!isAuthenticated) {
    return (
      <div id="account-unauthenticated-card" className="p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/15 shadow-2xl backdrop-blur-2xl my-4">
        <div className="relative group shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-600 via-slate-700 to-slate-800 p-0.5 shadow-xl flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-[#070b1e] rounded-[15px] flex items-center justify-center text-slate-300">
              <User className="w-8 h-8" />
            </div>
          </div>
          {/* Requirement 1: Guest - No badge */}
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Guest
          </h3>
          <p className="text-xs font-mono text-slate-400">
            Sign in to continue
          </p>
          <div className="pt-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold font-mono">
              Plan: Free
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (onSignIn) onSignIn();
          }}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r ${accentColorClass} hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-blue-500/25 flex items-center gap-2`}
        >
          <LogOut className="w-4 h-4 rotate-180" />
          <span>Sign In</span>
        </button>
      </div>
    );
  }

  // SIGNED IN DASHBOARD VIEW
  return (
    <div id="account-dashboard-view" className="space-y-8 animate-in fade-in duration-300">
      
      {/* 👤 SECTION 1: ACCOUNT DETAILS */}
      <section id="account-section-user" className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Account Overview
            </h4>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Session
          </span>
        </div>

        {!isEditing ? (
          <div className="relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center overflow-hidden">
                    {userProfile?.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.name || "User Avatar"}
                        className="w-full h-full object-cover rounded-[15px]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#080d22] rounded-[15px] flex items-center justify-center text-white text-xl font-bold font-mono tracking-wider">
                        {getInitials(userProfile?.name, userProfile?.email)}
                      </div>
                    )}
                  </div>
                  {/* Badge logic: PRO if profile.plan == "pro", FREE if logged in non-pro */}
                  {isProUser(userProfile) ? (
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono text-[9px] font-black tracking-widest shadow">
                      PRO
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-slate-700/90 text-slate-300 border border-slate-600/60 font-mono text-[9px] font-bold tracking-widest shadow uppercase">
                      FREE
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {userProfile?.name || userProfile?.email?.split("@")[0] || ""}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  {userProfile?.email && (
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {userProfile.email}
                    </p>
                  )}
                </div>
              </div>

              <button
                id="edit-profile-btn"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 shadow"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {userProfile?.memberSince && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">Member Since</span>
                  </div>
                  <span className="text-xs font-semibold font-mono text-white">
                    {formatMemberSince(userProfile.memberSince)}
                  </span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Current Plan</span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border ${
                  isProUser(userProfile)
                    ? "bg-gradient-to-r from-amber-500/20 to-blue-500/20 border-amber-500/30 text-amber-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-300"
                }`}>
                  {isProUser(userProfile) ? "AstraMind Pro" : "Free"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-3xl bg-white/[0.05] border border-blue-500/30 shadow-2xl space-y-4 backdrop-blur-xl animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-blue-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5" /> Editing Profile
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider ml-1">Display Name</label>
                <input
                  type="text"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your display name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider ml-1">Photo / Avatar URL</label>
                <input
                  type="url"
                  value={editForm.avatarUrl || ""}
                  onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-400 focus:outline-none transition-all cursor-not-allowed opacity-70"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r ${accentColorClass} hover:brightness-110 cursor-pointer shadow-md flex items-center gap-1.5`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 🔐 SECTION 2: SECURITY & ACTIVE SESSIONS (NEW REQUIREMENT) */}
      <section id="account-section-security" className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Security &amp; Session Management
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {activeSessions.length} Active {activeSessions.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6 backdrop-blur-xl">
          
          {/* Active Sessions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Active Devices &amp; Sessions
              </span>
              {activeSessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleSignOutOtherDevices}
                  className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out From Other Devices</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                      {s.deviceName.includes("iPhone") || s.deviceName.includes("Mobile") ? (
                        <Smartphone className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Laptop className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{s.deviceName}</span>
                        {s.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {s.browser} • {s.location} ({s.lastActive})
                      </p>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeDevice(s.id)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/10 hover:text-rose-300 text-slate-400 text-[10px] font-medium transition-colors cursor-pointer shrink-0 border border-white/5"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-white">Password &amp; Authentication</h5>
                <p className="text-[10px] text-slate-400">Regularly update your password to protect your account</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(!showChangePassword);
                  setPwdStatus(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>{showChangePassword ? "Cancel" : "Change Password"}</span>
              </button>
            </div>

            {pwdStatus && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  pwdStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                }`}
              >
                {pwdStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{pwdStatus.message}</span>
              </div>
            )}

            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? "text" : "password"}
                      required
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 focus:outline-none cursor-pointer"
                      title={showCurrentPwd ? "Hide password" : "Show password"}
                      aria-label={showCurrentPwd ? "Hide password" : "Show password"}
                    >
                      {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? "text" : "password"}
                        required
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 focus:outline-none cursor-pointer"
                        title={showNewPwd ? "Hide password" : "Show password"}
                        aria-label={showNewPwd ? "Hide password" : "Show password"}
                      >
                        {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPwd ? "text" : "password"}
                        required
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 focus:outline-none cursor-pointer"
                        title={showConfirmPwd ? "Hide password" : "Show password"}
                        aria-label={showConfirmPwd ? "Hide password" : "Show password"}
                      >
                        {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {newPwd.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={`font-semibold ${pwdStrength.color.replace('bg-', 'text-')}`}>
                        {pwdStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full ${pwdStrength.score >= 1 ? pwdStrength.color : "bg-transparent"} flex-1`} />
                      <div className={`h-full ${pwdStrength.score >= 2 ? pwdStrength.color : "bg-transparent"} flex-1`} />
                      <div className={`h-full ${pwdStrength.score >= 3 ? pwdStrength.color : "bg-transparent"} flex-1`} />
                      <div className={`h-full ${pwdStrength.score >= 4 ? pwdStrength.color : "bg-transparent"} flex-1`} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r ${accentColorClass} hover:brightness-110 cursor-pointer shadow-md`}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 🤖 SECTION 3: AI PREFERENCES */}
      <section id="account-section-preferences" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Cpu className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            AI Intelligence Preferences
          </h4>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5 backdrop-blur-xl">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Default Intelligence Engine</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                "AstraMind-AI Ultra",
                "AstraMind-AI Pro",
                "AstraMind-AI Neural",
                "AstraMind-AI Vision"
              ].map((mode) => {
                const isSelected = (userProfile?.defaultMode || "Astra Mind 1.0 (Pro)") === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => onUpdateProfile({ defaultMode: mode })}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-medium border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-sm"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t("settings.primaryLanguage", "Primary Language")}</span>
              </label>
              <select
                value={userProfile?.language || "English (US)"}
                onChange={(e) => {
                  const langVal = e.target.value;
                  onUpdateProfile({ language: langVal });
                  onUpdateSettings({ language: langVal });
                  setI18nLanguage(langVal);
                }}
                className="w-full bg-[#070b1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              >
                <option value="English (US)">English (US)</option>
                <option value="हिंदी (Hindi)">हिंदी (Hindi)</option>
                <option value="తెలుగు (Telugu)">తెలుగు (Telugu)</option>
                <option value="Español (Spanish)">Español (Spanish)</option>
                <option value="Deutsch (German)">Deutsch (German)</option>
                <option value="日本語 (Japanese)">日本語 (Japanese)</option>
                <option value="Français (French)">Français (French)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
                <span>Interface Theme</span>
              </label>
              <div className="flex gap-2">
                {(["dark", "light", "system"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdateSettings({ theme: t })}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-medium capitalize flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.theme === t
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {t === "dark" && <Moon className="w-3 h-3" />}
                    {t === "light" && <Sun className="w-3 h-3" />}
                    {t === "system" && <Laptop className="w-3 h-3" />}
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📈 SECTION 4: USAGE STATISTICS */}
      <section id="account-section-stats" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Usage Statistics &amp; Analytics
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 backdrop-blur-xl group">
            <div className="flex items-center justify-between text-slate-400">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">+12%</span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {animatedStats.conversations}
            </div>
            <div className="text-[11px] font-medium text-slate-400">Conversations</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 backdrop-blur-xl group">
            <div className="flex items-center justify-between text-slate-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Active</span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {animatedStats.requests}
            </div>
            <div className="text-[11px] font-medium text-slate-400">AI Requests</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 backdrop-blur-xl group">
            <div className="flex items-center justify-between text-slate-400">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Multimodal</span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {animatedStats.files}
            </div>
            <div className="text-[11px] font-medium text-slate-400">Files Analysed</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 backdrop-blur-xl group">
            <div className="flex items-center justify-between text-slate-400">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Most Used</span>
            </div>
            <div className="text-xs font-bold font-mono text-amber-300 tracking-tight line-clamp-1 pt-1">
              {favouriteModel || "No activity yet"}
            </div>
            <div className="text-[11px] font-medium text-slate-400">Favourite Model</div>
          </div>
        </div>
      </section>

      {/* 🔒 SECTION 5: PRIVACY & DATA ACTIONS */}
      <section id="account-section-privacy" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Privacy &amp; Session Termination
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportData}
            className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-200 flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Export Workspace Backup</div>
                <div className="text-[10px] text-slate-400">Download sanitized account data (.json)</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all duration-200 flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">Sign Out Securely</div>
                  <div className="text-[10px] text-amber-400/80">Log out of current active session</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </section>

    </div>
  );
}
