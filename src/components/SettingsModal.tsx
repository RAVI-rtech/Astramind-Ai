import React, { useState, useEffect } from "react";
import { 
  X, 
  ArrowLeft,
  Check, 
  Laptop, 
  Moon, 
  Sun, 
  Settings as SettingsIcon, 
  Info, 
  Shield, 
  FileText, 
  User, 
  Database,
  Zap,
  Bell,
  Brain,
  Code2,
  Globe,
  Sliders,
  ChevronRight,
  LogOut,
  Edit3,
  Mail,
  Calendar,
  Sparkles,
  Award,
  CheckCircle2,
  Cpu,
  Lock,
  MessageSquare,
  Crown
} from "lucide-react";
import { Settings, Theme, AccentColor, UserProfile } from "../types";
import Logo from "./Logo";
import LocalDataCenter from "./LocalDataCenter";
import { useLanguage } from "../i18n";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  userProfile?: UserProfile | null;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  initialTab?: "profile" | "model" | "preferences" | "coding" | "notifications" | "localData" | "about" | "memory" | "settings" | "privacy" | "terms";
  isAuthenticated?: boolean;
  isLoading?: boolean;
  onSignOut?: () => void;
  onSignIn?: (profileData?: Partial<UserProfile>) => void;
  sessionsCount?: number;
  messagesCount?: number;
  filesCount?: number;
  favouriteModel?: string;
  accentColorClass?: string;
  onOpenFounder?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userProfile,
  onUpdateProfile,
  initialTab = "profile",
  isAuthenticated = false,
  isLoading = false,
  onSignOut,
  onSignIn,
  sessionsCount = 0,
  messagesCount = 0,
  filesCount = 0,
  favouriteModel = "Gemini 3.6 Flash",
  accentColorClass = "from-blue-600 to-indigo-600",
  onOpenFounder,
}: SettingsModalProps) {
  const { t, setLanguage: setI18nLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    "profile" | "model" | "preferences" | "coding" | "notifications" | "localData" | "about"
  >("profile");

  // Local state for interactive settings
  const [selectedAiModel, setSelectedAiModel] = useState<string>(
    userProfile?.defaultMode || settings.defaultMode || "Gemini 3.6 Flash"
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    userProfile?.language || settings.language || "English"
  );
  const [codingLang, setCodingLang] = useState<string>("Python");
  const [codingDifficulty, setCodingDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  
  // Notifications switches
  const [notifEmail, setNotifEmail] = useState<boolean>(true);
  const [notifUpdates, setNotifUpdates] = useState<boolean>(true);
  const [notifReminders, setNotifReminders] = useState<boolean>(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(userProfile?.name || "");
  const [profileAvatar, setProfileAvatar] = useState<string>(userProfile?.avatarUrl || "");

  useEffect(() => {
    if (initialTab === ("settings" as any)) {
      setActiveTab("preferences");
    } else if (initialTab === ("privacy" as any) || initialTab === ("terms" as any)) {
      setActiveTab("about");
    } else if (initialTab === "memory") {
      setActiveTab("profile");
    } else if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || "");
      setProfileAvatar(userProfile.avatarUrl || "");
      if (userProfile.defaultMode) setSelectedAiModel(userProfile.defaultMode);
      if (userProfile.language) setSelectedLanguage(userProfile.language);
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: profileName,
      avatarUrl: profileAvatar,
    });
    setIsEditingProfile(false);
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedAiModel(modelName);
    onUpdateSettings({ defaultMode: modelName });
    onUpdateProfile({ defaultMode: modelName });
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setI18nLanguage(lang);
    onUpdateSettings({ language: lang });
    onUpdateProfile({ language: lang });
  };

  // Apple-style Toggle Switch Component
  const AppleSwitch = ({
    checked,
    onChange,
    id
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    id: string;
  }) => (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#2563EB]" : "bg-white/10"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#09090B]/85 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      {/* Modal Container */}
      <div
        id="settings-modal-card"
        className="relative w-[92vw] max-w-4xl h-[90vh] max-h-[780px] flex flex-col md:flex-row bg-[#111214]/95 border border-white/[0.08] rounded-[24px] sm:rounded-[26px] shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-3xl font-sans text-[#F8FAFC]"
      >
        {/* Subtle Ambient Background Gradient (Apple Style) */}
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-blue-600/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[250px] bg-sky-500/5 blur-[100px] pointer-events-none rounded-full" />

        {/* SIDEBAR NAVIGATION (Desktop & Mobile Horizontal Scrollable Segmented) */}
        <div
          id="modal-sidebar-nav"
          className="w-full md:w-64 bg-[#09090B]/90 border-b md:border-b-0 md:border-r border-white/[0.08] p-2 sm:p-3 md:p-5 flex flex-row md:flex-col gap-1 sm:gap-1.5 overflow-x-auto shrink-0 z-10 scrollbar-none no-scrollbar"
        >
          {/* Header Brand Badge inside Sidebar */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-3 mb-3 border-b border-white/[0.08]">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Settings</h2>
              <p className="text-[11px] text-[#94A3B8]">AstraMind Intelligence</p>
            </div>
          </div>

          <button
            id="tab-btn-profile"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 shrink-0 md:shrink cursor-pointer ${
              activeTab === "profile"
                ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <User className="w-4 h-4 text-blue-400" />
            <span>Account Profile</span>
          </button>

          <button
            id="tab-btn-model"
            onClick={() => setActiveTab("model")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 shrink-0 md:shrink cursor-pointer ${
              activeTab === "model"
                ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>AI Model Engine</span>
          </button>

          <button
            id="tab-btn-preferences"
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 shrink-0 md:shrink cursor-pointer ${
              activeTab === "preferences"
                ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Theme &amp; Language</span>
          </button>

          <button
            id="tab-btn-coding"
            onClick={() => setActiveTab("coding")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 shrink-0 md:shrink cursor-pointer ${
              activeTab === "coding"
                ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Coding Preferences</span>
          </button>

          <button
            id="tab-btn-notifications"
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 shrink-0 md:shrink cursor-pointer ${
              activeTab === "notifications"
                ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Notifications</span>
          </button>

          <button
            id="tab-btn-localdata"
            onClick={() => setActiveTab("localData")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 shrink-0 md:shrink cursor-pointer ${
              activeTab === "localData"
                ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Storage &amp; Backup</span>
          </button>

          <button
            id="tab-btn-about"
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 shrink-0 md:shrink cursor-pointer ${
              activeTab === "about"
                ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Info className="w-4 h-4 text-[#60A5FA]" />
            <span>About &amp; Legal</span>
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div id="modal-content-area" className="flex-1 flex flex-col p-5 md:p-8 min-w-0 overflow-y-auto z-10 scrollbar-none no-scrollbar">
          
          {/* TOP HEADER */}
          <div id="modal-content-header" className="flex items-center justify-between pb-5 mb-6 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-lg font-bold text-white tracking-tight">⚡ AstraMind Settings</h2>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5 font-normal">
                Manage your account and AI preferences.
              </p>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2.5">
              {/* Profile Avatar Chip */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(userProfile?.name || "A")[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-white hidden sm:inline-block max-w-[90px] truncate">
                  {userProfile?.name || "Guest"}
                </span>
              </div>

              {/* Notification Icon */}
              <button
                type="button"
                onClick={() => setActiveTab("notifications")}
                className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#94A3B8] hover:text-white transition-all duration-200 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>

              {/* Theme Toggle Icon */}
              <button
                type="button"
                onClick={() => {
                  const nextTheme: Theme = settings.theme === "dark" ? "light" : "dark";
                  onUpdateSettings({ theme: nextTheme });
                }}
                className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#94A3B8] hover:text-white transition-all duration-200 cursor-pointer"
                title="Toggle Theme"
              >
                {settings.theme === "light" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
              </button>

              {/* Back to Chat Button */}
              <button
                id="settings-modal-back-btn"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold transition-all duration-200 cursor-pointer"
                title="Back to Chat"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Chat</span>
              </button>

              {/* Close Button */}
              <button
                id="settings-modal-close-btn"
                onClick={onClose}
                className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#94A3B8] hover:text-white transition-all duration-200 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAB 1: PROFILE / ACCOUNT CARD */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Card */}
              <div className="relative p-6 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl transition-all duration-200 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {/* Brand Logo & Avatar */}
                    <Logo variant="card" iconOnly={true} className="shrink-0" />
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {userProfile?.name || "AstraMind User"}
                        </h3>
                        {/* Plan Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
                          {userProfile?.currentPlan || userProfile?.plan || "AstraMind Pro"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-normal">
                        <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span>{userProfile?.email || "user@astramind.ai"}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-semibold text-white transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#60A5FA]" />
                    <span>{isEditingProfile ? "Cancel Edit" : "Edit Profile"}</span>
                  </button>
                </div>

                {/* Member since & Details row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-xs text-[#94A3B8] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" /> Member Since
                    </span>
                    <span className="text-xs font-medium text-white">
                      {userProfile?.memberSince || "August 2026"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-xs text-[#94A3B8] flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" /> Account Status
                    </span>
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                </div>

                {/* Edit Form */}
                {isEditingProfile && (
                  <form onSubmit={handleSaveProfileSubmit} className="pt-4 border-t border-white/[0.08] space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#94A3B8]">Display Name</label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-[#09090B] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#94A3B8]">Avatar URL</label>
                        <input
                          type="url"
                          value={profileAvatar}
                          onChange={(e) => setProfileAvatar(e.target.value)}
                          placeholder="https://example.com/avatar.png"
                          className="w-full bg-[#09090B] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-[#2563EB] hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        Save Profile
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Account Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" /> Security &amp; Auth
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Protected with end-to-end encryption. Your API keys are managed server-side.
                  </p>
                </div>

                <div className="p-5 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" /> Activity Stats
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {sessionsCount} Conversations • {messagesCount} Messages • {filesCount} Files
                  </p>
                </div>
              </div>

              {/* Sign Out Action */}
              {onSignOut && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={onSignOut}
                    className="px-5 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI MODEL SELECTOR */}
          {activeTab === "model" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Current Intelligence Model</h3>
                  <p className="text-xs text-[#94A3B8] mt-1 font-normal">
                    Select the foundational reasoning engine powering your conversations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    {
                      id: "Gemini 3.6 Flash",
                      name: "Gemini 3.6 Flash",
                      provider: "Google AI Studio",
                      desc: "Lightning-fast multimodal reasoning, coding, and live web grounding.",
                      badge: "Recommended",
                      active: selectedAiModel.includes("Gemini") || selectedAiModel.includes("Flash"),
                    },
                    {
                      id: "Claude 3.5 Sonnet",
                      name: "Claude 3.5 Sonnet",
                      provider: "Anthropic Engine",
                      desc: "Nuanced writing, complex analysis, and high-precision code syntax.",
                      badge: "Pro",
                      active: selectedAiModel.includes("Claude"),
                    },
                    {
                      id: "GPT-4o",
                      name: "GPT-4o Omni",
                      provider: "OpenAI Engine",
                      desc: "High versatility, structured data parsing, and multi-turn logic.",
                      badge: "Pro",
                      active: selectedAiModel.includes("GPT"),
                    },
                    {
                      id: "DeepSeek R1",
                      name: "DeepSeek R1",
                      provider: "DeepSeek Reasoning",
                      desc: "Advanced mathematical proofs, algorithmic search, and deep logic.",
                      badge: "Reasoning",
                      active: selectedAiModel.includes("DeepSeek"),
                    },
                  ].map((model) => (
                    <div
                      key={model.id}
                      onClick={() => handleModelSelect(model.name)}
                      className={`p-4 rounded-[18px] border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                        model.active
                          ? "bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-500/10"
                          : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{model.name}</h4>
                            {model.active && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
                          </div>
                          <span className="text-[10px] text-[#94A3B8]">{model.provider}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-semibold text-slate-300">
                          {model.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">{model.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THEME & LANGUAGE */}
          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Theme Selector */}
              <div className="p-6 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Interface Theme</h3>
                  <p className="text-xs text-[#94A3B8] mt-1">Choose your visual appearance.</p>
                </div>

                <div className="grid grid-cols-3 gap-3 p-1.5 rounded-full bg-[#09090B] border border-white/[0.08]">
                  {(["dark", "light", "system"] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => onUpdateSettings({ theme: t })}
                      className={`py-2 px-4 rounded-full text-xs font-semibold transition-all duration-200 capitalize flex items-center justify-center gap-2 cursor-pointer ${
                        settings.theme === t
                          ? "bg-[#2563EB] text-white shadow-md"
                          : "text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      {t === "dark" && <Moon className="w-3.5 h-3.5" />}
                      {t === "light" && <Sun className="w-3.5 h-3.5" />}
                      {t === "system" && <Laptop className="w-3.5 h-3.5" />}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div className="p-6 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{t("settings.primaryLanguage", "Primary Language")}</h3>
                  <p className="text-xs text-[#94A3B8] mt-1">{t("settings.languageDesc", "Select your preferred interaction language (English, Hindi, Telugu).")}</p>
                </div>

                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageSelect(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/[0.1] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
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
            </div>
          )}

          {/* TAB 5: CODING PREFERENCES */}
          {activeTab === "coding" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Programming Language</h3>
                  <p className="text-xs text-[#94A3B8] mt-1">Default language for coding tutor &amp; code generation.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {["Python", "C", "Java", "C++", "Web (JS/TS)"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodingLang(lang)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                        codingLang === lang
                          ? "bg-[#2563EB] border-[#2563EB] text-white shadow-md"
                          : "bg-white/[0.03] border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/[0.08] space-y-3">
                  <h4 className="text-xs font-bold text-white">Difficulty Level</h4>
                  <div className="grid grid-cols-3 gap-3 p-1 rounded-full bg-[#09090B] border border-white/[0.08]">
                    {(["Beginner", "Intermediate", "Advanced"] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setCodingDifficulty(diff)}
                        className={`py-2 px-3 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          codingDifficulty === diff
                            ? "bg-[#2563EB] text-white shadow-md"
                            : "text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-xs font-bold text-white">Email Notifications</h3>
                    <p className="text-[11px] text-[#94A3B8]">Receive weekly summary reports and account activity.</p>
                  </div>
                  <AppleSwitch
                    id="notif-email-switch"
                    checked={notifEmail}
                    onChange={(val) => setNotifEmail(val)}
                  />
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-xs font-bold text-white">System Updates</h3>
                    <p className="text-[11px] text-[#94A3B8]">Get notified when new AI models or features launch.</p>
                  </div>
                  <AppleSwitch
                    id="notif-updates-switch"
                    checked={notifUpdates}
                    onChange={(val) => setNotifUpdates(val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">Learning Reminders</h3>
                    <p className="text-[11px] text-[#94A3B8]">Daily study schedule reminders and flashcard goals.</p>
                  </div>
                  <AppleSwitch
                    id="notif-reminders-switch"
                    checked={notifReminders}
                    onChange={(val) => setNotifReminders(val)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LOCAL STORAGE & BACKUP */}
          {activeTab === "localData" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <LocalDataCenter />
            </div>
          )}

          {/* TAB 8: ABOUT & LEGAL */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-xs text-[#94A3B8] leading-relaxed">
              <div className="p-6 rounded-[22px] bg-white/[0.05] border border-white/[0.08] backdrop-blur-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <Logo variant="card" iconOnly={true} />
                  <div>
                    <h3 className="text-sm font-bold text-white">AstraMind AI</h3>
                    <p className="text-xs text-[#94A3B8]">Version 1.2.0-beta • Enterprise Release</p>
                  </div>
                </div>

                <p className="text-xs text-[#94A3B8]">
                  Built by <strong className="text-white">Kolloju Ravi Charan</strong>. Designed for effortless intelligence, deep learning, and privacy-first local state.
                </p>

                {/* Founder Feature Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-600/10 to-indigo-600/10 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      Meet the Founder
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      KOLLOJU RAVI CHARAN — Founder &amp; Developer of AstraMind AI
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenFounder) {
                        onOpenFounder();
                      }
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-md border border-white/10"
                  >
                    View Profile
                  </button>
                </div>

                <div className="pt-4 border-t border-white/[0.08] space-y-3">
                  <h4 className="text-xs font-bold text-white">Legal &amp; Compliance</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white">
                      <strong>Privacy Policy</strong>: Strict non-scraping guarantee.
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white">
                      <strong>Terms of Service</strong>: Fair usage &amp; developer standards.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
