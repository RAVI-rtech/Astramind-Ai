import React, { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Upload,
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  Sliders,
  Image as ImageIcon,
  Zap,
  Edit3,
  RefreshCw,
  Info,
  ArrowRightLeft,
  Columns,
  Layers,
  Split,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  ImageStudioItem,
  IMAGE_PROVIDERS,
  apiEditImage,
  apiCheckImageModelsStatus,
  saveImageToHistory,
  deleteImageFromHistory,
} from "../lib/imageStudio";

interface AIImageEditorProps {
  currentUserId?: string | null;
  history: ImageStudioItem[];
  initialImage?: string | null;
  initialPrompt?: string;
  onHistoryUpdated: () => void;
  accentColorClass: string;
}

const EDIT_PRESETS = [
  "Add glowing cyan cyberpunk holographic visor & neon lighting",
  "Transform background into a serene golden hour sunset beach",
  "Convert character and scene into a vibrant anime illustration",
  "Add warm cinematic volumetric lighting and soft lens flare",
  "Add a glowing magical aura with floating starry dust particles",
  "Change atmosphere to a rainy futuristic cybernetic city at night",
];

export default function AIImageEditor({
  currentUserId,
  history,
  initialImage,
  initialPrompt,
  onHistoryUpdated,
  accentColorClass,
}: AIImageEditorProps) {
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage || null);
  const [editPrompt, setEditPrompt] = useState(initialPrompt || "");
  const [selectedProvider, setSelectedProvider] = useState("astramind-vision-pro");
  const [isEditing, setIsEditing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const [editedResult, setEditedResult] = useState<ImageStudioItem | null>(null);

  // Comparison view settings
  const [viewMode, setViewMode] = useState<"slider" | "side">("slider");
  const [sliderPos, setSliderPos] = useState(50); // 0% to 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isModelUnavailable, setIsModelUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(null);

  useEffect(() => {
    apiCheckImageModelsStatus().then((status) => {
      if (!status.available) {
        setIsModelUnavailable(true);
        setUnavailableMessage(status.message || "Image editing is unavailable with your current API configuration.");
      }
    });
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const handleDeleteImage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteImageFromHistory(id, currentUserId);
      if (editedResult?.id === id) {
        setEditedResult(null);
      }
      onHistoryUpdated();
      showToast("success", "Edited image deleted successfully from history.");
    } catch (err: any) {
      console.error("[AI Image Editor] Delete error:", err);
      showToast("error", err?.message || "Failed to delete image.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSourceImage(event.target.result as string);
        setEditedResult(null);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSourceImage(event.target.result as string);
          setEditedResult(null);
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditGenerate = async () => {
    if (isModelUnavailable) {
      setErrorMsg(unavailableMessage || "Image editing is currently unavailable with your API configuration. No supported image models were found.");
      return;
    }
    if (!sourceImage) {
      setErrorMsg("Please upload or select an image to edit.");
      return;
    }
    if (!editPrompt.trim()) {
      setErrorMsg("Please enter editing instructions.");
      return;
    }

    setErrorMsg(null);
    setIsEditing(true);
    setProgressPercent(15);
    setProgressStep("Generating image...");

    const t1 = setTimeout(() => {
      setProgressPercent(45);
      setProgressStep("Generating image...");
    }, 2000);

    const t2 = setTimeout(() => {
      setProgressPercent(80);
      setProgressStep("Trying another provider...");
    }, 5000);

    try {
      const resultUrl = await apiEditImage(
        {
          prompt: editPrompt.trim(),
          image: sourceImage,
          providerId: selectedProvider,
        },
        (statusText) => {
          setProgressStep(statusText);
        }
      );

      clearTimeout(t1);
      clearTimeout(t2);

      setProgressPercent(95);
      setProgressStep("Finalizing comparison render...");

      const savedItem = await saveImageToHistory({
        userId: currentUserId,
        type: "editor",
        prompt: editPrompt.trim(),
        imageUrl: resultUrl,
        originalImageUrl: sourceImage,
        providerId: selectedProvider,
      });

      setProgressPercent(100);
      setEditedResult(savedItem);
      onHistoryUpdated();
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      console.error("Image editing error:", err);
      setErrorMsg("Image generation is currently unavailable. Please try again later.");
    } finally {
      setIsEditing(false);
    }
  };

  // Slider Mouse/Touch Handler
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `AstraMind_Edited_Image_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const editorHistory = history.filter((item) => item.type === "editor");

  return (
    <div id="ai-image-editor-container" className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-slate-900 border border-purple-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium">
            <Edit3 className="w-3.5 h-3.5" />
            <span>AstraMind AI Studio • Generative Image Editor</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AI Image Editor
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Modify existing photos or generated images using natural language instructions. Add elements, alter lighting, transform art styles, and compare before &amp; after results with an interactive split slider.
          </p>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
            toastMsg.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/80 border-red-500/40 text-red-200"
          }`}
        >
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="text-white/60 hover:text-white ml-2 text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN EDITING WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SOURCE UPLOAD & EDIT PROMPT (5 cols) */}
        <div className="lg:col-span-5 space-y-6 p-6 rounded-3xl bg-[#070b1a]/80 border border-white/10 backdrop-blur-xl shadow-xl">
          {/* Upload Image Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-2 uppercase tracking-wider font-semibold">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Source Image</span>
              </label>
              {sourceImage && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  Change Image
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {sourceImage ? (
              <div className="relative group rounded-2xl overflow-hidden border border-white/15 bg-black/50">
                <img
                  src={sourceImage}
                  alt="Source"
                  referrerPolicy="no-referrer"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Replace Image
                  </button>
                  <button
                    onClick={() => {
                      setSourceImage(null);
                      setEditedResult(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="w-full py-10 px-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/50 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Click or drag &amp; drop an image here</p>
                  <p className="text-[11px] text-slate-400 font-mono">PNG, JPG, or WEBP supported</p>
                </div>
              </div>
            )}

            {/* Select from existing gallery shortcut */}
            {history.length > 0 && !sourceImage && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-400">Or pick from recent creations:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {history.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSourceImage(item.imageUrl)}
                      className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500 transition-all shrink-0 cursor-pointer"
                    >
                      <img src={item.imageUrl} alt="Thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Editing Prompt Section */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-slate-300 flex items-center gap-2 uppercase tracking-wider font-semibold">
              <Wand2 className="w-4 h-4 text-amber-400" />
              <span>Editing Instructions</span>
            </label>
            <textarea
              id="editor-prompt-input"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Describe what to modify (e.g. Add glowing cybernetic goggles, change lighting to warm golden hour sunset...)"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
            />

            {/* Edit Prompt Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Quick Edit Instructions:</span>
              <div className="flex flex-wrap gap-1.5">
                {EDIT_PRESETS.slice(0, 3).map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setEditPrompt(preset)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors truncate max-w-[240px] text-left cursor-pointer"
                  >
                    "{preset.slice(0, 30)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Engine Provider */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <label className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Image Provider</span>
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {IMAGE_PROVIDERS.filter((p) => p.supportsEditing).map((prov) => (
                <option key={prov.id} value={prov.id} className="bg-slate-900 text-white">
                  {prov.name} ({prov.badge}) — {prov.description}
                </option>
              ))}
            </select>
          </div>

          {/* UNAVAILABLE MODEL WARNING ALERT */}
          {isModelUnavailable && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-100">Image Editing Unavailable</p>
                <p className="mt-0.5 text-amber-300/80 leading-relaxed">
                  {unavailableMessage || "Image editing is currently unavailable with your API configuration. No supported image models were found for this API key."}
                </p>
              </div>
            </div>
          )}

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
          )}

          {/* GENERATE EDITED IMAGE BUTTON */}
          <div className="space-y-3 pt-2">
            <button
              id="generate-edit-image-btn"
              onClick={handleEditGenerate}
              disabled={!sourceImage || !editPrompt.trim() || isEditing || isModelUnavailable}
              className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer ${
                !sourceImage || !editPrompt.trim() || isEditing || isModelUnavailable
                  ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60"
                  : `bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:brightness-110 shadow-purple-500/20 active:scale-[0.99]`
              }`}
            >
              {isEditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Edits... ({progressPercent}%)</span>
                </>
              ) : isModelUnavailable ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Image Editing Unavailable</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-purple-300" />
                  <span>Generate AstraMind Edited Image</span>
                </>
              )}
            </button>

            {/* Dynamic Progress Bar */}
            {isEditing && (
              <div className="space-y-2 p-4 rounded-2xl bg-black/50 border border-purple-500/30 animate-pulse">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-2 text-purple-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    {progressStep}
                  </span>
                  <span className="text-white font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BEFORE / AFTER INTERACTIVE COMPARISON (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-[#070b1a]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col h-full min-h-[420px]">
            {/* Header & View Mode Switcher */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-300 flex items-center gap-2 uppercase tracking-wider font-semibold">
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                <span>Before &amp; After Comparison</span>
              </span>

              {editedResult && (
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setViewMode("slider")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                      viewMode === "slider" ? "bg-purple-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Split Slider</span>
                  </button>
                  <button
                    onClick={() => setViewMode("side")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                      viewMode === "side" ? "bg-purple-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Side by Side</span>
                  </button>
                </div>
              )}
            </div>

            {/* MAIN COMPARISON STAGE */}
            <div className="flex-1 flex flex-col justify-center items-center">
              {isEditing ? (
                <div className="w-full aspect-video rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center animate-spin">
                    <Wand2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Applying Generative Edits</p>
                    <p className="text-xs text-slate-400 font-mono">{progressStep}</p>
                  </div>
                </div>
              ) : editedResult && sourceImage ? (
                <div className="w-full space-y-4">
                  {/* SLIDER VIEW MODE */}
                  {viewMode === "slider" ? (
                    <div className="space-y-2">
                      <div
                        ref={sliderContainerRef}
                        onMouseDown={() => setIsDraggingSlider(true)}
                        onMouseUp={() => setIsDraggingSlider(false)}
                        onMouseLeave={() => setIsDraggingSlider(false)}
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleTouchMove}
                        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 bg-black select-none cursor-ew-resize group shadow-2xl"
                      >
                        {/* Modified Image (Full Background) */}
                        <img
                          src={editedResult.imageUrl}
                          alt="Edited Result"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Original Image (Clipped overlay) */}
                        <div
                          className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-2xl"
                          style={{ width: `${sliderPos}%` }}
                        >
                          <img
                            src={sourceImage}
                            alt="Original Source"
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover max-w-none"
                            style={{
                              width: sliderContainerRef.current ? sliderContainerRef.current.clientWidth : "100%",
                              height: sliderContainerRef.current ? sliderContainerRef.current.clientHeight : "100%",
                            }}
                          />
                          <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-[10px] font-mono font-bold border border-white/10">
                            BEFORE
                          </span>
                        </div>

                        <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-purple-600/90 text-white text-[10px] font-mono font-bold border border-purple-400/30">
                          AFTER
                        </span>

                        {/* Slider Drag Handle */}
                        <div
                          className="absolute inset-y-0 w-1 bg-white shadow-xl cursor-ew-resize flex items-center justify-center"
                          style={{ left: `${sliderPos}%` }}
                        >
                          <div className="w-7 h-7 rounded-full bg-white text-slate-950 font-bold text-xs flex items-center justify-center shadow-2xl border-2 border-purple-600">
                            ↔
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-center text-slate-400 font-mono">
                        Drag handle left / right to compare original vs edited image
                      </p>
                    </div>
                  ) : (
                    /* SIDE BY SIDE VIEW MODE */
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Before (Original)</span>
                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                          <img src={sourceImage} alt="Original" referrerPolicy="no-referrer" className="w-full h-48 object-cover" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">After (Edited)</span>
                        <div className="rounded-2xl overflow-hidden border border-purple-500/30 bg-black/50 shadow-xl">
                          <img src={editedResult.imageUrl} alt="Edited" referrerPolicy="no-referrer" className="w-full h-48 object-cover" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions & Details */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                    <p className="text-xs text-slate-200 italic">"{editedResult.prompt}"</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(editedResult.imageUrl)}
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Edited Image</span>
                      </button>
                      <button
                        onClick={() => setPreviewModalUrl(editedResult.imageUrl)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="View Fullsize"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteImage(editedResult.id, e)}
                        className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3 text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                    <ArrowRightLeft className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-xs font-mono">No edit comparison active</p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Upload an image on the left, type edit instructions, and click generate to compare results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDITED IMAGES HISTORY GALLERY */}
      {editorHistory.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">Edited Image History</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{editorHistory.length} edits saved</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {editorHistory.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-purple-500/50 transition-all shadow-lg flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => setPreviewModalUrl(item.imageUrl)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
                      title="View Fullsize"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(item.imageUrl)}
                      className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteImage(item.id, e)}
                      className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-2.5 space-y-1 bg-white/[0.02]">
                  <p className="text-[11px] text-slate-300 line-clamp-1 italic">"{item.prompt}"</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="text-purple-400 font-semibold">EDITED</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
