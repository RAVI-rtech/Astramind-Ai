import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Send, X, MicOff, AudioLines, Zap, ChevronUp, Check } from "lucide-react";
import { Attachment } from "../types";
import { getSpeechRecognition, isSpeechSupported } from "../utils/speech";

export type AiMode = "chat" | "image" | "video" | "live";

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: "auto", name: "Auto Mode", badge: "Smart Route" },
  { id: "deep", name: "AstraMind Deep", badge: "Reasoning" },
  { id: "v3.5", name: "Astra 3.5", badge: "Versatile" },
  { id: "light", name: "AstraMind Light", badge: "Fast" },
];

interface ChatInputProps {
  onSend: (text: string, attachment?: Attachment, options?: { mode: AiMode; imageSize: string; videoAspect: string; useMaps: boolean }) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  variant?: "centered" | "sticky";
  accentColorClass: string;
  onOpenLive?: () => void;
}

export default function ChatInput({
  onSend,
  isLoading,
  onStopGeneration,
  variant = "sticky",
  accentColorClass,
  onOpenLive,
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Model Selector State
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODEL_OPTIONS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // AI Feature States
  const [aiMode, setAiMode] = useState<AiMode>("chat");
  const [imageSize, setImageSize] = useState("1K");
  const [videoAspect, setVideoAspect] = useState("16:9");
  const [useMaps, setUseMaps] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Listen for external set-prompt requests (e.g. from ExplorePage, WorkspacePage, HeroLanding)
  useEffect(() => {
    const handleSetPrompt = (e: CustomEvent<string>) => {
      if (typeof e.detail === "string") {
        setInputText(e.detail);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(e.detail.length, e.detail.length);
          }
        }, 10);
      }
    };
    window.addEventListener("astramind-set-prompt" as any, handleSetPrompt);
    return () => window.removeEventListener("astramind-set-prompt" as any, handleSetPrompt);
  }, []);

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Speech Recognition cleanly when dictation is toggled
  const startListening = () => {
    if (!isSpeechSupported()) {
      setSpeechError("Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const rec = getSpeechRecognition();
      if (!rec) {
        setSpeechError("Speech recognition unavailable.");
        return;
      }

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError("Microphone access blocked. Click 'Open in New Tab' above or enable microphone permissions.");
        } else if (event.error === "no-speech") {
          // Silent timeout when user doesn't say anything
          setSpeechError(null);
        } else if (event.error === "audio-capture") {
          setSpeechError("No microphone found on your device.");
        } else {
          setSpeechError(`Voice input error (${event.error}).`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.warn("Failed to start speech recognition:", err);
      setIsListening(false);
      setSpeechError("Unable to start microphone. Try opening the app in a new tab.");
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      startListening();
    }
  };

  // Handle auto-growth for textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const isTextFile = file.type.startsWith("text/") || 
      file.name.endsWith(".txt") || 
      file.name.endsWith(".md") || 
      file.name.endsWith(".json") || 
      file.name.endsWith(".csv");

    if (isTextFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const textContent = reader.result as string;
        setAttachment({
          name: file.name,
          type: file.type || "text/plain",
          url: URL.createObjectURL(file),
          content: textContent,
          size: file.size,
        });
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setAttachment({
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
          base64: base64String,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = () => {
    if (attachment?.url) {
      URL.revokeObjectURL(attachment.url);
    }
    setAttachment(null);
  };

  const getFormatBadge = (fileType: string, name: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    if (ext === 'PDF') return <span className="text-rose-400 font-bold text-[10px]">PDF</span>;
    if (ext === 'DOCX' || ext === 'DOC') return <span className="text-blue-400 font-bold text-[10px]">DOCX</span>;
    if (ext === 'PPTX' || ext === 'PPT') return <span className="text-amber-400 font-bold text-[10px]">PPTX</span>;
    if (ext === 'XLSX' || ext === 'XLS' || ext === 'CSV') return <span className="text-emerald-400 font-bold text-[10px]">XLSX</span>;
    if (ext === 'TXT' || ext === 'MD' || ext === 'JSON') return <span className="text-purple-400 font-bold text-[10px]">{ext}</span>;
    return <span className="text-cyan-400 font-bold text-[10px]">{ext}</span>;
  };

  const handleSubmit = () => {
    if (isLoading && onStopGeneration) {
      onStopGeneration();
      return;
    }

    if (aiMode === "live") {
      if (onOpenLive) onOpenLive();
      return;
    }

    const trimmedText = inputText.trim();
    if (!trimmedText && !attachment) return;
    if (isLoading) return;

    onSend(trimmedText, attachment || undefined, { mode: aiMode, imageSize, videoAspect, useMaps });
    setInputText("");
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const isCentered = variant === "centered";

  return (
    <div
      id={`chat-input-wrapper-${variant}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleDrop}
      className={`relative w-full max-w-3xl mx-auto transition-all ${
        isCentered 
          ? "py-2 px-0" 
          : "p-2 sm:p-4 bg-black/40 border-t border-white/10 backdrop-blur-2xl sticky bottom-0 z-10"
      }`}
    >
      {/* Drag indicator overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-md border-2 border-dashed border-blue-400 rounded-3xl">
          <div className="bg-[#0b0f24] px-6 py-3 rounded-full text-blue-300 font-medium flex items-center gap-2 border border-blue-500/30 shadow-2xl">
            <Paperclip className="w-5 h-5" />
            Drop PDF, DOCX, PPTX, XLSX, TXT, or Image here
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        id="attachment-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.json,.csv,image/*"
        className="hidden"
      />

      {/* Main input card */}
      <div className="relative group w-full">
        <div
          id="main-input-glass-card"
          className="relative flex flex-col w-full bg-[#090d1a]/90 border border-white/10 rounded-2xl shadow-xl z-20 focus-within:border-blue-500/40 transition-colors"
        >
          {/* Attachment preview area */}
          {attachment && (
            <div
              id="attachment-preview-bar"
              className="flex items-center gap-3 p-3 bg-white/5 border-b border-white/10 rounded-t-[24px] overflow-hidden"
            >
              <div className="relative group/att w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center shrink-0">
                {attachment.type.startsWith("image/") ? (
                  <img
                    src={attachment.url}
                    alt="Attachment preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFormatBadge(attachment.type, attachment.name)
                )}
                <button
                  id="remove-attachment-btn"
                  onClick={handleRemoveAttachment}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-rose-400" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{attachment.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : attachment.type.toUpperCase()}
                </p>
              </div>
              <button
                id="remove-attachment-text-btn"
                onClick={handleRemoveAttachment}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Speech Input Status Alert */}
          {speechError && (
            <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-[11px] text-rose-300 font-mono flex items-center justify-between">
              <span>{speechError}</span>
              <button onClick={() => setSpeechError(null)}>
                <X className="w-3.5 h-3.5 hover:text-white" />
              </button>
            </div>
          )}

          {/* Textarea + buttons row */}
          <div id="input-controls-row" className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#111827]/90 backdrop-blur-2xl border border-white/10 shadow-2xl focus-within:border-blue-500/40 transition-all">
            {/* Attachment trigger (+ Plus button) */}
            <button
              id="trigger-attachment-btn"
              type="button"
              onClick={handleAttachmentClick}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all shrink-0 flex items-center justify-center cursor-pointer border border-white/5"
              title="Attach PDF, DOCX, PPTX, XLSX, TXT, Image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Model Selector Trigger (⚡ Model) */}
            <div className="relative shrink-0" ref={modelMenuRef}>
              <button
                id="model-selector-btn"
                type="button"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
                title="Select Model"
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline-block max-w-[100px] truncate">{selectedModel.name}</span>
                <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isModelMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Model Dropdown Popover */}
              {isModelMenuOpen && (
                <div
                  id="model-selector-dropdown"
                  className="absolute bottom-full mb-3 left-0 w-60 rounded-2xl bg-[#111827]/95 border border-white/10 p-2 shadow-2xl backdrop-blur-2xl z-[100] animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold border-b border-white/10 mb-1.5 flex items-center justify-between">
                    <span>Engine</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                  {MODEL_OPTIONS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model);
                        setIsModelMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        selectedModel.id === model.id
                          ? "bg-blue-500/20 text-blue-200 border border-blue-500/30 shadow-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Zap className={`w-3.5 h-3.5 ${selectedModel.id === model.id ? "text-blue-400" : "text-slate-400"}`} />
                        {model.name}
                      </span>
                      {selectedModel.id === model.id ? (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-mono">{model.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea box */}
            <textarea
              id="chat-textarea-box"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                aiMode === 'live'
                  ? "Click send to start Live Voice..."
                  : isListening
                  ? "Listening... speak now."
                  : attachment
                  ? "Ask about this file..."
                  : "Type your question..."
              }
              disabled={isLoading || aiMode === 'live'}
              className="flex-1 max-h-[160px] bg-transparent border-none focus:ring-0 py-1.5 px-2 text-white placeholder-[#A1A1AA] resize-none font-normal leading-normal text-base outline-none"
            />

            <div className="flex items-center gap-2 shrink-0">
              {/* Voice input button (🎤 Voice) */}
              <button
                id="voice-dictation-btn"
                type="button"
                onClick={toggleVoiceInput}
                disabled={isLoading || aiMode === 'live'}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? "text-rose-400 bg-rose-500/10 animate-pulse"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title="Voice Dictation"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit / Stop button */}
              <button
                id="send-chat-submit-btn"
                type="button"
                onClick={handleSubmit}
                disabled={!isLoading && !inputText.trim() && !attachment && aiMode !== 'live'}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 cursor-pointer ${
                  isLoading
                    ? "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/30 hover:scale-105"
                    : (inputText.trim() || attachment || aiMode === 'live')
                    ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                }`}
                title={isLoading ? "Stop generating" : "Send message"}
              >
                {isLoading ? (
                  <span className="w-3 h-3 bg-white rounded-xs" />
                ) : aiMode === 'live' ? (
                  <AudioLines className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AstraMind AI Disclaimer */}
        <p className="mt-2.5 text-center text-[12px] sm:text-[13px] text-slate-400/70 font-normal leading-relaxed select-none px-2 max-w-2xl mx-auto">
          AstraMind may occasionally generate inaccurate information. Please verify important details before relying on them.
        </p>
      </div>
    </div>
  );
}

