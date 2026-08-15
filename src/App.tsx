import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, User, Trash2, Plus, MessageSquare, WifiOff, Gamepad2, X } from "lucide-react";
import { ChatSession, Message, Settings, Attachment, UserProfile, Theme } from "./types";
import { generateSessionToken } from "./utils/security";
import {
  supabase,
  getOrCreateSupabaseProfile,
  updateSupabaseProfile,
  handleAndLogGoogleAuthError,
  isSupabaseConfigured,
  formatMemberSince,
  getInitials,
} from "./lib/supabase";
import {
  fetchUserConversations,
  createConversation,
  saveMessage,
  updateConversationTitle,
  togglePinConversation,
  toggleArchiveConversation,
  deleteConversation,
  deleteAllUserConversations,
  generateTitleFromMessage,
  fetchUserStatistics,
  UserStatistics,
} from "./lib/supabaseChat";
import TopBar, { NavTab } from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import ChatInput from "./components/ChatInput";
import ChatWindow from "./components/ChatWindow";
import SettingsModal from "./components/SettingsModal";
import LiveVoiceModal from "./components/LiveVoiceModal";
import FounderModal from "./components/FounderModal";
import Logo from "./components/Logo";
import Login from "./components/Login";
import AuroraBackground from "./components/AuroraBackground";
import HeroLanding from "./components/HeroLanding";
import ExplorePage from "./components/ExplorePage";
import WorkspacePage from "./components/WorkspacePage";
import DashboardPage from "./components/DashboardPage";
import AIStudioPage from "./components/AIStudioPage";
import ResumeBuilderPage from "./components/ResumeBuilderPage";
import LearnPage from "./components/LearnPage";
import AIToolsPage from "./components/AIToolsPage";
import InterviewPrepPage from "./components/InterviewPrepPage";
import FounderPage from "./components/FounderPage";
import WelcomeAuthModal from "./components/WelcomeAuthModal";
import WelcomeNoticeModal from "./components/WelcomeNoticeModal";
import GuestLimitModal from "./components/GuestLimitModal";
import OfflineScreen from "./components/OfflineScreen";
import OfflineGames from "./components/OfflineGames";
import StressReliefZonePage from "./components/StressReliefZonePage";
import SearchModal from "./components/SearchModal";
import { db } from "./lib/db";
import { SearchResultItem } from "./lib/localSearch";
import { initCapacitorNativeApp, checkNetworkStatus } from "./lib/capacitor";

// Initial config presets
const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  accentColor: "blue",
  animationsEnabled: true,
  language: "English (US)",
  defaultMode: "Astra Mind 1.0",
  responseLength: "balanced",
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  autoVoiceOutput: false,
};

// Map accent IDs to actual Tailwind style classes
const ACCENT_MAP = {
  blue: {
    gradient: "from-blue-600 to-indigo-600",
    text: "text-blue-400",
    border: "border-blue-500/30",
    bgLight: "bg-blue-500/10",
  },
  purple: {
    gradient: "from-purple-600 to-pink-600",
    text: "text-purple-400",
    border: "border-purple-500/30",
    bgLight: "bg-purple-500/10",
  },
  cyan: {
    gradient: "from-cyan-500 to-blue-500",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    bgLight: "bg-cyan-500/10",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-600",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    bgLight: "bg-emerald-500/10",
  },
  rose: {
    gradient: "from-rose-500 to-red-500",
    text: "text-rose-400",
    border: "border-rose-500/30",
    bgLight: "bg-rose-500/10",
  },
};

