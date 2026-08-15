import { downloadResumePDF } from "../lib/pdfExport";
import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Sparkles, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, FilePlus, 
  Eye, 
  Edit3, 
  Wand2, 
  Award, 
  Briefcase, 
  GraduationCap, 
  FolderKanban, 
  Layers, 
  Languages as LangIcon, 
  User, 
  Share2, 
  RefreshCw, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  BarChart3, 
  HelpCircle, 
  Upload, 
  X,
  Tag,
  Image,
  Type,
  Lock,
  LogIn,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Login from "./Login";
import { 
  ResumeData, 
  ResumeTemplateId, 
  ResumeAccentColor, 
  WorkExperienceItem, 
  ProjectItem, 
  EducationItem, 
  CertificationItem, 
  AchievementItem, 
  LanguageItem 
} from "../types";
import { 
  loadAllResumes, 
  saveResume, 
  deleteResume, 
  duplicateResume, 
  createNewResume, 
  callAIResumeImprove, 
  
  SAMPLE_RESUME 
} from "../lib/resumeStorage";

import RegularAtsTemplate from "./resumeTemplates/RegularAtsTemplate";
import ModernExecutiveTemplate from "./resumeTemplates/ModernExecutiveTemplate";
import MinimalistAtsTemplate from "./resumeTemplates/MinimalistAtsTemplate";
import TechLeadTemplate from "./resumeTemplates/TechLeadTemplate";
import ElegantSerifTemplate from "./resumeTemplates/ElegantSerifTemplate";

interface ResumeBuilderProps {
  accentColorClass: string;
  isAuthenticated?: boolean;
}

const ACCENT_COLORS: { id: ResumeAccentColor; name: string; hex: string; bgClass: string }[] = [
  { id: "indigo", name: "Royal Indigo", hex: "#4f46e5", bgClass: "bg-indigo-600" },
  { id: "emerald", name: "Astra Emerald", hex: "#059669", bgClass: "bg-emerald-600" },
  { id: "cyan", name: "Cyan Spark", hex: "#0891b2", bgClass: "bg-cyan-600" },
  { id: "rose", name: "Velvet Rose", hex: "#e11d48", bgClass: "bg-rose-600" },
  { id: "amber", name: "Amber Glow", hex: "#d97706", bgClass: "bg-amber-600" },
  { id: "monochrome", name: "Charcoal Slate", hex: "#334155", bgClass: "bg-slate-700" },
];

interface SkillInputProps {
  categoryIndex: number;
  existingSkills?: string[];
  onAddSkill: (categoryIndex: number, skillValue: string) => void;
}

