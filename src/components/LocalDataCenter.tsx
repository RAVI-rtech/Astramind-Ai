import React, { useState, useEffect } from "react";
import { Database, Download, Upload, Trash2, Brain, HardDrive, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { db, LocalAIMemory } from "../lib/db";
import { getLocalAIMemories, addLocalAIMemory, removeLocalAIMemory, clearAllLocalAIMemories } from "../lib/aiMemory";
import { downloadLocalBackupFile, importLocalWorkspaceJSON } from "../lib/backup";

export default function LocalDataCenter() {
  const [dbStats, setDbStats] = useState({
    sessions: 0,
    notes: 0,
    files: 0,
    resumes: 0,
    memories: 0,
  });
  const [memories, setMemories] = useState<LocalAIMemory[]>([]);
  const [newMemKey, setNewMemKey] = useState("");
  const [newMemVal, setNewMemVal] = useState("");
  const [newMemCategory, setNewMemCategory] = useState<LocalAIMemory["category"]>("personal");
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const loadStatsAndMemories = async () => {
    try {
      const sCount = await db.sessions.count();
      const nCount = await db.notes.count();
      const fCount = await db.workspaceFiles.count();
      const rCount = await db.resumes.count();
      const mCount = await db.aiMemory.count();

      setDbStats({
        sessions: sCount,
        notes: nCount,
        files: fCount,
        resumes: rCount,
        memories: mCount,
      });

      const memList = await getLocalAIMemories();
      setMemories(memList);
    } catch (err) {
      console.error("Failed loading local database statistics:", err);
    }
  };

  useEffect(() => {
    loadStatsAndMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemVal.trim()) return;

    await addLocalAIMemory(newMemKey.trim(), newMemVal.trim(), newMemCategory);
    setNewMemKey("");
    setNewMemVal("");
    setStatusMsg({ text: "AI Memory added to local IndexedDB", type: "success" });
    await loadStatsAndMemories();

    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleRemoveMemory = async (id: string) => {
    await removeLocalAIMemory(id);
    await loadStatsAndMemories();
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      await downloadLocalBackupFile();
      setStatusMsg({ text: "Local workspace backup downloaded successfully!", type: "success" });
    } catch (err: any) {
      setStatusMsg({ text: "Backup export failed: " + err.message, type: "error" });
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importLocalWorkspaceJSON(content);
        if (res.success) {
          setStatusMsg({ text: `Imported ${res.count} records into IndexedDB!`, type: "success" });
          await loadStatsAndMemories();
          window.location.reload();
        } else {
          setStatusMsg({ text: `Import error: ${res.error}`, type: "error" });
        }
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleClearDatabase = async () => {
    if (confirm("Are you sure you want to clear your local IndexedDB storage? All local chats, notes, files & memories will be reset.")) {
      await db.sessions.clear();
      await db.notes.clear();
      await db.workspaceFiles.clear();
      await db.resumes.clear();
      await db.aiMemory.clear();
      setStatusMsg({ text: "Local IndexedDB database wiped cleanly.", type: "success" });
      await loadStatsAndMemories();
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-200">
      {/* Local First Privacy Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-2">
        <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Local-First & Zero Server Database</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          Your chats, workspace documents, notes, resumes, and AI memory are stored exclusively inside your browser's <strong>IndexedDB</strong> and <strong>OPFS (Origin Private File System)</strong>. No personal data is stored on remote servers.
        </p>
      </div>

      {/* Storage Health & Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <span className="text-base font-extrabold text-indigo-400 block font-mono">{dbStats.sessions}</span>
          <span className="text-[10px] text-slate-400">Chat Threads</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <span className="text-base font-extrabold text-purple-400 block font-mono">{dbStats.notes}</span>
          <span className="text-[10px] text-slate-400">Notes & Docs</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <span className="text-base font-extrabold text-cyan-400 block font-mono">{dbStats.files}</span>
          <span className="text-[10px] text-slate-400">Local Files</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <span className="text-base font-extrabold text-emerald-400 block font-mono">{dbStats.resumes}</span>
          <span className="text-[10px] text-slate-400">Resumes</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <span className="text-base font-extrabold text-amber-400 block font-mono">{dbStats.memories}</span>
          <span className="text-[10px] text-slate-400">AI Memories</span>
        </div>
      </div>

      {/* Status Notification */}
      {statusMsg && (
        <div className={`p-3 rounded-xl flex items-center gap-2 font-medium ${
          statusMsg.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
        }`}>
          {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Local Workspace Backup & Restore */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-white text-xs">Local Backup & Restore</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting JSON..." : "Export Full Workspace (.json)"}</span>
          </button>

          <label className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-purple-400" />
            <span>{isImporting ? "Restoring..." : "Restore Backup (.json)"}</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* AI Memory Section (Stored Exclusively on Device) */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-white text-xs">Local AI Memory</h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Device-only context</span>
        </div>

        {/* Form to Add AI Memory */}
        <form onSubmit={handleAddMemory} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            placeholder="Fact / Key (e.g. Favorite Language)"
            value={newMemKey}
            onChange={(e) => setNewMemKey(e.target.value)}
            className="sm:col-span-4 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            placeholder="Value (e.g. TypeScript, React, Next.js)"
            value={newMemVal}
            onChange={(e) => setNewMemVal(e.target.value)}
            className="sm:col-span-5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="sm:col-span-3 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>+ Remember</span>
          </button>
        </form>

        {/* Memory List */}
        <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
          {memories.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic text-center py-2">
              No local memories saved yet. Add key facts above to personalize AI responses offline.
            </p>
          ) : (
            memories.map((mem) => (
              <div key={mem.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                <div>
                  <span className="font-semibold text-amber-300">{mem.key}: </span>
                  <span className="text-slate-300">{mem.value}</span>
                </div>
                <button
                  onClick={() => handleRemoveMemory(mem.id)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone: Wipe Local DB */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Need to reset all local device storage?</span>
        <button
          onClick={handleClearDatabase}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Wipe IndexedDB</span>
        </button>
      </div>
    </div>
  );
}
