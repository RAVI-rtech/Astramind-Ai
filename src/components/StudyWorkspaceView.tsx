import React, { useState, useEffect, useRef } from "react";
import {
  FolderKanban,
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle2,
  Check,
  AlertCircle,
  Clock,
  Award,
  ArrowRight,
  RotateCw,
  Plus,
  Trash2,
  Upload,
  FileText,
  HelpCircle,
  Send,
  Eye,
  Edit2,
  Brain,
  ChevronRight,
  TrendingUp,
  Bookmark,
  Flag,
  ListOrdered,
  X,
  Code,
  FileCheck,
  Copy,
  CheckCheck,
  RefreshCw,
  Lightbulb,
  ExternalLink,
  HardDrive,
  Search,
  Database,
  Filter
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  StudyWorkspace,
  StudyMaterial,
  GuidedLesson,
  Flashcard,
  QuizQuestion,
  QuizResult,
  MockExam,
  ImportantQuestion,
  DocumentProfile,
  SummaryNotesData,
  PracticeExercise,
  SourceMode,
  StudyContext,
  KnowledgeBaseStatus,
  LearningActivityRecord,
  KnowledgeDocument,
  KnowledgeChunk,
  KnowledgeQueryResult
} from "../types";
import {
  updateWorkspace,
  addMaterialToWorkspace,
  removeMaterialFromWorkspace,
  renameMaterial,
  getSavedLessons,
  saveGuidedLesson,
  getSavedFlashcards,
  saveFlashcards,
  getSavedQuizResults,
  saveQuizResult,
  getSavedMockExams,
  saveMockExam,
  getWorkspaces,
  getActiveWorkspace,
  DEFAULT_INITIAL_WORKSPACE,
  VR25_CURRICULUM,
  getLearningActivities,
  saveLearningActivity
} from "../lib/studyWorkspaceStorage";
import PDFStudyView from "./PDFStudyView";
import { setActivePDFDocument } from "../lib/pdfStudyStorage";

export type WorkspaceTab =
  | "overview"
  | "materials"
  | "pdf-study"
  | "knowledge-base"
  | "ai-tutor"
  | "tutor"
  | "lessons"
  | "learn"
  | "mcq"
  | "flashcards"
  | "mock-exam"
  | "exam"
  | "important-questions"
  | "important"
  | "summary-notes"
  | "practice"
  | "progress";

export interface StudyWorkspaceViewProps {
  workspace?: StudyWorkspace | null;
  onUpdateWorkspace?: (updated: StudyWorkspace) => void;
  onOpenCreateModal?: () => void;
  onOpenCreateWorkspace?: () => void;
  onSwitchWorkspace?: (workspaceId: string) => void;
  onSelectWorkspace?: (workspace: StudyWorkspace) => void;
  onStartChatWithPrompt?: (prompt: string) => void;
  allWorkspaces?: StudyWorkspace[];
  initialTab?: any;
  accentColorClass?: string;
}

