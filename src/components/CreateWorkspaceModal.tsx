import React, { useState, useRef } from "react";
import { 
  X, Sparkles, FolderKanban, Upload, FileText, Layers, Check, BookOpen,
  GraduationCap, Building, Target, Search, ExternalLink, Loader2, Download, Globe
} from "lucide-react";
import { 
  VITS_BRANCHES, 
  VITS_SUBJECTS, 
  LEARNING_GOALS, 
  createWorkspace 
} from "../lib/studyWorkspaceStorage";
import { VITS_COLLEGE_NAME, VITS_SYLLABUS_URL } from "../data/vitsAcademics";
import { BTechYear, BTechSemester, LearningGoal, StudyWorkspace, DocumentProfile } from "../types";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workspace: StudyWorkspace) => void;
  onWorkspaceCreated?: (workspace: StudyWorkspace) => void;
  accentColorClass?: string;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreated,
  onWorkspaceCreated,
  accentColorClass = "text-blue-400 border-blue-500/30"
}: CreateWorkspaceModalProps) {
  const getInitialBranch = (): string => {
    try {
      const raw = localStorage.getItem("astramind_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.branch) {
          const match = VITS_BRANCHES.find(
            (b) => b.toLowerCase() === p.branch.toLowerCase() || b.includes(p.branch) || p.branch.includes(b)
          );
          if (match) return match;
        }
      }
    } catch {}
    return VITS_BRANCHES[0];
  };

  const [name, setName] = useState("");
  const [college, setCollege] = useState(VITS_COLLEGE_NAME);
  const [programType, setProgramType] = useState("B.Tech");
  const [officialWebsiteUrl, setOfficialWebsiteUrl] = useState(VITS_SYLLABUS_URL);
  const [branch, setBranch] = useState<string>(getInitialBranch);
  const [year, setYear] = useState<BTechYear>("2nd");
  const [semester, setSemester] = useState<BTechSemester>("I");
  const [subject, setSubject] = useState(VITS_SUBJECTS["2nd"][0] || "Data Structures & Algorithms");
  const [learningGoal, setLearningGoal] = useState<LearningGoal>("Prepare for exam");
  const [syllabusLinks, setSyllabusLinks] = useState<Array<{
    title: string; url: string; sourcePageUrl: string; host: string; kind: "pdf" | "page";
  }>>([]);
  const [syllabusDiscoveryNote, setSyllabusDiscoveryNote] = useState<string | null>(null);
  const [syllabusDiscoveryError, setSyllabusDiscoveryError] = useState<string | null>(null);
  const [isDiscoveringSyllabus, setIsDiscoveringSyllabus] = useState(false);
  const [isImportingSyllabusUrl, setIsImportingSyllabusUrl] = useState("");
  const [syllabusSourceUrl, setSyllabusSourceUrl] = useState("");
  
  // File upload & document understanding state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
    size: string;
    content?: string;
    base64?: string;
    url?: string;
    officialSourceUrl?: string;
    profile?: DocumentProfile;
  } | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docProfile, setDocProfile] = useState<DocumentProfile | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [manualNotes, setManualNotes] = useState("");
  const [showManualNotes, setShowManualNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isVitsCollege = college.trim().toLowerCase() === VITS_COLLEGE_NAME.toLowerCase();
  const currentSubjectList = isVitsCollege && programType === "B.Tech" ? (VITS_SUBJECTS[year] || []) : [];

  const handleDiscoverSyllabus = async () => {
    if (!college.trim()) {
      setSyllabusDiscoveryError("Enter your college or institution name first.");
      return;
    }
    if (!officialWebsiteUrl.trim()) {
      setSyllabusDiscoveryError("Enter the college's official HTTPS website or syllabus page.");
      return;
    }
    setIsDiscoveringSyllabus(true);
    setSyllabusDiscoveryError(null);
    setSyllabusDiscoveryNote(null);
    setSyllabusLinks([]);
    try {
      const response = await fetch("/api/college-syllabus/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: college.trim(),
          officialWebsiteUrl: officialWebsiteUrl.trim(),
          programType,
          branch,
          year: `${year} Year`,
          semester: semester === "I" ? "Semester I" : "Semester II",
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Could not inspect the official website.");
      const links = Array.isArray(data.links) ? data.links : [];
      setSyllabusLinks(links);
      setSyllabusDiscoveryNote(data.note || (links.length ? "Official syllabus links found." : "No syllabus links were found on that page."));
      if (links.length === 0) setSyllabusDiscoveryError("No syllabus or curriculum links were found. Try the college's dedicated academics/syllabus page.");
    } catch (error: any) {
      setSyllabusDiscoveryError(error?.message || "Syllabus discovery failed.");
    } finally {
      setIsDiscoveringSyllabus(false);
    }
  };

  const handleImportOfficialSyllabus = async (link: { title: string; url: string; kind: "pdf" | "page" }) => {
    if (link.kind !== "pdf") {
      setSyllabusDiscoveryError("This is an official academic page, not a direct PDF. Open the page and choose a syllabus PDF link there.");
      return;
    }
    setIsImportingSyllabusUrl(link.url);
    setSyllabusDiscoveryError(null);
    try {
      const response = await fetch("/api/college-syllabus/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: college.trim(),
          officialWebsiteUrl: officialWebsiteUrl.trim(),
          syllabusUrl: link.url,
          programType,
          branch,
          year: `${year} Year`,
          semester: semester === "I" ? "Semester I" : "Semester II",
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Could not import this official PDF.");
      if (typeof data.extractedText !== "string" || data.extractedText.trim().length < 30) {
        throw new Error("The PDF was downloaded, but readable text was not extracted. Upload a text-readable version instead.");
      }
      const profile = data.profile as DocumentProfile | undefined;
      setUploadedFile({
        name: data.fileName || link.title,
        type: "pdf",
        size: "Official syllabus · text extracted",
        content: data.extractedText,
        url: data.syllabusUrl || link.url,
        officialSourceUrl: officialWebsiteUrl.trim(),
        profile,
      });
      setDocProfile(profile || null);
      setSyllabusSourceUrl(data.syllabusUrl || link.url);
      setManualNotes("");
      setShowManualNotes(false);
      if (!subject.trim() && profile?.detectedDomain) setSubject(profile.detectedDomain);
      if (!name.trim()) setName(`${college.trim()} — ${programType} Study Workspace`);
      setSyllabusDiscoveryNote(`Imported ${data.fileName || link.title}. The extracted text is ready for study tools.`);
    } catch (error: any) {
      setSyllabusDiscoveryError(error?.message || "Could not import this syllabus PDF.");
    } finally {
      setIsImportingSyllabusUrl("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isText = file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
    if (!isPdf && !isText) {
      setAnalysisError("For accurate study, upload a text-readable PDF, TXT, Markdown, or paste notes. Other formats are not treated as extracted study material yet.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setAnalysisError("This file is larger than 30 MB. Please upload a smaller document.");
      return;
    }
    setIsAnalyzingDoc(true);
    setAnalysisError(null);
    const reader = new FileReader();

    if (isText) {
      reader.onload = async (event) => {
        const textContent = ((event.target?.result as string) || "").trim();
        if (textContent.length < 30) {
          setIsAnalyzingDoc(false);
          setAnalysisError("This file contains too little readable text to be used as a study source.");
          return;
        }
        const fileObj = {
          name: file.name,
          type: "text",
          size: `${Math.round(file.size / 1024)} KB`,
          content: textContent,
        };
        setUploadedFile(fileObj);

        try {
          const resp = await fetch("/api/workspace/analyze-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: "text",
              content: textContent,
            }),
          });
          const data = await resp.json();
          if (!resp.ok || data.error) throw new Error(data.error || "Document analysis failed.");
          if (typeof data.extractedText !== "string" || data.extractedText.trim().length < 30) {
            throw new Error("No readable text was extracted from this document.");
          }
          if (data.profile) {
            setDocProfile(data.profile);
            setSubject(data.profile.detectedDomain);
            if (!name) setName(`${data.profile.title || data.profile.detectedDomain} Study Workspace`);
            setUploadedFile({
              ...fileObj,
              content: data.extractedText || textContent,
              profile: data.profile,
            });
          }
        } catch (err: any) {
          console.error("Document analysis error:", err);
          setUploadedFile(null);
          setDocProfile(null);
          setAnalysisError(err?.message || "Document analysis failed. The file was not added as a usable study source.");
        } finally {
          setIsAnalyzingDoc(false);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = async (event) => {
        const base64Data = ((event.target?.result as string) || "").split(",")[1];
        const fileType = "pdf";
        const fileObj = {
          name: file.name,
          type: fileType,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          base64: base64Data,
        };
        setUploadedFile(fileObj);

        try {
          const resp = await fetch("/api/workspace/analyze-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType,
              base64: base64Data,
            }),
          });
          const data = await resp.json();
          if (data.profile) {
            setDocProfile(data.profile);
            setSubject(data.profile.detectedDomain);
            if (!name) setName(`${data.profile.title || data.profile.detectedDomain} Study Workspace`);
            setUploadedFile({
              ...fileObj,
              content: data.extractedText || "",
              profile: data.profile,
            });
          }
        } catch (err: any) {
          console.error("Document analysis error:", err);
          setAnalysisError("Some parts of this document could not be confidently classified.");
        } finally {
          setIsAnalyzingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalSubject = subject.trim() || docProfile?.detectedDomain || "General Study";
    const finalName = name.trim() || `${finalSubject} Workspace`;

    const initialMaterial = uploadedFile
      ? uploadedFile
      : manualNotes.trim()
      ? {
          name: `${finalSubject}_Study_Notes.txt`,
          type: "notes",
          size: `${Math.round(manualNotes.length / 1024) || 1} KB`,
          content: manualNotes.trim(),
        }
      : undefined;

    const newWs = createWorkspace({
      name: finalName,
      college,
      programType,
      officialWebsiteUrl: officialWebsiteUrl.trim() || undefined,
      syllabusSourceUrl: syllabusSourceUrl || uploadedFile?.url || undefined,
      branch: branch.trim() || "Not specified",
      year,
      semester,
      subject: finalSubject,
      learningGoal,
      documentProfile: docProfile || undefined,
      initialMaterial: initialMaterial ? {
        ...initialMaterial,
        url: "url" in initialMaterial ? initialMaterial.url : undefined,
        officialSourceUrl: "officialSourceUrl" in initialMaterial ? initialMaterial.officialSourceUrl : undefined,
      } : undefined,
    });

    setIsSubmitting(false);
    if (onWorkspaceCreated) {
      onWorkspaceCreated(newWs);
    } else if (onCreated) {
      onCreated(newWs);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div 
        id="create-workspace-modal"
        className="relative w-full max-w-2xl bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-neutral-100 my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Create Study Workspace</h2>
              <p className="text-xs text-neutral-400">Create a source-grounded study space for any college, degree, or subject.</p>
            </div>
          </div>
          <button
            id="close-create-workspace-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Workspace Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Workspace Name <span className="text-neutral-500">(e.g. Data Structures & Algorithms Mastery)</span>
            </label>
            <input
              id="workspace-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DSA Preparation & Exam Sprint"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all"
            />
          </div>

          {/* Institution and program — VITS is the default, but all fields are editable. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-neutral-400" /> College / University
              </label>
              <input
                id="workspace-college-input"
                type="text"
                value={college}
                onChange={(e) => {
                  const nextCollege = e.target.value;
                  setCollege(nextCollege);
                  setSyllabusLinks([]);
                  setSyllabusDiscoveryNote(null);
                  setSyllabusDiscoveryError(null);
                  setSyllabusSourceUrl("");
                  if (nextCollege.trim().toLowerCase() === VITS_COLLEGE_NAME.toLowerCase()) setOfficialWebsiteUrl(VITS_SYLLABUS_URL);
                  else if (nextCollege !== college) setOfficialWebsiteUrl("");
                  setSubject("");
                }}
                placeholder="Enter your college or university"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/60"
                required
              />
              <p className="text-[10px] text-neutral-500 mt-1">Vignan Institute of Technology and Science is preselected.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-neutral-400" /> Degree / Program
              </label>
              <select
                id="workspace-program-select"
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/60"
              >
                {["B.Tech", "B.E.", "B.Sc.", "B.A.", "B.Com.", "BBA", "BCA", "M.Tech", "M.E.", "M.Sc.", "M.A.", "MBA", "MCA", "Diploma", "MBBS / Health Sciences", "Law", "School / High School", "Other / Self-directed"].map((program) => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-neutral-400" /> Branch / Major / Course
              </label>
              <input
                id="workspace-branch-select"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                list={isVitsCollege && programType === "B.Tech" ? "vits-branch-suggestions" : undefined}
                placeholder="e.g. CSE, Physics, Commerce, Nursing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500/60"
              />
              {isVitsCollege && programType === "B.Tech" && (
                <datalist id="vits-branch-suggestions">
                  {VITS_BRANCHES.map((item) => <option key={item} value={item} />)}
                </datalist>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-400" /> Official College Website / Syllabus Page
              </label>
              <input
                id="official-college-website-input"
                type="url"
                value={officialWebsiteUrl}
                onChange={(e) => {
                  setOfficialWebsiteUrl(e.target.value);
                  setSyllabusLinks([]);
                  setSyllabusDiscoveryNote(null);
                  setSyllabusDiscoveryError(null);
                  setSyllabusSourceUrl("");
                }}
                placeholder="https://college.edu/academics/syllabus"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500/60"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Only the official website you enter and approved document links are searched.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20"><Search className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Find the official syllabus</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">AstraMind checks the academic page you provide and lists syllabus links it finds. If a directly downloadable PDF is available, import it into Materials. The app never assumes that a syllabus is correct based on a college name alone.</p>
              </div>
              <button type="button" onClick={handleDiscoverSyllabus} disabled={isDiscoveringSyllabus || !college.trim() || !officialWebsiteUrl.trim()} className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                {isDiscoveringSyllabus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isDiscoveringSyllabus ? "Searching…" : "Find syllabus"}
              </button>
            </div>
            {isVitsCollege && <a href={VITS_SYLLABUS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-blue-300 hover:text-blue-200 underline underline-offset-2">VITS official syllabus page <ExternalLink className="w-3 h-3" /></a>}
            {syllabusDiscoveryNote && <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-300" role="status">{syllabusDiscoveryNote}</div>}
            {syllabusDiscoveryError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200" role="alert">{syllabusDiscoveryError}</div>}
            {syllabusSourceUrl && <div className="text-[11px] text-emerald-300 flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Official syllabus source attached. <a href={syllabusSourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 inline-flex items-center gap-1">Open source <ExternalLink className="w-3 h-3" /></a></div>}
            {syllabusLinks.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">Discovered on the supplied official site · {syllabusLinks.length} links</div>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {syllabusLinks.slice(0, 18).map((link) => (
                    <div key={link.url} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${link.kind === "pdf" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-blue-500/30 bg-blue-500/10 text-blue-300"}`}>{link.kind === "pdf" ? "PDF" : "PAGE"}</span><span className="text-xs font-medium text-white break-words">{link.title}</span></div>
                        <div className="text-[10px] text-neutral-500 mt-1 break-all">{link.host}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 hover:border-neutral-500 px-2.5 py-2 text-[11px] text-neutral-300"><ExternalLink className="w-3 h-3" /> Open</a>
                        {link.kind === "pdf" && (
                          <button type="button" onClick={() => handleImportOfficialSyllabus(link)} disabled={Boolean(isImportingSyllabusUrl)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-2 text-[11px] font-semibold text-white disabled:opacity-50">
                            {isImportingSyllabusUrl === link.url ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            {isImportingSyllabusUrl === link.url ? "Importing…" : "Import PDF"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {syllabusLinks.length > 18 && <p className="text-[10px] text-neutral-500">Showing the top 18 matches. Refine the official page URL if you need a specific program or regulation.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Year & Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Year / Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["1st", "2nd", "3rd", "4th"] as BTechYear[]).map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setYear(yr);
                      if (isVitsCollege && programType === "B.Tech" && VITS_SUBJECTS[yr]?.[0]) {
                        setSubject(VITS_SUBJECTS[yr][0]);
                      }
                    }}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      year === yr
                        ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                        : "bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Term / Semester</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["I", "II"] as BTechSemester[]).map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSemester(sem)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      semester === sem
                        ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                        : "bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject / course: open text input, with optional VITS suggestions only when appropriate. */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-neutral-400" /> Subject / Course
            </label>
            <input
              id="workspace-subject-select"
              type="text"
              list={currentSubjectList.length > 0 ? "vits-subject-suggestions" : undefined}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter a subject, course, module, or learning topic"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500/60"
            />
            {currentSubjectList.length > 0 && (
              <datalist id="vits-subject-suggestions">
                {currentSubjectList.map((item) => <option key={item} value={item} />)}
              </datalist>
            )}
            <p className="text-[10px] text-neutral-500 mt-1">Any subject is supported. VITS subjects appear only as optional suggestions for VITS B.Tech students.</p>
          </div>

          {/* Learning Goal */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-neutral-400" /> Primary Learning Goal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEARNING_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setLearningGoal(goal)}
                  className={`px-3 py-2 text-xs rounded-xl border text-left transition-all ${
                    learningGoal === goal
                      ? "bg-blue-500/15 border-blue-500 text-blue-300 font-medium"
                      : "bg-neutral-950/40 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Material Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Study Material <span className="text-neutral-500">(PDF, TXT, Markdown, or paste notes)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowManualNotes(!showManualNotes)}
                className="text-xs text-blue-400 hover:underline"
              >
                {showManualNotes ? "Upload file instead" : "Paste text notes"}
              </button>
            </div>

            {showManualNotes ? (
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={4}
                placeholder="Paste unit syllabus, lecture notes, formula sheets, or important questions here..."
                className="w-full p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500/60 font-mono"
              />
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{uploadedFile.name}</div>
                          <div className="text-[10px] text-neutral-400">
                            {uploadedFile.size} • {isAnalyzingDoc ? "Extracting text…" : "User-provided source"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setDocProfile(null);
                          setAnalysisError(null);
                        }}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {isAnalyzingDoc && (
                      <div className="p-3.5 rounded-xl bg-neutral-900 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-300 animate-pulse">
                        <Sparkles className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">Reading & Understanding Document...</div>
                          <div className="text-[11px] text-neutral-400">Inspecting sections, terminology, and identifying real academic domain (no bias)</div>
                        </div>
                      </div>
                    )}

                    {docProfile && (
                      <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-700/80 font-mono text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                          <span className="font-bold text-neutral-300 tracking-wider">DOCUMENT</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-sans">
                            Source Profile
                          </span>
                        </div>
                        <div className="py-2.5 space-y-2 border-b border-neutral-800/60 font-sans">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-400">File:</span>
                            <span className="font-medium text-white truncate max-w-[240px]">{docProfile.fileName}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-400">Detected Domain:</span>
                            <span className="font-semibold text-blue-400">{docProfile.detectedDomain}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 text-xs block mb-1">Topics:</span>
                            <ul className="space-y-0.5 pl-2 text-neutral-200 text-[11px]">
                              {docProfile.topics.slice(0, 5).map((t, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <span className="text-blue-400">•</span> {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div>
                              <span className="text-neutral-400">Sections:</span>{" "}
                              <span className="text-white font-medium">{docProfile.estimatedSections > 0 ? docProfile.estimatedSections : "Not detected"}</span>
                            </div>
                            <div>
                              <span className="text-neutral-400">Pages:</span>{" "}
                              <span className="text-white font-medium">{docProfile.pages && docProfile.pages > 0 ? docProfile.pages : "Not detected"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2.5 font-sans space-y-1 text-[11px]">
                          <div className="text-neutral-400 font-medium">Processing status:</div>
                          <div className={docProfile.processingStatus.contentExtracted ? "text-emerald-400 flex items-center gap-1.5" : "text-amber-300 flex items-center gap-1.5"}>
                            <Check className="w-3.5 h-3.5" /> {docProfile.processingStatus.contentExtracted ? "Readable text extracted" : "No readable text confirmed"}
                          </div>
                          <div className={docProfile.processingStatus.topicsIdentified ? "text-emerald-400 flex items-center gap-1.5" : "text-neutral-400 flex items-center gap-1.5"}>
                            <Check className="w-3.5 h-3.5" /> {docProfile.processingStatus.topicsIdentified ? "Topics identified" : "Topics not confirmed"}
                          </div>
                          <div className={docProfile.processingStatus.studyToolsReady ? "text-emerald-400 flex items-center gap-1.5" : "text-amber-300 flex items-center gap-1.5"}>
                            <Check className="w-3.5 h-3.5" /> {docProfile.processingStatus.studyToolsReady ? "Study tools ready" : "Study tools unavailable until extraction succeeds"}
                          </div>
                          {docProfile.confidence === "Low" && (
                            <div className="text-amber-400/90 text-[11px] pt-1 italic">
                              "{docProfile.confidenceNote || "Some parts of this document could not be confidently classified."}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {analysisError && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                        {analysisError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-5 border border-dashed rounded-xl cursor-pointer transition-all ${
                      dragOver
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-neutral-800 hover:border-neutral-700 bg-neutral-950/30"
                    }`}
                  >
                    <Upload className="w-6 h-6 text-neutral-400 mb-1.5" />
                    <p className="text-xs text-neutral-300 font-medium">Click to upload or drag & drop</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Text-readable PDF, TXT, or Markdown. Scanned/image-only PDFs are not yet supported.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-create-workspace-btn"
              type="submit"
              disabled={isSubmitting || isAnalyzingDoc}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? "Creating Workspace..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
