import React, { useState } from "react";
import { motion } from "motion/react";
import { WifiOff, RefreshCw, Gamepad2, Layout, BookOpen, FileText, Code, CheckCircle, ArrowRight } from "lucide-react";
import OfflineGames from "./OfflineGames";

interface OfflineScreenProps {
  onRetry?: () => void;
  isRetrying?: boolean;
  onContinueOffline?: () => void;
}

export default function OfflineScreen({ onRetry, isRetrying = false, onContinueOffline }: OfflineScreenProps) {
  const [activeTab, setActiveTab] = useState<"games" | "local">("games");

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050816]/95 text-white flex flex-col p-4 sm:p-6 overflow-y-auto select-none backdrop-blur-2xl">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl mx-auto my-auto space-y-6">
        
        {/* Top Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0e24]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
              <WifiOff className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                You're Offline
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                While we reconnect, enjoy these offline activities.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                <span>{isRetrying ? "Reconnecting..." : "Retry Connection"}</span>
              </button>

              {onContinueOffline && (
                <button
                  onClick={onContinueOffline}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Continue in App (Offline Local Mode)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Section Navigation */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setActiveTab("games")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "games"
                ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Offline Games</span>
          </button>

          <button
            onClick={() => setActiveTab("local")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeTab === "local"
                ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Local Viewing & Editing</span>
          </button>
        </div>

        {/* Content Body */}
        {activeTab === "games" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <OfflineGames />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0c102b]/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl text-slate-200"
          >
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Full Local Availability</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                AstraMind automatically caches your saved work locally. You can browse, create, and edit all your items without internet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>AI Tutor</span>
                </div>
                <p className="text-xs text-slate-300">
                  Read past lesson logs, code exercises, and notes offline.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Resume Builder</span>
                </div>
                <p className="text-xs text-slate-300">
                  Edit resume fields, change templates, and export PDF locally.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Notes & Documents</span>
                </div>
                <p className="text-xs text-slate-300">
                  Create new notes, organize code snippets, and edit existing files offline.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Code className="w-4 h-4" />
                  <span>Workspace & Code Editor</span>
                </div>
                <p className="text-xs text-slate-300">
                  Write, format, and save local code projects in your browser storage.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onContinueOffline}
                className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
              >
                Open Workspace Offline
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