export default function StudyWorkspaceView({
  workspace: propWorkspace,
  onUpdateWorkspace,
  onOpenCreateModal,
  onOpenCreateWorkspace,
  onSwitchWorkspace,
  onSelectWorkspace,
  onStartChatWithPrompt,
  allWorkspaces: propAllWorkspaces,
  initialTab = "overview",
  accentColorClass = "text-blue-400"
}: StudyWorkspaceViewProps) {
  const allWorkspaces = propAllWorkspaces || getWorkspaces();
  const workspace = propWorkspace || getActiveWorkspace() || allWorkspaces[0] || DEFAULT_INITIAL_WORKSPACE;
  const handleOpenCreateModal = onOpenCreateWorkspace || onOpenCreateModal || (() => {});
  const handleSwitchWorkspace = (wsId: string) => {
    if (onSwitchWorkspace) {
      onSwitchWorkspace(wsId);
    } else if (onSelectWorkspace) {
      const found = allWorkspaces.find((w) => w.id === wsId);
      if (found) onSelectWorkspace(found);
    }
  };

  // Normalize initialTab in case callers pass alternate naming
  const normalizedInitialTab: WorkspaceTab = 
    initialTab === "learn" ? "lessons" :
    initialTab === "exam" ? "mock-exam" :
    initialTab === "important" ? "important-questions" :
    initialTab === "tutor" ? "ai-tutor" :
    (initialTab as WorkspaceTab) || "overview";

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(normalizedInitialTab);
  
  // Update activeTab if initialTab prop changes
  useEffect(() => {
    const normalized: WorkspaceTab = 
      initialTab === "learn" ? "lessons" :
      initialTab === "exam" ? "mock-exam" :
      initialTab === "important" ? "important-questions" :
      initialTab === "tutor" ? "ai-tutor" :
      (initialTab as WorkspaceTab) || "overview";
    setActiveTab(normalized);
  }, [initialTab]);

  // Sub-tab States
  // 1. Lessons
  const [lessons, setLessons] = useState<GuidedLesson[]>(() => getSavedLessons(workspace.id));
  const [currentLesson, setCurrentLesson] = useState<GuidedLesson | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [selectedLessonAnswer, setSelectedLessonAnswer] = useState<number | null>(null);
  const [lessonAnswerSubmitted, setLessonAnswerSubmitted] = useState(false);

  // 2. Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => getSavedFlashcards(workspace.id));
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState<number>(10);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [customCountInput, setCustomCountInput] = useState("10");
  const [flashcardDifficulty, setFlashcardDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [flashcardTopic, setFlashcardTopic] = useState<string>("All Topics");

  // 3. Quizzes
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuizQIdx, setCurrentQuizQIdx] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizCount, setQuizCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState("Medium");
  const [quizQuestionType, setQuizQuestionType] = useState<string>("All Types");
  const [quizTopic, setQuizTopic] = useState(workspace.detectedTopics[0] || workspace.subject);
  const [missedQuizTopics, setMissedQuizTopics] = useState<string[]>([]);

  // 4. Mock Exam
  const [mockExams, setMockExams] = useState<MockExam[]>(() => getSavedMockExams(workspace.id));
  const [activeExam, setActiveExam] = useState<MockExam | null>(null);
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [examUserAnswers, setExamUserAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [currentExamQIdx, setCurrentExamQIdx] = useState(0);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // 5. Important Questions
  const [importantQuestions, setImportantQuestions] = useState<ImportantQuestion[]>([]);
  const [isGeneratingIQ, setIsGeneratingIQ] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("All");
  const [expandedIQ, setExpandedIQ] = useState<Record<string, boolean>>({});

  // 6. Summary / Notes
  const [summaryNotes, setSummaryNotes] = useState<SummaryNotesData | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // 7. Interactive Practice
  const [practiceExercises, setPracticeExercises] = useState<PracticeExercise[]>([]);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState(workspace.detectedTopics[0] || workspace.subject);
  const [practiceDifficulty, setPracticeDifficulty] = useState("Medium");
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  // 8. AI Tutor chat inside workspace
  const [actionError, setActionError] = useState<string | null>(null);
  const [tutorMessages, setTutorMessages] = useState<Array<{
    sender: "user" | "ai";
    text: string;
    citations?: Array<{
      documentName: string;
      pageNumber: number;
      subject: string;
      unit: string;
      sourceUrl?: string;
    }>;
  }>>([
    {
      sender: "ai",
      text: "Upload a readable PDF, TXT, Markdown, or notes file in Materials first. I will ground explanations in extracted text and will not invent document content or citations.",
    },
  ]);
  const [tutorInput, setTutorInput] = useState("");
  const [isTutorThinking, setIsTutorThinking] = useState(false);
  const tutorMessagesEndRef = useRef<HTMLDivElement>(null);

  // Start with source material uploaded by the student, not an assumed master syllabus.
  const [sourceMode, setSourceMode] = useState<SourceMode>("uploaded_material");
  const [studyContext, setStudyContext] = useState<StudyContext>(() => ({
    regulation: "",
    year: workspace.year ? (/year/i.test(workspace.year) || workspace.year === "Not applicable" ? workspace.year : `${workspace.year} Year`) : "",
    semester: workspace.semester
      ? (/(semester|term|trimester|quarter)/i.test(workspace.semester) || ["Annual", "Not applicable"].includes(workspace.semester)
        ? workspace.semester
        : `Semester ${workspace.semester}`)
      : "",
    branch: workspace.branch || "",
    subject: workspace.subject || "",
    unit: "",
    sourceType: "uploaded_material",
    sourceDocumentIds: workspace.materials.map((material) => material.id),
  }));

  const [kbStatus, setKbStatus] = useState<KnowledgeBaseStatus | null>(null);
  const [kbDocuments, setKbDocuments] = useState<KnowledgeDocument[]>([]);
  const [kbSearchQuery, setKbSearchQuery] = useState("");
  const [kbSearchResults, setKbSearchResults] = useState<KnowledgeQueryResult | null>(null);
  const [isSearchingKb, setIsSearchingKb] = useState(false);
  const [selectedKbSubject, setSelectedKbSubject] = useState<string>("All");
  const [isSyncingKb, setIsSyncingKb] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [learningActivities, setLearningActivities] = useState<LearningActivityRecord[]>(() =>
    getLearningActivities(workspace.id)
  );

  // Fetch KB Status and documents on load
  useEffect(() => {
    fetch("/api/knowledge-base/status")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setKbStatus(data);
      })
      .catch((e) => console.warn("Could not fetch KB status:", e));

    fetch("/api/knowledge-base/documents")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.documents)) setKbDocuments(data.documents);
      })
      .catch((e) => console.warn("Could not fetch KB documents:", e));
  }, []);

  const handleSearchKb = async (queryText?: string) => {
    const q = queryText || kbSearchQuery.trim();
    if (!q) return;
    if (queryText) setKbSearchQuery(queryText);
    setIsSearchingKb(true);
    try {
      const resp = await fetch("/api/knowledge-base/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          studyContext: selectedKbSubject !== "All" ? { subject: selectedKbSubject } : undefined,
          topK: 5,
        }),
      });
      const data = await resp.json();
      if (data && !data.error) {
        setKbSearchResults(data);
      }
    } catch (err) {
      console.error("Knowledge base query failed:", err);
    } finally {
      setIsSearchingKb(false);
    }
  };

  const handleSyncKnowledgeBase = async () => {
    setIsSyncingKb(true);
    setSyncSuccessMessage(null);
    setSyncErrorMessage(null);
    try {
      const resp = await fetch("/api/knowledge-base/sync", { method: "POST" });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "The server did not confirm a successful import.");
      if (!data.status) throw new Error("The server did not confirm an indexed result.");
      setKbStatus(data.status);
      setSyncSuccessMessage(`Sync completed: ${data.status.totalDocuments} documents and ${data.status.totalChunks} chunks indexed.`);
      const docsResp = await fetch("/api/knowledge-base/documents");
      const docs = await docsResp.json();
      if (Array.isArray(docs.documents)) setKbDocuments(docs.documents);
    } catch (error: any) {
      setSyncErrorMessage(error?.message || "Knowledge-base sync failed.");
    } finally {
      setIsSyncingKb(false);
    }
  };

  // 9. Materials upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialName, setEditingMaterialName] = useState("");

  // Sync when workspace changes
  useEffect(() => {
    setLessons(getSavedLessons(workspace.id));
    setFlashcards(getSavedFlashcards(workspace.id));
    setMockExams(getSavedMockExams(workspace.id));
    setCurrentLesson(null);
    setQuizActive(false);
    setActiveExam(null);
    setQuizTopic(workspace.detectedTopics[0] || workspace.subject);
  }, [workspace.id]);

  // Exam timer
  useEffect(() => {
    if (!activeExam || examSubmitted || examTimeRemaining <= 0) return;
    const timer = setInterval(() => {
      setExamTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, examSubmitted, examTimeRemaining]);

  // Scroll tutor chat
  useEffect(() => {
    tutorMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tutorMessages]);

  // Helper to get all extracted text from uploaded materials as the single source of truth
  const getExtractedSourceContent = () => workspace.materials
    .filter((material) => typeof material.content === "string" && material.content.trim().length >= 30)
    .map((material) => `--- USER-SUPPLIED SOURCE DOCUMENT: ${material.name} (${material.type}) ---\n${material.content!.trim()}`)
    .join("\n\n");

  const requireWorkspaceSource = (toolName: string): boolean => {
    if (getExtractedSourceContent().trim().length >= 30) return true;
    setActionError(`Upload a readable PDF, TXT, Markdown, or notes file in Materials before using ${toolName}. Files without extracted text are not used as AI source material.`);
    setActiveTab("materials");
    return false;
  };

  // Upload only material whose contents can be extracted and used as genuine study context.
  const handleUploadMaterial = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isText = file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
    if (!isPdf && !isText) {
      setActionError("Upload a text-based PDF, TXT, or Markdown file. Other formats are not currently extractable as reliable study sources.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setActionError("This file is larger than 30 MB. Please upload a smaller document.");
      return;
    }

    setIsAnalyzingUpload(true);
    setActionError(null);
    const addExtractedMaterial = (content: string, profile?: DocumentProfile) => {
      const newMat = addMaterialToWorkspace(workspace.id, {
        name: file.name,
        type: isPdf ? "pdf" : "notes",
        size: isPdf ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : Math.max(1, Math.round(file.size / 1024)) + " KB",
        content,
        profile,
      });
      if (onUpdateWorkspace) {
        onUpdateWorkspace({
          ...workspace,
          subject: profile?.detectedDomain && profile.detectedDomain !== "General Academic" && profile.detectedDomain !== "Unknown / General"
            ? profile.detectedDomain
            : workspace.subject,
          documentProfile: profile || workspace.documentProfile,
          detectedTopics: profile?.topics?.length
            ? Array.from(new Set([...profile.topics, ...workspace.detectedTopics]))
            : workspace.detectedTopics,
          materials: [newMat, ...workspace.materials],
        });
      }
    };

    const reader = new FileReader();
    reader.onerror = () => {
      setIsAnalyzingUpload(false);
      setActionError("The file could not be read. Please try again.");
    };

    if (isText) {
      reader.onload = async (event) => {
        const textContent = String(event.target?.result || "").trim();
        if (textContent.length < 30) {
          setIsAnalyzingUpload(false);
          setActionError("This file does not contain enough readable text to create study material.");
          return;
        }
        let profile: DocumentProfile | undefined;
        try {
          const resp = await fetch("/api/workspace/analyze-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: file.name, fileType: "text", content: textContent }),
          });
          if (resp.ok) {
            const data = await resp.json();
            profile = data.profile;
          }
        } catch (error) {
          console.warn("Document classification unavailable; retaining user text:", error);
        } finally {
          addExtractedMaterial(textContent, profile);
          setIsAnalyzingUpload(false);
        }
      };
      reader.readAsText(file);
      return;
    }

    reader.onload = async (event) => {
      try {
        const dataUrl = String(event.target?.result || "");
        const base64Data = dataUrl.split(",")[1] || "";
        if (!base64Data) throw new Error("The PDF could not be read.");
        const resp = await fetch("/api/workspace/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileType: "pdf", base64: base64Data }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Could not extract text from this PDF.");
        const extractedText = typeof data.extractedText === "string" ? data.extractedText.trim() : "";
        if (extractedText.length < 30) {
          throw new Error("No readable text could be extracted from this PDF. Use a text-based PDF rather than an image-only scan.");
        }
        addExtractedMaterial(extractedText, data.profile);
      } catch (error: any) {
        console.error("Material extraction failed:", error);
        setActionError(error?.message || "Could not extract text from this PDF. It was not added as a study source.");
      } finally {
        setIsAnalyzingUpload(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateLesson = async (customTopic?: string) => {
    if (!requireWorkspaceSource("Guided Lessons")) return;
    const topicToUse = customTopic || workspace.detectedTopics[0] || workspace.subject;
    setIsGeneratingLesson(true);
    setActionError(null);
    setSelectedLessonAnswer(null);
    setLessonAnswerSubmitted(false);

    try {
      const resp = await fetch("/api/workspace/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: workspace.subject,
          topic: topicToUse,
          extractedContent: getExtractedSourceContent().slice(0, 16000),
          materialSummary: workspace.materials.map((m) => m.name + ": " + (m.content || "")).join("\n").slice(0, 1500),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || "Failed to generate lesson from AI service.");
      }
      const newLesson: GuidedLesson = {
        id: "les-" + Date.now().toString(36),
        workspaceId: workspace.id,
        topic: topicToUse,
        conceptTitle: data.conceptTitle || `${topicToUse} Essentials`,
        conceptExplanation: data.conceptExplanation,
        example: data.example,
        checkQuestion: data.checkQuestion,
        completed: false,
      };
      setCurrentLesson(newLesson);
    } catch (e: any) {
      console.error("Lesson generation failed:", e);
      setActionError(e?.message || "Failed to generate lesson. Please check network or AI key configuration.");
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleCompleteLesson = () => {
    if (!currentLesson) return;
    const completedLesson: GuidedLesson = {
      ...currentLesson,
      completed: true,
      userAnsweredCorrectly: selectedLessonAnswer === currentLesson.checkQuestion.correctIndex,
    };
    saveGuidedLesson(workspace.id, completedLesson);
    const updated = [completedLesson, ...lessons.filter((l) => l.id !== completedLesson.id)];
    setLessons(updated);
    setCurrentLesson(null);
  };

  const handleGenerateFlashcards = async () => {
    if (!requireWorkspaceSource("Flashcards")) return;
    setIsGeneratingFlashcards(true);
    setActionError(null);
    try {
      const countToUse = isCustomCount 
        ? Math.max(5, Math.min(50, parseInt(customCountInput, 10) || 10)) 
        : flashcardCount;
      const resp = await fetch("/api/workspace/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: workspace.subject,
          topic: flashcardTopic === "All Topics" ? undefined : flashcardTopic,
          count: countToUse,
          difficulty: flashcardDifficulty,
          extractedContent: getExtractedSourceContent().slice(0, 16000),
          materialsContext: workspace.materials.map((m) => m.name).join(", "),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || "Failed to generate flashcards.");
      }
      if (Array.isArray(data.flashcards)) {
        const formatted: Flashcard[] = data.flashcards.map((f: any, idx: number) => ({
          id: `fc-${Date.now()}-${idx}`,
          workspaceId: workspace.id,
          front: f.front,
          back: f.back,
          topic: f.topic || (flashcardTopic !== "All Topics" ? flashcardTopic : workspace.detectedTopics[0]) || workspace.subject,
          status: "unreviewed",
          difficulty: flashcardDifficulty,
        }));
        saveFlashcards(workspace.id, formatted);
        setFlashcards(formatted);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (e: any) {
      console.error("Flashcards generation failed:", e);
      setActionError(e?.message || "Failed to generate flashcards. Please retry.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleFlashcardStatus = (status: "known" | "needs_revision") => {
    if (flashcards.length === 0) return;
    const current = flashcards[currentCardIndex];
    const updatedCards = [...flashcards];
    updatedCards[currentCardIndex] = {
      ...current,
      status,
      lastReviewed: Date.now(),
    };
    saveFlashcards(workspace.id, updatedCards);
    setFlashcards(updatedCards);

    // Advance to next card
    if (currentCardIndex + 1 < flashcards.length) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!requireWorkspaceSource("Quiz")) return;
    setIsGeneratingQuiz(true);
    setActionError(null);
    try {
      const resp = await fetch("/api/workspace/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: workspace.subject,
          topic: quizTopic,
          count: quizCount,
          difficulty: quizDifficulty,
          questionType: quizQuestionType,
          extractedContent: getExtractedSourceContent().slice(0, 16000),
          materialsContext: workspace.materials.map((m) => m.name).join(", "),
          hasCode: workspace.documentProfile?.hasCode,
          hasFormulas: workspace.documentProfile?.hasFormulas,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || "Failed to generate quiz questions.");
      }
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        setCurrentQuizQIdx(0);
        setSelectedQuizOption(null);
        setUserQuizAnswers({});
        setQuizCompleted(false);
        setMissedQuizTopics([]);
        setQuizActive(true);
      }
    } catch (e: any) {
      console.error("Quiz generation failed:", e);
      setActionError(e?.message || "Failed to generate quiz questions. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleNextQuizQuestion = () => {
    if (selectedQuizOption === null) return;
    const newAnswers = { ...userQuizAnswers, [currentQuizQIdx]: selectedQuizOption };
    setUserQuizAnswers(newAnswers);

    if (currentQuizQIdx + 1 < quizQuestions.length) {
      setCurrentQuizQIdx(currentQuizQIdx + 1);
      setSelectedQuizOption(null);
    } else {
      // Quiz finished
      setQuizCompleted(true);
      let correct = 0;
      const missed: string[] = [];
      quizQuestions.forEach((q, idx) => {
        if (newAnswers[idx] === q.correctIndex) {
          correct++;
        } else {
          missed.push(q.topic || workspace.detectedTopics[0] || workspace.subject);
        }
      });
      const uniqueMissed = Array.from(new Set(missed));
      setMissedQuizTopics(uniqueMissed);

      const result: QuizResult = {
        id: "qr-" + Date.now().toString(36),
        workspaceId: workspace.id,
        subject: workspace.subject,
        timestamp: Date.now(),
        totalQuestions: quizQuestions.length,
        correctCount: correct,
        accuracy: Math.round((correct / quizQuestions.length) * 100),
        questions: quizQuestions,
        userAnswers: newAnswers,
        missedTopics: uniqueMissed,
      };
      saveQuizResult(workspace.id, result);
    }
  };

  const handleStartMockExam = async (durationMinutes: number = 30) => {
    if (!requireWorkspaceSource("Mock Exam")) return;
    setIsGeneratingExam(true);
    setActionError(null);
    try {
      const resp = await fetch("/api/workspace/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: workspace.subject,
          topic: "Assessment based on uploaded material",
          count: 10,
          difficulty: "Hard",
          extractedContent: getExtractedSourceContent().slice(0, 16000),
          materialsContext: workspace.materials.map((m) => m.name).join(", "),
          hasCode: workspace.documentProfile?.hasCode,
          hasFormulas: workspace.documentProfile?.hasFormulas,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || "Failed to generate exam questions.");
      }
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const exam: MockExam = {
          id: "me-" + Date.now().toString(36),
          workspaceId: workspace.id,
          subject: workspace.subject,
          unitsOrTopics: "Uploaded material",
          difficulty: "Hard",
          durationMinutes,
          questions: data.questions,
          createdAt: Date.now(),
        };
        setActiveExam(exam);
        setExamTimeRemaining(durationMinutes * 60);
        setExamUserAnswers({});
        setMarkedForReview([]);
        setCurrentExamQIdx(0);
        setExamSubmitted(false);
      }
    } catch (e: any) {
      console.error("Failed to generate mock exam:", e);
      setActionError(e?.message || "Failed to generate mock exam questions.");
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleSubmitExam = () => {
    if (!activeExam) return;
    setExamSubmitted(true);
    let correct = 0;
    const missedTopics: string[] = [];
    activeExam.questions.forEach((q, idx) => {
      if (examUserAnswers[idx] === q.correctIndex) {
        correct++;
      } else {
        missedTopics.push(q.topic || workspace.detectedTopics[0] || workspace.subject);
      }
    });

    const uniqueWeak = Array.from(new Set(missedTopics));

    const completed: MockExam = {
      ...activeExam,
      completedAt: Date.now(),
      score: correct,
      totalScore: activeExam.questions.length,
      accuracy: Math.round((correct / activeExam.questions.length) * 100),
      userAnswers: examUserAnswers,
      markedForReview,
      weakTopics: uniqueWeak.length > 0 ? uniqueWeak : [workspace.detectedTopics[0] || workspace.subject],
    };

    saveMockExam(workspace.id, completed);
    setMockExams([completed, ...mockExams.filter((m) => m.id !== completed.id)]);
    setActiveExam(completed);
  };

  const handleGenerateImportantQuestions = async () => {
    if (!requireWorkspaceSource("Important Questions")) return;
    setIsGeneratingIQ(true);
    setActionError(null);
    try {
      const resp = await fetch("/api/workspace/generate-important-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: workspace.subject,
          branch: workspace.branch,
          extractedContent: getExtractedSourceContent().slice(0, 16000),
          materialsContext: workspace.materials.map((m) => m.name).join(", "),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || "Failed to generate important questions.");
      }
      if (Array.isArray(data.questions)) {
        setImportantQuestions(data.questions);
      }
    } catch (e: any) {
      console.error("Important questions failed:", e);
      setActionError(e?.message || "Failed to generate important questions.");
    } finally {
      setIsGeneratingIQ(false);
    }
  };

  const handleGenerateSummaryNotes = async () => {
    if (!requireWorkspaceSource("Summary Notes")) return;
    setIsGeneratingSummary(true);
    setActionError(null);
    try {
      const resp = await fetch("/api/workspace/generate-summary-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: workspace.subject,
          extractedContent: getExtractedSourceContent().slice(0, 18000),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Failed to generate summary notes");
      setSummaryNotes(data.notes);
    } catch (e: any) {
      console.error("Summary notes generation failed:", e);
      setActionError(e?.message || "Failed to generate summary notes. Please retry.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGeneratePractice = async () => {
    if (!requireWorkspaceSource("Practice")) return;
    setIsGeneratingPractice(true);
    setActionError(null);
    try {
      const resp = await fetch("/api/workspace/generate-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: workspace.subject,
          topic: practiceTopic,
          difficulty: practiceDifficulty,
          extractedContent: getExtractedSourceContent().slice(0, 16000),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Failed to generate practice exercises");
      if (Array.isArray(data.exercises)) {
        setPracticeExercises(data.exercises);
      }
    } catch (e: any) {
      console.error("Practice exercises generation failed:", e);
      setActionError(e?.message || "Failed to generate practice drills. Please retry.");
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const handleSendTutorMessage = async (queryText?: string, sourceOverride?: string) => {
    const textToSend = queryText || tutorInput.trim();
    if (!textToSend || isTutorThinking) return;
    const sourceToUse = sourceOverride?.trim() || getExtractedSourceContent();
    if (sourceToUse.trim().length < 30 && !requireWorkspaceSource("AI Tutor")) return;

    setTutorMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    if (!queryText) setTutorInput("");
    setIsTutorThinking(true);

    try {
      const resp = await fetch("/api/workspace/ai-tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...tutorMessages.map((m) => ({
              sender: m.sender === "user" ? "user" : "assistant",
              text: m.text,
            })),
            { sender: "user", text: textToSend },
          ],
          subject: workspace.subject,
          extractedContent: sourceToUse.slice(0, 16000),
          college: workspace.college,
          branch: workspace.branch,
          learningGoal: workspace.learningGoal,
          studyContext: {
            ...studyContext,
            regulation: workspace.studyContext?.regulation || "",
            year: workspace.year ? (/year/i.test(workspace.year) || workspace.year === "Not applicable" ? workspace.year : `${workspace.year} Year`) : "",
            semester: workspace.semester
              ? (/(semester|term|trimester|quarter)/i.test(workspace.semester) || ["Annual", "Not applicable"].includes(workspace.semester)
                ? workspace.semester
                : `Semester ${workspace.semester}`)
              : "",
            branch: workspace.branch || "",
            subject: workspace.subject || "",
            unit: workspace.studyContext?.unit || "",
            sourceType: "uploaded_material",
            sourceDocumentIds: workspace.materials.filter((material) => typeof material.content === "string" && material.content.trim().length >= 30).map((material) => material.id),
          },
        }),
      });

      const data = await resp.json();
      if (data.text) {
        setTutorMessages((prev) => [
          ...prev, 
          { 
            sender: "ai", 
            text: data.text, 
            citations: Array.isArray(data.citations) ? data.citations : undefined 
          }
        ]);
      } else {
        setTutorMessages((prev) => [
          ...prev,
          { sender: "ai", text: "The AI tutor returned an empty response. Check the AI provider configuration and retry." },
        ]);
      }
    } catch (e) {
      console.error("Tutor error:", e);
      setTutorMessages((prev) => [
        ...prev,
        { sender: "ai", text: "I encountered a network hiccup. Please click retry or rephrase your question." },
      ]);
    } finally {
      setIsTutorThinking(false);
    }
  };

  const navTabs: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "materials", label: "Materials", icon: FileText },
    { id: "pdf-study", label: "PDF Study", icon: FileText },
    { id: "knowledge-base", label: "Source Library", icon: HardDrive },
    { id: "ai-tutor", label: "AI Tutor", icon: GraduationCap },
    { id: "lessons", label: "Smart Lessons", icon: Layers },
    { id: "flashcards", label: "Flashcards", icon: RotateCw },
    { id: "mcq", label: "Quiz", icon: CheckCircle2 },
    { id: "mock-exam", label: "Mock Test", icon: Award },
    { id: "important-questions", label: "Important Questions", icon: HelpCircle },
    { id: "summary-notes", label: "Summary / Notes", icon: FileCheck },
    { id: "practice", label: "Practice", icon: Code },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d0e] text-[#fcfcfc] overflow-hidden font-sans">
      {/* Workspace Top Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-[#151517] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-[#a78bfa]">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif-studio text-xl font-medium text-white truncate">{workspace.name}</h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-mono-studio bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/25 rounded-full">
                {workspace.subject}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50 mt-0.5 font-mono-studio">
              {workspace.programType && <span>{workspace.programType}</span>}
              {workspace.branch && <><span>•</span><span>{workspace.branch}</span></>}
              {(workspace.year || workspace.semester) && <><span>•</span><span>{[
                workspace.year ? (/year/i.test(workspace.year) || workspace.year === "Not applicable" ? workspace.year : `${workspace.year} Year`) : "",
                workspace.semester ? (/(semester|term|trimester|quarter)/i.test(workspace.semester) || ["Annual", "Not applicable"].includes(workspace.semester) ? workspace.semester : `Semester ${workspace.semester}`) : "",
              ].filter(Boolean).join(" · ")}</span></>}
              {workspace.college && <><span className="hidden md:inline">•</span><span className="hidden md:inline text-white/40">{workspace.college}</span></>}
              {workspace.syllabusSourceUrl && <a href={workspace.syllabusSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 underline underline-offset-2"><ExternalLink className="w-3 h-3" /> Syllabus source</a>}
            </div>
          </div>
        </div>

        {/* Workspace Switcher & Actions */}
        <div className="flex items-center gap-2.5">
          {allWorkspaces.length > 1 && (
            <select
              value={workspace.id}
              onChange={(e) => handleSwitchWorkspace(e.target.value)}
              className="px-3 py-1.5 rounded-full bg-[#0d0d0e] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#a78bfa] cursor-pointer"
            >
              {allWorkspaces.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#151517] text-white">
                  {w.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-semibold rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="hidden sm:inline">New Workspace</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="px-6 border-b border-white/[0.06] bg-[#151517]/60 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "border-[#a78bfa] text-white font-semibold"
                  : "border-transparent text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Workspace Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {actionError && (
          <div className="max-w-5xl mx-auto flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Recommended Next Action Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-neutral-900/60 border border-blue-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-950/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" /> Recommended Next Action
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {workspace.recommendedNextAction || `Study Unit 1 for ${workspace.subject}`}
                </h3>
                <p className="text-xs text-neutral-400">
                  Tailored to your goal: <span className="text-neutral-300 font-medium">{workspace.learningGoal}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("lessons");
                  handleGenerateLesson();
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all shrink-0"
              >
                Start Guided Lesson <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Source Document Profile Card (Source of Truth) */}
            {workspace.documentProfile && (
              <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-700/80 font-mono text-xs shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200 tracking-wider text-sm font-mono">DOCUMENT</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-sans font-medium">
                      Authoritative Source
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    Classification Confidence: <span className={workspace.documentProfile.confidence === "High" ? "text-emerald-400 font-semibold" : workspace.documentProfile.confidence === "Medium" ? "text-blue-400 font-semibold" : "text-amber-400 font-semibold"}>{workspace.documentProfile.confidence}</span>
                  </span>
                </div>

                <div className="space-y-3 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-neutral-400">File:</span>
                    <span className="font-semibold text-white truncate max-w-md">{workspace.documentProfile.fileName}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-neutral-400">Detected Domain:</span>
                    <span className="font-bold text-blue-400 text-sm">{workspace.documentProfile.detectedDomain}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block mb-1.5 font-medium">Topics:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1 text-neutral-200 text-xs">
                      {workspace.documentProfile.topics.map((t, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-blue-400 font-bold">•</span>
                          <span className="truncate">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                      <div className="text-[11px] text-neutral-400">Estimated Sections:</div>
                      <div className="text-base font-bold text-white mt-0.5">{workspace.documentProfile.estimatedSections}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                      <div className="text-[11px] text-neutral-400">Pages:</div>
                      <div className="text-base font-bold text-white mt-0.5">{workspace.documentProfile.pages || 1}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                      <div className="text-[11px] text-neutral-400">Formulas Detected:</div>
                      <div className="text-base font-bold text-white mt-0.5">{workspace.documentProfile.hasFormulas ? "Yes" : "No"}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                      <div className="text-[11px] text-neutral-400">Code / Snippets:</div>
                      <div className="text-base font-bold text-white mt-0.5">{workspace.documentProfile.hasCode ? "Yes" : "No"}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 font-sans space-y-1 text-xs border-t border-neutral-800/60">
                  <div className="text-neutral-400 font-semibold mb-1">Processing:</div>
                  <div className="text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Content extracted
                  </div>
                  <div className="text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Topics identified
                  </div>
                  <div className="text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Study tools ready
                  </div>
                  {workspace.documentProfile.confidence === "Low" && (
                    <div className="text-amber-400 text-xs pt-1.5 italic">
                      "{workspace.documentProfile.confidenceNote || "Some parts of this document could not be confidently classified."}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-xs text-neutral-400">Progress</div>
                <div className="text-xl font-bold text-white mt-1">{workspace.progressPercent}%</div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${workspace.progressPercent}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-xs text-neutral-400">Materials Uploaded</div>
                <div className="text-xl font-bold text-white mt-1">{workspace.materials.length}</div>
                <div className="text-[11px] text-neutral-500 mt-1">PDFs & Notes</div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-xs text-neutral-400">Quiz Accuracy</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {workspace.stats.quizzesAttempted > 0 ? `${workspace.stats.quizAccuracy}%` : "No attempts"}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">{workspace.stats.quizzesAttempted} quizzes taken</div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-xs text-neutral-400">Lessons Completed</div>
                <div className="text-xl font-bold text-white mt-1">{workspace.stats.lessonsCompleted}</div>
                <div className="text-[11px] text-neutral-500 mt-1">Concepts mastered</div>
              </div>
            </div>

            {/* Detected Topics & Materials Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Detected Topics */}
              <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" /> Syllabus & Key Units
                  </h4>
                  <span className="text-[11px] text-neutral-500">{workspace.detectedTopics.length} Units</span>
                </div>
                <div className="space-y-2">
                  {workspace.detectedTopics.map((topic, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/80 flex items-center justify-between hover:border-neutral-700 transition-colors"
                    >
                      <span className="text-xs text-neutral-200 truncate">{topic}</span>
                      <button
                        onClick={() => {
                          setActiveTab("lessons");
                          handleGenerateLesson(topic);
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium shrink-0 ml-2"
                      >
                        Study Unit
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Materials Preview */}
              <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Study Materials
                  </h4>
                  <button
                    onClick={() => setActiveTab("materials")}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Manage
                  </button>
                </div>
                {workspace.materials.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-neutral-800 rounded-xl">
                    <p className="text-xs text-neutral-400">No study materials attached yet.</p>
                    <button
                      onClick={() => setActiveTab("materials")}
                      className="mt-2 text-xs text-blue-400 font-medium hover:underline"
                    >
                      + Upload Notes or PDF
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workspace.materials.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">{m.name}</div>
                            <div className="text-[10px] text-neutral-500">{m.size}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab("ai-tutor")}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-medium shrink-0"
                        >
                          Ask AI
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab("lessons")}
                className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-blue-500/40 hover:bg-neutral-800/30 text-left transition-all"
              >
                <Layers className="w-5 h-5 text-blue-400 mb-1" />
                <div className="text-xs font-semibold text-white">Guided Lessons</div>
                <div className="text-[10px] text-neutral-400">Bite-sized concept checks</div>
              </button>

              <button
                onClick={() => setActiveTab("mcq")}
                className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-emerald-500/40 hover:bg-neutral-800/30 text-left transition-all"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
                <div className="text-xs font-semibold text-white">MCQ Practice</div>
                <div className="text-[10px] text-neutral-400">Test unit-wise knowledge</div>
              </button>

              <button
                onClick={() => setActiveTab("flashcards")}
                className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-purple-500/40 hover:bg-neutral-800/30 text-left transition-all"
              >
                <RotateCw className="w-5 h-5 text-purple-400 mb-1" />
                <div className="text-xs font-semibold text-white">Flashcards</div>
                <div className="text-[10px] text-neutral-400">Rapid term revision</div>
              </button>

              <button
                onClick={() => setActiveTab("important-questions")}
                className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/40 hover:bg-neutral-800/30 text-left transition-all"
              >
                <HelpCircle className="w-5 h-5 text-amber-400 mb-1" />
                <div className="text-xs font-semibold text-white">Important Questions</div>
                <div className="text-[10px] text-neutral-400">Exam question bank</div>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MATERIALS */}
        {/* ========================================================= */}
        {activeTab === "materials" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Workspace Study Materials</h3>
                <p className="text-xs text-neutral-400">Upload and manage lecture notes, syllabus, PDFs, or PPT presentations</p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,.txt,.md,.png,.jpg"
                  onChange={handleUploadMaterial}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all"
                >
                  <Upload className="w-4 h-4" /> Upload Material
                </button>
              </div>
            </div>

            {/* Connected VR25 Master Drive Repository Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">VR25 Google Drive Master Repository</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                      Connected & Indexed
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    Authoritative syllabus notes (BEE, C Programming, M1, CAEG, English) are pre-indexed and ready for source-grounded answers.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab("knowledge-base")}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow"
                >
                  <Database className="w-3.5 h-3.5" /> Browse Master Notes
                </button>
              </div>
            </div>

            {/* Materials List */}
            {workspace.materials.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
                <FileText className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white">No materials uploaded yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                  Upload your notes, PDFs, or presentations to begin intelligent AI analysis, guided lesson generation, and exam quizzes.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium inline-flex items-center gap-2 border border-neutral-700"
                >
                  <Upload className="w-3.5 h-3.5" /> Select PDF or Notes
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {workspace.materials.map((material) => (
                  <div
                    key={material.id}
                    className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-blue-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        {editingMaterialId === material.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingMaterialName}
                              onChange={(e) => setEditingMaterialName(e.target.value)}
                              className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                            />
                            <button
                              onClick={() => {
                                renameMaterial(workspace.id, material.id, editingMaterialName);
                                setEditingMaterialId(null);
                                if (onUpdateWorkspace) {
                                  onUpdateWorkspace({
                                    ...workspace,
                                    materials: workspace.materials.map((m) =>
                                      m.id === material.id ? { ...m, name: editingMaterialName } : m
                                    ),
                                  });
                                }
                              }}
                              className="px-2 py-1 bg-blue-600 rounded text-[11px] text-white"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-white truncate">{material.name}</div>
                        )}
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {material.size} • Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingMaterialId(material.id);
                          setEditingMaterialName(material.name);
                        }}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                        title="Rename"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setActivePDFDocument({
                            id: material.id,
                            title: material.name.replace(/\.[^/.]+$/, ""),
                            fileName: material.name,
                            pageCount: Number(material.profile?.pages) || 0,
                            sourceType: "workspace",
                            uploadedAt: material.uploadedAt || Date.now(),
                            rawContent: material.content,
                            subject: workspace.subject,
                            topics: material.profile?.topics || workspace.detectedTopics,
                          });
                          setActiveTab("pdf-study");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Open in PDF Study Studio"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Study PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          removeMaterialFromWorkspace(workspace.id, material.id);
                          if (onUpdateWorkspace) {
                            onUpdateWorkspace({
                              ...workspace,
                              materials: workspace.materials.filter((m) => m.id !== material.id),
                            });
                          }
                        }}
                        className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: PDF STUDY STUDIO */}
        {/* ========================================================= */}
        {activeTab === "pdf-study" && (
          <div className="h-[calc(100vh-140px)] -m-4 sm:-m-6 flex flex-col">
            <PDFStudyView workspace={workspace} />
          </div>
        )}

        {/* ========================================================= */}
        {/* SOURCE LIBRARY: documents genuinely indexed by this deployment */}
        {/* ========================================================= */}
        {activeTab === "knowledge-base" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header & Sync Controls */}
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">Knowledge Base</h3>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                        (kbStatus?.totalDocuments ?? kbDocuments.length) > 0
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-neutral-800 text-neutral-300 border-neutral-700"
                      }`}>
                        {(kbStatus?.totalDocuments ?? kbDocuments.length) > 0 ? "Indexed content" : "Empty index"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Only genuinely ingested documents are shown here. No demo PDFs, invented chunks, or placeholder statistics are added.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("pdf-study")}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Open PDF Study
                  </button>
                  <button
                    onClick={handleSyncKnowledgeBase}
                    disabled={isSyncingKb}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKb ? "animate-spin" : ""}`} />
                    {isSyncingKb ? "Syncing Drive..." : "Sync Repository"}
                  </button>
                </div>
              </div>

              {syncSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{syncSuccessMessage}</span>
                </div>
              )}
              {syncErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{syncErrorMessage}</span>
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-[11px] text-neutral-400">Indexed Documents</div>
                <div className="text-xl font-bold text-white mt-1">
                  {kbStatus?.totalDocuments ?? kbDocuments.length}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">Ingested source files</div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-[11px] text-neutral-400">Semantic Indexed Chunks</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {kbStatus?.totalChunks ?? 0}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">600–800 token partitions</div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-[11px] text-neutral-400">Indexed Subjects</div>
                <div className="text-base font-bold text-blue-400 mt-1 truncate">{kbStatus?.subjects?.length ?? 0}</div>
                <div className="text-[10px] text-neutral-500 mt-1">Count from the real source index</div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <div className="text-[11px] text-neutral-400">Retrieval</div>
                <div className="text-base font-bold text-purple-400 mt-1">Keyword + Similarity</div>
                <div className="text-[10px] text-neutral-500 mt-1">Only indexed text is searched</div>
              </div>
            </div>

            {/* Interactive RAG Retrieval Explorer */}
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  RAG Query Understanding & Retrieval Playground
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Search only text indexed from real source documents. To study your own syllabus, import it from Create Workspace or upload it in Materials.
                </p>
              </div>

              {/* Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchKb();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={kbSearchQuery}
                    onChange={(e) => setKbSearchQuery(e.target.value)}
                    placeholder="Search or test question (e.g. 'Explain KCL and KVL in electrical circuits')..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!kbSearchQuery.trim() || isSearchingKb}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors shrink-0 shadow-md shadow-blue-600/20"
                >
                  {isSearchingKb ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Search Chunks</span>
                </button>
              </form>

              {/* Search Results Display */}
              {kbSearchResults && (
                <div className="space-y-4 pt-3 border-t border-neutral-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">Classified Scope:</span>
                      <span className="font-semibold text-blue-400">{kbSearchResults.detectedSubject}</span>
                      {kbSearchResults.detectedUnit && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/25 text-[10px] font-medium">
                          {kbSearchResults.detectedUnit}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Retrieved <span className="font-bold text-white">{kbSearchResults.chunks.length}</span> authoritative chunks
                    </div>
                  </div>

                  <div className="space-y-3">
                    {kbSearchResults.chunks.map((item, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              {item.chunk.documentName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                              Page {item.chunk.pageNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-emerald-400 font-medium">
                              Match: {Math.round(item.score * 100)}%
                            </span>
                            {item.relevanceReason && (
                              <span className="text-neutral-400 hidden sm:inline">• {item.relevanceReason}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-neutral-300 bg-neutral-900/70 p-3 rounded-lg border border-neutral-800/80 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {item.chunk.content}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="text-[11px] text-neutral-400">
                            Topic: <span className="text-neutral-200">{item.chunk.topic}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            
                            <button
                              onClick={() => {
                                setActiveTab("ai-tutor");
                                handleSendTutorMessage(`Based on ${item.chunk.documentName} (Page ${item.chunk.pageNumber}), explain ${item.chunk.topic}`, item.chunk.content);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[11px] font-medium transition-colors"
                            >
                              Ask AI Tutor →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Master Curriculum Documents Directory */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Indexed Source Documents
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Only documents actually indexed on the server appear here.
                  </p>
                </div>

                {/* Subject Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    "All",
                    ...Array.from(new Set((kbStatus?.subjects || kbDocuments.map((doc: any) => doc.subject))
                      .filter((subject): subject is string => typeof subject === "string" && subject.trim().length > 0))),
                  ].map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setSelectedKbSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedKbSubject === sub
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
                      }`}
                    >
                      {sub === "All" ? "All Subjects" : sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Documents List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {kbDocuments
                  .filter((d: any) =>
                    selectedKbSubject === "All" ||
                    d.subject.toLowerCase().includes(selectedKbSubject.toLowerCase())
                  )
                  .map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                            {doc.subjectCode || doc.subject}
                          </span>
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${
                            doc.status === "indexed"
                              ? "text-emerald-400"
                              : doc.status === "pending"
                              ? "text-amber-300"
                              : "text-rose-300"
                          }`}>
                            {doc.status === "indexed" ? "Indexed" : doc.status === "pending" ? "Pending" : "Failed"}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white truncate">{doc.documentName}</h5>
                        <p className="text-[11px] text-neutral-400">{doc.subject} • {doc.unit || "All Units"}</p>
                      </div>

                      <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                        <span>{typeof doc.pageCount === "number" && doc.pageCount > 0 ? `PDF • ${doc.pageCount} Pages` : doc.mimeType || "Page count unavailable"}</span>
                        <div className="flex items-center gap-2">
                          
                        </div>
                      </div>
                    </div>
                  ))}
                {kbDocuments.length === 0 && (
                  <div className="col-span-full p-8 text-center border border-dashed border-neutral-700 rounded-2xl bg-neutral-950/30 space-y-3">
                    <Database className="w-8 h-8 text-neutral-500 mx-auto" />
                    <h5 className="text-sm font-semibold text-white">No indexed documents yet</h5>
                    <p className="text-xs text-neutral-400 max-w-xl mx-auto">
                      This deployment does not have live Google Drive ingestion configured. No sample PDFs or invented chunks are added. Upload your PDF or text notes in Materials to use the source-grounded study tools.
                    </p>
                    <button
                      onClick={() => setActiveTab("materials")}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Go to Materials
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AI TUTOR */}
        {/* ========================================================= */}
        {activeTab === "ai-tutor" && (
          <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-220px)]">
            {/* Quick Actions Pills */}
            <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-none shrink-0">
              {[
                "Explain this topic simply",
                "Summarize material",
                "Give an engineering example",
                "Ask me a concept question",
                "Create practice questions",
                "Prepare me for semester exam",
              ].map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSendTutorMessage(pill)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-blue-500/40 hover:bg-neutral-800 text-[11px] text-neutral-300 whitespace-nowrap transition-all"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800/80 mb-3">
              {tutorMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "ai" && (
                    <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-neutral-900/90 text-neutral-200 border border-neutral-800 rounded-bl-sm"
                    }`}
                  >
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {/* Grounded Source Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-neutral-800/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Source references</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cite, cIdx) => (
                            <div
                              key={cIdx}
                              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-950/80 border border-emerald-500/25 text-[11px] text-neutral-200"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-medium text-white truncate max-w-[180px]">{cite.documentName}</span>
                              {typeof cite.pageNumber === "number" && cite.pageNumber > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">p. {cite.pageNumber}</span>
                              )}
                              <span className="text-[10px] text-neutral-400 hidden sm:inline">({cite.unit || cite.subject})</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">Source reference</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTutorThinking && (
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
                  <span>AstraMind Tutor is analyzing syllabus & notes...</span>
                </div>
              )}
              <div ref={tutorMessagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTutorMessage();
              }}
              className="flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                placeholder={`Ask anything about ${workspace.subject}...`}
                className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!tutorInput.trim() || isTutorThinking}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: LESSONS */}
        {/* ========================================================= */}
        {activeTab === "lessons" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Guided Learning Lessons</h3>
                <p className="text-xs text-neutral-400">AI-generated concept explanations with interactive concept checks</p>
              </div>
              <button
                onClick={() => handleGenerateLesson()}
                disabled={isGeneratingLesson}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingLesson ? "Generating Lesson..." : "+ Generate Guided Lesson"}
              </button>
            </div>

            {/* Active Guided Lesson Display */}
            {currentLesson ? (
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full">
                      {currentLesson.topic}
                    </span>
                    <h3 className="text-lg font-bold text-white">{currentLesson.conceptTitle}</h3>
                  </div>
                  <button
                    onClick={() => setCurrentLesson(null)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                {/* Concept Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Concept Explanation</h4>
                  <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed bg-neutral-950/40 p-4 rounded-xl border border-neutral-800/80">
                    <ReactMarkdown>{currentLesson.conceptExplanation}</ReactMarkdown>
                  </div>
                </div>

                {/* Engineering Example */}
                {currentLesson.example && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Engineering Example / Implementation</h4>
                    <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed bg-purple-950/20 p-4 rounded-xl border border-purple-800/30">
                      <ReactMarkdown>{currentLesson.example}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Concept Check Question */}
                <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4" /> Concept Check
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white">{currentLesson.checkQuestion.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentLesson.checkQuestion.options.map((opt, optIdx) => {
                      const isSelected = selectedLessonAnswer === optIdx;
                      const isCorrect = optIdx === currentLesson.checkQuestion.correctIndex;
                      let btnStyle = "bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700";

                      if (lessonAnswerSubmitted) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-blue-500/20 border-blue-500 text-blue-300 font-semibold";
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={lessonAnswerSubmitted}
                          onClick={() => setSelectedLessonAnswer(optIdx)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                        >
                          <span className="font-mono text-neutral-400 mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {!lessonAnswerSubmitted ? (
                    <button
                      disabled={selectedLessonAnswer === null}
                      onClick={() => setLessonAnswerSubmitted(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                    >
                      Verify Answer
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {selectedLessonAnswer === currentLesson.checkQuestion.correctIndex ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Correct! Excellent grasp of the concept.
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Review needed.
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-300">{currentLesson.checkQuestion.explanation}</p>
                      <button
                        onClick={handleCompleteLesson}
                        className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Concept Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.length === 0 ? (
                  <div className="p-10 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
                    <Layers className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-white">No lessons completed yet</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                      Generate your first bite-sized lesson on {workspace.subject} to start building your conceptual mastery.
                    </p>
                    <button
                      onClick={() => handleGenerateLesson()}
                      disabled={isGeneratingLesson}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate First Lesson
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Completed Lessons ({lessons.length})</h4>
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                              Mastered
                            </span>
                            <span className="text-sm font-semibold text-white">{lesson.conceptTitle}</span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-1">{lesson.topic}</p>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentLesson(lesson);
                            setSelectedLessonAnswer(lesson.checkQuestion.correctIndex);
                            setLessonAnswerSubmitted(true);
                          }}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          Review Lesson
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: MCQ QUIZ */}
        {/* ========================================================= */}
        {activeTab === "mcq" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!quizActive ? (
              <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">Source-Driven Practice Quiz</h3>
                  <p className="text-xs text-neutral-400">
                    Real AI questions extracted directly from {workspace.documentProfile?.fileName ? `"${workspace.documentProfile.fileName}"` : workspace.subject}. No generic or unrelated math.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Topic</label>
                    <select
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                    >
                      {workspace.detectedTopics.map((t, idx) => (
                        <option key={idx} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Number of Questions</label>
                    <select
                      value={quizCount}
                      onChange={(e) => setQuizCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Question Format</label>
                    <select
                      value={quizQuestionType}
                      onChange={(e) => setQuizQuestionType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                    >
                      <option value="All Types">Mixed Formats</option>
                      <option value="MCQs">MCQs Only</option>
                      <option value="True/False">True / False</option>
                      <option value="Concept">Concept & Definitions</option>
                      <option value="Application">Application Scenarios</option>
                      {workspace.documentProfile?.hasCode && (
                        <option value="Code">Code & Syntax</option>
                      )}
                      {workspace.documentProfile?.hasFormulas && (
                        <option value="Numerical">Numerical & Calculations</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">Difficulty</label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                    >
                      <option value="Easy">Easy (Conceptual)</option>
                      <option value="Medium">Medium (Standard Exam)</option>
                      <option value="Hard">Hard (Deep Analytical)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleStartQuiz}
                  disabled={isGeneratingQuiz}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGeneratingQuiz ? "Generating Document-Grounded Quiz..." : "Start Practice Quiz"}
                </button>
              </div>
            ) : !quizCompleted ? (
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      Question <span className="text-white font-bold">{currentQuizQIdx + 1}</span> of {quizQuestions.length}
                    </span>
                    {quizQuestions[currentQuizQIdx]?.questionType && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                        {quizQuestions[currentQuizQIdx]?.questionType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setQuizActive(false)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Quit Quiz
                  </button>
                </div>

                {/* Current Question */}
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-medium text-white leading-snug">
                    {quizQuestions[currentQuizQIdx]?.question}
                  </h3>

                  <div className="space-y-2.5">
                    {quizQuestions[currentQuizQIdx]?.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => setSelectedQuizOption(optIdx)}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center gap-3 ${
                          selectedQuizOption === optIdx
                            ? "bg-blue-600/20 border-blue-500 text-white font-semibold"
                            : "bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                        }`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-400">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-neutral-800">
                  <button
                    disabled={selectedQuizOption === null}
                    onClick={handleNextQuizQuestion}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md disabled:opacity-50 transition-all"
                  >
                    {currentQuizQIdx + 1 === quizQuestions.length ? "Submit Quiz" : "Next Question"}{" "}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Results Review */
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-6">
                <div className="text-center py-4 border-b border-neutral-800">
                  <Award className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-white">Quiz Completed!</h3>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {Object.values(userQuizAnswers).filter((ans, idx) => ans === quizQuestions[idx]?.correctIndex).length} / {quizQuestions.length} Correct
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Your answers and explanations are detailed below</p>
                </div>

                {/* Review Questions */}
                <div className="space-y-4">
                  {quizQuestions.map((q, idx) => {
                    const userAns = userQuizAnswers[idx];
                    const isCorrect = userAns === q.correctIndex;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          isCorrect ? "bg-emerald-950/20 border-emerald-800/40" : "bg-rose-950/20 border-rose-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">Question {idx + 1}</span>
                            {q.questionType && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-300 uppercase">
                                {q.questionType.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          <span className={isCorrect ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                            {isCorrect ? "Correct (+1)" : "Incorrect"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-200 mb-2">{q.question}</p>
                        <div className="text-xs text-neutral-400">
                          Your answer: <span className="text-white font-medium">{q.options[userAns]}</span>
                        </div>
                        {!isCorrect && (
                          <div className="text-xs text-emerald-400 mt-0.5">
                            Correct answer: <span className="font-medium">{q.options[q.correctIndex]}</span>
                          </div>
                        )}
                        <p className="text-[11px] text-neutral-400 mt-2 bg-neutral-950/50 p-2.5 rounded-lg">
                          <span className="font-semibold text-neutral-300">Explanation: </span>
                          {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setQuizActive(false)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Take Another Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: FLASHCARDS */}
        {/* ========================================================= */}
        {activeTab === "flashcards" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Flashcard Configuration & Control Bar */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-purple-400" /> Source-Grounded Flashcards
                  </h3>
                  <p className="text-xs text-neutral-400">
                    High-yield active recall cards preserving terminology directly from {workspace.documentProfile?.fileName ? `"${workspace.documentProfile.fileName}"` : workspace.subject}
                  </p>
                </div>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={isGeneratingFlashcards}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-600/25 transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  <RotateCw className={`w-4 h-4 ${isGeneratingFlashcards ? "animate-spin" : ""}`} />
                  {isGeneratingFlashcards ? "Generating Cards..." : flashcards.length > 0 ? "Regenerate Cards" : "Generate Flashcards"}
                </button>
              </div>

              {/* Controls Row: Topic, Card Count (10, 20, 50, custom), Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800/80 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Topic Scope</label>
                  <select
                    value={flashcardTopic}
                    onChange={(e) => setFlashcardTopic(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200"
                  >
                    <option value="All Topics">All Document Topics</option>
                    {workspace.detectedTopics.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Card Count</label>
                  <div className="flex items-center gap-1">
                    {[10, 20, 50].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setIsCustomCount(false);
                          setFlashcardCount(cnt);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                          !isCustomCount && flashcardCount === cnt
                            ? "bg-purple-600 border-purple-500 text-white font-semibold"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCustomCount(true)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                        isCustomCount
                          ? "bg-purple-600 border-purple-500 text-white font-semibold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Custom
                    </button>
                    {isCustomCount && (
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={customCountInput}
                        onChange={(e) => setCustomCountInput(e.target.value)}
                        className="w-14 px-2 py-1 bg-neutral-950 border border-purple-500 rounded-lg text-white text-xs text-center"
                        placeholder="Count"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Difficulty</label>
                  <select
                    value={flashcardDifficulty}
                    onChange={(e) => setFlashcardDifficulty(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200"
                  >
                    <option value="Easy">Easy (Definitions & Terms)</option>
                    <option value="Medium">Medium (Conceptual Recall)</option>
                    <option value="Hard">Hard (Deep Mechanics)</option>
                  </select>
                </div>
              </div>
            </div>

            {flashcards.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
                <RotateCw className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white">No flashcards generated yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                  Select your options above and click "Generate Flashcards" to create high-yield spaced repetition revision cards strictly from your uploaded material.
                </p>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={isGeneratingFlashcards}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate First Set
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Stats & Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Card {currentCardIndex + 1} of {flashcards.length}</span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-purple-400 font-medium">{flashcards[currentCardIndex]?.topic}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      ✓ {flashcards.filter((c) => c.status === "known").length} Mastered
                    </span>
                    <span className="text-rose-400 flex items-center gap-1 font-medium">
                      ✗ {flashcards.filter((c) => c.status === "needs_revision").length} Review
                    </span>
                    <button
                      onClick={() => {
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }}
                      className="text-xs text-blue-400 hover:underline ml-2"
                    >
                      Restart Cards
                    </button>
                  </div>
                </div>

                {/* 3D Interactive Card */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[260px] p-8 rounded-3xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-neutral-700 transition-all select-none"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="uppercase tracking-wider font-semibold text-purple-400">
                      {isFlipped ? "Answer / Conceptual Explanation" : "Prompt / Question / Technical Term"}
                    </span>
                    <span className="text-[11px] bg-neutral-800/80 px-2 py-0.5 rounded text-neutral-300">
                      Click anywhere to flip
                    </span>
                  </div>

                  <div className="my-6 text-center">
                    <h3 className="text-base sm:text-xl font-bold text-white leading-relaxed">
                      {isFlipped ? flashcards[currentCardIndex]?.back : flashcards[currentCardIndex]?.front}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>
                      Status: <span className={flashcards[currentCardIndex]?.status === "known" ? "text-emerald-400 font-medium" : flashcards[currentCardIndex]?.status === "needs_revision" ? "text-rose-400 font-medium" : "text-neutral-400"}>{flashcards[currentCardIndex]?.status || "unreviewed"}</span>
                    </span>
                    <span className="text-neutral-500 italic">Source Grounded</span>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleFlashcardStatus("needs_revision")}
                    className="flex-1 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Needs Revision</span>
                  </button>
                  <button
                    onClick={() => handleFlashcardStatus("known")}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Know / Mastered</span>
                  </button>
                  <button
                    onClick={() => {
                      if (currentCardIndex + 1 < flashcards.length) {
                        setCurrentCardIndex(currentCardIndex + 1);
                        setIsFlipped(false);
                      } else {
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }
                    }}
                    className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-all"
                  >
                    Next Card →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: MOCK EXAM */}
        {/* ========================================================= */}
        {activeTab === "mock-exam" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!activeExam ? (
              <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white">University Mock Exam Simulator</h3>
                  <p className="text-xs text-neutral-400">
                    Simulate real JNTU / Autonomous university semester conditions with timed countdown, review palette, and post-exam diagnostics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800">
                    <div className="text-xs text-neutral-400">Questions</div>
                    <div className="text-base font-bold text-white mt-1">10 Questions</div>
                    <div className="text-[11px] text-neutral-500">Covering all Units</div>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800">
                    <div className="text-xs text-neutral-400">Time Limit</div>
                    <div className="text-base font-bold text-white mt-1">30 Minutes</div>
                    <div className="text-[11px] text-neutral-500">Countdown timer</div>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800">
                    <div className="text-xs text-neutral-400">Negative Marking</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">None</div>
                    <div className="text-[11px] text-neutral-500">Standard University</div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartMockExam(30)}
                  disabled={isGeneratingExam}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  <Award className="w-4 h-4" />
                  {isGeneratingExam ? "Generating University Exam Paper..." : "Launch Timed Mock Exam"}
                </button>
              </div>
            ) : !examSubmitted ? (
              /* Active Mock Exam Environment */
              <div className="space-y-5">
                {/* Sticky Exam Timer Bar */}
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeExam.subject} Examination</h3>
                    <div className="text-[11px] text-neutral-400">Question {currentExamQIdx + 1} of {activeExam.questions.length}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-sm font-bold text-yellow-400">
                      <Clock className="w-4 h-4" />
                      {Math.floor(examTimeRemaining / 60)}:{(examTimeRemaining % 60).toString().padStart(2, "0")}
                    </div>
                    <button
                      onClick={handleSubmitExam}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                    >
                      Submit Paper
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {/* Left: Question Content */}
                  <div className="md:col-span-3 p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <span className="text-xs font-semibold text-blue-400">QUESTION {currentExamQIdx + 1}</span>
                      <button
                        onClick={() => {
                          if (markedForReview.includes(currentExamQIdx)) {
                            setMarkedForReview(markedForReview.filter((idx) => idx !== currentExamQIdx));
                          } else {
                            setMarkedForReview([...markedForReview, currentExamQIdx]);
                          }
                        }}
                        className={`text-xs flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
                          markedForReview.includes(currentExamQIdx)
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-medium"
                            : "border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" /> Mark for Review
                      </button>
                    </div>

                    <h4 className="text-sm sm:text-base font-medium text-white leading-relaxed">
                      {activeExam.questions[currentExamQIdx]?.question}
                    </h4>

                    <div className="space-y-3">
                      {activeExam.questions[currentExamQIdx]?.options.map((opt, optIdx) => {
                        const isSelected = examUserAnswers[currentExamQIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => setExamUserAnswers({ ...examUserAnswers, [currentExamQIdx]: optIdx })}
                            className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-center gap-3 transition-all ${
                              isSelected
                                ? "bg-blue-600/20 border-blue-500 text-white font-medium"
                                : "bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                            }`}
                          >
                            <span className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-400 shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                      <button
                        disabled={currentExamQIdx === 0}
                        onClick={() => setCurrentExamQIdx(currentExamQIdx - 1)}
                        className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        disabled={currentExamQIdx + 1 === activeExam.questions.length}
                        onClick={() => setCurrentExamQIdx(currentExamQIdx + 1)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-40"
                      >
                        Next Question
                      </button>
                    </div>
                  </div>

                  {/* Right: Question Navigation Palette */}
                  <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                    <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Question Palette</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {activeExam.questions.map((_, idx) => {
                        const isCurrent = currentExamQIdx === idx;
                        const isAnswered = examUserAnswers[idx] !== undefined;
                        const isMarked = markedForReview.includes(idx);

                        let badgeColor = "bg-neutral-950 border-neutral-800 text-neutral-400";
                        if (isMarked) {
                          badgeColor = "bg-amber-500/20 border-amber-500 text-amber-300 font-bold";
                        } else if (isAnswered) {
                          badgeColor = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                        }
                        if (isCurrent) {
                          badgeColor += " ring-2 ring-blue-500";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentExamQIdx(idx)}
                            className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all ${badgeColor}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Exam Result Diagnostics */
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-6">
                <div className="text-center py-4 border-b border-neutral-800">
                  <Award className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-white">Exam Report Card</h3>
                  <div className="text-3xl font-black text-blue-400 mt-1">
                    {activeExam.score} / {activeExam.totalScore} ({activeExam.accuracy}%)
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Detailed performance breakdown across all units</p>
                </div>

                <div className="space-y-4">
                  {activeExam.questions.map((q, idx) => {
                    const userAns = activeExam.userAnswers?.[idx];
                    const isCorrect = userAns === q.correctIndex;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          isCorrect ? "bg-emerald-950/20 border-emerald-800/40" : "bg-rose-950/20 border-rose-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-white">Question {idx + 1}</span>
                          <span className={isCorrect ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-200 mb-2">{q.question}</p>
                        <div className="text-xs text-neutral-400">
                          Your response: <span className="text-white font-medium">{userAns !== undefined ? q.options[userAns] : "Not attempted"}</span>
                        </div>
                        <div className="text-xs text-emerald-400 mt-0.5">
                          Correct: <span className="font-medium">{q.options[q.correctIndex]}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-2 bg-neutral-950/40 p-2.5 rounded-lg">
                          <span className="font-semibold text-neutral-300">Analysis: </span>{q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setActiveExam(null)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Back to Exam Simulator
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: IMPORTANT QUESTIONS */}
        {/* ========================================================= */}
        {activeTab === "important-questions" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">University Important Questions</h3>
                <p className="text-xs text-neutral-400">
                  AI-generated examination suggestions based on university question patterns and syllabus weightage
                </p>
              </div>
              <button
                onClick={handleGenerateImportantQuestions}
                disabled={isGeneratingIQ}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-amber-600/25 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingIQ ? "Analyzing Question Papers..." : "Generate Important Questions"}
              </button>
            </div>

            {/* Questions Bank */}
            {importantQuestions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
                <HelpCircle className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-white">No important questions generated yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                  Click "Generate Important Questions" to generate unit-wise exam questions with frequency ratings and model answers.
                </p>
                <button
                  onClick={handleGenerateImportantQuestions}
                  disabled={isGeneratingIQ}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Exam Questions
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {importantQuestions.map((iq) => {
                  const isExpanded = !!expandedIQ[iq.id];
                  return (
                    <div
                      key={iq.id}
                      className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-full">
                            {iq.unit}
                          </span>
                          <span className="text-xs text-neutral-400">{iq.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                              iq.frequency === "Repeated"
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/25"
                                : iq.frequency === "High Probability"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                                : "bg-purple-500/15 text-purple-300 border-purple-500/25"
                            }`}
                          >
                            {iq.frequency}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] bg-neutral-800 text-neutral-300 rounded-full">
                            {iq.difficulty}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-white leading-relaxed">{iq.question}</h4>

                      <div>
                        <button
                          onClick={() => setExpandedIQ({ ...expandedIQ, [iq.id]: !isExpanded })}
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          {isExpanded ? "Hide Model Answer Outline" : "View Model Answer Outline"}
                        </button>
                        {isExpanded && (
                          <div className="mt-2.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
                            <span className="font-semibold text-white block mb-1">Key Points for Maximum Marks:</span>
                            {iq.answerSummary}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: PROGRESS */}
        {/* ========================================================= */}
        {activeTab === "progress" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Academic Progress Tracker</h3>
              <p className="text-xs text-neutral-400">Real tracked activity for {workspace.subject}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="text-xs text-neutral-400">Lessons Completed</div>
                <div className="text-2xl font-bold text-white mt-1">{workspace.stats.lessonsCompleted}</div>
                <div className="text-[11px] text-neutral-500 mt-1">Bite-sized concepts mastered</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="text-xs text-neutral-400">Quizzes Attempted</div>
                <div className="text-2xl font-bold text-white mt-1">{workspace.stats.quizzesAttempted}</div>
                <div className="text-[11px] text-neutral-500 mt-1">Accuracy: {workspace.stats.quizAccuracy}%</div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                <div className="text-xs text-neutral-400">Flashcards Mastered</div>
                <div className="text-2xl font-bold text-white mt-1">{workspace.stats.flashcardsReviewed}</div>
                <div className="text-[11px] text-neutral-500 mt-1">Spaced repetition recall</div>
              </div>
            </div>

            {/* Overall Syllabus Completion */}
            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Syllabus Mastery</h4>
                <span className="text-sm font-bold text-blue-400">{workspace.progressPercent}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all" style={{ width: `${workspace.progressPercent}%` }} />
              </div>
              <p className="text-xs text-neutral-400">
                {workspace.stats.lessonsCompleted === 0 && workspace.stats.quizzesAttempted === 0
                  ? "Your progress will appear after your first study session. Start with a guided lesson or quiz."
                  : `You have completed ${workspace.stats.lessonsCompleted} concepts and ${workspace.stats.quizzesAttempted} quizzes.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
