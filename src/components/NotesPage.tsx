import React, { useState, useEffect } from "react";
import { StickyNote, Plus, Search, Trash2, Edit3, Save, Sparkles, Folder, Check, Copy, Tag, Clock } from "lucide-react";
import AdSenseBanner from "./AdSenseBanner";
import { ADSENSE_CONFIG } from "../config/adsense";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  color: string;
}

interface NotesPageProps {
  accentColorClass?: string;
  onStartChat?: (prompt: string) => void;
}

export default function NotesPage({ onStartChat }: NotesPageProps) {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem("astramind_notes");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const userNotes = parsed.filter((note: Note) =>
        note && !["note-1", "note-2", "note-3"].includes(note.id)
      );
      if (userNotes.length !== parsed.length) {
        localStorage.setItem("astramind_notes", JSON.stringify(userNotes));
      }
      return userNotes;
    } catch (error) {
      console.warn("Could not load saved notes:", error);
      return [];
    }
  });
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("astramind_notes", JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const categories = ["All", "Architecture", "Interview", "System Design", "General"];

  const filteredNotes = notes.filter((n) => {
    const matchesCat = filterCategory === "All" || n.category === filterCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      content: "",
      category: "General",
      updatedAt: "Just now",
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30",
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateActiveNote = (fields: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNoteId ? { ...n, ...fields, updatedAt: "Just now" } : n))
    );
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (activeNoteId === id && updated.length > 0) {
      setActiveNoteId(updated[0].id);
    }
  };

  const handleCopyContent = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div id="notes-page-container" className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Studio Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-3">
              <StickyNote className="w-3.5 h-3.5" />
              <span>AstraMind Knowledge Base</span>
            </div>
            <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
              Smart Notes
            </h1>
            <p className="text-sm text-white/50 mt-1 font-normal tracking-wide">
              Organize lecture takeaways, code snippets, and research insights in clean studio notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNote}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Note</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Layout (Sidebar List + Editor) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Notes Navigator (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-[24px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] transition-all"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      filterCategory === cat
                        ? "bg-[#a78bfa] text-[#0d0d0e] font-semibold shadow-md shadow-[#a78bfa]/20"
                        : "bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Note List Cards */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto scrollbar-thin pr-1">
              {filteredNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-4 rounded-[20px] cursor-pointer transition-all duration-200 border ${
                      isActive
                        ? "bg-[#1a1a1d] border-[#a78bfa]/40 text-white shadow-lg shadow-black/40 scale-[1.01]"
                        : "bg-[#151517] hover:bg-[#18181b] border-white/[0.06] text-white/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-medium text-sm text-white truncate max-w-[80%]">{note.title}</h3>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="text-white/40 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-3 font-normal">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-white/40">
                      <span className="px-2 py-0.5 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/20 font-mono-studio font-medium text-[#a78bfa]">
                        {note.category}
                      </span>
                      <span className="flex items-center gap-1 font-mono-studio text-[10px]">
                        <Clock className="w-3 h-3 text-white/30" />
                        {note.updatedAt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Active Note Editor Panel (8 cols) */}
          <div className="lg:col-span-8">
            {activeNote ? (
              <div className="p-6 md:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-6 flex flex-col min-h-[580px]">
                
                {/* Header Editor Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                    placeholder="Note Title..."
                    className="bg-transparent font-serif-studio text-2xl sm:text-3xl font-medium text-white focus:outline-none focus:border-b focus:border-[#a78bfa] pb-1 w-full"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyContent}
                      className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs flex items-center gap-1.5 cursor-pointer text-white/80 transition-colors"
                      title="Copy note text"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Copied" : "Copy"}</span>
                    </button>

                  {onStartChat && (
                    <button
                      onClick={() => onStartChat(`Summarize and expand on this note:\n\nTitle: ${activeNote.title}\n\nContent:\n${activeNote.content}`)}
                      className="px-3.5 py-1.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                      <span>Ask AI to Expand</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Selector */}
              <div className="flex items-center gap-2 text-xs">
                <Tag className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="text-white/40 font-mono-studio">Category:</span>
                <select
                  value={activeNote.category}
                  onChange={(e) => handleUpdateActiveNote({ category: e.target.value })}
                  className="bg-[#151517] border border-white/[0.08] rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-[#a78bfa] cursor-pointer"
                >
                  <option value="Architecture">Architecture</option>
                  <option value="Interview">Interview</option>
                  <option value="System Design">System Design</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Content Textarea */}
              <div className="flex-1 flex flex-col">
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                  placeholder="Write note contents here..."
                  className="w-full flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] resize-none font-sans leading-relaxed scrollbar-thin"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/[0.06]">
                <span className="font-mono-studio text-[11px] text-[#a78bfa]">
                  {activeNote.content.split(/\s+/).filter(Boolean).length} words
                </span>
                <span className="font-mono-studio text-[11px] text-white/40">
                  Saved locally to AstraMind Studio
                </span>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-[28px] bg-[#151517] border border-white/[0.06] text-center text-white/40 flex flex-col items-center justify-center min-h-[400px]">
              <StickyNote className="w-10 h-10 text-white/20 mb-4" />
              <p className="text-sm font-medium text-white/60">No note selected</p>
              <button onClick={handleCreateNote} className="mt-4 px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs font-semibold cursor-pointer shadow-md transition-all">
                Create First Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. NOTES / RESOURCES — BOTTOM AD SLOT                                 */}
      {/* ===================================================================== */}
      <AdSenseBanner
        id="notes-bottom-ad-slot"
        slotId={ADSENSE_CONFIG.slots.notesBottom}
        format="auto"
        responsive={true}
        variant="banner"
        className="pt-2 sm:pt-4 w-full"
      />

    </div>
  </div>
);
}
