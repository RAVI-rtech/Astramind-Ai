import React, { useState, useRef } from "react";
import { 
  X, 
  Sparkles, 
  FolderKanban, 
  Upload, 
  FileText, 
  Layers, 
  Check, 
  BookOpen, 
  GraduationCap,
  Building,
  Target
} from "lucide-react";
import { 
  VITS_BRANCHES, 
  VITS_SUBJECTS, 
  LEARNING_GOALS, 
  createWorkspace 
} from "../lib/studyWorkspaceStorage";
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
  const [college, setCollege] = useState("Vignan Institute of Technology and Science");
  const [branch, setBranch] = useState<string>(getInitialBranch);
  const [year, setYear] = useState<BTechYear>("2nd");
  const [semester, setSemester] = useState<BTechSemester>("I");
  const [subject, setSubject] = useState(VITS_SUBJECTS["2nd"][0] || "Data Structures & Algorithms");
  const [customSubject, setCustomSubject] = useState("");
  const [learningGoal, setLearningGoal] = useState<LearningGoal>("Prepare for exam");
  
  // File upload & document understanding state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
    size: string;
    content?: string;
    base64?: string;
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

  const currentSubjectList = VITS_SUBJECTS[year] || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    setIsAnalyzingDoc(true);
    setAnalysisError(null);
    const isText = file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md");
    const reader = new FileReader();

    if (isText) {
      reader.onload = async (event) => {
        const textContent = (event.target?.result as string) || "";
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
          setAnalysisError("Some parts of this document could not be confidently classified.");
        } finally {
          setIsAnalyzingDoc(false);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = async (event) => {
        const base64Data = ((event.target?.result as string) || "").split(",")[1];
        const fileType = file.name.endsWith(".pdf") ? "pdf" : file.name.endsWith(".ppt") || file.name.endsWith(".pptx") ? "ppt" : "notes";
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

    const finalSubject = docProfile?.detectedDomain && docProfile.detectedDomain !== "General Academic"
      ? docProfile.detectedDomain
      : subject === "Custom Subject" 
      ? customSubject.trim() || "Engineering Core" 
      : subject;
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
      branch,
      year,
      semester,
      subject: finalSubject,
      learningGoal,
      documentProfile: docProfile || undefined,
      initialMaterial,
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
              <p className="text-xs text-neutral-400">Set up your tailored B.Tech study companion with intelligent notes analysis</p>
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

          {/* College & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-neutral-400" /> College
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-neutral-400" /> Branch
              </label>
              <select
                id="workspace-branch-select"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/60"
              >
                {VITS_BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Year & Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Year</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["1st", "2nd", "3rd", "4th"] as BTechYear[]).map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setYear(yr);
                      if (VITS_SUBJECTS[yr]?.[0]) {
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
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Semester</label>
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

          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-neutral-400" /> Subject
            </label>
            <select
              id="workspace-subject-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/60"
            >
              {currentSubjectList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Custom Subject">+ Enter Custom Subject</option>
            </select>

            {subject === "Custom Subject" && (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject name..."
                className="mt-2 w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-sm text-white focus:outline-none focus:border-blue-500/60"
              />
            )}
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
                Study Material <span className="text-neutral-500">(PDF, PPT, notes, images, or paste text)</span>
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
                  accept=".pdf,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg"
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
                            {uploadedFile.size} • {isAnalyzingDoc ? "Analyzing document content..." : "Source of Truth"}
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
                              <span className="text-neutral-400">Estimated Sections:</span>{" "}
                              <span className="text-white font-medium">{docProfile.estimatedSections}</span>
                            </div>
                            <div>
                              <span className="text-neutral-400">Pages:</span>{" "}
                              <span className="text-white font-medium">{docProfile.pages || 1}</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2.5 font-sans space-y-1 text-[11px]">
                          <div className="text-neutral-400 font-medium">Processing:</div>
                          <div className="text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Content extracted
                          </div>
                          <div className="text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Topics identified
                          </div>
                          <div className="text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Study tools ready
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
                    <p className="text-[11px] text-neutral-500 mt-0.5">PDF, PPTX, lecture notes, or syllabus (optional)</p>
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
              disabled={isSubmitting}
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
