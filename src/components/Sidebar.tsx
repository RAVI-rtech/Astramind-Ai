import React, { useState } from "react";
import { 
  Home,
  MessageSquare, 
  GraduationCap,
  StickyNote,
  FileText,
  Code2,
  Sparkles,
  FolderKanban,
  History,
  Settings as SettingsIcon,
  Crown,
  Search,
  HardDrive,
  X,
  Plus,
  Trash2,
  Pencil,
  Check,
  Pin,
  Archive,
  Download,
  FolderArchive,
  User,
  Gamepad2,
  Brain
} from "lucide-react";
import { ChatSession, UserProfile } from "../types";
import Logo from "./Logo";
import { NavTab } from "./TopBar";
import { getInitials, isProUser } from "../lib/supabase";
import { useLanguage } from "../i18n";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenModal: (modalType: "profile" | "settings" | "about" | "privacy" | "terms") => void;
  onOpenFounder?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onPinSession?: (id: string, e: React.MouseEvent) => void;
  onArchiveSession?: (id: string, e: React.MouseEvent) => void;
  onExportSession?: (id: string, e: React.MouseEvent) => void;
  onOpenCodingTutor?: () => void;
  onOpenLearn?: () => void;
  onOpenAIStudio?: () => void;
  onOpenResumeBuilder?: () => void;
  onClearAllHistory: () => void;
  accentColorClass: string;
  userProfile?: UserProfile | null;
  isAuthenticated?: boolean;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  activeTab,
  onTabChange,
  onSelectSession,
  onNewChat,
  onOpenModal,
  onOpenFounder,
  isOpen,
  onClose,
  onDeleteSession,
  onRenameSession,
  onPinSession,
  onArchiveSession,
  onExportSession,
  onClearAllHistory,
  accentColorClass,
  userProfile,
  isAuthenticated = false,
}: SidebarProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Navigation Items according to exact requirements
  const mainNavItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "chat", label: t("nav.newChat", "AI Chat"), icon: MessageSquare },
    { id: "learn", label: t("nav.learn", "AI Tutor"), icon: GraduationCap },
    { id: "resume-builder", label: t("nav.resumeBuilder", "Resume Builder"), icon: FileText, badge: "ATS" },
    { id: "ai-studio", label: t("nav.aiStudio", "Image Generator"), icon: Sparkles },
    { id: "stress-relief", label: "Stress Relief Zone", icon: Brain, badge: "Games" },
    { id: "workspace", label: t("nav.workspace", "Workspace"), icon: FolderKanban },
    { id: "settings", label: t("nav.settings", "Settings"), icon: SettingsIcon },
  ];

  // Filter sessions
  const visibleSessions = sessions.filter((session) => {
    const isArchivedMatch = showArchived ? !!session.isArchived : !session.isArchived;
    if (!isArchivedMatch) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = session.title.toLowerCase().includes(query);
    const messageMatch = session.messages.some((m) => m.text.toLowerCase().includes(query));
    return titleMatch || messageMatch;
  });

  const pinnedSessions = visibleSessions.filter((s) => s.isPinned);
  const recentSessions = visibleSessions.filter((s) => !s.isPinned);
  const archivedCount = sessions.filter((s) => s.isArchived).length;

  const userInitials = (isAuthenticated && userProfile?.name)
    ? userProfile.name.substring(0, 2).toUpperCase()
    : null;

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId && activeTab === "chat";
    return (
      <div
        key={session.id}
        id={`session-item-${session.id}`}
        onClick={() => {
          onTabChange("chat");
          onSelectSession(session.id);
          onClose();
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-xs font-medium ${
          isActive
            ? "bg-purple-600/25 border border-purple-500/40 text-white shadow-md shadow-purple-950/40"
            : "text-slate-400 hover:bg-white/5 border border-transparent hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden pr-16 w-full">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-purple-400" : "text-slate-500"}`} />
          {editingSessionId === session.id ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  if (onRenameSession && editTitle.trim()) {
                    onRenameSession(session.id, editTitle.trim());
                  }
                  setEditingSessionId(null);
                } else if (e.key === 'Escape') {
                  setEditingSessionId(null);
                }
              }}
              className="w-full bg-slate-900 border border-purple-500 rounded px-2 py-0.5 text-white text-xs outline-none"
            />
          ) : (
            <span className="truncate">{session.title}</span>
          )}
        </div>

        {/* Actions wrapper */}
        <div className="absolute right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 bg-[#080d22]/90 backdrop-blur-md px-1 py-0.5 rounded-lg border border-white/10 shadow-lg">
          {editingSessionId === session.id ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRenameSession && editTitle.trim()) {
                  onRenameSession(session.id, editTitle.trim());
                }
                setEditingSessionId(null);
              }}
              className="p-1 rounded text-emerald-400 hover:bg-white/10"
              title="Save Title"
            >
              <Check className="w-3 h-3" />
            </button>
          ) : (
            <>
              {onPinSession && (
                <button
                  onClick={(e) => onPinSession(session.id, e)}
                  className={`p-1 rounded transition-colors ${
                    session.isPinned ? "text-amber-400" : "text-slate-400 hover:text-amber-300"
                  }`}
                  title={session.isPinned ? "Unpin Chat" : "Pin Chat"}
                >
                  <Pin className="w-3 h-3" />
                </button>
              )}
              {onArchiveSession && (
                <button
                  onClick={(e) => onArchiveSession(session.id, e)}
                  className="p-1 rounded text-slate-400 hover:text-purple-300"
                  title={session.isArchived ? "Unarchive" : "Archive"}
                >
                  <Archive className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="p-1 rounded text-slate-400 hover:text-rose-400"
                title="Delete Chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="sidebar-container"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[82vw] max-w-[300px] sm:w-72 bg-[#080c18]/90 backdrop-blur-2xl border-r border-white/10 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header with AstraMind Logo */}
        <div id="sidebar-header" className="flex items-center justify-between p-4 sm:p-5 pb-3">
          <Logo variant="sidebar" />
          <button
            id="sidebar-close-btn"
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden cursor-pointer"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Primary Button */}
        <div className="px-4 py-2">
          <button
            onClick={() => {
              onTabChange("chat");
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-purple-600/30 transition-all cursor-pointer border border-white/20 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{t("nav.newChat", "New Session")}</span>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-2 space-y-0.5 overflow-y-auto max-h-[42vh] scrollbar-thin">
          <p className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            {t("nav.navigation", "Navigation")}
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer group ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600/35 to-indigo-600/25 border border-purple-500/40 text-white shadow-md shadow-purple-950/30 font-bold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-purple-300" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border ${
                    isActive 
                      ? "bg-purple-500/30 border-purple-400/40 text-purple-200" 
                      : "bg-white/5 border-white/10 text-slate-400"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Recent History Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-white/5 space-y-2 scrollbar-thin">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              {showArchived ? "Archived Chats" : "Recent History"}
            </span>
            {sessions.length > 0 && !showArchived && (
              <button
                onClick={onClearAllHistory}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-mono transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {pinnedSessions.length > 0 && !showArchived && (
            <div className="space-y-1">
              {pinnedSessions.map(renderSessionItem)}
            </div>
          )}

          <div className="space-y-1">
            {recentSessions.slice(0, 6).map(renderSessionItem)}
          </div>
        </div>

        {/* Bottom Area: Golden Meet the Founder & User Profile */}
        <div id="sidebar-bottom-area" className="p-3 border-t border-white/10 space-y-2.5 bg-black/20">
          
          {/* Golden Meet the Founder Option */}
          <button
            onClick={() => {
              onTabChange("founder");
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === "founder"
                ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/20"
                : "bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 hover:from-amber-500/25 hover:to-amber-500/20 border-amber-500/40 text-amber-300 hover:text-amber-200 shadow-md shadow-amber-950/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30" />
              <span>{t("nav.founder", "Meet the Founder")}</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* User Profile Card & Subscription Badge */}
          <div 
            onClick={() => onOpenModal("profile")}
            className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-purple-900/50 shrink-0 overflow-hidden">
                {isAuthenticated && userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : isAuthenticated ? (
                  getInitials(userProfile?.name, userProfile?.email)
                ) : (
                  <User className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-purple-200 transition-colors">
                  {isAuthenticated ? (userProfile?.name || userProfile?.email?.split("@")[0] || "User") : "Guest"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAuthenticated ? (
                    isProUser(userProfile) ? (
                      <>
                        <Crown className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                        <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-tight">
                          AstraMind Pro
                        </span>
                      </>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/80 border border-slate-600/50 text-slate-300 text-[9px] font-mono font-bold uppercase tracking-wider">
                        FREE
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      Sign in to continue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}


