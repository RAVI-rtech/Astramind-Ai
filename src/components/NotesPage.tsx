import React, { useState, useEffect } from "react";
import { StickyNote, Plus, Search, Trash2, Edit3, Save, Sparkles, Folder, Check, Copy, Tag, Clock } from "lucide-react";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  color: string;
}

const DEFAULT_NOTES: Note[] = [
  {
    id: "note-1",
    title: "AI Operating System Architecture Notes",
    content: "Key principles for AstraMind OS:\n- Glassmorphic translucent surface cards with 24px corner radii\n- Multi-threaded reasoning with instant streaming feedback\n- Local-first caching with secure encrypted Cloud persistence\n- Voice input & TTS multimodal integration",
    category: "Architecture",
    updatedAt: "Today, 2:45 PM",
    color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30",
  },
  {
    id: "note-2",
    title: "Technical Interview Questions & Cheat Sheet",
    content: "1. Explain event loop microtasks vs macrotasks in Node.js\n2. How to implement lazy client initialization for API keys\n3. CSS glassmorphism performance optimization via hardware-accelerated transforms",
    category: "Interview",
    updatedAt: "Yesterday, 6:12 PM",
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
  },
  {
    id: "note-3",
    title: "System Design Blueprint - Microservices & Redis",
    content: "Use redis pub/sub for instant sync across worker nodes. Deploy edge reverse proxy listening exclusively on container port 3000.",
    category: "System Design",
    updatedAt: "3 days ago",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  },
];

interface NotesPageProps {
  accentColorClass?: string;
  onStartChat?: (prompt: string) => void;
}

export default function NotesPage({ onStartChat }: NotesPageProps) {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("astramind_notes");
    return saved ? JSON.parse(saved) : DEFAULT_NOTES;
  });
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("astramind_notes", JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

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
      content: "Type your notes here or request AstraMind AI to auto-generate summary...",
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
    <div id="notes-page-container" className="flex-1 overflow-y-auto z-10 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-thin">
      
      {/* Vision Pro Glassmorphism Hero Section */}
      <div className="glass-panel p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <StickyNote className="w-3.5 h-3.5" />
            <span>AstraMind AI Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Smart AI Notes &amp; Ideas Scratchpad
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Organize thoughts, research insights, code snippets, and interview prep in floating translucent cards powered by AstraMind AI.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={handleCreateNote}
            className="glass-button-primary px-5 py-3 flex items-center gap-2 cursor-pointer text-sm shadow-xl shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Note</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar List + Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Notes Navigator (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-4 space-y-3 border border-white/10">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterCategory === cat
                      ? "bg-purple-600/80 text-white shadow-md shadow-purple-500/20"
                      : "bg-white/5 text-slate-400 hover:text-white"
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
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/50 text-white shadow-lg shadow-purple-950/40 scale-[1.01]"
                      : "bg-slate-900/40 hover:bg-slate-800/50 border-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-sm text-white truncate max-w-[80%]">{note.title}</h3>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono font-medium text-purple-300">
                      {note.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
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
            <div className="glass-panel p-6 md:p-8 space-y-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30 flex flex-col min-h-[580px]">
              
              {/* Header Editor Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  placeholder="Note Title..."
                  className="bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b focus:border-purple-500/50 pb-1 w-full"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyContent}
                    className="glass-button-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Copy note text"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>

                  {onStartChat && (
                    <button
                      onClick={() => onStartChat(`Summarize and expand on this note:\n\nTitle: ${activeNote.title}\n\nContent:\n${activeNote.content}`)}
                      className="glass-button-primary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask AI to Expand</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Selector */}
              <div className="flex items-center gap-2 text-xs">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400 font-mono">Category:</span>
                <select
                  value={activeNote.category}
                  onChange={(e) => handleUpdateActiveNote({ category: e.target.value })}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:border-purple-500/50"
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
                  className="w-full flex-1 bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none font-sans leading-relaxed scrollbar-thin"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
                <span className="font-mono text-[11px] text-purple-300">
                  {activeNote.content.split(/\s+/).filter(Boolean).length} words
                </span>
                <span className="font-mono text-[11px]">
                  Saved locally to AstraMind OS
                </span>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
              <StickyNote className="w-12 h-12 text-slate-500 mb-4 animate-bounce" />
              <p className="text-sm font-semibold">No note selected</p>
              <button onClick={handleCreateNote} className="mt-4 glass-button-primary px-4 py-2 text-xs cursor-pointer">
                Create First Note
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
