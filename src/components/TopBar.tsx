import React, { useEffect, useState } from "react";
import { 
  Menu, 
  Settings as SettingsIcon, 
  Search, 
  Bell, 
  Sparkles, 
  Sun, 
  Moon, 
  ChevronDown, 
  Check, 
  Command,
  Crown,
  User
} from "lucide-react";
import Logo from "./Logo";
import { UserProfile } from "../types";
import { getInitials, isProUser } from "../lib/supabase";
import { useLanguage } from "../i18n";

export type NavTab = 
  | "dashboard" 
  | "chat" 
  | "resume-builder" 
  | "notes" 
  | "ai-tools" 
  | "interview-prep" 
  | "workspace" 
  | "history" 
  | "settings" 
  | "founder"
  | "coding"
  | "learn"
  | "ai-studio"
  | "explore"
  | "offline-hub"
  | "stress-relief";

interface TopBarProps {
  onMenuToggle: () => void;
  onProfileClick: () => void;
  onOpenSettings: () => void;
  onOpenFounder?: () => void;
  onSignInClick?: () => void;
  onOpenSearch?: () => void;
  userProfile?: UserProfile;
  isAuthenticated?: boolean;
  accentColorClass: string;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function TopBar({
  onMenuToggle,
  onProfileClick,
  onOpenSettings,
  onOpenSearch,
  userProfile,
  isAuthenticated = true,
  accentColorClass,
  activeTab = "dashboard",
  onTabChange,
  isDarkMode: propIsDarkMode,
  onToggleDarkMode,
}: TopBarProps) {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini 3.6 Flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [internalDarkMode, setInternalDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : internalDarkMode;

  const aiModels = [
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", speed: "Optimal Speed & Reasoning", badge: "Default" },
    { id: "astramind-deep", name: "AstraMind Deep 3.0", speed: "Complex Reasoning & Math", badge: "Deep Think" },
    { id: "astramind-ultra", name: "AstraMind Ultra 1.5", speed: "Multimodal & Vision", badge: "Ultra" },
  ];

  const notifications = [
    { id: 1, title: "System Update", desc: "AstraMind Deep Reasoning v3.0 is now live.", time: "10m ago", unread: true },
    { id: 2, title: "Resume ATS Analysis", desc: "Your software engineer resume score is 94/100.", time: "1h ago", unread: true },
    { id: 3, title: "Storage Alert", desc: "1.2 GB of 10 GB workspace storage utilized.", time: "1d ago", unread: false },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (onOpenSearch) onOpenSearch();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenSearch]);

  const userInitials = (isAuthenticated && userProfile?.name)
    ? userProfile.name.substring(0, 2).toUpperCase()
    : null;

  return (
    <header
      id="astramind-fixed-topbar"
      className="fixed top-0 left-0 right-0 z-40 w-full px-3 md:px-6 py-2.5 pointer-events-none"
    >
      <div
        className={`max-w-[1400px] mx-auto flex items-center justify-between px-3 md:px-4 h-14 rounded-2xl transition-all duration-300 pointer-events-auto border ${
          isScrolled
            ? "bg-[#060914]/90 backdrop-blur-2xl border-purple-500/25 shadow-2xl shadow-purple-950/40"
            : "bg-[#080d1e]/70 backdrop-blur-xl border-white/10 shadow-xl shadow-black/50"
        }`}
      >
        {/* Left Section: Mobile Menu Toggle & AstraMind Logo */}
        <div id="topbar-left-wrapper" className="flex items-center gap-3">
          <button
            id="topbar-hamburger-btn"
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => onTabChange?.("dashboard")} 
            className="cursor-pointer flex items-center gap-2"
          >
            <Logo />
            {isAuthenticated ? (
              isProUser(userProfile) ? (
                <span className="hidden sm:inline-block text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  PRO
                </span>
              ) : (
                <span className="hidden sm:inline-block text-[10px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-700/80 border border-slate-600/50 text-slate-300">
                  FREE
                </span>
              )
            ) : null}
          </div>
        </div>

        {/* Center Section: Global Search Bar */}
        <div 
          onClick={onOpenSearch}
          className="hidden md:flex items-center relative w-full max-w-sm mx-4 cursor-pointer"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            readOnly
            placeholder={t("header.searchPlaceholder", "Search anything, ask AI, or jump to page...")}
            onClick={onOpenSearch}
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-1.5 pl-10 pr-12 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all cursor-pointer"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>

        {/* Right Section: Mobile Search, AI Model Selector, Notifications, Theme Switch, Avatar */}
        <div id="topbar-right-wrapper" className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-slate-300" />
          </button>

          {/* Current AI Model Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 min-h-[44px] rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="hidden lg:inline">{selectedModel}</span>
              <span className="lg:hidden text-[11px] font-mono">Flash</span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[85vw] rounded-2xl bg-[#090d1f] border border-purple-500/30 shadow-2xl p-2 z-50 backdrop-blur-2xl space-y-1">
                <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Select AI Engine
                </div>
                {aiModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.name);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      selectedModel === m.name
                        ? "bg-purple-600/30 text-white border border-purple-500/40"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.speed}</p>
                    </div>
                    {selectedModel === m.name && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Switch Toggle */}
          <button
            onClick={() => {
              if (onToggleDarkMode) {
                onToggleDarkMode();
              } else {
                setInternalDarkMode(!internalDarkMode);
              }
            }}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isDarkMode ? "Switch to Day Mode (Light Theme)" : "Switch to Night Mode (Dark Theme)"}
          >
            {isDarkMode ? <Moon className="w-4 h-4 text-purple-300" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>

          {/* User Avatar Button */}
          <button
            id="topbar-profile-btn"
            onClick={onProfileClick}
            className="group flex items-center gap-2 px-2 sm:px-2.5 py-1.5 min-h-[44px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-purple-900/50 overflow-hidden shrink-0">
              {isAuthenticated && userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : isAuthenticated ? (
                getInitials(userProfile?.name, userProfile?.email)
              ) : (
                <User className="w-4 h-4 text-slate-300" />
              )}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden sm:inline">
              {isAuthenticated ? (userProfile?.name ? userProfile.name.split(" ")[0] : userProfile?.email ? userProfile.email.split("@")[0] : "Profile") : "Sign in"}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}