export default function App() {
  // State Initialization
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Optimizing Response...");
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // UI States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userStats, setUserStats] = useState<UserStatistics>({
    conversations: 0,
    aiRequests: 0,
    filesAnalysed: 0,
    favouriteModel: "No activity yet",
  });
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  });
  const [redirectDestination, setRedirectDestination] = useState<string | null>(null);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isFounderOpen, setIsFounderOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"profile" | "settings" | "localData" | "about" | "privacy" | "terms">("settings");

  // Welcome & Guest Mode UI States
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isGuestLimitModalOpen, setIsGuestLimitModalOpen] = useState(false);
  const [guestAiCount, setGuestAiCount] = useState<number>(() => {
    return parseInt(localStorage.getItem("astramind_guest_ai_count") || "0", 10);
  });

  // Offline network handling
  const [isOffline, setIsOffline] = useState(false);
  const [isRetryingNetwork, setIsRetryingNetwork] = useState(false);
  const [dismissedOfflineModal, setDismissedOfflineModal] = useState(false);
  const [showGamesModal, setShowGamesModal] = useState(false);

  // Welcome Notice Popup State (24-hour preference)
  const [isWelcomeNoticeOpen, setIsWelcomeNoticeOpen] = useState<boolean>(() => {
    try {
      const hideUntil = localStorage.getItem("astramind_hide_welcome_notice_until");
      if (hideUntil) {
        const expiry = parseInt(hideUntil, 10);
        if (!isNaN(expiry) && expiry > Date.now()) {
          return false;
        }
      }
    } catch (e) {
      console.warn("Error reading welcome notice preference:", e);
    }
    return true; // default open on site load
  });

  // Initialize Capacitor Native Android features and Network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissedOfflineModal(false);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial network check
    checkNetworkStatus().then((connected) => {
      setIsOffline(!connected);
    });

    // Initialize Capacitor native plugins (Status Bar, Back Button, Splash)
    initCapacitorNativeApp({
      onBackButton: () => {
        // Dismiss active modals first if open
        if (isWelcomeNoticeOpen) {
          setIsWelcomeNoticeOpen(false);
          return true;
        }
        if (isWelcomeModalOpen) {
          setIsWelcomeModalOpen(false);
          return true;
        }
        if (isGuestLimitModalOpen) {
          setIsGuestLimitModalOpen(false);
          return true;
        }
        if (isModalOpen) {
          setIsModalOpen(false);
          handleNewChat();
          setActiveTab("chat");
          updateUrl("/", true);
          return true;
        }
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
          return true;
        }
        if (isLiveOpen) {
          setIsLiveOpen(false);
          return true;
        }
        if (isFounderOpen) {
          setIsFounderOpen(false);
          return true;
        }
        return false; // let capacitor handle standard web history back / app exit
      },
      onNetworkChange: (connected) => {
        setIsOffline(!connected);
      },
    });

    const handlePopState = () => {
      const path = normalizePath(window.location.pathname);
      setCurrentPath(path);
      if (isModalOpen || path === "/settings" || path === "/profile") {
        setIsModalOpen(false);
        handleNewChat();
        setActiveTab("chat");
        updateUrl("/", true);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isWelcomeModalOpen, isGuestLimitModalOpen, isModalOpen, isSidebarOpen, isLiveOpen, isFounderOpen]);

  const handleRetryNetwork = async () => {
    setIsRetryingNetwork(true);
    const connected = await checkNetworkStatus();
    setTimeout(() => {
      setIsOffline(!connected);
      setIsRetryingNetwork(false);
    }, 800);
  };

  const normalizePath = (path: string) => {
    return path.toLowerCase().replace(/\/$/, "") || "/";
  };

  const isProtectedRoute = (path: string) => {
    const normalized = normalizePath(path);
    return (
      normalized === "/workspace" ||
      normalized === "/profile" ||
      normalized === "/settings" ||
      normalized === "/dashboard" ||
      normalized === "/resume-builder" ||
      normalized === "/resume" ||
      normalized === "/ai-studio" ||
      normalized === "/studio" ||
      normalized === "/photo" ||
      normalized === "/image"
    );
  };

  const updateUrl = (path: string, replace = false) => {
    const normalized = normalizePath(path);
    if (window.location.pathname !== normalized) {
      if (replace) {
        window.history.replaceState({}, "", normalized);
      } else {
        window.history.pushState({}, "", normalized);
      }
    }
    setCurrentPath(normalized);
  };

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const clearUnauthenticatedSessionData = async () => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setUserProfile(null);
    setSessions([]);
    setActiveSessionId(null);
    setUserStats({
      conversations: 0,
      aiRequests: 0,
      filesAnalysed: 0,
      favouriteModel: "No activity yet",
    });

    try {
      localStorage.removeItem("astramind_auth");
      localStorage.removeItem("astramind_profile");
      localStorage.removeItem("astramind_user_profile");
      localStorage.removeItem("astramind_sessions");
      localStorage.removeItem("astramind_active_id");
      localStorage.removeItem("astramind_session_token");
      localStorage.removeItem("astramind_session_expires");
      sessionStorage.clear();
      if (db && db.userProfile) {
        await db.userProfile.clear().catch(() => {});
      }
    } catch (e) {
      console.warn("Error clearing unauthenticated session data:", e);
    }
  };

  const refreshUserStats = async (userId?: string | null) => {
    const uid = userId || currentUserId;
    if (!uid) {
      setUserStats({
        conversations: 0,
        aiRequests: 0,
        filesAnalysed: 0,
        favouriteModel: "No activity yet",
      });
      return;
    }
    const stats = await fetchUserStatistics(uid);
    setUserStats(stats);
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = normalizePath(window.location.pathname);
      setCurrentPath(path);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load state and listen to Supabase authentication session on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("astramind_settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.error("Failed to load settings from localStorage:", err);
    }

    // Check active Supabase session
    const syncSupabaseAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setCurrentUserId(session.user.id);
          localStorage.setItem("astramind_auth", "true");
          const authName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.user_metadata?.display_name;
          const authEmail = session.user.email || "";
          const authPhoto = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || session.user.user_metadata?.photoURL;
          const authMemberSince = formatMemberSince(session.user.created_at);

          const profile = await getOrCreateSupabaseProfile(
            session.user.id,
            authEmail,
            authName,
            session.user.created_at,
            authPhoto
          );
          const activeProfile: UserProfile = {
            name: profile?.name || authName || (authEmail ? authEmail.split("@")[0] : ""),
            email: authEmail || profile?.email || "",
            age: profile?.age || "",
            className: profile?.className || "",
            bio: profile?.bio || "",
            memberSince: profile?.memberSince || authMemberSince,
            plan: profile?.plan || "free",
            currentPlan: (profile?.plan || profile?.currentPlan || "").toLowerCase() === "pro" ? "AstraMind Pro" : "Free",
            defaultMode: profile?.defaultMode || "Astra Mind 1.0",
            language: profile?.language || "English (US)",
            autoMode: true,
            avatarUrl: profile?.avatarUrl || authPhoto || "",
          };
          setUserProfile(activeProfile);
          localStorage.setItem("astramind_profile", JSON.stringify(activeProfile));

          // Load user's persistent conversations and statistics from Supabase
          const [dbSessions, stats] = await Promise.all([
            fetchUserConversations(session.user.id),
            fetchUserStatistics(session.user.id),
          ]);
          setUserStats(stats);
          if (dbSessions && dbSessions.length > 0) {
            setSessions(dbSessions);
            localStorage.setItem("astramind_sessions", JSON.stringify(dbSessions));
            const savedActiveId = localStorage.getItem("astramind_active_id");
            if (savedActiveId && dbSessions.some((s) => s.id === savedActiveId)) {
              setActiveSessionId(savedActiveId);
            } else {
              setActiveSessionId(dbSessions[0].id);
              localStorage.setItem("astramind_active_id", dbSessions[0].id);
            }
          }
        } else {
          await clearUnauthenticatedSessionData();
        }
      } catch (err) {
        console.error("Error checking Supabase session:", err);
        await clearUnauthenticatedSessionData();
      } finally {
        setIsAuthChecking(false);
      }
    };

    syncSupabaseAuth();

    // Listen for auth state changes (login, logout, session refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setCurrentUserId(session.user.id);
        localStorage.setItem("astramind_auth", "true");
        const authName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.user_metadata?.display_name;
        const authEmail = session.user.email || "";
        const authPhoto = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || session.user.user_metadata?.photoURL;
        const authMemberSince = formatMemberSince(session.user.created_at);

        const profile = await getOrCreateSupabaseProfile(
          session.user.id,
          authEmail,
          authName,
          session.user.created_at,
          authPhoto
        );
        const activeProfile: UserProfile = {
          name: profile?.name || authName || (authEmail ? authEmail.split("@")[0] : ""),
          email: authEmail || profile?.email || "",
          age: profile?.age || "",
          className: profile?.className || "",
          bio: profile?.bio || "",
          memberSince: profile?.memberSince || authMemberSince,
          plan: profile?.plan || "free",
          currentPlan: (profile?.plan || profile?.currentPlan || "").toLowerCase() === "pro" ? "AstraMind Pro" : "Free",
          defaultMode: profile?.defaultMode || "Astra Mind 1.0",
          language: profile?.language || "English (US)",
          autoMode: true,
          avatarUrl: profile?.avatarUrl || authPhoto || "",
        };
        setUserProfile(activeProfile);
        localStorage.setItem("astramind_profile", JSON.stringify(activeProfile));

        // Load user's persistent conversations and stats from Supabase
        const [dbSessions, stats] = await Promise.all([
          fetchUserConversations(session.user.id),
          fetchUserStatistics(session.user.id),
        ]);
        setUserStats(stats);
        if (dbSessions) {
          setSessions(dbSessions);
          localStorage.setItem("astramind_sessions", JSON.stringify(dbSessions));
          const savedActiveId = localStorage.getItem("astramind_active_id");
          if (savedActiveId && dbSessions.some((s) => s.id === savedActiveId)) {
            setActiveSessionId(savedActiveId);
          } else if (dbSessions.length > 0) {
            setActiveSessionId(dbSessions[0].id);
            localStorage.setItem("astramind_active_id", dbSessions[0].id);
          }
        }
      } else {
        await clearUnauthenticatedSessionData();

        const path = normalizePath(window.location.pathname);
        if (isProtectedRoute(path) || event === "SIGNED_OUT") {
          if (isProtectedRoute(path)) {
            setRedirectDestination(path);
            setRedirectReason("Your session has expired. Please sign in again.");
            updateUrl("/login", true);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync route and modal states when currentPath or auth state changes
  useEffect(() => {
    if (isAuthChecking) return;

    const path = normalizePath(currentPath);

    if (isProtectedRoute(path) && !isAuthenticated) {
      setRedirectDestination(path);
      if (!redirectReason) {
        setRedirectReason(`Sign in required to access ${path}.`);
      }
      updateUrl("/login", true);
    } else if (path === "/workspace" && isAuthenticated) {
      setActiveTab("workspace");
      setIsModalOpen(false);
    } else if (path === "/profile" && isAuthenticated) {
      setModalTab("profile");
      setIsModalOpen(true);
    } else if (path === "/settings" && isAuthenticated) {
      setModalTab("settings");
      setIsModalOpen(true);
    } else if (path === "/explore") {
      setActiveTab("explore");
      setIsModalOpen(false);
    } else if (path === "/stress-relief" || path === "/offline-hub" || path === "/offline-games" || path === "/games") {
      setActiveTab("stress-relief");
      setIsModalOpen(false);
    } else if (path === "/dashboard" && isAuthenticated) {
      setActiveTab("dashboard");
      setIsModalOpen(false);
    } else if ((path === "/ai-studio" || path === "/studio" || path === "/photo" || path === "/image") && isAuthenticated) {
      setActiveTab("ai-studio");
      setIsModalOpen(false);
    } else if ((path === "/resume-builder" || path === "/resume") && isAuthenticated) {
      setActiveTab("resume-builder");
      setIsModalOpen(false);
    } else if (path === "/login" && isAuthenticated) {
      const dest = redirectDestination || "/";
      setRedirectDestination(null);
      setRedirectReason(null);
      updateUrl(dest, true);
    }
  }, [currentPath, isAuthenticated, isAuthChecking]);

  // On initial launch, if there is no authenticated user, always show the Welcome/Login modal
  useEffect(() => {
    if (isAuthChecking) return;

    if (!isAuthenticated) {
      setIsWelcomeModalOpen(true);
    } else {
      setIsWelcomeModalOpen(false);
    }
  }, [isAuthenticated, isAuthChecking]);

  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleAuthError(null);
    setIsGoogleSigningIn(true);
    try {
      if (!isSupabaseConfigured()) {
        const errObj = {
          code: "SUPABASE_NOT_CONFIGURED",
          message: "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing or set to placeholders.",
        };
        const formatted = handleAndLogGoogleAuthError(errObj);
        setGoogleAuthError(formatted.details);
        setIsGoogleSigningIn(false);
        return;
      }

      console.log("Initiating Google Sign-In via Supabase OAuth...");
      console.log("Configured Redirect URL:", window.location.origin);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        const formatted = handleAndLogGoogleAuthError(error);
        setGoogleAuthError(formatted.details);
        setIsGoogleSigningIn(false);
      } else if (data?.url) {
        console.log("Google OAuth redirect URL generated successfully:", data.url);
      }
    } catch (err: any) {
      const formatted = handleAndLogGoogleAuthError(err);
      setGoogleAuthError(formatted.details);
      setIsGoogleSigningIn(false);
    }
  };

  const handleEmailSignIn = () => {
    setIsWelcomeModalOpen(false);
    updateUrl("/login");
  };

  const handleGuestMode = () => {
    localStorage.setItem("astramind_guest_mode", "true");
    setIsWelcomeModalOpen(false);
  };

  // Day / Night Theme Management
  const isDarkMode = settings.theme !== "light";

  useEffect(() => {
    const isLight =
      settings.theme === "light" ||
      (settings.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: light)").matches);

    if (isLight) {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.body.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.body.classList.remove("light-mode");
    }
  }, [settings.theme]);

  // Save settings when changed
  const handleUpdateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("astramind_settings", JSON.stringify(updated));
  };

  const handleToggleTheme = () => {
    const nextTheme: Theme = isDarkMode ? "light" : "dark";
    handleUpdateSettings({ theme: nextTheme });
  };

  const handleUpdateProfile = (newProfile: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...newProfile };
    setUserProfile(updated);
    localStorage.setItem("astramind_profile", JSON.stringify(updated));
    if (currentUserId) {
      updateSupabaseProfile(currentUserId, updated).catch((err) => console.warn("Supabase profile sync error:", err));
    }
  };

  // Sync session changes to localStorage & IndexedDB
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem("astramind_sessions", JSON.stringify(updatedSessions));
    // Asynchronously update IndexedDB
    try {
      updatedSessions.forEach((sess) => {
        db.sessions.put(sess).catch((e) => console.warn("Dexie put session error:", e));
      });
    } catch (e) {
      console.warn("IndexedDB async sync error:", e);
    }
  };

  const handleSearchResultSelect = (item: SearchResultItem) => {
    if (item.type === "chat") {
      handleSelectSession(item.id);
    } else if (item.type === "note" || item.type === "file") {
      setActiveTab("workspace");
    } else if (item.type === "resume") {
      setActiveTab("resume-builder");
    } else if (item.type === "memory") {
      setModalTab("localData");
      setIsModalOpen(true);
    }
  };

  const handleTabChange = (tab: NavTab) => {
    const targetPath = tab === "chat" ? "/" : `/${tab}`;
    if (isProtectedRoute(targetPath) && !isAuthenticated) {
      const featureName =
        tab === "resume-builder"
          ? "ATS Resume Builder"
          : tab === "ai-studio"
          ? "AI Photo Generator"
          : tab === "workspace"
          ? "Workspace"
          : tab;
      setRedirectDestination(targetPath);
      setRedirectReason(`Sign in required to access ${featureName}.`);
      updateUrl("/login");
      return;
    }
    setActiveTab(tab);
    updateUrl(targetPath);
  };

  const handleSelectSession = (id: string) => {
    if (!isAuthenticated) {
      setRedirectDestination("/chat");
      setRedirectReason("Sign in required to access Chat History and saved sessions.");
      updateUrl("/login");
      return;
    }
    setActiveSessionId(id);
    setActiveTab("chat");
    updateUrl("/");
    localStorage.setItem("astramind_active_id", id);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setActiveTab("chat");
    localStorage.removeItem("astramind_active_id");
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUserId) {
      await deleteConversation(id);
      refreshUserStats(currentUserId);
    }
    const updated = sessions.filter((s) => s.id !== id);
    saveSessionsToStorage(updated);
    
    if (activeSessionId === id) {
      const nextActive = updated.length > 0 ? updated[0].id : null;
      setActiveSessionId(nextActive);
      if (nextActive) {
        localStorage.setItem("astramind_active_id", nextActive);
      } else {
        localStorage.removeItem("astramind_active_id");
      }
    }
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    if (currentUserId) {
      await updateConversationTitle(id, newTitle);
    }
    const updated = sessions.map(s => {
      if (s.id === id) {
        return { ...s, title: newTitle };
      }
      return s;
    });
    saveSessionsToStorage(updated);
  };

  const handlePinSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = sessions.find((s) => s.id === id);
    const nextPinned = target ? !target.isPinned : true;
    if (currentUserId) {
      await togglePinConversation(id, nextPinned);
    }
    const updated = sessions.map((s) => (s.id === id ? { ...s, isPinned: nextPinned } : s));
    saveSessionsToStorage(updated);
  };

  const handleArchiveSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = sessions.find((s) => s.id === id);
    const nextArchived = target ? !target.isArchived : true;
    if (currentUserId) {
      await toggleArchiveConversation(id, nextArchived);
    }
    const updated = sessions.map((s) => (s.id === id ? { ...s, isArchived: nextArchived } : s));
    saveSessionsToStorage(updated);
  };

  const handleExportSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSession = sessions.find((s) => s.id === id);
    if (!targetSession) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targetSession, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${targetSession.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleContinueGenerating = async () => {
    if (isLoading || !activeSessionId) return;
    await handleSendMessage("Continue generating response from where you left off.");
  };

  const handleClearAllHistory = async () => {
    if (!isAuthenticated) {
      setRedirectDestination("/");
      setRedirectReason("Sign in required to modify chat history.");
      updateUrl("/login");
      return;
    }
    if (window.confirm("Are you sure you want to delete all chat history? This action cannot be undone.")) {
      if (currentUserId) {
        await deleteAllUserConversations(currentUserId);
        refreshUserStats(currentUserId);
      }
      saveSessionsToStorage([]);
      setActiveSessionId(null);
      localStorage.removeItem("astramind_active_id");
    }
  };

  const handleOpenModal = (tab: "profile" | "settings" | "about" | "privacy" | "terms") => {
    const targetPath = (tab === "profile" || tab === "settings") ? `/${tab}` : currentPath;
    if (isProtectedRoute(targetPath) && !isAuthenticated) {
      setRedirectDestination(targetPath);
      setRedirectReason(`Sign in required to access ${targetPath}.`);
      updateUrl("/login");
      return;
    }
    setModalTab(tab);
    setIsModalOpen(true);
    if (tab === "profile" || tab === "settings") {
      updateUrl(targetPath);
    }
  };

  const handleLogin = (profileData?: Partial<UserProfile>) => {
    setIsAuthenticated(true);
    localStorage.setItem("astramind_auth", "true");
    localStorage.setItem("astramind_welcome_dismissed", "true");
    setIsWelcomeModalOpen(false);
    const token = generateSessionToken();
    localStorage.setItem("astramind_session_token", token);
    localStorage.setItem("astramind_session_expires", (Date.now() + 86400000 * 7).toString());

    if (profileData) {
      setUserProfile((prev) => {
        const updated = { ...prev, ...profileData };
        localStorage.setItem("astramind_profile", JSON.stringify(updated));
        return updated;
      });
    }

    const target = redirectDestination || "/";
    setRedirectDestination(null);
    setRedirectReason(null);

    if (target === "/workspace") {
      setActiveTab("workspace");
      setIsModalOpen(false);
    } else if (target === "/profile") {
      setModalTab("profile");
      setIsModalOpen(true);
    } else if (target === "/settings") {
      setModalTab("settings");
      setIsModalOpen(true);
    } else if (target === "/explore") {
      setActiveTab("explore");
      setIsModalOpen(false);
    } else if (target === "/dashboard") {
      setActiveTab("dashboard");
      setIsModalOpen(false);
    } else {
      setActiveTab("chat");
      setIsModalOpen(false);
    }

    updateUrl(target, true);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out from Supabase:", err);
    }
    await clearUnauthenticatedSessionData();
    setIsModalOpen(false);
    setActiveTab("chat");
    setRedirectDestination(null);
    setRedirectReason(null);
    updateUrl("/", true);
  };

  // Main chat sending/streaming logic
  const handleSendMessage = async (text: string, attachment?: Attachment, options?: { mode: string; imageSize?: string; videoAspect?: string; useMaps?: boolean }) => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const currentGuestCount = parseInt(localStorage.getItem("astramind_guest_ai_count") || "0", 10);
      if (currentGuestCount >= 5) {
        setIsGuestLimitModalOpen(true);
        return;
      }
      const newCount = currentGuestCount + 1;
      localStorage.setItem("astramind_guest_ai_count", newCount.toString());
      setGuestAiCount(newCount);
    }

    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];
    let currentSession = currentSessions.find((s) => s.id === currentSessionId);

    // Create user message
    const userMsg: Message = {
      id: "msg_user_" + Date.now(),
      sender: "user",
      text,
      timestamp: Date.now(),
      attachment,
    };

    let targetConvId = currentSessionId;

    // If no active session, bootstrap a new session with title auto-generated from first message
    if (!currentSession || !currentSessionId) {
      const generatedTitle = generateTitleFromMessage(text);
      
      // Try creating in Supabase if authenticated
      if (currentUserId) {
        const dbConv = await createConversation(currentUserId, generatedTitle);
        if (dbConv) {
          targetConvId = dbConv.id;
        }
      }

      if (!targetConvId) {
        targetConvId = "session_" + Date.now();
      }

      currentSessionId = targetConvId;
      currentSession = {
        id: currentSessionId,
        title: generatedTitle,
        messages: [userMsg],
        lastUpdated: Date.now(),
      };
      currentSessions = [currentSession, ...currentSessions];
      setActiveSessionId(currentSessionId);
      localStorage.setItem("astramind_active_id", currentSessionId);
    } else {
      currentSession.messages = [...currentSession.messages, userMsg];
      currentSession.lastUpdated = Date.now();
    }

    // Persist user message in Supabase
    if (currentUserId && currentSessionId) {
      saveMessage(currentSessionId, "user", text, options?.mode || "Astra Mind 1.0", attachment).then(() => {
        refreshUserStats(currentUserId);
      });
    }

    saveSessionsToStorage(currentSessions);

    setIsLoading(true);
    setStatusMessage("Optimizing Response...");
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const aiMsgId = "msg_ai_" + Date.now();
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: "assistant",
      text: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    currentSession.messages = [...currentSession.messages, initialAiMsg];
    setSessions([...currentSessions]);

    try {
      if (options?.mode === 'image') {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, size: options.imageSize })
        });
        const data = await res.json();
        const responseText = "Here is your generated image:";
        
        if (currentUserId && currentSessionId) {
          saveMessage(currentSessionId, "assistant", responseText, "Image Model");
        }

        setSessions(prev => {
          const finalized = prev.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: s.messages.map(m => {
                  if (m.id === aiMsgId) {
                    return { ...m, isStreaming: false, text: responseText, generatedImage: data.imageUri || data.imageUrl };
                  }
                  return m;
                })
              };
            }
            return s;
          });
          localStorage.setItem("astramind_sessions", JSON.stringify(finalized));
          return finalized;
        });
        setIsLoading(false);
        return;
      }

      if (options?.mode === 'video') {
        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, aspectRatio: options.videoAspect })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        const operationName = data.operationName;
        
        setSessions(prev => prev.map(s => s.id === currentSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === aiMsgId ? { ...m, generatedVideo: { operationName, status: 'processing' }, text: "Video generation started..." } : m)
        } : s));

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/video-status?operationName=${encodeURIComponent(operationName)}`);
            const statusData = await statusRes.json();
            
            if (statusData.state === 'SUCCEEDED') {
              clearInterval(pollInterval);
              const dlRes = await fetch(`/api/video-download?operationName=${encodeURIComponent(operationName)}`);
              const dlData = await dlRes.json();
              const videoText = "Your video is ready!";

              if (currentUserId && currentSessionId) {
                saveMessage(currentSessionId, "assistant", videoText, "Video Model");
              }
              
              setSessions(prev => {
                const finalized = prev.map(s => s.id === currentSessionId ? {
                  ...s,
                  messages: s.messages.map(m => m.id === aiMsgId ? { 
                    ...m, 
                    isStreaming: false, 
                    text: videoText, 
                    generatedVideo: { uri: dlData.videoUri, operationName, status: 'done' } 
                  } : m)
                } : s);
                localStorage.setItem("astramind_sessions", JSON.stringify(finalized));
                return finalized;
              });
              setIsLoading(false);
            } else if (statusData.state === 'FAILED') {
              clearInterval(pollInterval);
              setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                ...s,
                messages: s.messages.map(m => m.id === aiMsgId ? { ...m, isStreaming: false, text: "Video generation failed." } : m)
              } : s));
              setIsLoading(false);
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }, 5000);
        
        return;
      }

      // Default Chat logic
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: options?.mode,
          messages: currentSession.messages
            .filter((m) => m.id !== aiMsgId)
            .map((m) => ({
              sender: m.sender,
              text: m.text,
              attachment: m.attachment ? {
                name: m.attachment.name,
                type: m.attachment.type,
                base64: m.attachment.base64,
              } : undefined,
            })),
          useMapsGrounding: options?.useMaps,
          systemInstruction: `You are AstraMind AI, an ultra-premium, elegant, and highly advanced digital mind. 
            Provide responses formatted in beautiful, elegant Markdown. Wrap code in blocks, use bullet points, and maintain a highly structured layout. 
            Your creator is Ravi charan. Mention his name appropriately if asked about your creator or origins.
            Provide summarized, concise answers for any questions. Avoid long paragraphs unless explicitly required by the user's prompt. 
            Never mention Google, Gemini, or version numbers like 3.5. You are AstraMind AI.`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("Body reader unavailable");

      let fullAiText = "";
      let partialChunk = "";
      let lastGroundingChunks: any[] | undefined = undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        partialChunk += chunkText;
        const lines = partialChunk.split("\n");
        partialChunk = lines.pop() || ""; 

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.providerSwitch || parsed.statusMessage) {
                setStatusMessage("Switching Intelligence...");
                setTimeout(() => {
                  setStatusMessage("Optimizing Response...");
                }, 800);
              } else if (parsed.groundingChunks) {
                lastGroundingChunks = parsed.groundingChunks;
              } else if (parsed.text) {
                fullAiText += parsed.text;
                setSessions((prevSessions) => {
                  return prevSessions.map((s) => {
                    if (s.id === currentSessionId) {
                      return {
                        ...s,
                        messages: s.messages.map((m) => {
                          if (m.id === aiMsgId) {
                            return { ...m, text: fullAiText, groundingChunks: lastGroundingChunks };
                          }
                          return m;
                        }),
                      };
                    }
                    return s;
                  });
                });
              }
            } catch (err) {}
          }
        }
      }

      const finalResponseText = fullAiText || "All AI providers are temporarily unavailable. Please try again in a few moments.";

      if (currentUserId && currentSessionId) {
        saveMessage(currentSessionId, "assistant", finalResponseText, options?.mode || "Astra Mind 1.0").then(() => {
          refreshUserStats(currentUserId);
        });
      }

      setSessions((prevSessions) => {
        const finalized = prevSessions.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map((m) => {
                if (m.id === aiMsgId) {
                  return { ...m, isStreaming: false, text: finalResponseText, groundingChunks: lastGroundingChunks };
                }
                return m;
              }),
            };
          }
          return s;
        });
        localStorage.setItem("astramind_sessions", JSON.stringify(finalized));
        return finalized;
      });
    } catch (error: any) {
      console.error("Failed to fetch stream:", error);
      setSessions((prevSessions) => {
        const errorSessions = prevSessions.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map((m) => {
                if (m.id === aiMsgId) {
                  return { ...m, isStreaming: false, text: "All AI providers are temporarily unavailable. Please try again in a few moments." };
                }
                return m;
              }),
            };
          }
          return s;
        });
        localStorage.setItem("astramind_sessions", JSON.stringify(errorSessions));
        return errorSessions;
      });
    } finally {
      if (options?.mode !== 'video') {
        setIsLoading(false);
      }
    }
  };

  const handleRegenerate = async () => {
    if (!activeSessionId || isLoading) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession || currentSession.messages.length < 2) return;

    const poppedMessages = currentSession.messages.filter((m, i) => {
      const isLast = i === currentSession.messages.length - 1;
      return !(isLast && m.sender === "assistant");
    });

    const updatedSession = {
      ...currentSession,
      messages: poppedMessages,
    };

    const updatedSessions = sessions.map((s) => (s.id === activeSessionId ? updatedSession : s));
    setSessions(updatedSessions);

    const lastUserMsg = poppedMessages.filter((m) => m.sender === "user").pop();
    if (lastUserMsg) {
      const cleanedSession = {
        ...updatedSession,
        messages: poppedMessages.filter((m) => m.id !== lastUserMsg.id),
      };
      const cleanedSessions = sessions.map((s) => (s.id === activeSessionId ? cleanedSession : s));
      setSessions(cleanedSessions);
      
      await handleSendMessage(lastUserMsg.text, lastUserMsg.attachment);
    }
  };

  const handleEditMessage = async (msgId: string, newText: string) => {
    if (isLoading || !activeSessionId) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    const msgIndex = currentSession.messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    const poppedMessages = currentSession.messages.slice(0, msgIndex);
    const msgToEdit = currentSession.messages[msgIndex];
    
    const updatedSession = {
      ...currentSession,
      messages: poppedMessages,
    };

    const updatedSessions = sessions.map((s) => (s.id === activeSessionId ? updatedSession : s));
    setSessions(updatedSessions);
    
    await handleSendMessage(newText, msgToEdit.attachment);
  };

  // Get dynamic accent classes
  const activeAccent = ACCENT_MAP[settings.accentColor] || ACCENT_MAP.blue;

  // Dynamic user statistics calculations
  const totalConversationsCount = userStats.conversations > 0 ? userStats.conversations : sessions.length;
  const totalMessagesCount = userStats.aiRequests > 0
    ? userStats.aiRequests
    : sessions.reduce((acc, s) => acc + s.messages.filter((m) => m.sender === "user").length, 0);
  const totalFilesCount = userStats.filesAnalysed > 0
    ? userStats.filesAnalysed
    : sessions.flatMap((s) => s.messages.filter((m) => m.attachment)).length;

  // 1. Initial Session Verification Screen (Prevents protected page flash)
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="z-10 flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <Logo variant="splash" />
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium font-mono pt-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Authenticating Session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Login View (If on /login route or attempting to access protected route unauthenticated)
  if (currentPath === "/login" || (!isAuthenticated && isProtectedRoute(currentPath))) {
    return (
      <Login
        onLogin={handleLogin}
        accentColorClass={activeAccent.gradient}
        redirectReason={redirectReason}
        onCancel={() => {
          setRedirectDestination(null);
          setRedirectReason(null);
          updateUrl("/", true);
          setActiveTab("chat");
        }}
      />
    );
  }

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const hasMessages = currentSession && currentSession.messages.length > 0;

  return (
    <div
      id="astramind-root"
      className="min-h-screen flex flex-col font-sans bg-[#030712] text-slate-100 relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white"
    >
      {/* Aurora Animated Moving Gradient Background */}
      <AuroraBackground isLightMode={!isDarkMode} />

      {/* Offline Mode Top Status Banner */}
      {isOffline && dismissedOfflineModal && (
        <div className="fixed top-0 inset-x-0 z-50 bg-[#0d1229] border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between text-amber-300 font-medium shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>You're Offline — Viewing & editing local data enabled. AI responses require internet.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGamesModal(true)}
              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Offline Games</span>
            </button>
            <button
              onClick={() => setDismissedOfflineModal(false)}
              className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
            >
              Offline Screen
            </button>
          </div>
        </div>
      )}

      {/* Transparent Floating Top Bar Navigation */}
      <TopBar
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onProfileClick={() => handleOpenModal("profile")}
        onOpenSettings={() => handleOpenModal("settings")}
        onOpenFounder={() => setIsFounderOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        accentColorClass={activeAccent.gradient}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleTheme}
      />

      {/* Main Workspace Layout (Sidebar + Tab Pages) */}
      <div id="astramind-workspace" className="flex-1 flex overflow-hidden relative z-10 pt-16">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onOpenModal={handleOpenModal}
          onOpenFounder={() => setIsFounderOpen(true)}
          onOpenCodingTutor={() => handleTabChange("coding")}
          onOpenLearn={() => handleTabChange("learn")}
          onOpenAIStudio={() => handleTabChange("ai-studio")}
          onOpenResumeBuilder={() => handleTabChange("resume-builder")}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onPinSession={handlePinSession}
          onArchiveSession={handleArchiveSession}
          onExportSession={handleExportSession}
          onClearAllHistory={handleClearAllHistory}
          accentColorClass={activeAccent.gradient}
          userProfile={userProfile}
          isAuthenticated={isAuthenticated}
        />

        {/* Dynamic Workspace Panel based on activeTab */}
        <main id="main-chat-panel" className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          
          {activeTab === "ai-tools" && (
            <div className="flex-1 overflow-y-auto z-10 scrollbar-thin">
              <AIToolsPage
                onNavigateTab={(tab) => handleTabChange(tab)}
                onStartChat={(prompt) => {
                  handleNewChat();
                  setActiveTab("chat");
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("astramind-set-prompt", { detail: prompt }));
                  }, 50);
                }}
              />
            </div>
          )}

          {activeTab === "interview-prep" && (
            <div className="flex-1 overflow-y-auto z-10 scrollbar-thin">
              <InterviewPrepPage
                onStartChat={(prompt) => {
                  handleNewChat();
                  setActiveTab("chat");
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("astramind-set-prompt", { detail: prompt }));
                  }, 50);
                }}
              />
            </div>
          )}

          {activeTab === "founder" && (
            <div className="flex-1 overflow-y-auto z-10 scrollbar-thin">
              <FounderPage />
            </div>
          )}

          {activeTab === "learn" && (
            <div className="flex-1 overflow-y-auto z-10 scrollbar-thin">
              <LearnPage
                accentColorClass={activeAccent.gradient}
                onOpenResumeBuilder={() => handleTabChange("resume-builder")}
                onStartChat={(prompt) => {
                  handleNewChat();
                  setActiveTab("chat");
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("astramind-set-prompt", { detail: prompt }));
                  }, 50);
                }}
              />
            </div>
          )}

          {activeTab === "ai-studio" && (
            <div className="flex-1 overflow-y-auto z-10 scrollbar-thin">
              <AIStudioPage
                currentUserId={currentUserId}
                accentColorClass={activeAccent.gradient}
              />
            </div>
          )}

          {activeTab === "resume-builder" && (
            <div className="flex-1 overflow-y-auto z-10 scrollbar-thin">
              <ResumeBuilderPage
                accentColorClass={activeAccent.gradient}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}

          {activeTab === "stress-relief" && (
            <div className="flex-1 overflow-y-auto z-10 scrollbar-thin">
              <StressReliefZonePage />
            </div>
          )}
          
          {activeTab === "explore" && (
            <ExplorePage
              onSelectPrompt={(prompt) => {
                handleNewChat();
                setActiveTab("chat");
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("astramind-set-prompt", { detail: prompt }));
                }, 50);
              }}
              onOpenResumeBuilder={() => handleTabChange("resume-builder")}
              accentColorClass={activeAccent.gradient}
            />
          )}

          {activeTab === "workspace" && (
            <WorkspacePage
              sessions={sessions}
              onOpenResumeBuilder={() => handleTabChange("resume-builder")}
              onFileClick={(attachment) => {
                handleNewChat();
                setActiveTab("chat");
                handleSendMessage(`Analyze file: ${attachment.name}`, attachment);
              }}
              onUploadAndChat={(attachment) => {
                handleNewChat();
                setActiveTab("chat");
                handleSendMessage(`Analyze uploaded file: ${attachment.name}`, attachment);
              }}
              onSelectPrompt={(prompt) => {
                handleNewChat();
                setActiveTab("chat");
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("astramind-set-prompt", { detail: prompt }));
                }, 50);
              }}
              accentColorClass={activeAccent.gradient}
            />
          )}

          {activeTab === "dashboard" && (
            <DashboardPage
              sessions={sessions}
              userProfile={userProfile}
              isAuthenticated={isAuthenticated}
              settings={settings}
              accentColorClass={activeAccent.gradient}
              onSelectSession={(id) => {
                handleSelectSession(id);
                setActiveTab("chat");
              }}
              onNewChat={() => {
                handleNewChat();
                setActiveTab("chat");
              }}
              onOpenSettings={() => handleOpenModal("settings")}
              userStats={userStats}
            />
          )}

          {activeTab === "chat" && (
            hasMessages ? (
              /* Active Chat Session View */
              <div id="active-chat-container" className="flex-1 flex flex-col overflow-hidden z-10">
                <ChatWindow
                  messages={currentSession.messages}
                  isLoading={isLoading}
                  statusMessage={statusMessage}
                  onRegenerate={handleRegenerate}
                  onStopGeneration={handleStopGeneration}
                  onContinueGenerating={handleContinueGenerating}
                  onEditMessage={handleEditMessage}
                  accentColorClass={activeAccent.gradient}
                />
                <ChatInput
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  onStopGeneration={handleStopGeneration}
                  variant="sticky"
                  accentColorClass={activeAccent.gradient}
                  onOpenLive={() => setIsLiveOpen(true)}
                />
              </div>
            ) : (
              /* Hero Landing Page View */
              <div id="hero-landing-container" className="flex-1 overflow-y-auto z-10 scrollbar-thin">
                <HeroLanding
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  userProfile={userProfile}
                  isAuthenticated={isAuthenticated}
                  accentColorClass={activeAccent.gradient}
                  onOpenLive={() => setIsLiveOpen(true)}
                  onOpenSettings={() => handleOpenModal("settings")}
                  onOpenFounder={() => setIsFounderOpen(true)}
                  onStartChatting={() => {
                    const inputEl = document.getElementById("chat-textarea-box");
                    if (inputEl) inputEl.focus();
                  }}
                />
              </div>
            )
          )}

        </main>
      </div>

      {/* Global Config Dialog Panel */}
      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          handleNewChat();
          setActiveTab("chat");
          updateUrl("/", true);
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        initialTab={modalTab}
        isAuthenticated={isAuthenticated}
        isLoading={isAuthChecking}
        onSignOut={handleSignOut}
        onSignIn={() => {
          setRedirectDestination(currentPath);
          setRedirectReason("Please sign in to access your profile and settings.");
          updateUrl("/login");
          setIsModalOpen(false);
        }}
        sessionsCount={totalConversationsCount}
        messagesCount={totalMessagesCount}
        filesCount={totalFilesCount}
        favouriteModel={userStats.favouriteModel}
        accentColorClass={activeAccent.gradient}
        onOpenFounder={() => handleTabChange("founder")}
      />
      <LiveVoiceModal isOpen={isLiveOpen} onClose={() => setIsLiveOpen(false)} accentColorClass={activeAccent.gradient} />
      <FounderModal isOpen={isFounderOpen} onClose={() => setIsFounderOpen(false)} accentColorClass={activeAccent.gradient} />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResultSelect}
      />

      {/* Welcome / About AstraMind AI Popup Modal */}
      <WelcomeNoticeModal
        isOpen={isWelcomeNoticeOpen}
        onClose={() => setIsWelcomeNoticeOpen(false)}
        onLearnMore={() => {
          setIsWelcomeNoticeOpen(false);
          handleTabChange("founder");
        }}
      />
      
      {/* Professional Welcome Authentication Modal */}
      <WelcomeAuthModal
        isOpen={isWelcomeModalOpen}
        onClose={handleGuestMode}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onGuestMode={handleGuestMode}
        accentColorClass={activeAccent.gradient}
        authError={googleAuthError}
        isLoading={isGoogleSigningIn}
      />

      {/* Guest Mode Limit Modal */}
      <GuestLimitModal
        isOpen={isGuestLimitModalOpen}
        onClose={() => setIsGuestLimitModalOpen(false)}
        onSignIn={() => {
          setIsGuestLimitModalOpen(false);
          updateUrl("/login");
        }}
        limit={5}
      />

      {/* Professional Offline Network Screen */}
      {isOffline && !dismissedOfflineModal && (
        <OfflineScreen
          onRetry={handleRetryNetwork}
          isRetrying={isRetryingNetwork}
          onContinueOffline={() => setDismissedOfflineModal(true)}
        />
      )}

      {/* Standalone Offline Games Modal */}
      {showGamesModal && (
        <div className="fixed inset-0 z-[9999] bg-[#050816]/95 backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto my-auto space-y-4">
            <div className="flex items-center justify-between bg-[#0a0e24] p-4 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 text-white font-black text-lg">
                <Gamepad2 className="w-6 h-6 text-indigo-400" />
                <span>Offline Games Arcade</span>
              </div>
              <button
                onClick={() => setShowGamesModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <OfflineGames />
          </div>
        </div>
      )}
    </div>
  );
}