const SkillInput: React.FC<SkillInputProps> = ({ categoryIndex, existingSkills = [], onAddSkill }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Case-insensitive duplicate check
    const isDuplicate = existingSkills.some(
      (s) => s.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (!isDuplicate) {
      onAddSkill(categoryIndex, trimmed);
    }
    setValue("");

    // Keep input focused for fast multi-skill typing on mobile & desktop
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd();
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full">
      <input
        ref={inputRef}
        type="text"
        enterKeyHint="done"
        placeholder="Type a skill and tap + or Enter..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        className="w-full bg-slate-800/90 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-xs text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        onClick={(e) => {
          e.preventDefault();
          handleAdd();
        }}
        className={`absolute right-1.5 p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
          value.trim()
            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
            : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
        }`}
        title="Add Skill"
        aria-label="Add Skill"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};

export default function ResumeBuilderPage({ accentColorClass, isAuthenticated }: ResumeBuilderProps) {
  // Auth & Download Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingDownloadType, setPendingDownloadType] = useState<"pdf"  | null>(null);
  const [downloadStep, setDownloadStep] = useState<"idle" | "preparing" | "downloading" | "completed">("idle");
  // Saved resumes list & current active resume
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeData>(SAMPLE_RESUME);
  const [activeSection, setActiveSection] = useState<
    "personal" | "headers" | "experience" | "projects" | "skills" | "education" | "certifications" | "achievements" | "languages"
  >("personal");

  // UI state
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Autosave status state
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  // Modals & AI drawers state
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isAiBulletModalOpen, setIsAiBulletModalOpen] = useState(false);
  const [aiBulletTarget, setAiBulletTarget] = useState<{
    section: "experience" | "projects";
    itemId: string;
    bulletIdx: number;
    text: string;
  } | null>(null);
  const [aiBulletOptions, setAiBulletOptions] = useState<{ options: string[]; tip: string } | null>(null);
  const [isGeneratingBullets, setIsGeneratingBullets] = useState(false);

  // AI Summary modal state
  const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // AI Skill drawer state
  const [isAiSkillDrawerOpen, setIsAiSkillDrawerOpen] = useState(false);
  const [aiSkillsResult, setAiSkillsResult] = useState<any | null>(null);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);

  // ATS Analysis state
  const [atsAnalysis, setAtsAnalysis] = useState<any | null>(null);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load saved resumes on mount
  useEffect(() => {
    const list = loadAllResumes();
    setResumes(list);
    if (list.length > 0) {
      setActiveResume(list[0]);
    }
  }, []);

  // Continuous Autosave effect to persist active form state to local storage
  useEffect(() => {
    if (!activeResume || !activeResume.id) return;
    setIsAutoSaving(true);
    const saveTimer = setTimeout(() => {
      saveResume(activeResume);
      setResumes(loadAllResumes());
      const nowFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSavedTime(nowFormatted);
      setIsAutoSaving(false);
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [activeResume]);

  // Update active resume and persist
  const handleUpdateResume = (updated: ResumeData) => {
    setActiveResume(updated);
    saveResume(updated);
    setResumes(loadAllResumes());
  };

  // Handle switching active resume
  const handleSelectResume = (id: string) => {
    const found = resumes.find((r) => r.id === id);
    if (found) {
      setActiveResume(found);
      showToast("success", `Loaded resume: "${found.title}"`);
    }
  };

  // Create new resume
  const handleCreateNew = () => {
    const fresh = createNewResume(`Resume ${resumes.length + 1}`, "modern-executive");
    setActiveResume(fresh);
    setResumes(loadAllResumes());
    showToast("success", "Created new blank resume.");
  };

  // Duplicate resume
  const handleDuplicate = () => {
    const copy = duplicateResume(activeResume.id);
    setActiveResume(copy);
    setResumes(loadAllResumes());
    showToast("success", `Created copy: "${copy.title}"`);
  };

  // Delete resume
  const handleDelete = () => {
    if (resumes.length <= 1) {
      showToast("error", "You must keep at least one resume.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${activeResume.title}"?`)) {
      const remaining = deleteResume(activeResume.id);
      setResumes(remaining);
      setActiveResume(remaining[0]);
      showToast("success", "Resume deleted.");
    }
  };

  // Authentication & Download Flow Handlers
  const checkIsUserLoggedIn = async (): Promise<boolean> => {
    if (isAuthenticated) return true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return true;
    } catch (e) {
      console.error("Auth check error:", e);
    }
    return localStorage.getItem("astramind_auth") === "true";
  };

  // Export PDF trigger (checks auth first)
  const handleDownloadPDF = async () => {
    const isLogged = await checkIsUserLoggedIn();
    if (!isLogged) {
      setPendingDownloadType("pdf");
      setShowAuthModal(true);
      return;
    }
    await executeDownload("pdf");
  };

  // Export clean Resume Photo PNG trigger (checks auth first)
    // Execute export with step-by-step progress
  const executeDownload = async (type: "pdf" ) => {
    setIsExportingPDF(true);

    try {
      // Step 1: Preparing Resume...
      setDownloadStep("preparing");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Downloading...
      setDownloadStep("downloading");
      await new Promise((resolve) => setTimeout(resolve, 300));

      const cleanName = activeResume.personalInfo.fullName
        ? `${activeResume.personalInfo.fullName.trim().replace(/\s+/g, "_")}_Resume.${"pdf"}`
        : `Resume.${"pdf"}`;

      await downloadResumePDF("resume-printable-area", cleanName);

      // Step 3: Completed.
      setDownloadStep("completed");
      showToast("success", `${"PDF"} downloaded successfully!`);
    } catch (e: any) {
      console.error("[ResumeBuilderPage] PDF Generation Pipeline Exception caught:", e?.message || e, e);
      showToast("error", e?.message || "Resume is currently unavailable.");
      setDownloadStep("idle");
    } finally {
      setIsExportingPDF(false);
      setIsExportingImage(false);
      setTimeout(() => {
        setDownloadStep("idle");
      }, 1800);
    }
  };

  // Auto-continue download after successful login
  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    showToast("success", "Signed in successfully! Downloading resume...");
    if (pendingDownloadType) {
      const typeToDownload = pendingDownloadType;
      setPendingDownloadType(null);
      await executeDownload(typeToDownload);
    }
  };

  // Direct print view trigger
  const handlePrint = () => {
    window.print();
  };

  // Open AI Bullet Enhancer
  const handleOpenAiBulletEnhancer = async (section: "experience" | "projects", itemId: string, bulletIdx: number, rawText: string) => {
    setAiBulletTarget({ section, itemId, bulletIdx, text: rawText });
    setIsAiBulletModalOpen(true);
    setIsGeneratingBullets(true);
    setAiBulletOptions(null);

    try {
      const res = await callAIResumeImprove({
        action: "enhance_bullet",
        text: rawText,
        jobTitle: activeResume.personalInfo.jobTitle,
      });
      setAiBulletOptions(res);
    } catch (err) {
      showToast("error", "AI enhancement unavailable right now.");
    } finally {
      setIsGeneratingBullets(false);
    }
  };

  // Apply chosen bullet option
  const handleApplyBulletOption = (chosenText: string) => {
    if (!aiBulletTarget) return;

    if (aiBulletTarget.section === "experience") {
      const updatedExp = activeResume.experience.map((item) => {
        if (item.id === aiBulletTarget.itemId) {
          const newBullets = [...item.bulletPoints];
          newBullets[aiBulletTarget.bulletIdx] = chosenText;
          return { ...item, bulletPoints: newBullets };
        }
        return item;
      });
      handleUpdateResume({ ...activeResume, experience: updatedExp });
    } else if (aiBulletTarget.section === "projects") {
      const updatedProj = activeResume.projects.map((item) => {
        if (item.id === aiBulletTarget.itemId) {
          const newBullets = [...item.bulletPoints];
          newBullets[aiBulletTarget.bulletIdx] = chosenText;
          return { ...item, bulletPoints: newBullets };
        }
        return item;
      });
      handleUpdateResume({ ...activeResume, projects: updatedProj });
    }

    setIsAiBulletModalOpen(false);
    showToast("success", "Applied AI enhanced bullet point!");
  };

  // Generate AI Executive Summary
  const handleGenerateAiSummary = async () => {
    setIsAiSummaryModalOpen(true);
    setIsGeneratingSummary(true);
    setAiSummaryResult(null);

    try {
      const res = await callAIResumeImprove({
        action: "generate_summary",
        jobTitle: activeResume.personalInfo.jobTitle,
        context: `${activeResume.personalInfo.summary} | Top skills: ${activeResume.skills.map((s) => s.skills.join(", ")).join("; ")}`,
      });
      if (res?.summary) {
        setAiSummaryResult(res.summary);
      }
    } catch (e) {
      showToast("error", "AI summary generator unavailable.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleApplyAiSummary = (summaryText: string) => {
    handleUpdateResume({
      ...activeResume,
      personalInfo: { ...activeResume.personalInfo, summary: summaryText },
    });
    setIsAiSummaryModalOpen(false);
    showToast("success", "Updated professional summary!");
  };

  // AI Skill Suggestions
  const handleGenerateAiSkills = async () => {
    setIsAiSkillDrawerOpen(true);
    setIsGeneratingSkills(true);
    setAiSkillsResult(null);

    try {
      const currentListed = activeResume.skills.flatMap((s) => s.skills).join(", ");
      const res = await callAIResumeImprove({
        action: "suggest_skills",
        jobTitle: activeResume.personalInfo.jobTitle,
        text: currentListed,
      });
      setAiSkillsResult(res);
    } catch (e) {
      showToast("error", "AI skill recommender unavailable.");
    } finally {
      setIsGeneratingSkills(false);
    }
  };

  const handleAddSuggestedSkill = (categoryName: string, skillName: string) => {
    const updatedSkills = [...activeResume.skills];
    let catIndex = updatedSkills.findIndex((c) => c.category.toLowerCase().includes(categoryName.toLowerCase()));
    
    if (catIndex < 0) {
      updatedSkills.push({
        category: categoryName as any || "Technical",
        skills: [skillName],
      });
    } else {
      if (!updatedSkills[catIndex].skills.includes(skillName)) {
        updatedSkills[catIndex].skills.push(skillName);
      }
    }

    handleUpdateResume({ ...activeResume, skills: updatedSkills });
    showToast("success", `Added skill "${skillName}"`);
  };

  // ATS Analysis Audit
  const handleRunAtsAudit = async () => {
    setIsAtsModalOpen(true);
    setIsAnalyzingAts(true);
    setAtsAnalysis(null);

    try {
      const res = await callAIResumeImprove({
        action: "analyze_ats",
        jobTitle: activeResume.personalInfo.jobTitle,
        resumeData: activeResume,
      });
      setAtsAnalysis(res);
    } catch (e) {
      showToast("error", "ATS parser audit failed.");
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  const currentAccentHex = ACCENT_COLORS.find((c) => c.id === activeResume.accentColor)?.hex || "#4f46e5";

  // Render Template
  const renderTemplateView = () => {
    switch (activeResume.templateId) {
      case "regular-ats":
        return <RegularAtsTemplate resume={activeResume} accentHex={currentAccentHex} />;
      case "minimalist-ats":
        return <MinimalistAtsTemplate resume={activeResume} accentHex={currentAccentHex} />;
      case "tech-lead":
        return <TechLeadTemplate resume={activeResume} accentHex={currentAccentHex} />;
      case "elegant-serif":
        return <ElegantSerifTemplate resume={activeResume} accentHex={currentAccentHex} />;
      case "modern-executive":
      default:
        return <ModernExecutiveTemplate resume={activeResume} accentHex={currentAccentHex} />;
    }
  };

  return (
    <div id="astramind-resume-builder-page" className="min-h-screen text-slate-100 bg-[#030712] pt-6 pb-16 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Vision Pro Glass Hero Banner */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-transparent blur-3xl pointer-events-none" />
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>AstraMind ATS Resume Architect</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              AI Resume &amp; Career Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Build high-converting ATS tech resumes with real-time AI suggestions, live template rendering, and sanitized PDF export.
            </p>
          </div>
          
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="glass-button-primary px-5 py-2.5 flex items-center gap-2 cursor-pointer text-xs shadow-xl shadow-purple-600/30"
            >
              <Download className="w-4 h-4" />
              <span>Export Sanitized PDF</span>
            </button>
          </div>
        </div>

        {/* Top Workspace Header Bar */}
        <div id="resume-builder-toolbar" className="bg-[#090d1f]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Title & Resume Switcher */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activeResume.title}
                  onChange={(e) => handleUpdateResume({ ...activeResume, title: e.target.value })}
                  className="bg-transparent text-sm sm:text-base font-bold text-white outline-none border-b border-transparent hover:border-white/20 focus:border-indigo-500 px-1 py-0.5 rounded transition-all"
                  title="Click to rename resume title"
                />
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ATS Ready
                </span>

                {/* Auto-Save Live Status Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium">
                  <span className="relative flex h-2 w-2">
                    {isAutoSaving ? (
                      <span className="animate-spin h-2 w-2 rounded-full border border-emerald-400 border-t-transparent"></span>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    )}
                  </span>
                  <span>{isAutoSaving ? "Saving..." : `Auto-saved at ${lastSavedTime}`}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                AstraMind AI Executive Resume Suite
              </p>
            </div>

            {/* Resume Dropdown */}
            <select
              value={activeResume.id}
              onChange={(e) => handleSelectResume(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 border border-white/15 rounded-lg px-2.5 py-1.5 outline-none hover:border-indigo-500/50 cursor-pointer"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({new Date(r.lastUpdated).toLocaleDateString()})
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateNew}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Create new resume"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Duplicate current resume"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Delete resume"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Controls: Template Switcher, Color Picker, Download & ATS Audit */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            
            {/* ATS Score Audit Button */}
            <button
              onClick={handleRunAtsAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ATS Score Audit</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Print / Save Vector PDF via Browser"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? "Exporting..." : "Download PDF"}</span>
            </button>

            
          </div>

        </div>

        {/* Customization Bar: Template Selector & Color Accents */}
        <div className="bg-[#090d1f]/60 border border-white/5 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Template Choices */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Template:
            </span>
            {[
              { id: "regular-ats", label: "Regular" },
              { id: "modern-executive", label: "Modern Executive" },
              { id: "minimalist-ats", label: "100% ATS Clean" },
              { id: "tech-lead", label: "Tech Lead" },
              { id: "elegant-serif", label: "Elegant Serif" },
            ].map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleUpdateResume({ ...activeResume, templateId: tmpl.id as ResumeTemplateId })}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeResume.templateId === tmpl.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          {/* Color Accents */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium mr-1">Accent:</span>
            <div className="flex items-center gap-1.5">
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleUpdateResume({ ...activeResume, accentColor: col.id })}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer ${col.bgClass} ${
                    activeResume.accentColor === col.id ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          {/* Extended Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateResume({ ...activeResume, isExtended: !activeResume.isExtended })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeResume.isExtended 
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              {activeResume.isExtended ? "Extended (Max 2 Pages)" : "Standard (1 Page)"}
            </button>
          </div>

          {/* View Toggle (Edit Form / Preview / Split) */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${
                viewMode === "edit" ? "bg-white/15 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`hidden md:block px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${
                viewMode === "split" ? "bg-white/15 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${
                viewMode === "preview" ? "bg-white/15 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Main Split Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Section Form Editor */}
          {(viewMode === "edit" || viewMode === "split") && (
            <div className={`space-y-4 ${viewMode === "split" ? "lg:col-span-5" : "lg:col-span-12"}`}>
              
              {/* Navigation Section Tabs */}
              <div className="flex flex-wrap gap-1 bg-[#090d1f] p-1.5 rounded-2xl border border-white/10">
                {[
                  { id: "personal", label: "Personal Info", icon: User },
                  { id: "headers", label: "Section Titles", icon: Type },
                  { id: "experience", label: "Experience", icon: Briefcase },
                  { id: "projects", label: "Projects", icon: FolderKanban },
                  { id: "skills", label: "Skills", icon: Sparkles },
                  { id: "education", label: "Education", icon: GraduationCap },
                  { id: "certifications", label: "Certs", icon: Award },
                  { id: "achievements", label: "Awards", icon: Award },
                  { id: "languages", label: "Languages", icon: LangIcon },
                ].map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Section Form Contents */}
              <div className="bg-[#090d1f]/90 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                
                {/* 1. Personal Info */}
                {activeSection === "personal" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-400" />
                        Personal Information & Header
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo.fullName}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, fullName: e.target.value },
                            })
                          }
                          placeholder="e.g. Alex Mercer"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Target Professional Title *</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo.jobTitle}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, jobTitle: e.target.value },
                            })
                          }
                          placeholder="e.g. Senior Full-Stack Engineer"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={activeResume.personalInfo.email}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, email: e.target.value },
                            })
                          }
                          placeholder="alex.mercer@astramind.ai"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo.phone}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, phone: e.target.value },
                            })
                          }
                          placeholder="+1 (555) 234-8900"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Location (City, Country)</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo.location}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, location: e.target.value },
                            })
                          }
                          placeholder="San Francisco, CA"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn Profile</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo.linkedinUrl}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, linkedinUrl: e.target.value },
                            })
                          }
                          placeholder="linkedin.com/in/alexmercer"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Profile</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo.githubUrl}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, githubUrl: e.target.value },
                            })
                          }
                          placeholder="github.com/alexmercer"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Portfolio / Website</label>
                        <input
                          type="text"
                          value={activeResume.personalInfo.portfolioUrl}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              personalInfo: { ...activeResume.personalInfo, portfolioUrl: e.target.value },
                            })
                          }
                          placeholder="alexmercer.dev"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Summary Generator */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Professional Executive Summary
                        </label>
                        <button
                          onClick={handleGenerateAiSummary}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>AI Generate Summary</span>
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={activeResume.personalInfo.summary}
                        onChange={(e) =>
                          handleUpdateResume({
                            ...activeResume,
                            personalInfo: { ...activeResume.personalInfo, summary: e.target.value },
                          })
                        }
                        placeholder="Write a compelling 3-4 sentence summary or click AI Generate Summary..."
                        className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* 1.5 Section Titles Customization */}
                {activeSection === "headers" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Type className="w-4 h-4 text-indigo-400" />
                          Customize Section Titles & Headings
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Rename any section heading (e.g., PROFESSIONAL SUMMARY, WORK EXPERIENCE, ACADEMIC HISTORY) to fit your preference or role.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Summary Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.summary || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), summary: e.target.value },
                            })
                          }
                          placeholder="e.g. PROFESSIONAL SUMMARY"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Work Experience Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.experience || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), experience: e.target.value },
                            })
                          }
                          placeholder="e.g. WORK EXPERIENCE"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Projects Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.projects || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), projects: e.target.value },
                            })
                          }
                          placeholder="e.g. PROJECTS"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Skills Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.skills || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), skills: e.target.value },
                            })
                          }
                          placeholder="e.g. SKILLS & COMPETENCIES"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Education Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.education || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), education: e.target.value },
                            })
                          }
                          placeholder="e.g. EDUCATION"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Certifications Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.certifications || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), certifications: e.target.value },
                            })
                          }
                          placeholder="e.g. CERTIFICATIONS"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Achievements Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.achievements || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), achievements: e.target.value },
                            })
                          }
                          placeholder="e.g. HONORS & ACHIEVEMENTS"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Languages Heading</label>
                        <input
                          type="text"
                          value={activeResume.sectionTitles?.languages || ""}
                          onChange={(e) =>
                            handleUpdateResume({
                              ...activeResume,
                              sectionTitles: { ...(activeResume.sectionTitles || {}), languages: e.target.value },
                            })
                          }
                          placeholder="e.g. LANGUAGES"
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Experience */}
                {activeSection === "experience" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                        Work Experience
                      </h3>
                      <button
                        onClick={() => {
                          const newExp: WorkExperienceItem = {
                            id: "exp-" + Date.now(),
                            jobTitle: "Software Engineer",
                            company: "Company Name",
                            location: "City, State",
                            startDate: "2022",
                            endDate: "Present",
                            isCurrent: true,
                            bulletPoints: ["Accomplished [X] as measured by [Y], by doing [Z]."],
                          };
                          handleUpdateResume({
                            ...activeResume,
                            experience: [newExp, ...activeResume.experience],
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Position</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {activeResume.experience.map((item, idx) => (
                        <div key={item.id} className="bg-slate-900/80 border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300">
                              Position #{idx + 1}
                            </span>
                            <button
                              onClick={() => {
                                const updatedExp = activeResume.experience.filter((e) => e.id !== item.id);
                                handleUpdateResume({ ...activeResume, experience: updatedExp });
                              }}
                              className="text-rose-400 hover:text-rose-300 cursor-pointer text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={item.jobTitle}
                              onChange={(e) => {
                                const updatedExp = [...activeResume.experience];
                                updatedExp[idx].jobTitle = e.target.value;
                                handleUpdateResume({ ...activeResume, experience: updatedExp });
                              }}
                              placeholder="Job Title"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={item.company}
                              onChange={(e) => {
                                const updatedExp = [...activeResume.experience];
                                updatedExp[idx].company = e.target.value;
                                handleUpdateResume({ ...activeResume, experience: updatedExp });
                              }}
                              placeholder="Company Name"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={item.location}
                              onChange={(e) => {
                                const updatedExp = [...activeResume.experience];
                                updatedExp[idx].location = e.target.value;
                                handleUpdateResume({ ...activeResume, experience: updatedExp });
                              }}
                              placeholder="Location"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.startDate}
                                onChange={(e) => {
                                  const updatedExp = [...activeResume.experience];
                                  updatedExp[idx].startDate = e.target.value;
                                  handleUpdateResume({ ...activeResume, experience: updatedExp });
                                }}
                                placeholder="Start Date"
                                className="w-1/2 bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                value={item.endDate}
                                disabled={item.isCurrent}
                                onChange={(e) => {
                                  const updatedExp = [...activeResume.experience];
                                  updatedExp[idx].endDate = e.target.value;
                                  handleUpdateResume({ ...activeResume, experience: updatedExp });
                                }}
                                placeholder="End Date"
                                className="w-1/2 bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-40"
                              />
                            </div>
                          </div>

                          {/* Bullet Points */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                              <span>Bullet Points & Accomplishments:</span>
                              <button
                                onClick={() => {
                                  const updatedExp = [...activeResume.experience];
                                  updatedExp[idx].bulletPoints.push("Accomplished [X] as measured by [Y], by doing [Z].");
                                  handleUpdateResume({ ...activeResume, experience: updatedExp });
                                }}
                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Bullet
                              </button>
                            </div>

                            {item.bulletPoints.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-2">•</span>
                                <textarea
                                  rows={2}
                                  value={bullet}
                                  onChange={(e) => {
                                    const updatedExp = [...activeResume.experience];
                                    updatedExp[idx].bulletPoints[bIdx] = e.target.value;
                                    handleUpdateResume({ ...activeResume, experience: updatedExp });
                                  }}
                                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => handleOpenAiBulletEnhancer("experience", item.id, bIdx, bullet)}
                                  className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
                                  title="AI Enhance Bullet Point"
                                >
                                  <Wand2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const updatedExp = [...activeResume.experience];
                                    updatedExp[idx].bulletPoints.splice(bIdx, 1);
                                    handleUpdateResume({ ...activeResume, experience: updatedExp });
                                  }}
                                  className="p-2 text-slate-500 hover:text-rose-400 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Projects */}
                {activeSection === "projects" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-indigo-400" />
                        Key Projects
                      </h3>
                      <button
                        onClick={() => {
                          const newProj: ProjectItem = {
                            id: "proj-" + Date.now(),
                            title: "Project Title",
                            role: "Lead Developer",
                            techStack: ["React", "Node.js"],
                            link: "github.com/user/project",
                            startDate: "2024",
                            endDate: "2025",
                            bulletPoints: ["Designed and implemented core architecture."],
                          };
                          handleUpdateResume({ ...activeResume, projects: [newProj, ...activeResume.projects] });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Project</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {activeResume.projects.map((proj, idx) => (
                        <div key={proj.id} className="bg-slate-900/80 border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300">Project #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = activeResume.projects.filter((p) => p.id !== proj.id);
                                handleUpdateResume({ ...activeResume, projects: updated });
                              }}
                              className="text-rose-400 hover:text-rose-300 cursor-pointer text-xs"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => {
                                const updated = [...activeResume.projects];
                                updated[idx].title = e.target.value;
                                handleUpdateResume({ ...activeResume, projects: updated });
                              }}
                              placeholder="Project Title"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={proj.role}
                              onChange={(e) => {
                                const updated = [...activeResume.projects];
                                updated[idx].role = e.target.value;
                                handleUpdateResume({ ...activeResume, projects: updated });
                              }}
                              placeholder="Your Role"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={proj.link}
                              onChange={(e) => {
                                const updated = [...activeResume.projects];
                                updated[idx].link = e.target.value;
                                handleUpdateResume({ ...activeResume, projects: updated });
                              }}
                              placeholder="Project URL or Repo Link"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={proj.techStack.join(", ")}
                              onChange={(e) => {
                                const updated = [...activeResume.projects];
                                updated[idx].techStack = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                handleUpdateResume({ ...activeResume, projects: updated });
                              }}
                              placeholder="Tech Stack (comma separated)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={proj.startDate}
                              onChange={(e) => {
                                const updated = [...activeResume.projects];
                                updated[idx].startDate = e.target.value;
                                handleUpdateResume({ ...activeResume, projects: updated });
                              }}
                              placeholder="Start Date (e.g. Jan 2024)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              value={proj.endDate}
                              onChange={(e) => {
                                const updated = [...activeResume.projects];
                                updated[idx].endDate = e.target.value;
                                handleUpdateResume({ ...activeResume, projects: updated });
                              }}
                              placeholder="End Date (e.g. Present)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Bullet points */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                              <span>Bullets & Highlights:</span>
                              <button
                                onClick={() => {
                                  const updated = [...activeResume.projects];
                                  updated[idx].bulletPoints.push("Key contribution or outcome...");
                                  handleUpdateResume({ ...activeResume, projects: updated });
                                }}
                                className="text-indigo-400 flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Bullet
                              </button>
                            </div>

                            {proj.bulletPoints.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-2">•</span>
                                <textarea
                                  rows={2}
                                  value={bullet}
                                  onChange={(e) => {
                                    const updated = [...activeResume.projects];
                                    updated[idx].bulletPoints[bIdx] = e.target.value;
                                    handleUpdateResume({ ...activeResume, projects: updated });
                                  }}
                                  className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => handleOpenAiBulletEnhancer("projects", proj.id, bIdx, bullet)}
                                  className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer"
                                  title="AI Enhance"
                                >
                                  <Wand2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const updated = [...activeResume.projects];
                                    updated[idx].bulletPoints.splice(bIdx, 1);
                                    handleUpdateResume({ ...activeResume, projects: updated });
                                  }}
                                  className="p-2 text-slate-500 hover:text-rose-400 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Skills */}
                {activeSection === "skills" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Skills & Categorized Competencies
                      </h3>
                      <button
                        onClick={handleGenerateAiSkills}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>AI Suggest Skills</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {activeResume.skills.map((cat, cIdx) => (
                        <div key={cIdx} className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={cat.category}
                              onChange={(e) => {
                                const updated = [...activeResume.skills];
                                updated[cIdx].category = e.target.value as any;
                                handleUpdateResume({ ...activeResume, skills: updated });
                              }}
                              className="bg-transparent text-xs font-bold text-indigo-300 outline-none border-b border-transparent focus:border-indigo-500"
                            />
                            <button
                              onClick={() => {
                                const updated = activeResume.skills.filter((_, idx) => idx !== cIdx);
                                handleUpdateResume({ ...activeResume, skills: updated });
                              }}
                              className="text-rose-400 hover:text-rose-300 text-xs cursor-pointer"
                            >
                              Remove Category
                            </button>
                          </div>

                          {/* Skill Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {cat.skills.map((sk, skIdx) => (
                              <span
                                key={skIdx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 transition-all hover:bg-indigo-500/25"
                              >
                                <span>{sk}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...activeResume.skills];
                                    updated[cIdx] = {
                                      ...updated[cIdx],
                                      skills: updated[cIdx].skills.filter((_, i) => i !== skIdx),
                                    };
                                    handleUpdateResume({ ...activeResume, skills: updated });
                                  }}
                                  className="text-indigo-300 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                                  title={`Remove ${sk}`}
                                  aria-label={`Remove ${sk}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>

                          {/* Add Skill Input */}
                          <div className="pt-2">
                            <SkillInput 
                              categoryIndex={cIdx} 
                              existingSkills={cat.skills}
                              onAddSkill={(idx, skillVal) => {
                                const updated = [...activeResume.skills];
                                const exists = updated[idx].skills.some(
                                  (s) => s.trim().toLowerCase() === skillVal.trim().toLowerCase()
                                );
                                if (!exists) {
                                  updated[idx] = { ...updated[idx], skills: [...updated[idx].skills, skillVal.trim()] };
                                  handleUpdateResume({ ...activeResume, skills: updated });
                                }
                              }} 
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          handleUpdateResume({
                            ...activeResume,
                            skills: [...activeResume.skills, { category: "Other", skills: [] }],
                          });
                        }}
                        className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs text-slate-400 hover:text-white hover:border-indigo-500/50 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Skill Category
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Education */}
                {activeSection === "education" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-400" />
                        Education & Academics
                      </h3>
                      <button
                        onClick={() => {
                          const newEdu: EducationItem = {
                            id: "edu-" + Date.now(),
                            degree: "B.S. in Computer Science",
                            school: "University Name",
                            location: "City, State",
                            startDate: "2018",
                            endDate: "2022",
                            gpa: "3.8",
                            highlights: "Dean's List",
                          };
                          handleUpdateResume({ ...activeResume, education: [newEdu, ...activeResume.education] });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Education</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeResume.education.map((edu, idx) => (
                        <div key={edu.id} className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-300">Degree #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = activeResume.education.filter((e) => e.id !== edu.id);
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              className="text-rose-400 text-xs cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const updated = [...activeResume.education];
                                updated[idx].degree = e.target.value;
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              placeholder="Degree / Certificate"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => {
                                const updated = [...activeResume.education];
                                updated[idx].school = e.target.value;
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              placeholder="School / University"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => {
                                const updated = [...activeResume.education];
                                updated[idx].gpa = e.target.value;
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              placeholder="GPA / Honors"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={edu.location || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.education];
                                updated[idx].location = e.target.value;
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              placeholder="Location (City, State)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={edu.startDate || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.education];
                                updated[idx].startDate = e.target.value;
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              placeholder="Start Year/Date (e.g. 2018)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={edu.endDate || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.education];
                                updated[idx].endDate = e.target.value;
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              placeholder="End Year/Date (e.g. 2022)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={edu.highlights}
                              onChange={(e) => {
                                const updated = [...activeResume.education];
                                updated[idx].highlights = e.target.value;
                                handleUpdateResume({ ...activeResume, education: updated });
                              }}
                              placeholder="Key Highlights / Honors"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none sm:col-span-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Certifications */}
                {activeSection === "certifications" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-400" />
                        Certifications & Credentials
                      </h3>
                      <button
                        onClick={() => {
                          const newCert: CertificationItem = {
                            id: "cert-" + Date.now(),
                            name: "AWS Solutions Architect",
                            issuer: "Amazon Web Services",
                            date: "2024",
                            credentialUrl: "aws.amazon.com/verify",
                          };
                          handleUpdateResume({ ...activeResume, certifications: [...activeResume.certifications, newCert] });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Certification</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeResume.certifications.map((cert, idx) => (
                        <div key={cert.id} className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-300">Cert #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = activeResume.certifications.filter((c) => c.id !== cert.id);
                                handleUpdateResume({ ...activeResume, certifications: updated });
                              }}
                              className="text-rose-400 text-xs cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => {
                                const updated = [...activeResume.certifications];
                                updated[idx].name = e.target.value;
                                handleUpdateResume({ ...activeResume, certifications: updated });
                              }}
                              placeholder="Certification Name"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => {
                                const updated = [...activeResume.certifications];
                                updated[idx].issuer = e.target.value;
                                handleUpdateResume({ ...activeResume, certifications: updated });
                              }}
                              placeholder="Issuing Organization"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={cert.date || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.certifications];
                                updated[idx].date = e.target.value;
                                handleUpdateResume({ ...activeResume, certifications: updated });
                              }}
                              placeholder="Date Issued (e.g. 2024)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={cert.credentialUrl || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.certifications];
                                updated[idx].credentialUrl = e.target.value;
                                handleUpdateResume({ ...activeResume, certifications: updated });
                              }}
                              placeholder="Credential URL / Verification Link"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Achievements */}
                {activeSection === "achievements" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-400" />
                        Honors & Achievements
                      </h3>
                      <button
                        onClick={() => {
                          const newAch: AchievementItem = {
                            id: "ach-" + Date.now(),
                            title: "1st Place Winner - Hackathon",
                            organization: "Tech Conference",
                            date: "2024",
                            description: "Built autonomous agent solution.",
                          };
                          handleUpdateResume({ ...activeResume, achievements: [...activeResume.achievements, newAch] });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Achievement</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeResume.achievements.map((ach, idx) => (
                        <div key={ach.id} className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-300">Award #{idx + 1}</span>
                            <button
                              onClick={() => {
                                const updated = activeResume.achievements.filter((a) => a.id !== ach.id);
                                handleUpdateResume({ ...activeResume, achievements: updated });
                              }}
                              className="text-rose-400 text-xs cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={ach.title}
                              onChange={(e) => {
                                const updated = [...activeResume.achievements];
                                updated[idx].title = e.target.value;
                                handleUpdateResume({ ...activeResume, achievements: updated });
                              }}
                              placeholder="Award Title"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={ach.organization || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.achievements];
                                updated[idx].organization = e.target.value;
                                handleUpdateResume({ ...activeResume, achievements: updated });
                              }}
                              placeholder="Issuing Organization"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={ach.date || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.achievements];
                                updated[idx].date = e.target.value;
                                handleUpdateResume({ ...activeResume, achievements: updated });
                              }}
                              placeholder="Date Received (e.g. 2024)"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="text"
                              value={ach.description || ""}
                              onChange={(e) => {
                                const updated = [...activeResume.achievements];
                                updated[idx].description = e.target.value;
                                handleUpdateResume({ ...activeResume, achievements: updated });
                              }}
                              placeholder="Description / Context"
                              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Languages */}
                {activeSection === "languages" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <LangIcon className="w-4 h-4 text-indigo-400" />
                        Languages
                      </h3>
                      <button
                        onClick={() => {
                          const newLang: LanguageItem = {
                            id: "lang-" + Date.now(),
                            name: "Spanish",
                            proficiency: "Professional",
                          };
                          handleUpdateResume({ ...activeResume, languages: [...activeResume.languages, newLang] });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Language</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeResume.languages.map((lang, idx) => (
                        <div key={lang.id} className="flex items-center gap-3 bg-slate-900/80 border border-white/10 rounded-xl p-3">
                          <input
                            type="text"
                            value={lang.name}
                            onChange={(e) => {
                              const updated = [...activeResume.languages];
                              updated[idx].name = e.target.value;
                              handleUpdateResume({ ...activeResume, languages: updated });
                            }}
                            placeholder="Language (e.g. English)"
                            className="w-1/2 bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                          <select
                            value={lang.proficiency}
                            onChange={(e) => {
                              const updated = [...activeResume.languages];
                              updated[idx].proficiency = e.target.value as any;
                              handleUpdateResume({ ...activeResume, languages: updated });
                            }}
                            className="w-1/2 bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="Native">Native / Bilingual</option>
                            <option value="Fluent">Fluent</option>
                            <option value="Professional">Professional Working</option>
                            <option value="Conversational">Conversational</option>
                            <option value="Basic">Basic</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Right Column: Interactive Live Preview */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div className={`space-y-3 ${viewMode === "split" ? "lg:col-span-7" : "lg:col-span-12"}`}>
              
              {/* Preview Zoom Controls & Quick Template Toggle Header */}
              <div className="bg-[#090d1f] border border-white/10 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span>Live Preview:</span>
                  </div>

                  {/* Template Quick Switcher Tabs */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/10">
                    {[
                      { id: "regular-ats", label: "Regular" },
                      { id: "modern-executive", label: "Modern" },
                      { id: "minimalist-ats", label: "Minimal" },
                      { id: "tech-lead", label: "Tech Lead" },
                      { id: "elegant-serif", label: "Classic Serif" },
                    ].map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => handleUpdateResume({ ...activeResume, templateId: tmpl.id as ResumeTemplateId })}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                          activeResume.templateId === tmpl.id
                            ? "bg-indigo-600 text-white shadow-sm font-semibold"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 text-[11px] min-w-[36px] text-center font-mono">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(0.95)}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10.5px] text-slate-400 cursor-pointer"
                  >
                    Fit
                  </button>
                </div>
              </div>

              {/* Printable / Preview Box */}
              <div className="overflow-x-auto bg-slate-950 p-4 rounded-2xl border border-white/10 flex justify-center shadow-inner min-h-[800px]">
                <div 
                  className="transition-transform duration-200 origin-top"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {renderTemplateView()}
                </div>
              </div>

            </div>
          )}

          {/* Offscreen DOM element for PDF export if viewMode is edit */}
          {viewMode === "edit" && (
            <div 
              aria-hidden="true" 
              className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none z-[-1]"
            >
              {renderTemplateView()}
            </div>
          )}

        </div>

      </div>

      {/* AI Bullet Enhancer Modal */}
      {isAiBulletModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f26] border border-white/15 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Wand2 className="w-4 h-4" />
                <span>AI Bullet Point Enhancer (STAR Method)</span>
              </div>
              <button
                onClick={() => setIsAiBulletModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGeneratingBullets ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">
                  Applying recruiter STAR methodology & action metrics...
                </p>
              </div>
            ) : aiBulletOptions ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Select an AI-enhanced option below to replace your bullet point:
                </p>

                <div className="space-y-2">
                  {aiBulletOptions.options.map((opt, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleApplyBulletOption(opt)}
                      className="bg-slate-900 border border-white/10 hover:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 hover:text-white cursor-pointer transition-all space-y-1 group"
                    >
                      <div className="flex justify-between items-center text-[10px] text-indigo-400 font-bold uppercase">
                        <span>Option {idx + 1}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                          Apply <Check className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="leading-relaxed">{opt}</p>
                    </div>
                  ))}
                </div>

                {aiBulletOptions.tip && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-indigo-300">
                    <span className="font-bold">Pro Tip: </span>{aiBulletOptions.tip}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-rose-400">Failed to generate suggestions.</p>
            )}
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {isAiSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f26] border border-white/15 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI Executive Summary Generator</span>
              </div>
              <button
                onClick={() => setIsAiSummaryModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGeneratingSummary ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">
                  Crafting concise executive summary for {activeResume.personalInfo.jobTitle}...
                </p>
              </div>
            ) : aiSummaryResult ? (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 text-xs text-slate-200 leading-relaxed">
                  {aiSummaryResult}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAiSummaryModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApplyAiSummary(aiSummaryResult)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold cursor-pointer"
                  >
                    Apply to Resume
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* AI Skill Suggestions Drawer */}
      {isAiSkillDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f26] border border-white/15 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Wand2 className="w-4 h-4" />
                <span>AI Suggested Industry Skills ({activeResume.personalInfo.jobTitle || "Role"})</span>
              </div>
              <button
                onClick={() => setIsAiSkillDrawerOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGeneratingSkills ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">
                  Analyzing top ATS skills for {activeResume.personalInfo.jobTitle}...
                </p>
              </div>
            ) : aiSkillsResult?.recommendedSkills ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {aiSkillsResult.recommendedSkills.map((cat: any, idx: number) => (
                  <div key={idx} className="bg-slate-900 border border-white/10 rounded-xl p-3 space-y-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide block">
                      {cat.category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((sk: string, sIdx: number) => (
                        <button
                          key={sIdx}
                          onClick={() => handleAddSuggestedSkill(cat.category, sk)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 text-slate-200 hover:text-white cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{sk}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ATS Audit Modal */}
      {isAtsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f26] border border-white/15 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Applicant Tracking System (ATS) Parser Audit</span>
              </div>
              <button
                onClick={() => setIsAtsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAnalyzingAts ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">
                  Parsing resume structure & checking recruiter keywords...
                </p>
              </div>
            ) : atsAnalysis ? (
              <div className="space-y-4 text-xs">
                {/* Score Header */}
                <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-emerald-400">
                      {atsAnalysis.score || 88} / 100
                    </span>
                    <p className="text-slate-300 font-semibold mt-0.5">
                      {atsAnalysis.verdict || "High Recruiter Compatibility"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {atsAnalysis.score || 88}%
                  </div>
                </div>

                {/* Strengths */}
                {atsAnalysis.strengths && (
                  <div>
                    <span className="font-bold text-slate-200 block mb-1">Key Strengths:</span>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                      {atsAnalysis.strengths.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keyword Gaps */}
                {atsAnalysis.keywordGaps && (
                  <div>
                    <span className="font-bold text-slate-200 block mb-1">Recommended Keywords to Add:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {atsAnalysis.keywordGaps.map((kw: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {atsAnalysis.recommendations && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-200 block">Actionable Fixes:</span>
                    {atsAnalysis.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 space-y-0.5">
                        <span className="font-semibold text-indigo-300">{rec.section}: </span>
                        <span className="text-slate-300">{rec.issue} — </span>
                        <span className="text-emerald-300">{rec.fix}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 1. Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b0f26] border border-white/15 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Sign In Required</h3>
                <p className="text-xs text-slate-400">Authentication is required to export resumes</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-200 text-center">
                Please sign in to download your resume.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingDownloadType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setShowLoginModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Login Overlay Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md relative my-8">
            <Login
              onLogin={handleLoginSuccess}
              accentColorClass={accentColorClass}
              redirectReason="Please sign in to download your resume."
              onCancel={() => {
                setShowLoginModal(false);
                setPendingDownloadType(null);
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Download Progress Modal */}
      {downloadStep !== "idle" && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b0f26] border border-white/15 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="flex justify-center">
              {downloadStep === "completed" ? (
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-in zoom-in-75 duration-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {downloadStep === "preparing" && "Preparing Resume..."}
                {downloadStep === "downloading" && "Downloading..."}
                {downloadStep === "completed" && "Completed."}
              </h4>
              <p className="text-xs text-slate-400">
                {downloadStep === "preparing" && "Formatting ATS sections & styles..."}
                {downloadStep === "downloading" && "Exporting PDF document..."}
                {downloadStep === "completed" && "Your resume has been exported."}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  downloadStep === "completed"
                    ? "bg-emerald-500 w-full"
                    : downloadStep === "downloading"
                    ? "bg-indigo-500 w-2/3"
                    : "bg-indigo-600 w-1/3"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border ${
          notification.type === "success"
            ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
            : "bg-rose-950/90 border-rose-500/40 text-rose-200"
        }`}>
          <Check className="w-4 h-4" />
          <span>{notification.msg}</span>
        </div>
      )}
    </div>
  );
}
