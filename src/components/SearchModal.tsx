import React, { useState, useEffect } from "react";
import { Search, X, MessageSquare, FileText, Briefcase, HardDrive, Brain, ArrowRight, Sparkles } from "lucide-react";
import { searchLocalDatabase, SearchResultItem } from "../lib/localSearch";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (item: SearchResultItem) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectResult }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "chat" | "note" | "resume" | "file" | "memory">("all");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        const res = await searchLocalDatabase(query);
        setResults(res);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Handle ESC key or keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredResults = activeFilter === "all" ? results : results.filter((r) => r.type === activeFilter);

  const getItemIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case "note":
        return <FileText className="w-4 h-4 text-purple-400" />;
      case "resume":
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case "file":
        return <HardDrive className="w-4 h-4 text-cyan-400" />;
      case "memory":
        return <Brain className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0b0f24]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search local chats, notes, resumes, workspace files, AI memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          {(["all", "chat", "note", "resume", "file", "memory"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-xl capitalize font-medium transition-all cursor-pointer ${
                activeFilter === filter
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {isSearching ? (
            <p className="text-xs text-slate-400 text-center py-6">Searching local IndexedDB index...</p>
          ) : query && filteredResults.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No matching local records found for "{query}".</p>
          ) : !query ? (
            <div className="text-center py-8 space-y-2">
              <Brain className="w-8 h-8 text-indigo-400/50 mx-auto" />
              <p className="text-xs text-slate-400">Type to search your offline IndexedDB database instantly.</p>
            </div>
          ) : (
            filteredResults.map((item) => (
              <button
                key={`${item.type}_${item.id}`}
                onClick={() => {
                  onSelectResult(item);
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-left flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-white/5 shrink-0 mt-0.5">{getItemIcon(item.type)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 uppercase font-mono">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.snippet}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Local IndexedDB Instant Search</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
