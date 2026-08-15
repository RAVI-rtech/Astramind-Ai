import React, { useState } from "react";
import { History, Search, MessageSquare, Trash2, Download, Pin, Archive, Calendar, ArrowRight, Sparkles, Filter, Check } from "lucide-react";
import { ChatSession } from "../types";

interface HistoryPageProps {
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onExportSession?: (id: string, e: React.MouseEvent) => void;
  onClearAllHistory?: () => void;
}

export default function HistoryPage({
  sessions,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExportSession,
  onClearAllHistory,
}: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pinned" | "archived">("all");

  const filteredSessions = sessions.filter((session) => {
    if (activeFilter === "pinned" && !session.isPinned) return false;
    if (activeFilter === "archived" && !session.isArchived) return false;
    if (activeFilter === "all" && session.isArchived) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.messages.some((m) => m.text.toLowerCase().includes(query))
    );
  });

  return (
    <div id="history-page-container" className="flex-1 overflow-y-auto z-10 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-thin">
      
      {/* Hero Section */}
      <div className="glass-panel p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <History className="w-3.5 h-3.5" />
            <span>AstraMind Session Vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Conversational &amp; Activity History
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Review past reasoning sessions, search through chat transcripts, export conversations, and manage saved AstraMind OS history.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={onNewChat}
            className="glass-button-primary px-5 py-3 flex items-center gap-2 cursor-pointer text-sm shadow-xl shadow-purple-600/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start New Session</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search through messages, topics, and titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            All Active ({sessions.filter((s) => !s.isArchived).length})
          </button>
          <button
            onClick={() => setActiveFilter("pinned")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === "pinned"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Pinned ({sessions.filter((s) => s.isPinned).length})
          </button>
          <button
            onClick={() => setActiveFilter("archived")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === "archived"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Archived ({sessions.filter((s) => s.isArchived).length})
          </button>

          {onClearAllHistory && sessions.length > 0 && (
            <button
              onClick={onClearAllHistory}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-colors ml-auto cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Grid of Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map((session) => {
          const userMessages = session.messages.filter((m) => m.sender === "user");
          const lastMsg = session.messages[session.messages.length - 1];

          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className="glass-card p-6 flex flex-col justify-between gap-4 cursor-pointer border border-white/10 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1 shadow-xl bg-slate-900/40"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-mono font-medium text-slate-400">
                      {userMessages.length} messages
                    </span>
                  </div>
                  {session.isPinned && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300">
                      PINNED
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                  {session.title}
                </h3>

                {lastMsg && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5 font-sans">
                    "{lastMsg.text}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[10px]">
                  ID: {session.id.substring(0, 8)}...
                </span>

                <div className="flex items-center gap-1">
                  {onExportSession && (
                    <button
                      onClick={(e) => onExportSession(session.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10"
                      title="Export transcript"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 transition-colors ml-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="col-span-full glass-panel p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <History className="w-12 h-12 text-slate-500 mb-3" />
            <p className="text-sm font-semibold text-white">No history sessions found</p>
            <p className="text-xs text-slate-400 mt-1">Start a new chat to begin building your conversation vault.</p>
            <button onClick={onNewChat} className="mt-4 glass-button-primary px-4 py-2 text-xs cursor-pointer">
              Start Chat
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
