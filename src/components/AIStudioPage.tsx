import React, { useState, useEffect } from "react";
import { Sparkles, Wand2, Image as ImageIcon, Trash2, Download, Copy, Check, Maximize2, Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import AIImageGenerator from "./AIImageGenerator";
import AIImageEditor from "./AIImageEditor";
import {
  ImageStudioItem,
  fetchUserImageHistory,
  deleteImageFromHistory,
} from "../lib/imageStudio";

interface AIStudioPageProps {
  currentUserId?: string | null;
  accentColorClass: string;
}

export type AIStudioSubTab = "generator" | "editor" | "gallery";

export default function AIStudioPage({
  currentUserId,
  accentColorClass,
}: AIStudioPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<AIStudioSubTab>("generator");
  const [history, setHistory] = useState<ImageStudioItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // States passed to Editor if "Edit image" is triggered from Generator or Gallery
  const [editorInitialImage, setEditorInitialImage] = useState<string | null>(null);
  const [editorInitialPrompt, setEditorInitialPrompt] = useState<string>("");

  // Gallery search & filter
  const [galleryQuery, setGalleryQuery] = useState("");
  const [galleryTypeFilter, setGalleryTypeFilter] = useState<"all" | "generator" | "editor">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showNotification = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const items = await fetchUserImageHistory(currentUserId);
      setHistory(items);
    } catch (err) {
      console.error("[AI Studio] Error loading history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUserId]);

  const handleSendToEditor = (imageUrl: string, prompt?: string) => {
    setEditorInitialImage(imageUrl);
    if (prompt) setEditorInitialPrompt(`Enhance image: ${prompt}`);
    setActiveSubTab("editor");
  };

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteImageFromHistory(id, currentUserId);
      await loadHistory();
      showNotification("success", "Image deleted successfully from history and storage.");
    } catch (err: any) {
      console.error("[AI Studio Gallery] Delete error:", err);
      showNotification("error", err?.message || "Failed to delete image.");
    }
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `AstraMind_AI_${prompt.slice(0, 20).replace(/[^a-z0-9]/gi, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredGallery = history.filter((item) => {
    if (galleryTypeFilter !== "all" && item.type !== galleryTypeFilter) return false;
    if (!galleryQuery.trim()) return true;
    const q = galleryQuery.toLowerCase();
    return item.prompt.toLowerCase().includes(q) || (item.style && item.style.toLowerCase().includes(q));
  });

  return (
    <div id="ai-studio-page-wrapper" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      {/* TOP NAVIGATION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">AstraMind AI Studio</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generative AI Visual Creation &amp; Image Transformation Engine
          </p>
        </div>

        {/* SubTab Toggle Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <button
            id="subtab-generator-btn"
            onClick={() => setActiveSubTab("generator")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "generator"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Image Generator</span>
          </button>

          <button
            id="subtab-editor-btn"
            onClick={() => setActiveSubTab("editor")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "editor"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Image Editor</span>
          </button>

          <button
            id="subtab-gallery-btn"
            onClick={() => setActiveSubTab("gallery")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "gallery"
                ? "bg-white/15 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>My History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/80 border-red-500/40 text-red-200"
          }`}
        >
          <span>{notification.msg}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white ml-2 text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB CONTENT VIEWS */}
      {activeSubTab === "generator" && (
        <AIImageGenerator
          currentUserId={currentUserId}
          history={history}
          onHistoryUpdated={loadHistory}
          onSendToEditor={handleSendToEditor}
          accentColorClass={accentColorClass}
        />
      )}

      {activeSubTab === "editor" && (
        <AIImageEditor
          currentUserId={currentUserId}
          history={history}
          initialImage={editorInitialImage}
          initialPrompt={editorInitialPrompt}
          onHistoryUpdated={loadHistory}
          accentColorClass={accentColorClass}
        />
      )}

      {activeSubTab === "gallery" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Gallery Filter & Search Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#070b1a]/80 border border-white/10 backdrop-blur-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={galleryQuery}
                onChange={(e) => setGalleryQuery(e.target.value)}
                placeholder="Search history by prompt or style..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </span>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
                {(["all", "generator", "editor"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setGalleryTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                      galleryTypeFilter === type
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery Items Grid */}
          {isLoadingHistory ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
              <p className="text-xs font-mono">Loading user image history...</p>
            </div>
          ) : filteredGallery.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3 bg-[#070b1a]/40 rounded-3xl border border-white/5">
              <ImageIcon className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-white">No images found in history</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {galleryQuery
                  ? "No creations match your search query."
                  : "Generate or edit images using AstraMind AI Studio to save them here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-3xl overflow-hidden bg-[#070b1a] border border-white/10 hover:border-blue-500/50 transition-all shadow-xl flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-950">
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-white border border-white/10">
                      {item.type === "editor" ? "🪄 EDIT" : "🎨 GENERATED"}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                      <button
                        onClick={() => setPreviewModalUrl(item.imageUrl)}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
                        title="View Fullsize"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(item.imageUrl, item.prompt)}
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                        title="Download Image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendToEditor(item.imageUrl, item.prompt)}
                        className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                        title="Edit in Image Editor"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                        title="Delete from History"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 bg-white/[0.02]">
                    <p className="text-xs text-slate-200 line-clamp-2 italic">"{item.prompt}"</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
                      <span>{item.style?.split(" ")[1] || "Default"}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULLSIZE PREVIEW MODAL */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black">
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <img
              src={previewModalUrl}
              alt="Full Preview"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
