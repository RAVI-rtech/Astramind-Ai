import React, { useState } from "react";
import { X, FileText, Bookmark, Download, Sparkles, Trash2, Edit3, Save } from "lucide-react";
import { NoteItem } from "./learnTypes";

interface NotesAndBookmarksModalProps {
  onClose: () => void;
  notes: NoteItem[];
  onSaveNote: (note: NoteItem) => void;
  onDeleteNote: (noteId: string) => void;
  bookmarkedCourseIds: string[];
  courseCatalogNames: Record<string, string>;
}

export default function NotesAndBookmarksModal({
  onClose,
  notes,
  onSaveNote,
  onDeleteNote,
  bookmarkedCourseIds,
  courseCatalogNames,
}: NotesAndBookmarksModalProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "bookmarks">("notes");
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(notes[0] || null);
  const [noteTitle, setNoteTitle] = useState(selectedNote?.title || "");
  const [noteContent, setNoteContent] = useState(selectedNote?.content || "");
  const [isPolishing, setIsPolishing] = useState(false);

  const handleSelectNote = (n: NoteItem) => {
    setSelectedNote(n);
    setNoteTitle(n.title);
    setNoteContent(n.content);
  };

  const handleSaveCurrentNote = () => {
    if (!selectedNote) return;
    const updated: NoteItem = {
      ...selectedNote,
      title: noteTitle || "Untitled Note",
      content: noteContent,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    onSaveNote(updated);
    setSelectedNote(updated);
  };

  const handlePolishingAI = async () => {
    if (!noteContent.trim() || isPolishing) return;
    setIsPolishing(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              sender: "user",
              text: `Polish, structure, and improve formatting for the following study notes. Make bullet points clear and correct grammar:\n\n${noteContent}`,
            },
          ],
          systemInstruction: "You are an AI note improver. Return clean Markdown formatted study notes.",
        }),
      });
      const data = await res.json();
      if (data.text) {
        setNoteContent(data.text);
      }
    } catch (e) {
      console.error("Polishing error", e);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleExportPDF = () => {
    let content = `ASTRAMIND STUDY NOTES\n\nTitle: ${noteTitle}\nCourse: ${selectedNote?.courseTitle || ""}\nDate: ${selectedNote?.updatedAt || ""}\n\n${noteContent}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${noteTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
      <div className="bg-[#0b0f24] border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#080c1d]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === "notes" ? "bg-indigo-600 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-slate-400"
              }`}
            >
              My Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === "bookmarks" ? "bg-indigo-600 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-slate-400"
              }`}
            >
              Bookmarks ({bookmarkedCourseIds.length})
            </button>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeTab === "notes" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
            {/* Notes List Sidebar */}
            <div className="md:col-span-4 bg-[#080d22] border-r border-white/10 p-3 space-y-2 overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-slate-400">All Saved Notes</span>
                <button
                  onClick={() => {
                    const newNote: NoteItem = {
                      id: `note-${Date.now()}`,
                      courseId: "general",
                      courseTitle: "General Study Note",
                      title: "New Study Note",
                      content: "",
                      updatedAt: new Date().toISOString().split("T")[0],
                    };
                    onSaveNote(newNote);
                    handleSelectNote(newNote);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
                >
                  + New Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No saved notes yet.</div>
              ) : (
                notes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleSelectNote(n)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedNote?.id === n.id ? "bg-indigo-600/20 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{n.title || "Untitled Note"}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span className="truncate">{n.courseTitle}</span>
                      <span>{n.updatedAt}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Note Editor */}
            <div className="md:col-span-8 p-4 flex flex-col space-y-3 bg-[#040612] overflow-hidden">
              {selectedNote ? (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note Title..."
                      className="bg-transparent text-base font-bold text-white outline-none flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePolishingAI}
                        disabled={isPolishing}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isPolishing ? "Polishing..." : "AI Polish"}</span>
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                        title="Export Text File"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveCurrentNote}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => {
                          onDeleteNote(selectedNote.id);
                          setSelectedNote(null);
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Type your study notes here..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-slate-200 outline-none resize-none scrollbar-thin p-1"
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  Select or create a note on the left to start editing.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* BOOKMARKS TAB */
          <div className="p-5 overflow-y-auto flex-1 space-y-3">
            <h3 className="text-sm font-bold text-white">Bookmarked Courses & Modules</h3>
            {bookmarkedCourseIds.length === 0 ? (
              <div className="p-6 bg-white/5 rounded-2xl text-center text-xs text-slate-400">
                No bookmarked courses yet. Click the bookmark icon on any course to save it here!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bookmarkedCourseIds.map((cid) => (
                  <div key={cid} className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{courseCatalogNames[cid] || cid}</span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded font-mono">Bookmarked</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
