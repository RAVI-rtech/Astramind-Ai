import React, { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  ArrowRight,
  Plus,
  Zap,
  Users,
  School,
  CalendarCheck,
  Briefcase,
  FileText,
  Linkedin,
  GraduationCap
} from "lucide-react";
import { UserProfile, StudyWorkspace } from "../types";
import {
  getAllWorkspaces,
  getActiveWorkspace,
  setActiveWorkspaceId
} from "../lib/studyWorkspaceStorage";
import { getLearningStreak } from "../lib/streakTracker";
import { NavTab } from "./TopBar";
import AdSenseBanner from "./AdSenseBanner";
import { ADSENSE_CONFIG } from "../config/adsense";

interface DashboardPageProps {
  userProfile?: UserProfile | null;
  isAuthenticated: boolean;
  onNewChat: () => void;
  onTabChange?: (tab: NavTab) => void;
  onOpenCreateWorkspace?: () => void;
  onSelectWorkspace?: (ws: StudyWorkspace, tab?: any) => void;
}

export default function DashboardPage({
  userProfile,
  isAuthenticated,
  onNewChat,
  onTabChange,
  onOpenCreateWorkspace,
  onSelectWorkspace,
}: DashboardPageProps) {
  const [workspaces, setWorkspaces] = useState<StudyWorkspace[]>([]);
  const [activeWs, setActiveWs] = useState<StudyWorkspace | null>(null);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  const studentName = userProfile?.name
    ? userProfile.name.split(" ")[0]
    : userProfile?.email
    ? userProfile.email.split("@")[0]
    : "Student";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const all = getAllWorkspaces();
    setWorkspaces(all);
    const curr = getActiveWorkspace();
    setActiveWs(curr || (all.length > 0 ? all[0] : null));

    const streak = getLearningStreak();
    setStreakData({
      currentStreak: Math.max(0, streak.currentStreak),
      longestStreak: Math.max(0, streak.longestStreak),
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onNewChat();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("astramind-set-prompt", { detail: searchQuery.trim() }));
    }, 60);
  };

  const handleOpenWorkspace = (ws: StudyWorkspace, tab?: any) => {
    setActiveWorkspaceId(ws.id);
    if (onSelectWorkspace) {
      onSelectWorkspace(ws, tab);
    } else if (onTabChange) {
      onTabChange("workspace");
    }
  };

  const academicTag = userProfile?.branch
    ? `Vignan • ${userProfile.branch}${userProfile?.section ? ` • Sec-${userProfile.section}` : ""}`
    : "Your Study Dashboard";

  return (
    <div className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-10">

        {/* 1. HERO SECTION */}
        <section className="text-center pt-4 sm:pt-8 pb-4">
          <div className="inline-block font-mono-studio text-[11px] uppercase tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] px-4 py-1.5 rounded-full mb-5">
            {academicTag}
          </div>

          <h1 className="font-serif-studio text-5xl sm:text-6xl md:text-7xl font-medium text-white tracking-tight leading-[0.92] mb-6">
            {getGreeting()},<br />
            {studentName}.
          </h1>

          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are we learning today?"
                className="w-full bg-[#151517] border border-white/[0.08] px-6 py-4 rounded-full text-white text-sm sm:text-base placeholder-white/30 shadow-2xl focus:outline-none focus:border-[#a78bfa] transition-all"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs font-semibold transition-all shadow-sm"
              >
                Ask AI
              </button>
            </form>
          </div>
        </section>

        {/* 2. MAIN BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* CARD 1 (SPAN 8): MULTIPLAYER ACTIVE / LIVE TOURNAMENT */}
          <div className="md:col-span-8 p-8 rounded-[32px] bg-[#151517] border border-white/[0.06] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 transition-transform hover:-translate-y-1 duration-300">
            <div className="max-w-md space-y-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                Live Quiz
              </div>
              <h2 className="font-serif-studio text-2xl sm:text-3xl text-white font-medium leading-snug">
                Host synchronized classroom battles.
              </h2>
              <p className="text-xs text-white/50 leading-relaxed">
                Host or join a live quiz room, answer questions in real time, and review results after the session.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onTabChange?.("live-quiz")}
                  className="px-6 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
                >
                  Enter Live Tournament
                </button>
              </div>
            </div>

            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#a78bfa] flex items-center justify-center font-serif-studio text-xl sm:text-2xl text-[#a78bfa] shrink-0 self-center sm:self-end">
              QUIZ
            </div>
          </div>

          {/* CARD 2 (SPAN 4): LEARNING STREAK */}
          <div className="md:col-span-4 p-8 rounded-[32px] bg-gradient-to-br from-[#1b172a] via-[#151517] to-[#151517] border border-white/[0.06] shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                Learning Streak
              </div>
              <div className="font-serif-studio text-5xl sm:text-6xl text-white my-3 leading-none">
                {streakData.currentStreak} {streakData.currentStreak === 1 ? "Day" : "Days"}
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {streakData.currentStreak === 0
                  ? "Your streak will start when real learning activity is recorded."
                  : `Your personal best is ${streakData.longestStreak} days. Keep the momentum going!`}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-[#a78bfa]">
              <span className="font-mono-studio">Active Track</span>
              <button
                onClick={() => onTabChange?.("attendance")}
                className="underline hover:text-[#c4b5fd] cursor-pointer"
              >
                View Attendance &rarr;
              </button>
            </div>
          </div>

          {/* CARD 3 (SPAN 4): CURRENT MODULE */}
          <div className="md:col-span-4 p-8 rounded-[32px] bg-[#151517] border border-white/[0.06] shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                Current Module
              </div>
              <h3 className="font-serif-studio text-2xl font-medium text-white mt-2 mb-1 truncate">
                {activeWs?.name || "No workspace selected"}
              </h3>
              <p className="text-xs text-white/50 mb-6 truncate">
                {activeWs?.detectedTopics?.[0] || (activeWs?.materials?.length ? activeWs.subject : "Upload study material to begin.")}
              </p>

              <div className="h-1 w-full bg-white/[0.06] rounded-full relative mb-6 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-[#a78bfa] rounded-full transition-all duration-500"
                  style={{ width: `${activeWs ? Math.max(0, Math.min(100, activeWs.progressPercent)) : 0}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (activeWs) {
                  handleOpenWorkspace(activeWs);
                } else if (onOpenCreateWorkspace) {
                  onOpenCreateWorkspace();
                } else {
                  onTabChange?.("workspace");
                }
              }}
              className="w-full py-2.5 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-white text-xs font-semibold transition-all cursor-pointer text-center"
            >
              Resume Studio
            </button>
          </div>

          {/* CARD 4 (SPAN 8): RECENT ASSETS */}
          <div className="md:col-span-8 p-8 rounded-[32px] bg-[#151517] border border-white/[0.06] shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-3">
                Recent Assets
              </div>

              {(() => {
                const recentMaterials = (activeWs?.materials || [])
                  .filter((material) => typeof material.content === "string" && material.content.trim().length >= 30)
                  .slice(0, 2);
                if (recentMaterials.length === 0) {
                  return (
                    <div className="py-8 text-center border border-dashed border-white/[0.1] rounded-2xl">
                      <FileText className="w-6 h-6 text-white/30 mx-auto mb-2" />
                      <p className="text-xs text-white/60">No uploaded study files yet.</p>
                      <p className="text-[10px] text-white/35 mt-1">Readable files appear here after you upload material to a workspace.</p>
                    </div>
                  );
                }
                return (
                  <div className="divide-y divide-white/[0.06]">
                    {recentMaterials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between py-3.5 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-[#a78bfa] shrink-0" />
                          <span className="text-xs sm:text-sm text-white/90 truncate">{material.name}</span>
                        </div>
                        <span className="text-[10px] font-mono-studio text-white/40 uppercase tracking-wider shrink-0 ml-4">
                          {material.size || "Size unavailable"}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={() => onTabChange?.("pdf-study")}
                className="px-5 py-2 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-white text-xs font-semibold transition-all cursor-pointer"
              >
                PDF Studio
              </button>
              <button
                onClick={() => onTabChange?.("workspace")}
                className="px-5 py-2 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* CARD 5 (SPAN 12): CAREER & PLACEMENT SUITE */}
          <div className="md:col-span-12 p-8 rounded-[32px] border border-dashed border-white/[0.12] bg-[#151517]/40 shadow-lg">
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold text-center mb-6">
              Career & Placement Suite
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div
                onClick={() => onTabChange?.("resume-builder")}
                className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer group"
              >
                <div className="text-sm font-semibold text-white group-hover:text-[#a78bfa] transition-colors mb-1">
                  Resume Builder
                </div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  ATS Optimizer
                </div>
              </div>

              <div
                onClick={() => onTabChange?.("profile-enhancer")}
                className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer group"
              >
                <div className="text-sm font-semibold text-white group-hover:text-[#a78bfa] transition-colors mb-1">
                  Profile Enhancer
                </div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  LinkedIn AI
                </div>
              </div>

              <div
                onClick={() => onTabChange?.("interview-prep")}
                className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-pointer group"
              >
                <div className="text-sm font-semibold text-white group-hover:text-[#a78bfa] transition-colors mb-1">
                  Interview Prep
                </div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                  Mock Engine
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 3. FOOTER */}
        <footer className="border-t border-white/[0.06] pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-3 font-mono-studio">
          <span>AstraMind AI Intelligence • v3.6 Flash</span>
          <span>Engineered for B.Tech Excellence</span>
          <span>2026-27 Academic Cycle</span>
        </footer>

        {/* AdSense Banner */}
        <AdSenseBanner
          id="home-bottom-ad-banner"
          slotId={ADSENSE_CONFIG.slots.homeBottomBanner}
          format="auto"
          responsive={true}
          variant="banner"
          className="w-full max-w-5xl mx-auto mt-4 px-1"
        />

      </div>
    </div>
  );
}
