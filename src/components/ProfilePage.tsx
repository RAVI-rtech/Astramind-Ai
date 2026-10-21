import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  GraduationCap,
  Hash,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CalendarCheck,
  Edit3,
  KeyRound,
  TrendingUp,
  ArrowRight,
  X,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles,
  LogOut
} from "lucide-react";
import { UserProfile } from "../types";
import { NavTab } from "./TopBar";
import { supabase, updateSupabaseProfile } from "../lib/supabase";

interface ProfilePageProps {
  userProfile?: UserProfile | null;
  isAuthenticated: boolean;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenSignIn?: () => void;
  onSignOut?: () => Promise<{ success: boolean; error?: string }> | void;
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

export default function ProfilePage({
  userProfile,
  isAuthenticated,
  onUpdateProfile,
  onNavigateTab,
  onOpenSignIn,
  onSignOut,
}: ProfilePageProps) {
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Edit form states
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      if (onSignOut) {
        const res = await onSignOut();
        if (res && (res as any).success === false) {
          setLogoutError((res as any).error || "Failed to log out. Please try again.");
          setIsLoggingOut(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) {
          setLogoutError(error.message || "Failed to log out.");
          setIsLoggingOut(false);
          return;
        }
      }
      setIsLogoutConfirmOpen(false);
    } catch (err: any) {
      setLogoutError(err?.message || "An unexpected error occurred during logout.");
      setIsLoggingOut(false);
    }
  };

