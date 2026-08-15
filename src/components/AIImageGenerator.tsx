import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Wand2,
  Download,
  Copy,
  Check,
  Maximize2,
  Sliders,
  Image as ImageIcon,
  Zap,
  Trash2,
  Edit3,
  Layers,
  ChevronRight,
  Info,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  ImageStudioItem,
  IMAGE_PROVIDERS,
  apiGenerateImage,
  apiCheckImageModelsStatus,
  saveImageToHistory,
  deleteImageFromHistory,
} from "../lib/imageStudio";

interface AIImageGeneratorProps {
  currentUserId?: string | null;
  history: ImageStudioItem[];
  onHistoryUpdated: () => void;
  onSendToEditor: (imageUrl: string, prompt?: string) => void;
  accentColorClass: string;
}

const STYLE_OPTIONS = [
  { id: "None", label: "None (Raw Prompt)", desc: "Generate exact prompt text with natural AI rendering" },
  { id: "AstraMind Photorealistic", label: "Photorealistic", desc: "Ultra-crisp 8K clarity & natural lighting" },
  { id: "AstraMind Cyberpunk", label: "Cyberpunk Neon", desc: "Futuristic cityscapes & glowing holograms" },
  { id: "AstraMind Anime Art", label: "Anime & Manga", desc: "Vibrant cel-shaded anime aesthetic" },
  { id: "AstraMind 3D Render", label: "3D Digital Art", desc: "Smooth Octane-rendered 3D models" },
  { id: "AstraMind Minimalist Vector", label: "Minimalist Vector", desc: "Clean geometric flat vector graphics" },
  { id: "AstraMind Cinematic Lighting", label: "Cinematic Film", desc: "Dramatic volumetric studio lighting" },
  { id: "AstraMind Fantasy Concept", label: "Fantasy Realm", desc: "Ethereal mystical landscapes & magic" },
  { id: "AstraMind Sci-Fi World", label: "Sci-Fi World", desc: "High-tech deep space & cybernetics" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1 Square", desc: "1024 × 1024" },
  { id: "16:9", label: "16:9 Landscape", desc: "1920 × 1080" },
  { id: "4:3", label: "4:3 Standard", desc: "1280 × 960" },
  { id: "3:4", label: "3:4 Portrait", desc: "960 × 1280" },
  { id: "9:16", label: "9:16 Story", desc: "1080 × 1920" },
];

const PROMPT_PRESETS = [
  "A majestic floating crystal island in deep space with neon waterfalls and glowing nebulae, photorealistic 8k",
  "Cyberpunk samurai standing under glowing hologram rain in a Tokyo alleyway at night",
  "A serene alpine lake reflecting snow-capped mountains at sunset with warm golden hour light",
  "Futuristic AI biomechanical portrait with glowing cyan fiber-optic circuitry, octane render",
  "A cute minimalist 3D isometric glass greenhouse with miniature glowing magical plants",
  "Ancient fantasy library floating inside a giant glowing hourglass, ethereal concept art",
];

export default function AIImageGenerator({
  currentUserId,
  history,
  onHistoryUpdated,
  onSendToEditor,
  accentColorClass,
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("None");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedProvider, setSelectedProvider] = useState("huggingface-inference");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const [latestGenerated, setLatestGenerated] = useState<ImageStudioItem | null>(null);
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
        setUnavailableMessage(status.message || "Image generation is unavailable with your current API configuration.");
      }
    });
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRandomPreset = () => {
    const random = PROMPT_PRESETS[Math.floor(Math.random() * PROMPT_PRESETS.length)];
    setPrompt(random);
  };

  const handleDeleteImage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteImageFromHistory(id, currentUserId);
      if (latestGenerated?.id === id) {
        setLatestGenerated(null);
      }
      onHistoryUpdated();
      showToast("success", "Image deleted successfully from history.");
    } catch (err: any) {
      console.error("[AI Image Generator] Delete error:", err);
      showToast("error", err?.message || "Failed to delete image.");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (isModelUnavailable) {
      setErrorMsg(unavailableMessage || "Image generation is currently unavailable with your API configuration. No supported image models were found.");
      return;
    }
    setErrorMsg(null);
    setIsGenerating(true);
    setProgressPercent(15);
    setProgressStep("Generating image...");

    const stepTimer1 = setTimeout(() => {
      setProgressPercent(45);
      setProgressStep("Generating image...");
    }, 2000);

    const stepTimer2 = setTimeout(() => {
      setProgressPercent(75);
      setProgressStep("Trying another provider...");
    }, 5000);

    try {
      const imageUrl = await apiGenerateImage(
        {
          prompt: prompt.trim(),
          style: selectedStyle,
          aspectRatio: selectedRatio,
          providerId: selectedProvider,
        },
        (statusText) => {
          setProgressStep(statusText);
        }
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setProgressPercent(95);
      setProgressStep("Finalizing high-res image output...");

      // Save to history
      const savedItem = await saveImageToHistory({
        userId: currentUserId,
        type: "generator",
        prompt: prompt.trim(),
        imageUrl,
        style: selectedStyle,
        aspectRatio: selectedRatio,
        providerId: selectedProvider,
      });

      setProgressPercent(100);
      setLatestGenerated(savedItem);
      onHistoryUpdated();
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error("Image generation failed:", err);
      setErrorMsg("Image generation is currently unavailable. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (url: string, filenamePrompt: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `AstraMind_AI_${filenamePrompt.slice(0, 20).replace(/[^a-z0-9]/gi, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generatorHistory = history.filter((item) => item.type === "generator");

  return (
    <div id="ai-image-generator-container" className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900 border border-blue-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AstraMind AI Studio • Image Synthesis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AI Image Generator
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Turn your imagination into high-resolution visual art. Powered by AstraMind-AI neural synthesis, supporting customizable artistic styles, flexible aspect ratios, and modular engine providers.
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

      {/* GENERATION CONTROLS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prompt Input & Generation Settings (2 cols on LG) */}
        <div className="lg:col-span-2 space-y-6 p-6 rounded-3xl bg-[#070b1a]/80 border border-white/10 backdrop-blur-xl shadow-xl">
          {/* Prompt Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-2 uppercase tracking-wider font-semibold">
                <Wand2 className="w-4 h-4 text-blue-400" />
                <span>Prompt Instructions</span>
              </label>
              <button
                type="button"
                onClick={handleRandomPreset}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Surprise Me</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                id="generator-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create in vivid detail (e.g. A serene glass temple floating over glowing blue water at twilight...)"
                rows={4}
                className="w-full px-4 py-3.5 rounded-2xl bg-black/50 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              />
              {prompt && (
                <button
                  onClick={() => setPrompt("")}
                  className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear prompt"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Prompt Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Sample Prompt Ideas:</span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_PRESETS.slice(0, 3).map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(preset)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors truncate max-w-[260px] text-left cursor-pointer"
                  >
                    "{preset.slice(0, 32)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-slate-300 flex items-center gap-2 uppercase tracking-wider font-semibold">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Artistic Style</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STYLE_OPTIONS.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-md shadow-blue-900/30 ring-1 ring-blue-500/50"
                        : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{style.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{style.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-slate-300 flex items-center gap-2 uppercase tracking-wider font-semibold">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Aspect Ratio</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => {
                const isSelected = selectedRatio === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50"
                        : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{ratio.label}</div>
                    <div className="text-[10px] text-slate-400">{ratio.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Engine Provider Selector (Modular Future-Proof Architecture) */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Engine Provider</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">Modular Engine Architecture</span>
            </div>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {IMAGE_PROVIDERS.map((prov) => (
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
                <p className="font-semibold text-amber-100">Image Generation Unavailable</p>
                <p className="mt-0.5 text-amber-300/80 leading-relaxed">
                  {unavailableMessage || "Image generation is currently unavailable with your API configuration. No supported image generation models were found for this API key."}
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

          {/* GENERATE BUTTON & LOADING PROGRESS */}
          <div className="space-y-3 pt-2">
            <button
              id="generate-image-btn"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || isModelUnavailable}
              className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer ${
                !prompt.trim() || isGenerating || isModelUnavailable
                  ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60"
                  : `bg-gradient-to-r ${accentColorClass} text-white hover:brightness-110 shadow-blue-500/20 active:scale-[0.99]`
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Art... ({progressPercent}%)</span>
                </>
              ) : isModelUnavailable ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Image Generation Unavailable</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate AstraMind Image</span>
                </>
              )}
            </button>

            {/* Dynamic Progress Bar */}
            {isGenerating && (
              <div className="space-y-2 p-4 rounded-2xl bg-black/50 border border-blue-500/30 animate-pulse">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-2 text-blue-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    {progressStep}
                  </span>
                  <span className="text-white font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Latest Result Preview Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#070b1a]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-300 flex items-center gap-2 uppercase tracking-wider font-semibold">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Synthesis Output</span>
              </span>
              {latestGenerated && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                  READY
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
              {isGenerating ? (
                <div className="w-full aspect-square rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center animate-bounce">
                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Synthesizing Artwork</p>
                    <p className="text-xs text-slate-400 font-mono">{progressStep}</p>
                  </div>
                </div>
              ) : latestGenerated ? (
                <div className="w-full space-y-4">
                  <div className="relative group rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl">
                    <img
                      src={latestGenerated.imageUrl}
                      alt={latestGenerated.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover max-h-[380px] rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 gap-2">
                      <button
                        onClick={() => setPreviewModalUrl(latestGenerated.imageUrl)}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
                        title="View Fullsize"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(latestGenerated.imageUrl, latestGenerated.prompt)}
                        className="p-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md text-white transition-colors cursor-pointer"
                        title="Download Image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSendToEditor(latestGenerated.imageUrl, latestGenerated.prompt)}
                        className="p-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 backdrop-blur-md text-white transition-colors cursor-pointer"
                        title="Edit in AI Image Editor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteImage(latestGenerated.id, e)}
                        className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 backdrop-blur-md text-white transition-colors cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span>{latestGenerated.style || "Photorealistic"}</span>
                      <span>{latestGenerated.aspectRatio || "1:1"}</span>
                    </div>
                    <p className="text-slate-200 line-clamp-2 italic">"{latestGenerated.prompt}"</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopyPrompt(latestGenerated.prompt, latestGenerated.id)}
                        className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedId === latestGenerated.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => onSendToEditor(latestGenerated.imageUrl, latestGenerated.prompt)}
                        className="flex-1 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Image</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3 text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                    <Wand2 className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-xs font-mono">No image synthesized yet</p>
                  <p className="text-[11px] text-slate-600 max-w-xs">
                    Type a prompt above and click "Generate AstraMind Image" to begin.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GENERATED IMAGES HISTORY GALLERY */}
      {generatorHistory.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">Generated Image History</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{generatorHistory.length} creations saved</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {generatorHistory.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-blue-500/50 transition-all shadow-lg flex flex-col"
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
                      onClick={() => handleDownload(item.imageUrl, item.prompt)}
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSendToEditor(item.imageUrl, item.prompt)}
                      className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                      title="Edit in Image Editor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
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
                    <span>{item.style?.split(" ")[1] || "Custom"}</span>
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
