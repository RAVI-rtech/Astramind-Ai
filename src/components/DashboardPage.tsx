import React, { useState } from "react";
import { 
  Search, 
  GraduationCap, 
  FileText, 
  BookOpen, 
  Compass, 
  Briefcase, 
  Code2, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { ChatSession, UserProfile, Settings } from "../types";
import { NavTab } from "./TopBar";
import { useLanguage } from "../i18n";

interface DashboardPageProps {
  sessions?: ChatSession[];
  userProfile?: UserProfile | null;
  isAuthenticated?: boolean;
  settings?: Settings;
  accentColorClass?: string;
  onSelectSession?: (id: string) => void;
  onNewChat: () => void;
  onTabChange?: (tab: NavTab) => void;
  onOpenVoiceModal?: () => void;
  onOpenSettings?: () => void;
  userStats?: any;
}

export default function DashboardPage({
  userProfile,
  isAuthenticated = false,
  onNewChat,
  onTabChange
}: DashboardPageProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const userName = (isAuthenticated && userProfile?.name) ? userProfile.name : "";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      onNewChat();
      return;
    }
    onNewChat();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("astramind-set-prompt", { detail: searchQuery.trim() }));
    }, 60);
  };

  const featureCards = [
    {
      id: "learn",
      tab: "learn" as NavTab,
      title: "AI Tutor",
      description: "Personalized step-by-step guidance, concept explanations, and study assistance.",
      icon: GraduationCap,
      color: "from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20",
    },
    {
      id: "resume-builder",
      tab: "resume-builder" as NavTab,
      title: "Resume Builder",
      description: "Craft ATS-friendly professional resumes with real-time score optimization.",
      icon: FileText,
      color: "from-sky-500/20 to-blue-600/10 text-sky-400 border-sky-500/20",
    },
    {
      id: "notes",
      tab: "notes" as NavTab,
      title: "AI Notes",
      description: "Summarize lectures, organize key insights, and auto-generate flashcards.",
      icon: BookOpen,
      color: "from-blue-600/20 to-indigo-600/10 text-blue-300 border-blue-400/20",
    },
    {
      id: "roadmaps",
      tab: "learn" as NavTab,
      title: "Roadmaps",
      description: "Structured learning paths for Python, Web Dev, DSA, AI & Data Structures.",
      icon: Compass,
      color: "from-cyan-500/20 to-blue-500/10 text-cyan-300 border-cyan-500/20",
    },
    {
      id: "interview-prep",
      tab: "interview-prep" as NavTab,
      title: "Interview Prep",
      description: "Mock technical interviews with instant feedback on speed & accuracy.",
      icon: Briefcase,
      color: "from-indigo-500/20 to-blue-500/10 text-indigo-300 border-indigo-500/20",
    },
    {
      id: "coding",
      tab: "coding" as NavTab,
      title: "Coding Practice",
      description: "Interactive coding environment with real-time linting, debugging, and hints.",
      icon: Code2,
      color: "from-blue-500/20 to-sky-500/10 text-blue-400 border-blue-500/20",
    },
  ];

  return (
    <div id="home-page-container" className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-6 sm:py-10 max-w-5xl mx-auto w-full flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
      
      {/* HERO SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full text-center space-y-3 sm:space-y-4 mb-6 sm:mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>AstraMind Intelligence Hub</span>
        </div>

        <h1 className="text-[26px] sm:text-[34px] md:text-[42px] font-bold text-white tracking-tight leading-tight">
          {t("dashboard.welcome", "Welcome back")}{userName ? `, ${userName}` : ""}
        </h1>

        <p className="text-[16px] sm:text-[20px] md:text-[24px] text-[#A1A1AA] font-normal max-w-xl mx-auto">
          {t("dashboard.subtitle", "What would you like to learn today?")}
        </p>
      </motion.div>

      {/* LARGE GLASS SEARCH BAR */}
      <motion.form 
        onSubmit={handleSearchSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mb-8 sm:mb-12 relative group"
      >
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 sm:left-5 text-[#A1A1AA] group-focus-within:text-blue-400 transition-colors pointer-events-none">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("dashboard.askAnything", "Ask anything...")}
            className="w-full pl-10 sm:pl-13 pr-24 sm:pr-32 py-3.5 sm:py-4 rounded-[20px] sm:rounded-[24px] bg-[#111827]/80 backdrop-blur-2xl border border-white/10 text-white placeholder-[#A1A1AA] text-sm sm:text-base focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/15 transition-all outline-none shadow-2xl"
          />

          <button
            type="submit"
            className="absolute right-1.5 sm:right-2 px-3.5 sm:px-5 py-2 sm:py-2.5 min-h-[44px] rounded-[16px] sm:rounded-[18px] bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
          >
            <span>{t("dashboard.askBtn", "Ask")}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </motion.form>

      {/* FEATURE CARDS GRID */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6"
      >
        {featureCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              onClick={() => {
                if (onTabChange) {
                  onTabChange(card.tab);
                } else {
                  onNewChat();
                }
              }}
              className="p-4 sm:p-6 rounded-[20px] sm:rounded-[26px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] hover:border-blue-500/30 hover:bg-white/[0.07] transition-all cursor-pointer group flex flex-col justify-between space-y-3 sm:space-y-4 shadow-xl"
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${card.color} border flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-[16px] sm:text-[18px] font-semibold text-white tracking-tight flex items-center justify-between">
                    <span>{card.title}</span>
                    <ArrowRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-blue-400 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#A1A1AA] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

    </div>
  );
}

