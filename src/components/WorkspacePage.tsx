import React, { useState, useRef } from "react";
import { 
  FolderKanban, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  FileImage, 
  File, 
  Upload, 
  Search, 
  Trash2, 
  Eye, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  HardDrive,
  Download,
  ArrowRight
} from "lucide-react";
import { ChatSession, Attachment } from "../types";

interface WorkspacePageProps {
  sessions: ChatSession[];
  onSelectPrompt?: (promptText: string) => void;
  onFileClick?: (attachment: Attachment) => void;
  onUploadAndChat?: (attachment: Attachment) => void;
  onOpenResumeBuilder?: () => void;
  accentColorClass: string;
}

export default function WorkspacePage({ 
  sessions, 
  onSelectPrompt, 
  onFileClick, 
  onUploadAndChat,
  onOpenResumeBuilder,
  accentColorClass 
}: WorkspacePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read saved resumes from LocalStorage
  const [savedResumes, setSavedResumes] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("astramind_resumes_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Error reading resumes in WorkspacePage:", e);
    }
    return [];
  });

  // Collect all files across all messages in sessions
  const allUploadedFiles: Array<{
    id: string;
    sessionTitle: string;
    sessionId: string;
    name: string;
    type: string;
    size: string;
    url: string;
    content?: string;
    base64?: string;
    date: string;
    attachment: Attachment;
  }> = [];

  sessions.forEach((session) => {
    session.messages.forEach((msg) => {
      if (msg.attachment) {
        allUploadedFiles.push({
          id: msg.id + "-att",
          sessionTitle: session.title,
          sessionId: session.id,
          name: msg.attachment.name,
          type: msg.attachment.type || "file",
          size: typeof msg.attachment.size === "number" ? `${Math.round(msg.attachment.size / 1024)} KB` : "120 KB",
          url: msg.attachment.url,
          content: msg.attachment.content,
          base64: msg.attachment.base64,
          date: new Date(session.lastUpdated || Date.now()).toLocaleDateString(),
          attachment: msg.attachment,
        });
      }
    });
  });

  const supportedFormats = [
    { name: "PDF Documents", ext: ".pdf", icon: FileText, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
    { name: "DOCX Word", ext: ".docx", icon: FileText, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { name: "XLSX Spreadsheets", ext: ".xlsx", icon: FileSpreadsheet, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { name: "PPTX Presentations", ext: ".pptx", icon: Layers, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { name: "Images & Visuals", ext: ".png, .jpg", icon: FileImage, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { name: "TXT & Source Code", ext: ".txt, .ts", icon: FileCode, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return FileImage;
    if (fileType.includes("sheet") || fileType.includes("csv") || fileType.includes("xlsx")) return FileSpreadsheet;
    if (fileType.includes("pdf") || fileType.includes("doc")) return FileText;
    if (fileType.includes("code") || fileType.includes("json")) return FileCode;
    return File;
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const attachment: Attachment = {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: result,
        base64: result,
      };

      if (onUploadAndChat) {
        onUploadAndChat(attachment);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDownloadFile = (f: { name: string; url?: string; content?: string; base64?: string }) => {
    try {
      if (f.url && (f.url.startsWith("data:") || f.url.startsWith("http") || f.url.startsWith("blob:"))) {
        const a = document.createElement("a");
        a.href = f.url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (f.content) {
        const blob = new Blob([f.content], { type: "text/plain;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else if (f.base64) {
        const a = document.createElement("a");
        a.href = f.base64;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Fallback file generation
        const blob = new Blob([`Document sample contents for ${f.name}`], { type: "text/plain;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Error downloading file:", err);
    }
  };

  const filteredFiles = allUploadedFiles.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div id="workspace-page-wrapper" className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Hidden File Input for Direct Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.json,.ts,.js,.py,.md"
      />

      {/* Vision Pro Glass Hero Banner */}
      <div className="glass-panel p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-transparent blur-3xl pointer-events-none" />
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Astra Workspace &amp; Knowledge Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Document &amp; File Vault
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Upload, inspect, download, and reason over PDF, Word, Excel, PowerPoint, code, and image files in translucent floating cards.
          </p>
        </div>

        <button
          onClick={handleTriggerUpload}
          className="glass-button-primary px-5 py-3 flex items-center gap-2 cursor-pointer text-sm shadow-xl shadow-purple-600/30 shrink-0 relative z-10"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Document</span>
        </button>
      </div>

      {/* Supported Formats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {supportedFormats.map((fmt) => {
          const Icon = fmt.icon;
          return (
            <div key={fmt.name} className={`p-3.5 rounded-2xl border backdrop-blur-xl ${fmt.color} flex flex-col gap-1.5`}>
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase">{fmt.ext}</span>
              </div>
              <span className="text-xs font-bold text-white tracking-tight">{fmt.name}</span>
            </div>
          );
        })}
      </div>

      {/* Saved Resumes Section */}
      {savedResumes.length > 0 && (
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Saved AI Resumes</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono">
                {savedResumes.length} saved
              </span>
            </div>

            {onOpenResumeBuilder && (
              <button
                onClick={onOpenResumeBuilder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Resume Builder</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedResumes.map((r: any) => (
              <div
                key={r.id}
                onClick={onOpenResumeBuilder}
                className="group p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.05] transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-blue-300 truncate">
                    {r.title || "Untitled Resume"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(r.lastUpdated || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300">
                  <span className="font-semibold text-white">{r.personalInfo?.fullName || "Candidate"}</span> – {r.personalInfo?.jobTitle || "Professional"}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                  <span>Template: {r.templateId || "Executive"}</span>
                  <span className="text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Edit &amp; Export <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Vault / List Section */}
      <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Uploaded Document Library</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono">
              {allUploadedFiles.length} files
            </span>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((f) => {
              const Icon = getFileIcon(f.type);
              return (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3 group shadow-md"
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                        {f.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>{f.size}</span>
                        <span>•</span>
                        <span className="truncate">{f.sessionTitle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadFile(f)}
                      className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                      title={`Download ${f.name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* AI Chat Query Button */}
                    <button
                      onClick={() => {
                        if (onFileClick) {
                          onFileClick(f.attachment);
                        } else if (onSelectPrompt) {
                          onSelectPrompt(`Analyze and extract actionable takeaways from ${f.name}.`);
                        }
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 transition-all cursor-pointer"
                      title="Inspect & Analyze with AI in Chat"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto shadow-inner">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">No documents uploaded yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Upload files directly using the button above or attach files during chat sessions. All documents will appear here and remain downloadable anytime.
              </p>
            </div>
            <button
              onClick={handleTriggerUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Choose a File to Upload</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