  // Initialize edit fields from userProfile
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setRollNumber(userProfile.rollNumber || userProfile.roll_number || "");
      setBranch(userProfile.branch || "");
      setSection(userProfile.section || "");
      setAvatarUrl(userProfile.avatarUrl || "");
    }
  }, [userProfile]);

  const handleOpenEditModal = () => {
    if (userProfile) {
      setName(userProfile.name || "");
      setRollNumber(userProfile.rollNumber || userProfile.roll_number || "");
      setBranch(userProfile.branch || "");
      setSection(userProfile.section || "");
      setAvatarUrl(userProfile.avatarUrl || "");
    }
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const trimmedName = name.trim();
    const trimmedRoll = rollNumber.trim().toUpperCase();

    if (!trimmedName) {
      setSaveErrorMsg("Please enter your full name.");
      return;
    }

    setIsSaving(true);

    const updates: Partial<UserProfile> = {
      name: trimmedName,
      rollNumber: trimmedRoll,
      roll_number: trimmedRoll,
      branch: branch || undefined,
      section: section || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    };

    try {
      // 1. Update React state & localStorage
      onUpdateProfile(updates);

      // 2. Persist to Supabase public."Profiles"
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || userProfile?.id || userProfile?.user_id;

      if (userId) {
        const res = await updateSupabaseProfile(userId, updates);
        if (res.error) {
          console.warn("Notice: profile sync to database warning:", res.error);
        }
      }

      setSaveSuccessMsg("Profile updated successfully.");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setSaveErrorMsg("Unable to update profile right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (newPassword.length < 8) {
      setPasswordErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordErrorMsg(
          error.message?.includes("recent login")
            ? "For security, please sign out and sign in again before changing your password."
            : "Unable to update password. Please try again."
        );
        return;
      }

      setPasswordSuccessMsg("Password changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setPasswordErrorMsg("Unable to update password right now. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Helper for avatar initials
  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (userProfile?.email ? userProfile.email[0].toUpperCase() : "U");

  const effectiveRoll = userProfile?.rollNumber || userProfile?.roll_number;
  const effectiveBranch = userProfile?.branch;
  const effectiveSection = userProfile?.section;

  return (
    <div className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">

        {/* PAGE HEADER */}
        <div>
          {/* Academic Meta Tag Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-3">
            <span>{effectiveBranch || "B.Tech"}</span>
            {effectiveSection && <span>• Section {effectiveSection}</span>}
            {effectiveRoll && <span>• {effectiveRoll}</span>}
          </div>

          <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
            Profile
          </h1>
          <p className="text-sm text-white/50 mt-1 font-normal tracking-wide">
            Manage your account information and preferences
          </p>
        </div>

        {/* MAIN LAYOUT: TWO COLUMNS ON DESKTOP, SINGLE COLUMN ON MOBILE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: MAIN PROFILE DETAILS (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. PROFILE HEADER CARD */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-2xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4.5 min-w-0">
                  {/* Profile Avatar */}
                  <div className="relative shrink-0">
                    {userProfile?.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt="Profile"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-white/10 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1f1b2e] via-[#1a1728] to-[#2d224d] border border-[#a78bfa]/30 flex items-center justify-center font-serif-studio text-2xl sm:text-3xl font-medium text-[#a78bfa] shadow-xl">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Name, Email, Student Badge */}
                  <div className="min-w-0 space-y-1.5">
                    <h2 className="font-serif-studio text-2xl sm:text-3xl font-medium text-white tracking-tight truncate">
                      {userProfile?.name || "Student"}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#a78bfa]/80 shrink-0" />
                      <span className="truncate">{userProfile?.email || "student@example.com"}</span>
                    </p>
                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono-studio uppercase tracking-wider font-semibold bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa]">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Student</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* 2. PERSONAL INFORMATION */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                <User className="w-4 h-4 text-[#a78bfa]" />
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-[0.15em]">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Full Name */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                    Full Name
                  </p>
                  <p className="text-sm font-medium text-white">
                    {userProfile?.name || <span className="text-white/30 italic">Not added</span>}
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center gap-1.5">
                    <span>Email Address</span>
                    <span title="Managed by authentication">
                      <Lock className="w-3 h-3 text-white/30" />
                    </span>
                  </p>
                  <p className="text-sm font-medium text-white truncate">
                    {userProfile?.email || <span className="text-white/30 italic">Not added</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. ACADEMIC INFORMATION */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                <GraduationCap className="w-4 h-4 text-[#a78bfa]" />
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-[0.15em]">
                  Academic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                {/* Roll Number */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#a78bfa]" />
                    <span>Roll Number</span>
                  </p>
                  <p className="text-sm font-mono-studio font-semibold text-white uppercase tracking-wider">
                    {effectiveRoll || <span className="font-sans text-white/30 italic lowercase tracking-normal">Not added</span>}
                  </p>
                </div>

                {/* Branch */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-[#a78bfa]" />
                    <span>Branch</span>
                  </p>
                  <p className="text-sm font-medium text-white">
                    {effectiveBranch || <span className="text-white/30 italic">Not added</span>}
                  </p>
                </div>

                {/* Section */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#a78bfa]" />
                    <span>Section</span>
                  </p>
                  <p className="text-sm font-medium text-white">
                    {effectiveSection ? (
                      effectiveSection === "Other" ? "Other" : `Section ${effectiveSection}`
                    ) : (
                      <span className="text-white/30 italic">Not added</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. ACCOUNT DETAILS */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-[0.15em]">
                  Account Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Account Status */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                    Account Status
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </div>
                </div>

                {/* Account Created */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                    Account Created
                  </p>
                  <p className="text-sm font-medium text-white/80">
                    {userProfile?.memberSince || "Recent"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: QUICK ACTIONS + ATTENDANCE SHORTCUT (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">

            {/* 5. RIGHT-SIDE QUICK ACTIONS */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#a78bfa]" />
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-[0.15em]">
                    Quick Actions
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Edit Profile */}
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-[#a78bfa]/30 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] shrink-0 group-hover:scale-105 transition-transform">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-[#a78bfa] transition-colors">
                        Edit Profile
                      </p>
                      <p className="text-[11px] text-white/40 truncate">
                        Update personal & academic info
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#a78bfa] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Change Password */}
                <button
                  type="button"
                  onClick={() => {
                    setPasswordErrorMsg(null);
                    setPasswordSuccessMsg(null);
                    setNewPassword("");
                    setConfirmPassword("");
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-amber-400/30 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                        Change Password
                      </p>
                      <p className="text-[11px] text-white/40 truncate">
                        Manage your account security
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* View Progress */}
                <button
                  type="button"
                  onClick={() => onNavigateTab("progress")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-purple-400/30 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                        View Progress
                      </p>
                      <p className="text-[11px] text-white/40 truncate">
                        Track study hours & streak
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Log Out */}
                {isAuthenticated && (
                  <button
                    id="profile-quick-logout-btn"
                    type="button"
                    onClick={() => {
                      setLogoutError(null);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/[0.04] hover:bg-rose-500/[0.09] border border-rose-500/15 hover:border-rose-500/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-rose-300 group-hover:text-rose-200 transition-colors">
                          Log Out
                        </p>
                        <p className="text-[11px] text-white/40 truncate">
                          End your session securely
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* 6. DEDICATED ATTENDANCE SHORTCUT */}
            <div
              onClick={() => onNavigateTab("attendance")}
              className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#1b172a] via-[#151517] to-[#151517] border border-[#a78bfa]/25 hover:border-[#a78bfa]/50 transition-all shadow-2xl group cursor-pointer relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#a78bfa]/10 blur-2xl pointer-events-none group-hover:bg-[#a78bfa]/20 transition-all" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 border border-[#a78bfa]/30 flex items-center justify-center text-[#a78bfa] group-hover:scale-110 transition-transform">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-studio uppercase tracking-wider font-semibold bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa]">
                    Live Portal
                  </span>
                </div>

                <div>
                  <h4 className="font-serif-studio text-xl font-medium text-white group-hover:text-[#a78bfa] transition-colors">
                    Attendance
                  </h4>
                  <p className="text-xs text-white/70 mt-0.5">
                    View your class attendance
                  </p>
                  <p className="text-[11px] text-white/40 mt-2 leading-relaxed">
                    Check subject-wise breakdown, conducted hours and 75% margin calculation.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#a78bfa] group-hover:text-[#c4b5fd]">
                  <span>Open Attendance Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 7. EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div
          id="edit-profile-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (!isSaving) setIsEditModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#151517] border border-white/[0.08] rounded-[28px] shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-studio text-xl font-medium text-white">Edit Profile</h3>
                  <p className="text-xs text-white/40">Update your personal and academic details.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Messages */}
            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {saveErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ravi Charan"
                  disabled={isSaving}
                  className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                />
              </div>

              {/* Roll Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#a78bfa]" />
                    <span>Roll Number</span>
                  </span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 23XX1A1234"
                  disabled={isSaving}
                  className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-xs sm:text-sm text-white font-mono-studio uppercase tracking-wider placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                />
              </div>

              {/* Branch & Section Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Branch */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-[#a78bfa]" />
                      <span>Branch</span>
                    </span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <select
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={isSaving}
                    className="w-full h-11 bg-[#101012] border border-white/[0.08] rounded-2xl px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-[#101012] text-white/30">
                      Select Branch
                    </option>
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b} className="bg-[#101012] text-white">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#a78bfa]" />
                      <span>Section</span>
                    </span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <select
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    disabled={isSaving}
                    className="w-full h-11 bg-[#101012] border border-white/[0.08] rounded-2xl px-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-[#101012] text-white/30">
                      Select Section
                    </option>
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-[#101012] text-white">
                        {s === "Other" ? "Other" : `Section ${s}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Profile Avatar / Photo URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  Profile Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isSaving}
                  className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all disabled:opacity-50"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/70 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div
          id="change-password-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (!isChangingPassword) setIsPasswordModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md bg-[#151517] border border-white/[0.08] rounded-[28px] shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-studio text-xl font-medium text-white">Change Password</h3>
                  <p className="text-xs text-white/40">Enter a secure new password for your account.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isChangingPassword}
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Messages */}
            {passwordSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={isChangingPassword}
                    className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-4 pr-10 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isChangingPassword}
                    className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-4 pr-10 text-xs sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-[11px] font-medium flex items-center gap-1 pt-0.5 ${
                    confirmPassword === newPassword ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {confirmPassword === newPassword ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  disabled={isChangingPassword}
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/70 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 rounded-full bg-amber-400 text-black hover:bg-amber-300 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isChangingPassword ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. LOGOUT CONFIRMATION DIALOG */}
      {isLogoutConfirmOpen && (
        <div
          id="profile-logout-dialog-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            if (!isLoggingOut) setIsLogoutConfirmOpen(false);
          }}
        >
          <div
            id="profile-logout-dialog-card"
            className="w-full max-w-sm bg-[#151517] border border-white/[0.08] rounded-[24px] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-[#fcfcfc]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
              <LogOut className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-serif-studio text-xl font-medium text-white">Log Out</h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Are you sure you want to log out?
              </p>
            </div>

            {logoutError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{logoutError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                id="profile-logout-cancel-btn"
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="profile-logout-confirm-btn"
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Logging Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
