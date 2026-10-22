import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Settings,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  Play,
  RotateCcw,
  Check,
  GraduationCap,
  Shield,
  Layers,
  FileText,
  Clock,
  Award,
  ChevronDown,
  Bookmark,
  Copy,
  FolderPlus,
  X,
  Search,
  ExternalLink,
  Loader2,
  Download,
  Globe
} from "lucide-react";
import {
  AcademicQuizDraft,
  AcademicQuestionDraft,
  AssessmentType,
  TimerType,
  ExplanationPolicy
} from "../../types/academicLiveQuiz";
import {
  VITS_COLLEGE_NAME,
  VITS_BRANCHES,
  VITS_YEARS,
  VITS_SEMESTERS,
  VITS_SYLLABUS_URL,
  getVitsSubjects
} from "../../data/vitsAcademics";
import { VitsBranch, AcademicYear, AcademicSemester } from "../../types/academicQuiz";
import { getSupabaseAuthHeaders } from "../../lib/supabase";

const LOCAL_STORAGE_DRAFT_KEY = "astramind_academic_live_quiz_draft_v2";
const LEGACY_VITS_DRAFT_KEY = "vits_academic_live_quiz_draft_v1";

interface AcademicQuizCreatorProps {
  initialDraft?: AcademicQuizDraft | null;
  userProfile?: any;
  onLaunchRoom: (draft: AcademicQuizDraft) => void;
  onCancel: () => void;
  onOpenAuth?: (reason?: string) => void;
}

const ASSESSMENT_TYPES: AssessmentType[] = [
  "Class Assessment",
  "Mid-Term Practice",
  "Lab Viva / Internal Assessment",
  "Placement Training",
  "Grand Test",
  "Weekly Unit Test"
];

const UNIT_OPTIONS = [
  { value: "All Units (Comprehensive)", label: "All Units (Comprehensive Syllabus)" },
  { value: "Unit 1", label: "Unit 1: Fundamentals & Basic Concepts" },
  { value: "Unit 2", label: "Unit 2: Core Principles & Architectures" },
  { value: "Unit 3", label: "Unit 3: Advanced Applications & Analysis" },
  { value: "Unit 4", label: "Unit 4: Specialized Methodologies" },
  { value: "Unit 5", label: "Unit 5: Case Studies & Emerging Paradigms" },
];

export default function AcademicQuizCreator({
  initialDraft,
  onLaunchRoom,
  onCancel,
  onOpenAuth,
}: AcademicQuizCreatorProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Academic Details. VITS is the default profile, not a restriction.
  const [college, setCollege] = useState<string>(VITS_COLLEGE_NAME);
  const [regulation, setRegulation] = useState<string>("VR25");
  const [programType, setProgramType] = useState<string>("B.Tech");
  const [branch, setBranch] = useState<string>(VITS_BRANCHES[0]);
  const [year, setYear] = useState<string>(VITS_YEARS[1]);
  const [semester, setSemester] = useState<string>(VITS_SEMESTERS[0]);
  const [officialWebsiteUrl, setOfficialWebsiteUrl] = useState<string>(VITS_SYLLABUS_URL);
  const [syllabusSourceUrl, setSyllabusSourceUrl] = useState<string>("");
  const [sourceMaterialText, setSourceMaterialText] = useState<string>("");
  const [syllabusLinks, setSyllabusLinks] = useState<Array<{
    title: string; url: string; sourcePageUrl: string; host: string; kind: "pdf" | "page";
  }>>([]);
  const [syllabusNote, setSyllabusNote] = useState<string | null>(null);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);
  const [isDiscoveringSyllabus, setIsDiscoveringSyllabus] = useState(false);
  const [isImportingSyllabusUrl, setIsImportingSyllabusUrl] = useState("");
  const [subject, setSubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [unit, setUnit] = useState<string>("All Units (Comprehensive)");
  const [topic, setTopic] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("Class Assessment");
  const [title, setTitle] = useState<string>("");

  // Step 2: Assessment Configuration
  const [questionCountTarget, setQuestionCountTarget] = useState<number>(5);
  const [timerType, setTimerType] = useState<TimerType>("per_question");
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30); // seconds
  const [durationMinutes, setDurationMinutes] = useState<number>(20); // minutes for overall timer
  const [marksPerCorrect, setMarksPerCorrect] = useState<number>(1);
  const [negativeMarks, setNegativeMarks] = useState<number>(0);
  const [questionOrder, setQuestionOrder] = useState<"fixed" | "randomized">("fixed");
  const [explanationPolicy, setExplanationPolicy] = useState<ExplanationPolicy>("after_quiz");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Medium");

  // Step 3: Manual Questions Builder
  const [questions, setQuestions] = useState<AcademicQuestionDraft[]>([
    {
      id: "q_init_1",
      questionNumber: 1,
      questionType: "single_mcq",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswers: [],
      explanation: "",
      marks: 1,
      negativeMarks: 0,
      isComplete: false,
    },
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // UI state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveNotice, setDraftSaveNotice] = useState<string | null>(null);
  const [showDraftRestored, setShowDraftRestored] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiError, setAiError] = useState<string | null>(null);

  // Reusable Question Bank & Past Quizzes Import State
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [questionBankQuestions, setQuestionBankQuestions] = useState<any[]>([]);
  const [pastQuizzesList, setPastQuizzesList] = useState<any[]>([]);
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankTab, setBankTab] = useState<"bank" | "past_quizzes">("bank");
  const [bankActionNotice, setBankActionNotice] = useState<string | null>(null);

  const fetchQuestionBankAndHistory = async () => {
    setBankLoading(true);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const [bankRes, histRes] = await Promise.all([
        fetch("/api/live-quiz/question-bank", { headers: authHeaders }),
        fetch("/api/live-quiz/history", { headers: authHeaders }),
      ]);
      const bankData = await bankRes.json();
      const histData = await histRes.json();
      if (bankData.success && Array.isArray(bankData.questions)) {
        setQuestionBankQuestions(bankData.questions);
      }
      if (histData.success && Array.isArray(histData.createdQuizzes)) {
        setPastQuizzesList(histData.createdQuizzes);
      }
    } catch {
      // ignore
    } finally {
      setBankLoading(false);
    }
  };

  const handleOpenQuestionBankModal = () => {
    setIsQuestionBankModalOpen(true);
    setSelectedBankQuestionIds([]);
    fetchQuestionBankAndHistory();
  };

  const handleImportSelectedQuestions = (selectedList: any[]) => {
    if (selectedList.length === 0) return;
    const newDraftQuestions: AcademicQuestionDraft[] = selectedList.map((q, idx) => ({
      id: `q_reused_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: questions.length + idx + 1,
      questionType: q.questionType || (q.blanksExpected ? "fill_blank" : q.shortAnswerGrading ? "short_answer" : "single_mcq"),
      questionText: q.questionText || q.question || "",
      options: Array.isArray(q.options) && q.options.length > 0 ? [...q.options] : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswers: Array.isArray(q.correctAnswers) ? [...q.correctAnswers] : (q.correctIndex !== undefined ? [q.correctIndex] : [0]),
      explanation: q.explanation || "",
      marks: q.marks || marksPerCorrect,
      negativeMarks: q.negativeMarks || negativeMarks,
      isComplete: true,
      blanksExpected: q.blanksExpected ? [...q.blanksExpected] : undefined,
      acceptedAlternatives: q.acceptedAlternatives ? [...q.acceptedAlternatives] : undefined,
      caseSensitive: q.caseSensitive,
      trimWhitespace: q.trimWhitespace,
      shortAnswerGrading: q.shortAnswerGrading,
      keywords: q.keywords ? [...q.keywords] : undefined,
      sampleAnswer: q.sampleAnswer,
    }));

    setQuestions((prev) => {
      // If only one empty initial question exists, replace it
      if (prev.length === 1 && !prev[0].questionText.trim()) {
        return newDraftQuestions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
      }
      return [...prev, ...newDraftQuestions].map((q, i) => ({ ...q, questionNumber: i + 1 }));
    });

    setIsQuestionBankModalOpen(false);
    setBankActionNotice(`Successfully imported ${newDraftQuestions.length} reusable question(s)!`);
    setTimeout(() => setBankActionNotice(null), 3500);
  };

  const handleSaveQuestionToBank = async (q: AcademicQuestionDraft) => {
    if (!q.questionText.trim()) {
      alert("Please enter question text before saving to the question bank.");
      return;
    }
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/question-bank", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: [{
            ...q,
            sourceTitle: title || subject || "Academic Quiz",
          }],
        }),
      });
      const data = await resp.json();
      if (resp.status === 401) {
        onOpenAuth?.("Please sign in to save questions to your question bank.");
        return;
      }
      if (data.success) {
        setBankActionNotice("Question saved to your Question Bank for future reuse!");
        setTimeout(() => setBankActionNotice(null), 3500);
      }
    } catch {
      alert("Failed to save to question bank.");
    }
  };

  // Local VITS curriculum data provides optional suggestions; other schools and programs use custom subjects.
  const isVitsBTech = college.trim().toLowerCase() === VITS_COLLEGE_NAME.toLowerCase() &&
    programType === "B.Tech" &&
    VITS_BRANCHES.includes(branch as VitsBranch) &&
    VITS_YEARS.includes(year as AcademicYear) &&
    VITS_SEMESTERS.includes(semester as AcademicSemester);
  const availableSubjects = isVitsBTech
    ? getVitsSubjects(branch as VitsBranch, year as AcademicYear, semester as AcademicSemester)
    : [];

  const clearImportedSyllabus = () => {
    setSourceMaterialText("");
    setSyllabusSourceUrl("");
    setSyllabusLinks([]);
    setSyllabusNote(null);
    setSyllabusError(null);
  };

  const handleDiscoverOfficialSyllabus = async () => {
    if (!college.trim()) {
      setSyllabusError("Enter the college or university name first.");
      return;
    }
    setIsDiscoveringSyllabus(true);
    setSyllabusError(null);
    setSyllabusNote(null);
    setSyllabusLinks([]);
    try {
      let sourceUrl = officialWebsiteUrl.trim();
      let sourceNote = "";
      if (!sourceUrl) {
        const lookupResponse = await fetch("/api/college-syllabus/find-official-site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ college: college.trim() }),
        });
        const lookup = await lookupResponse.json();
        if (!lookupResponse.ok || lookup.error) throw new Error(lookup.error || "Could not find the official college website.");
        sourceUrl = typeof lookup.officialWebsiteUrl === "string" ? lookup.officialWebsiteUrl.trim() : "";
        if (!sourceUrl) throw new Error("No official website was identified. Paste the college's official URL and try again.");
        sourceNote = lookup.note || "A candidate official website was found.";
        setOfficialWebsiteUrl(sourceUrl);
      }
      const response = await fetch("/api/college-syllabus/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: college.trim(),
          officialWebsiteUrl: sourceUrl,
          programType,
          branch,
          year,
          semester,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Could not inspect the official syllabus page.");
      const links = Array.isArray(result.links) ? result.links : [];
      setSyllabusLinks(links);
      setSyllabusNote([sourceNote, result.note].filter(Boolean).join(" "));
      if (links.length === 0) setSyllabusError("No syllabus links were found. Paste the official academics/syllabus page URL or open the official site and select a syllabus PDF.");
    } catch (error: any) {
      setSyllabusError(error?.message || "Official syllabus discovery failed.");
    } finally {
      setIsDiscoveringSyllabus(false);
    }
  };

  const handleImportSyllabusPdf = async (link: { title: string; url: string; kind: "pdf" | "page" }) => {
    if (link.kind !== "pdf") {
      setSyllabusError("This result is an academic page, not a direct PDF. Open it and choose a syllabus PDF listed there.");
      return;
    }
    const sourceUrl = officialWebsiteUrl.trim();
    if (!sourceUrl) {
      setSyllabusError("The official college page is missing. Find the official site first.");
      return;
    }
    setIsImportingSyllabusUrl(link.url);
    setSyllabusError(null);
    try {
      const response = await fetch("/api/college-syllabus/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: college.trim(),
          officialWebsiteUrl: sourceUrl,
          syllabusUrl: link.url,
          programType,
          branch,
          year,
          semester,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Could not import the official syllabus PDF.");
      const extractedText = typeof result.extractedText === "string" ? result.extractedText.trim() : "";
      if (extractedText.length < 30) {
        throw new Error("This PDF has no usable text. Download a text-readable PDF or scan-free source and try again.");
      }
      setSourceMaterialText(extractedText.slice(0, 30000));
      setSyllabusSourceUrl(result.syllabusUrl || link.url);
      setSyllabusNote(`Imported ${result.fileName || link.title}. AI-drafted questions will be grounded in the extracted syllabus text.`);
      setSubject(link.title.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim() || subject);
      setUnit("All Units (Comprehensive)");
    } catch (error: any) {
      setSyllabusError(error?.message || "Could not import this syllabus PDF.");
    } finally {
      setIsImportingSyllabusUrl("");
    }
  };

  // Initialize subject when branch/year/sem change
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!subject || !availableSubjects.includes(subject)) {
        setSubject(availableSubjects[0]);
      }
    }
  }, [branch, year, semester, availableSubjects]);

  // Update auto-title if title is blank or matches pattern
  useEffect(() => {
    const effectiveSubj = subject === "OTHER" ? customSubject : subject;
    if (effectiveSubj) {
      setTitle(`${effectiveSubj} - ${assessmentType} (${regulation})`);
    }
  }, [subject, customSubject, assessmentType, regulation]);

  // Load initial draft or restore from localStorage on mount
  useEffect(() => {
    if (initialDraft) {
      loadDraftIntoState(initialDraft);
      return;
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY) || localStorage.getItem(LEGACY_VITS_DRAFT_KEY);
      if (saved) {
        const parsed: AcademicQuizDraft = JSON.parse(saved);
        if (parsed && (parsed.subject || parsed.questions?.length > 0)) {
          loadDraftIntoState(parsed);
          setShowDraftRestored(true);
        }
      }
    } catch {
      // ignore
    }
  }, [initialDraft]);

  const loadDraftIntoState = (d: AcademicQuizDraft) => {
    if (d.college) setCollege(d.college);
    if (d.regulation !== undefined) setRegulation(d.regulation);
    if (d.programType) setProgramType(d.programType);
    if (d.officialWebsiteUrl !== undefined) setOfficialWebsiteUrl(d.officialWebsiteUrl);
    if (d.syllabusSourceUrl) setSyllabusSourceUrl(d.syllabusSourceUrl);
    if (d.sourceMaterialText) setSourceMaterialText(d.sourceMaterialText.slice(0, 30000));
    if (d.branch) setBranch(d.branch);
    if (d.year) setYear(d.year);
    if (d.semester) setSemester(d.semester);
    if (d.subject) setSubject(d.subject);
    if (d.unit) setUnit(d.unit);
    if (d.topic) setTopic(d.topic);
    if (d.title) setTitle(d.title);
    if (d.assessmentType) setAssessmentType(d.assessmentType);
    if (d.timerType) setTimerType(d.timerType);
    if (d.timePerQuestion) setTimePerQuestion(d.timePerQuestion);
    if (d.durationMinutes) setDurationMinutes(d.durationMinutes);
    if (typeof d.marksPerCorrect === "number") setMarksPerCorrect(d.marksPerCorrect);
    if (typeof d.negativeMarks === "number") setNegativeMarks(d.negativeMarks);
    if (d.questionOrder) setQuestionOrder(d.questionOrder);
    if (d.explanationPolicy) setExplanationPolicy(d.explanationPolicy);
    if (d.difficulty) setDifficulty(d.difficulty as any);
    if (d.questions && Array.isArray(d.questions) && d.questions.length > 0) {
      setQuestions(d.questions);
      setQuestionCountTarget(d.questions.length);
    }
  };

  // Auto-save draft to localStorage on changes
  useEffect(() => {
    const currentDraft = buildDraftObject();
    try {
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(currentDraft));
    } catch {
      // ignore storage quota errors
    }
  }, [
    college,
    regulation,
    programType,
    officialWebsiteUrl,
    syllabusSourceUrl,
    sourceMaterialText,
    branch,
    year,
    semester,
    subject,
    customSubject,
    unit,
    topic,
    title,
    assessmentType,
    timerType,
    timePerQuestion,
    durationMinutes,
    marksPerCorrect,
    negativeMarks,
    questionOrder,
    explanationPolicy,
    difficulty,
    questions,
  ]);

  const buildDraftObject = (): AcademicQuizDraft => {
    const effectiveSubject = subject === "OTHER" ? customSubject.trim() : subject.trim();
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || marksPerCorrect || 1), 0);

    return {
      college: college.trim() || VITS_COLLEGE_NAME,
      regulation: regulation.trim(),
      programType,
      officialWebsiteUrl: officialWebsiteUrl.trim() || undefined,
      syllabusSourceUrl: syllabusSourceUrl || undefined,
      sourceMaterialText: sourceMaterialText.trim().slice(0, 30000) || undefined,
      branch: branch.trim() || "Not specified",
      year: year.trim() || "Not specified",
      semester: semester.trim() || "Not specified",
      subject: effectiveSubject,
      unit,
      topic,
      title: title.trim() || `${effectiveSubject} Assessment`,
      assessmentType,
      timerType,
      timePerQuestion,
      durationMinutes,
      marksPerCorrect,
      negativeMarks,
      questionOrder,
      explanationPolicy,
      difficulty,
      questionCount: questions.length,
      totalMarks,
      questions,
      updatedAt: Date.now(),
      status: "draft",
    };
  };

  // Discard draft
  const handleDiscardDraft = () => {
    if (confirm("Are you sure you want to discard this draft and reset all fields?")) {
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      setShowDraftRestored(false);
      clearImportedSyllabus();
      setOfficialWebsiteUrl(college.trim().toLowerCase() === VITS_COLLEGE_NAME.toLowerCase() ? VITS_SYLLABUS_URL : "");
      setQuestions([
        {
          id: "q_init_1",
          questionNumber: 1,
          questionType: "single_mcq",
          questionText: "",
          options: ["", "", "", ""],
          correctAnswers: [],
          explanation: "",
          marks: 1,
          negativeMarks: 0,
          isComplete: false,
        },
      ]);
      setActiveQuestionIndex(0);
      setValidationErrors([]);
    }
  };

  // Save draft to server
  const handleSaveDraftToServer = async () => {
    setIsSavingDraft(true);
    setDraftSaveNotice(null);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const draftData = buildDraftObject();
      const resp = await fetch("/api/live-quiz/draft/save", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftData),
      });
      const data = await resp.json();
      if (resp.status === 401) {
        onOpenAuth?.("Please sign in to save your draft to your account.");
        return;
      }
      if (data.success) {
        setDraftSaveNotice("Draft saved successfully to your academic profile.");
        setTimeout(() => setDraftSaveNotice(null), 4000);
      } else {
        setDraftSaveNotice("Draft saved locally (server sync unavailable).");
      }
    } catch {
      setDraftSaveNotice("Draft saved locally to browser storage.");
      setTimeout(() => setDraftSaveNotice(null), 4000);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errs: string[] = [];
    const effectiveSubject = subject === "OTHER" ? customSubject.trim() : subject.trim();
    if (!effectiveSubject) errs.push("Subject is required. Please select or enter a valid course subject.");
    if (!college.trim()) errs.push("College / university is required.");
    if (!branch.trim()) errs.push("Branch / major / department is required.");
    if (!year.trim()) errs.push("Academic year / level is required. Choose Not applicable if your program does not use years.");
    if (!semester.trim()) errs.push("Term / semester is required. Choose Not applicable if your program does not use terms.");
    if (!title.trim()) errs.push("Assessment Title is required.");
    setValidationErrors(errs);
    return errs.length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const errs: string[] = [];
    if (timerType === "per_question" && (timePerQuestion < 5 || timePerQuestion > 300)) {
      errs.push("Per question timer must be between 5 and 300 seconds.");
    }
    if (timerType === "overall" && (durationMinutes < 1 || durationMinutes > 180)) {
      errs.push("Overall duration must be between 1 and 180 minutes.");
    }
    if (marksPerCorrect <= 0) {
      errs.push("Marks per correct answer must be greater than zero.");
    }
    if (negativeMarks < 0) {
      errs.push("Negative marks cannot be negative.");
    }
    setValidationErrors(errs);
    return errs.length === 0;
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    const errs: string[] = [];
    if (questions.length === 0) {
      errs.push("You must create at least 1 question for the assessment.");
    }
    questions.forEach((q, idx) => {
      if (!q.questionText.trim()) {
        errs.push(`Question #${idx + 1}: Question text cannot be empty.`);
      }
      if (q.questionType === "fill_blank") {
        const expected = q.blanksExpected || [];
        if (expected.filter((e) => e.trim().length > 0).length === 0) {
          errs.push(`Question #${idx + 1}: Please specify at least one expected answer for the blank.`);
        }
      } else if (q.questionType === "short_answer") {
        if (q.shortAnswerGrading === "auto") {
          const kw = q.keywords || [];
          if (kw.length === 0 && !q.sampleAnswer?.trim()) {
            errs.push(`Question #${idx + 1}: Please provide keywords or sample answer for automatic evaluation.`);
          }
        }
      } else if (q.questionType === "true_false") {
        const filledOptions = q.options.filter((option) => option.trim().length > 0);
        if (q.options.length !== 2 || filledOptions.length !== 2) {
          errs.push(`Question #${idx + 1}: True/False questions must have exactly two non-empty options.`);
        }
        const validCorrectIndexes = (q.correctAnswers || []).filter((index) =>
          Number.isInteger(index) && index >= 0 && index < q.options.length && Boolean(q.options[index]?.trim())
        );
        if (validCorrectIndexes.length !== 1) {
          errs.push(`Question #${idx + 1}: Please select exactly one valid True/False answer.`);
        }
      } else {
        const filledOptions = q.options.filter((option) => option.trim().length > 0);
        if (q.options.length !== 4 || filledOptions.length !== 4) {
          errs.push(`Question #${idx + 1}: MCQs must have all four non-empty options.`);
        }
        const validCorrectIndexes = (q.correctAnswers || []).filter((index) =>
          Number.isInteger(index) && index >= 0 && index < q.options.length && Boolean(q.options[index]?.trim())
        );
        if (validCorrectIndexes.length === 0) {
          errs.push(`Question #${idx + 1}: Please select a valid correct answer.`);
        } else if (q.questionType === "single_mcq" && validCorrectIndexes.length !== 1) {
          errs.push(`Question #${idx + 1}: A single-answer MCQ must have exactly one correct option.`);
        }
      }
    });
    setValidationErrors(errs);
    return errs.length === 0;
  };

  // Question manipulation
  const handleUpdateQuestion = (index: number, updates: Partial<AcademicQuestionDraft>) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = { ...next[index], ...updates };
      const hasText = !!target.questionText.trim();
      let hasValidAnswer = false;

      if (target.questionType === "fill_blank") {
        hasValidAnswer = (target.blanksExpected || []).some((b) => b.trim().length > 0);
      } else if (target.questionType === "short_answer") {
        hasValidAnswer = target.shortAnswerGrading === "manual" || (target.keywords && target.keywords.length > 0) || !!target.sampleAnswer?.trim();
      } else if (target.questionType === "true_false") {
        const hasTwoOptions = target.options.length === 2 && target.options.every((option) => option.trim().length > 0);
        const validAnswers = (target.correctAnswers || []).filter((index) =>
          Number.isInteger(index) && index >= 0 && index < target.options.length && Boolean(target.options[index]?.trim())
        );
        hasValidAnswer = hasTwoOptions && validAnswers.length === 1;
      } else {
        const hasFourOptions = target.options.length === 4 && target.options.every((option) => option.trim().length > 0);
        const validAnswers = (target.correctAnswers || []).filter((index) =>
          Number.isInteger(index) && index >= 0 && index < target.options.length && Boolean(target.options[index]?.trim())
        );
        const validAnswerCount = target.questionType === "single_mcq"
          ? validAnswers.length === 1
          : validAnswers.length > 0;
        hasValidAnswer = hasFourOptions && validAnswerCount;
      }

      target.isComplete = hasText && hasValidAnswer;
      next[index] = target;
      return next;
    });
  };

  const handleAddQuestion = () => {
    const newQ: AcademicQuestionDraft = {
      id: `q_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      questionNumber: questions.length + 1,
      questionType: "single_mcq",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswers: [],
      explanation: "",
      marks: marksPerCorrect,
      negativeMarks: negativeMarks,
      isComplete: false,
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert("An assessment must have at least one question.");
      return;
    }
    const next = questions.filter((_, i) => i !== index).map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setQuestions(next);
    setActiveQuestionIndex(Math.max(0, index - 1));
  };

  // AI Generation Assistant (Explicit opt-in only)
  const handleAIAssistantGenerate = async () => {
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const effectiveSubject = subject === "OTHER" ? customSubject : subject;
      const resp = await fetch("/api/live-quiz/generate-questions", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          college: college.trim() || VITS_COLLEGE_NAME,
          regulation: regulation.trim(),
          programType,
          subject: effectiveSubject,
          branch: branch.trim() || "Not specified",
          year,
          semester,
          sourceText: sourceMaterialText.slice(0, 28000),
          count: aiCount,
          difficulty,
          topic: unit ? `${unit}: ${topic}` : topic,
        }),
      });
      const data = await resp.json();
      if (resp.status === 401) {
        onOpenAuth?.("Please sign in to use the AI Question Assistant.");
        return;
      }
      if (!resp.ok || data.error) throw new Error(data.error || "Failed to generate quiz questions.");
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const validQuestions = data.questions.filter((question: any) =>
          question &&
          typeof question.questionText === "string" && question.questionText.trim() &&
          Array.isArray(question.options) && question.options.length === 4 &&
          question.options.every((option: unknown) => typeof option === "string" && option.trim()) &&
          Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0 &&
          question.correctAnswers.every((index: unknown) => Number.isInteger(index) && (index as number) >= 0 && (index as number) < question.options.length) &&
          typeof question.explanation === "string" && question.explanation.trim()
        );
        if (validQuestions.length === 0) throw new Error("The AI response contained no valid questions with confirmed answer keys.");
        const startNumber = questions.length + 1;
        const newQuestions: AcademicQuestionDraft[] = validQuestions.map((q: any, i: number) => ({
          id: `ai_${Date.now()}_${i}`,
          questionNumber: startNumber + i,
          questionType: "single_mcq",
          questionText: q.questionText.trim(),
          options: q.options.map((option: string) => option.trim()),
          correctAnswers: q.correctAnswers,
          explanation: q.explanation.trim(),
          marks: typeof q.marks === "number" && q.marks > 0 ? q.marks : marksPerCorrect,
          negativeMarks: typeof q.negativeMarks === "number" && q.negativeMarks >= 0 ? q.negativeMarks : negativeMarks,
          isComplete: true,
        }));
        setQuestions((prev) => {
          if (prev.length === 1 && !prev[0].questionText.trim()) {
            return newQuestions.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
          }
          return [...prev, ...newQuestions];
        });
        setIsAIAssistantOpen(false);
      } else {
        throw new Error(data.error || "The AI service returned no valid questions.");
      }
    } catch (e: any) {
      setAiError(e.message || "Network error generating questions.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Launch Room
  const handleFinalLaunch = () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }
    const finalDraft = buildDraftObject();
    onLaunchRoom(finalDraft);
  };

  const currentQ = questions[activeQuestionIndex] || questions[0];

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Top Banner & Regulation Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5" />
                {college || "Academic Assessment"}{regulation ? ` · ${regulation}` : ""}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <GraduationCap className="w-3.5 h-3.5" />
                {programType || "Academic"} Assessment Portal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Create College-Wide Academic Live Assessment
            </h1>
            <p className="text-sm text-slate-400">
              {college} • Real-time multi-student assessment for your selected course and academic context
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleSaveDraftToServer}
              disabled={isSavingDraft}
              className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Saves draft to persistent Supabase storage"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              {isSavingDraft ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Notices */}
        {showDraftRestored && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Restored your previous assessment draft. Questions and settings are preserved.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDraftRestored(false)}
                className="text-emerald-400 hover:underline text-xs"
              >
                Dismiss
              </button>
              <button
                onClick={handleDiscardDraft}
                className="text-rose-400 hover:text-rose-300 text-xs hover:underline ml-2"
              >
                Discard Draft
              </button>
            </div>
          </div>
        )}

        {draftSaveNotice && (
          <div className="mt-4 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{draftSaveNotice}</span>
          </div>
        )}
      </div>

      {/* Step Stepper Progress Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: "1. Academic Scope", desc: "Branch, Sem & Subject", icon: BookOpen },
            { step: 2, title: "2. Configuration", desc: "Timer, Marks & Rules", icon: Settings },
            { step: 3, title: "3. Question Builder", desc: `${questions.length} Questions Drafted`, icon: HelpCircle },
            { step: 4, title: "4. Review & Launch", desc: "Verify & Host Room", icon: Play },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <button
                key={item.step}
                onClick={() => {
                  if (item.step === 1) setCurrentStep(1);
                  else if (item.step === 2 && validateStep1()) setCurrentStep(2);
                  else if (item.step === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                  else if (item.step === 4 && validateStep1() && validateStep2() && validateStep3()) setCurrentStep(4);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/50 shadow-sm"
                    : isCompleted
                    ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className={`text-xs font-bold leading-none ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-slate-200"}`}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Alert Box */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Please resolve the following academic requirements:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 ml-2 pt-1 text-rose-700 dark:text-rose-300">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1: ACADEMIC DETAILS                                     */}
      {/* ============================================================ */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Step 1: Academic Scope & Syllabus Mapping
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Specify the department, academic year, semester, and official course curriculum for this assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Institution, program, regulation and department are editable for all schools/colleges. */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">College / University</label>
              <input
                type="text"
                value={college}
                onChange={(e) => {
                  const next = e.target.value;
                  setCollege(next);
                  if (next.trim().toLowerCase() === VITS_COLLEGE_NAME.toLowerCase()) {
                    setRegulation("VR25");
                    setProgramType("B.Tech");
                    setBranch(VITS_BRANCHES[0]);
                    setYear(VITS_YEARS[1]);
                    setSemester(VITS_SEMESTERS[0]);
                    setOfficialWebsiteUrl(VITS_SYLLABUS_URL);
                  } else if (next !== college) {
                    setRegulation("");
                    setBranch("");
                    setYear("");
                    setSemester("");
                    setOfficialWebsiteUrl("");
                  }
                  clearImportedSyllabus();
                  setSubject("");
                  setCustomSubject("");
                  setUnit("All Units (Comprehensive)");
                }}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Your college or university name"
                required
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Vignan Institute of Technology and Science is selected by default. Change it for another institution.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Degree / Program</label>
                <select
                  value={programType}
                  onChange={(e) => {
                    const nextProgram = e.target.value;
                    setProgramType(nextProgram);
                    clearImportedSyllabus();
                    setSubject("");
                    setCustomSubject("");
                    setBranch("");
                    if (nextProgram !== "B.Tech") setRegulation("");
                    else if (college.trim().toLowerCase() === VITS_COLLEGE_NAME.toLowerCase()) {
                      setRegulation("VR25");
                      setBranch(VITS_BRANCHES[0]);
                    }
                  }}
                  className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {["B.Tech", "B.E.", "B.Sc.", "B.A.", "B.Com.", "BBA", "BCA", "M.Tech", "M.E.", "M.Sc.", "M.A.", "MBA", "MCA", "Diploma", "MBBS / Health Sciences", "Law", "School / High School", "Other / Self-directed"].map((program) => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Academic Regulation / Curriculum</label>
                <input
                  type="text"
                  value={regulation}
                  onChange={(e) => setRegulation(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. VR25, 2024 curriculum, semester system"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch / Major / Department</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => { setBranch(e.target.value); setSubject(""); }}
                  list={isVitsBTech ? "vits-live-quiz-branches" : undefined}
                  className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. CSE, Physics, Commerce, Nursing, Civil Engineering"
                />
                {isVitsBTech && (
                  <datalist id="vits-live-quiz-branches">
                    {VITS_BRANCHES.map((item) => <option key={item} value={item} />)}
                  </datalist>
                )}
              </div>
            </div>

            {/* Official syllabus discovery for any institution; VITS page is prefilled by default. */}
            <div className="sm:col-span-2 space-y-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Official College Website / Syllabus Page
                  </label>
                  <input
                    type="url"
                    value={officialWebsiteUrl}
                    onChange={(e) => {
                      setOfficialWebsiteUrl(e.target.value);
                      clearImportedSyllabus();
                    }}
                    placeholder="Leave blank to find the official site automatically"
                    className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">VITS is preselected. For another college, leave this blank and AstraMind searches the web for a likely official homepage.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDiscoverOfficialSyllabus}
                  disabled={isDiscoveringSyllabus || !college.trim()}
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDiscoveringSyllabus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {isDiscoveringSyllabus ? "Searching..." : officialWebsiteUrl.trim() ? "Find syllabus" : "Find official site & syllabus"}
                </button>
              </div>

              {officialWebsiteUrl.trim() && (
                <a href={officialWebsiteUrl.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-300 underline underline-offset-2">
                  Open official source page <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {syllabusNote && (
                <div role="status" className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 p-3 text-[11px] text-slate-600 dark:text-slate-300">
                  {syllabusNote}
                  {syllabusSourceUrl && (
                    <a href={syllabusSourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 underline underline-offset-2">
                      View imported PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {sourceMaterialText && <span className="ml-2 text-emerald-600 dark:text-emerald-300">Syllabus text ready for AI questions</span>}
                </div>
              )}
              {syllabusError && (
                <div role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-[11px] text-rose-700 dark:text-rose-300">
                  {syllabusError}
                </div>
              )}
              {syllabusLinks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Links discovered on this official site</div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {syllabusLinks.slice(0, 12).map((link) => (
                      <div key={link.url} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 border ${link.kind === "pdf" ? "text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900" : "text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900"}`}>{link.kind === "pdf" ? "PDF" : "PAGE"}</span>
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-100 break-words">{link.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 break-all">{link.host}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-2 text-[10px] text-slate-600 dark:text-slate-300">
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                          {link.kind === "pdf" && (
                            <button type="button" onClick={() => handleImportSyllabusPdf(link)} disabled={Boolean(isImportingSyllabusUrl)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-2 text-[10px] font-semibold disabled:opacity-50">
                              {isImportingSyllabusUrl === link.url ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                              {isImportingSyllabusUrl === link.url ? "Importing..." : "Import PDF"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Academic year or level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Academic Year / Level</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select academic year / level</option>
                {Array.from(new Set([...VITS_YEARS, "5th Year", "6th Year", "PG Year 1", "PG Year 2", "Final Year", "Not applicable"])).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            {/* Semester / Term */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Semester / Term</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select term / semester</option>
                {Array.from(new Map([
                  ...VITS_SEMESTERS.map((value) => [value, value] as const),
                  ["Term 1", "Term 1"], ["Term 2", "Term 2"], ["Term 3", "Term 3"],
                  ["Trimester 1", "Trimester 1"], ["Trimester 2", "Trimester 2"], ["Trimester 3", "Trimester 3"],
                  ["Annual", "Annual / Yearly"], ["Not applicable", "Not applicable"],
                ] as Array<readonly [string, string]>)).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Course / subject name — any discipline */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Course / Subject Name</span>
                {availableSubjects.length > 0 && (
                  <span className="text-[11px] text-slate-500">Optional VITS curriculum suggestions · {availableSubjects.length}</span>
                )}
              </label>
              <input
                type="text"
                value={subject === "OTHER" ? customSubject : subject}
                onChange={(e) => { setSubject(e.target.value); setCustomSubject(""); }}
                list={availableSubjects.length > 0 ? "vits-live-quiz-subjects" : undefined}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter any subject, course, module, or topic"
              />
              {availableSubjects.length > 0 && (
                <datalist id="vits-live-quiz-subjects">
                  {availableSubjects.map((item) => <option key={item} value={item} />)}
                </datalist>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Import the official syllabus above to ground AI questions in its text. Without an imported source, questions are general practice and are not verified against the official curriculum.</p>
            </div>

            {/* Unit / Syllabus Module */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Syllabus Unit / Module Coverage
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assessment Category
              </label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {ASSESSMENT_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Topic / Subtopic */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Topic / Specific Focus (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CPU Scheduling Algorithms & Gantt Chart Calculations"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
              </input>
            </div>

            {/* Assessment Title */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Official Assessment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                if (validateStep1()) {
                  setCurrentStep(2);
                }
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              Continue to Assessment Configuration
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: ASSESSMENT CONFIGURATION                             */}
      {/* ============================================================ */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Step 2: Evaluation Rules, Timing & Scoring
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure examination timing, marking schemes, anti-cheating question ordering, and solution policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timer Type */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Examination Timing Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    type: "per_question",
                    title: "Per-Question Timer",
                    desc: "Each question advances automatically after a set interval (e.g. 30s).",
                    icon: Clock,
                  },
                  {
                    type: "overall",
                    title: "Overall Assessment Duration",
                    desc: "Fixed total exam time (e.g. 30 mins) with flexible pacing.",
                    icon: Layers,
                  },
                  {
                    type: "none",
                    title: "Host-Controlled (Untimed)",
                    desc: "Host manually controls advancement when discussion completes.",
                    icon: FileText,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = timerType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setTimerType(item.type as TimerType)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time value based on timerType */}
            {timerType === "per_question" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Time per Question (Seconds)
                </label>
                <select
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={15}>15 seconds (Rapid Fire)</option>
                  <option value={20}>20 seconds</option>
                  <option value={30}>30 seconds (Standard Academic)</option>
                  <option value={45}>45 seconds</option>
                  <option value={60}>60 seconds (1 minute - Numerical / Code)</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>120 seconds (2 minutes - Deep Problem)</option>
                </select>
              </div>
            )}

            {timerType === "overall" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total Assessment Duration (Minutes)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes (Standard Unit Test)</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (Full Period Exam)</option>
                </select>
              </div>
            )}

            {/* Marks per correct answer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Default Marks per Correct Answer
              </label>
              <select
                value={marksPerCorrect}
                onChange={(e) => setMarksPerCorrect(Number(e.target.value))}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={1}>1 Mark (Standard Single MCQ)</option>
                <option value={2}>2 Marks</option>
                <option value={3}>3 Marks</option>
                <option value={4}>4 Marks (Competitive / GATE Pattern)</option>
              </select>
            </div>

            {/* Negative Marking */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Negative Marking (Penalty for Incorrect)
              </label>
              <select
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={0}>0 (No Penalty)</option>
                <option value={0.25}>-0.25 Marks (25% penalty)</option>
                <option value={0.33}>-0.33 Marks (1/3 GATE penalty)</option>
                <option value={0.5}>-0.5 Marks (50% penalty)</option>
                <option value={1}>-1.0 Mark (Full penalty)</option>
              </select>
            </div>

            {/* Question Order */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Question Delivery Order
              </label>
              <select
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value as "fixed" | "randomized")}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="fixed">Fixed Order (Follows Syllabus Sequence)</option>
                <option value="randomized">Randomized Order (Anti-Cheating Shuffled)</option>
              </select>
            </div>

            {/* Explanation Policy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Answer & Solution Explanation Policy
              </label>
              <select
                value={explanationPolicy}
                onChange={(e) => setExplanationPolicy(e.target.value as ExplanationPolicy)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="after_quiz">Reveal solutions after complete assessment finishes</option>
                <option value="after_each">Reveal solutions immediately after each question is answered</option>
                <option value="never">Strict Exam Mode (Never reveal correct answers)</option>
              </select>
            </div>

            {/* Target Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Easy">Easy (Recall & Fundamentals)</option>
                <option value="Medium">Medium (Application & standard course assessment)</option>
                <option value="Hard">Hard (Analytical, Problem-Solving & GATE Level)</option>
                <option value="Mixed">Mixed Difficulty</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Academic Scope
            </button>
            <button
              onClick={() => {
                if (validateStep2()) {
                  setCurrentStep(3);
                }
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              Continue to Manual Question Builder
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: MANUAL QUESTION BUILDER (PRIMARY)                     */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Header Bar with Action & AI Assistant trigger */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Step 3: Manual Question Builder
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {questions.length} questions created • Total Marks: {questions.reduce((sum, q) => sum + (q.marks || marksPerCorrect), 0)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Question Bank & Past Quizzes Import */}
              <button
                type="button"
                onClick={handleOpenQuestionBankModal}
                className="px-3 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-sm"
                title="Reuse questions from your saved Question Bank or past assessments"
              >
                <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Question Bank</span>
              </button>

              {/* Optional AI Assistant (explicitly labeled, does NOT replace manual by default) */}
              <button
                type="button"
                onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                className="px-3 py-2 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
                title="Use AI as an optional assistant to draft questions without overwriting existing manual entries"
              >
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Optional AI Drafter
              </button>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </div>

          {/* Action Notice banner for Question Bank */}
          {bankActionNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bankActionNotice}</span>
            </div>
          )}

          {/* Optional AI Drafter Drawer */}
          {isAIAssistantOpen && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    AI Question Assistant
                  </span>
                </div>
                <button
                  onClick={() => setIsAIAssistantOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/80">
                Drafts questions for <strong className="font-semibold">{subject === "OTHER" ? customSubject : subject}</strong> ({unit}). For official syllabus alignment, import the college’s syllabus PDF below first.
                New questions will be <em>appended</em> to your list; your existing manual questions will never be overwritten.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Draft Count:</span>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg px-2.5 py-1.5"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAIAssistantGenerate}
                  disabled={isGeneratingAI}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isGeneratingAI ? "Drafting Questions..." : "Generate & Append Questions"}
                </button>
              </div>

              {aiError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {aiError}
                </p>
              )}
            </div>
          )}

          {/* Question Navigator Pill Bar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 shrink-0">
              Questions:
            </span>
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-1">
              {questions.map((q, idx) => {
                const isActive = idx === activeQuestionIndex;
                const isDone = q.isComplete;
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-8 min-w-8 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-all border ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : isDone
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    {isDone && !isActive && <Check className="w-3 h-3 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Active Question Editor Card */}
          {currentQ && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex items-center justify-center">
                    {activeQuestionIndex + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Question #{activeQuestionIndex + 1} Configuration
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {currentQ.isComplete ? "✓ All required fields valid" : "Incomplete (needs question text, options, and correct answer)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={currentQ.questionType || "single_mcq"}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      if (newType === "true_false") {
                        handleUpdateQuestion(activeQuestionIndex, {
                          questionType: newType,
                          options: ["True", "False"],
                          correctAnswers: [],
                        });
                      } else if (newType === "fill_blank") {
                        handleUpdateQuestion(activeQuestionIndex, {
                          questionType: newType,
                          options: [],
                          correctAnswers: [],
                          blanksExpected: currentQ.blanksExpected?.length ? currentQ.blanksExpected : [""],
                          acceptedAlternatives: currentQ.acceptedAlternatives || [],
                          caseSensitive: currentQ.caseSensitive ?? false,
                          trimWhitespace: currentQ.trimWhitespace ?? true,
                        });
                      } else if (newType === "short_answer") {
                        handleUpdateQuestion(activeQuestionIndex, {
                          questionType: newType,
                          options: [],
                          correctAnswers: [],
                          shortAnswerGrading: currentQ.shortAnswerGrading || "manual",
                          keywords: currentQ.keywords || [],
                          sampleAnswer: currentQ.sampleAnswer || "",
                        });
                      } else {
                        handleUpdateQuestion(activeQuestionIndex, {
                          questionType: newType,
                          options: currentQ.options.length >= 2 ? currentQ.options : ["Option A", "Option B", "Option C", "Option D"],
                          correctAnswers: currentQ.correctAnswers?.length ? currentQ.correctAnswers : [0],
                        });
                      }
                    }}
                    className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium"
                  >
                    <option value="single_mcq">Multiple Choice (Single Correct)</option>
                    <option value="multiple_mcq">Multiple Choice (Multiple Correct)</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_blank">Fill in the Blank</option>
                    <option value="short_answer">Short Answer (Subjective / Keyword)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleSaveQuestionToBank(currentQ)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    title="Save this question to your reusable Question Bank"
                  >
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline text-[11px] font-semibold text-amber-700 dark:text-amber-300">Save to Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(activeQuestionIndex)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete this question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Question Statement / Problem Prompt *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Supports code snippets, mathematical notation & technical queries</span>
                </label>
                <textarea
                  rows={3}
                  value={currentQ.questionText}
                  onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { questionText: e.target.value })}
                  placeholder={
                    currentQ.questionType === "fill_blank"
                      ? "e.g. In the OSI 7-layer model, the ________ layer is responsible for end-to-end reliable packet delivery."
                      : currentQ.questionType === "short_answer"
                      ? "e.g. Explain how Belady's Anomaly occurs in page replacement algorithms with a concrete example."
                      : "e.g. Which of the following page replacement algorithms suffers from Belady's Anomaly when allocated more physical page frames?"
                  }
                  className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                />
              </div>

              {/* QUESTION TYPE SPECIFIC CONFIGURATION */}
              {currentQ.questionType === "fill_blank" ? (
                /* ------------------- FILL IN THE BLANK ------------------- */
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-900/60 border border-indigo-200 dark:border-indigo-900/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Fill in the Blank Answers & Grading Rules
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Students will type their textual answer directly into an input box. The system automatically verifies their answer using the rules below.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Primary Expected Answer *
                      </label>
                      <input
                        type="text"
                        value={(currentQ.blanksExpected && currentQ.blanksExpected[0]) || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const prev = currentQ.blanksExpected || [];
                          const next = [val, ...prev.slice(1)];
                          handleUpdateQuestion(activeQuestionIndex, { blanksExpected: next });
                        }}
                        placeholder="e.g. Transport or Transport Layer"
                        className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Accepted Alternatives (comma-separated synonyms or spellings)
                      </label>
                      <input
                        type="text"
                        value={(currentQ.acceptedAlternatives || []).join(", ")}
                        onChange={(e) => {
                          const alts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          handleUpdateQuestion(activeQuestionIndex, { acceptedAlternatives: alts });
                        }}
                        placeholder="e.g. transport, Transport layer, layer 4"
                        className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Any of these will be counted as 100% correct.
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!currentQ.caseSensitive}
                          onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { caseSensitive: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Case-sensitive matching (strict upper/lowercase)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentQ.trimWhitespace !== false}
                          onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { trimWhitespace: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Normalize whitespace (ignore leading/trailing & double spaces)</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : currentQ.questionType === "short_answer" ? (
                /* ------------------- SHORT ANSWER ------------------- */
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-slate-900/60 border border-purple-200 dark:border-purple-900/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Short Answer Evaluation Model
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Students will type an explanatory textual answer. Select whether you prefer manual grading by the host or automatic keyword matching.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuestion(activeQuestionIndex, { shortAnswerGrading: "manual" })}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        currentQ.shortAnswerGrading === "manual"
                          ? "bg-purple-100/70 dark:bg-purple-950/40 border-purple-500 dark:border-purple-500 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Manual Grading by Host
                        </span>
                        {currentQ.shortAnswerGrading === "manual" && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Answers are marked <strong>Pending Review</strong> and not marked incorrect automatically. You review and award marks on the live host monitor.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateQuestion(activeQuestionIndex, { shortAnswerGrading: "auto" })}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        currentQ.shortAnswerGrading === "auto"
                          ? "bg-purple-100/70 dark:bg-purple-950/40 border-purple-500 dark:border-purple-500 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Automatic Evaluation
                        </span>
                        {currentQ.shortAnswerGrading === "auto" && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Matches expected keywords or phrases. Evaluates student responses automatically against your rubric.
                      </p>
                    </button>
                  </div>

                  {currentQ.shortAnswerGrading === "auto" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Required Keywords or Key Concepts (comma-separated) *
                      </label>
                      <input
                        type="text"
                        value={(currentQ.keywords || []).join(", ")}
                        onChange={(e) => {
                          const kws = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          handleUpdateQuestion(activeQuestionIndex, { keywords: kws });
                        }}
                        placeholder="e.g. FIFO, page frames, page faults, anomalous, increased"
                        className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Students must include at least 50% of these technical keywords to earn full marks.
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Model / Sample Reference Answer (Grading Rubric)
                    </label>
                    <textarea
                      rows={2}
                      value={currentQ.sampleAnswer || ""}
                      onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { sampleAnswer: e.target.value })}
                      placeholder="e.g. Belady's Anomaly occurs in FIFO where increasing the number of page frames from 3 to 4 increases the page fault count from 9 to 10 for certain reference strings."
                      className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none font-sans"
                    />
                  </div>
                </div>
              ) : (
                /* ------------------- MULTIPLE CHOICE & TRUE/FALSE ------------------- */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Answer Options & Key (Click circle to select the correct answer)
                    </label>
                    {currentQ.questionType !== "true_false" && currentQ.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateQuestion(activeQuestionIndex, {
                            options: [...currentQ.options, `Option ${String.fromCharCode(65 + currentQ.options.length)}`],
                          });
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Option
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {currentQ.options.map((optText, optIdx) => {
                      const isCorrect = currentQ.correctAnswers?.includes(optIdx);
                      const isMultiple = currentQ.questionType === "multiple_mcq";
                      const letterLabel = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCorrect
                              ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-600"
                              : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {/* Radio or Checkbox button to mark correct */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isMultiple) {
                                // Toggle in array
                                const prev = currentQ.correctAnswers || [];
                                const next = prev.includes(optIdx)
                                  ? prev.filter((i) => i !== optIdx)
                                  : [...prev, optIdx];
                                handleUpdateQuestion(activeQuestionIndex, { correctAnswers: next });
                              } else {
                                // Single correct
                                handleUpdateQuestion(activeQuestionIndex, { correctAnswers: [optIdx] });
                              }
                            }}
                            className={`w-6 h-6 rounded-${isMultiple ? "md" : "full"} flex items-center justify-center shrink-0 border transition-colors ${
                              isCorrect
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-800"
                            }`}
                            title="Click to mark this option as correct answer"
                          >
                            {isCorrect && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <span className="text-xs font-bold text-slate-500 w-4">
                            {letterLabel}.
                          </span>

                          <input
                            type="text"
                            value={optText}
                            onChange={(e) => {
                              const newOpts = [...currentQ.options];
                              newOpts[optIdx] = e.target.value;
                              handleUpdateQuestion(activeQuestionIndex, { options: newOpts });
                            }}
                            placeholder={`Option ${letterLabel} description...`}
                            className="flex-1 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />

                          {currentQ.questionType !== "true_false" && currentQ.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = currentQ.options.filter((_, i) => i !== optIdx);
                                const newCorrect = (currentQ.correctAnswers || [])
                                  .filter((i) => i !== optIdx)
                                  .map((i) => (i > optIdx ? i - 1 : i));
                                handleUpdateQuestion(activeQuestionIndex, {
                                  options: newOpts,
                                  correctAnswers: newCorrect.length > 0 ? newCorrect : [0],
                                });
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Remove option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solution / Explanation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Detailed Technical Solution / Syllabus Explanation</span>
                  <span className="text-[11px] text-slate-400 font-normal">Shown to students according to your explanation policy</span>
                </label>
                <textarea
                  rows={2}
                  value={currentQ.explanation || ""}
                  onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { explanation: e.target.value })}
                  placeholder="e.g. FIFO (First-In, First-Out) exhibits Belady's Anomaly where increasing the number of allocated page frames results in an increase in page faults."
                  className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                />
              </div>

              {/* Individual Marks Override */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Marks for this Question
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={currentQ.marks ?? marksPerCorrect}
                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { marks: Number(e.target.value) })}
                    className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Negative Marks Override
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={currentQ.negativeMarks ?? negativeMarks}
                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { negativeMarks: Number(e.target.value) })}
                    className="w-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Configuration
            </button>

            <button
              onClick={() => {
                if (validateStep3()) {
                  setCurrentStep(4);
                }
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              Proceed to Review & Launch
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 4: REVIEW & LAUNCH                                       */}
      {/* ============================================================ */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Step 4: Academic Assessment Review & Launch Confirmation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verify all curriculum specifications and question completeness before broadcasting this room code.
            </p>
          </div>

          {/* Assessment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Academic Scope
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {subject === "OTHER" ? customSubject : subject}
              </p>
              <p className="text-xs text-slate-500">
                {branch} • {year} • {semester}
              </p>
              <p className="text-xs text-slate-500">
                {unit} {topic ? `(${topic})` : ""}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Timing & Evaluation
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {timerType === "per_question"
                  ? `${timePerQuestion}s per question`
                  : timerType === "overall"
                  ? `${durationMinutes}m total duration`
                  : "Untimed / Host-directed"}
              </p>
              <p className="text-xs text-slate-500">
                {marksPerCorrect} mark(s) per correct • {negativeMarks > 0 ? `-${negativeMarks} penalty` : "No negative marking"}
              </p>
              <p className="text-xs text-slate-500">
                Order: {questionOrder === "randomized" ? "Randomized" : "Fixed syllabus sequence"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Question Inventory
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {questions.length} Questions Prepared
              </p>
              <p className="text-xs text-slate-500">
                Total Marks: {questions.reduce((sum, q) => sum + (q.marks || marksPerCorrect), 0)} Marks
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Ready for whole-class deployment
              </p>
            </div>
          </div>

          {/* Question Summary Checklist */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Questions Verification Roster ({questions.length})
            </h3>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                      {q.questionText || <em className="text-rose-500">Missing question text</em>}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {q.questionType === "fill_blank"
                        ? `Fill in the Blank • Target: "${(q.blanksExpected && q.blanksExpected[0]) || "—"}" • ${q.marks || marksPerCorrect} Mark(s)`
                        : q.questionType === "short_answer"
                        ? `Short Answer (${q.shortAnswerGrading === "manual" ? "Manual Grading" : "Automatic Evaluation"}) • ${q.marks || marksPerCorrect} Mark(s)`
                        : `${q.options.length} options • Correct: ${q.correctAnswers?.map((i) => String.fromCharCode(65 + i)).join(", ") || "None"} • ${q.marks || marksPerCorrect} Mark(s)`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveQuestionIndex(idx);
                      setCurrentStep(3);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Launch Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Question Editor
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraftToServer}
                disabled={isSavingDraft}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSavingDraft ? "Saving Draft..." : "Save Draft for Later"}
              </button>

              <button
                onClick={handleFinalLaunch}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                Launch Live Room Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* REUSABLE QUESTION BANK & PAST QUIZ IMPORT MODAL              */}
      {/* ============================================================ */}
      {isQuestionBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Question Bank &amp; Reusable Assessment Bank
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Import individual questions or entire quiz collections with safe versioning.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuestionBankModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 pt-2">
              <button
                onClick={() => setBankTab("bank")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                  bankTab === "bank"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Saved Questions ({questionBankQuestions.length})
              </button>
              <button
                onClick={() => setBankTab("past_quizzes")}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                  bankTab === "past_quizzes"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                From Past Quizzes ({pastQuizzesList.length})
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {bankLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Loading reusable question items...
                </div>
              ) : bankTab === "bank" ? (
                questionBankQuestions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
                    <p>No questions saved to your bank yet.</p>
                    <p className="text-[11px] text-slate-400">
                      You can click &quot;Save to Bank&quot; on any question in Step 3 to save it here for future quizzes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {questionBankQuestions.length} reusable question(s) available
                      </span>
                      <button
                        onClick={() => {
                          if (selectedBankQuestionIds.length === questionBankQuestions.length) {
                            setSelectedBankQuestionIds([]);
                          } else {
                            setSelectedBankQuestionIds(questionBankQuestions.map((q) => q.bankId || q.id));
                          }
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        {selectedBankQuestionIds.length === questionBankQuestions.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    {questionBankQuestions.map((q) => {
                      const qId = q.bankId || q.id;
                      const isChecked = selectedBankQuestionIds.includes(qId);
                      return (
                        <div
                          key={qId}
                          onClick={() => {
                            setSelectedBankQuestionIds((prev) =>
                              isChecked ? prev.filter((id) => id !== qId) : [...prev, qId]
                            );
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isChecked
                              ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-sm"
                              : "bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {q.questionType === "fill_blank"
                                  ? "Fill in Blank"
                                  : q.questionType === "short_answer"
                                  ? "Short Answer"
                                  : q.questionType === "multiple_mcq"
                                  ? "Multiple Choice (MSQ)"
                                  : "Single MCQ"}
                              </span>
                              {q.sourceTitle && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                  from {q.sourceTitle}
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                              {q.questionText || q.question}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Past Quizzes Tab */
                pastQuizzesList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                    <p>No past quizzes found under your profile.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastQuizzesList.map((quiz) => {
                      const quizQuestions = quiz.questions || [];
                      return (
                        <div
                          key={quiz.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                {quiz.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {quiz.subject} • {quiz.questionCount || quizQuestions.length} Questions
                              </p>
                            </div>
                            {quizQuestions.length > 0 && (
                              <button
                                onClick={() => handleImportSelectedQuestions(quizQuestions)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                              >
                                Import All ({quizQuestions.length})
                              </button>
                            )}
                          </div>

                          {quizQuestions.length > 0 && (
                            <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200 dark:border-indigo-900">
                              {quizQuestions.slice(0, 4).map((q: any, qIdx: number) => (
                                <div key={q.id || qIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                                  <span className="truncate">
                                    Q{qIdx + 1}. {q.questionText || q.question}
                                  </span>
                                  <button
                                    onClick={() => handleImportSelectedQuestions([q])}
                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0"
                                  >
                                    + Add
                                  </button>
                                </div>
                              ))}
                              {quizQuestions.length > 4 && (
                                <span className="text-[10px] text-slate-400">
                                  +{quizQuestions.length - 4} more questions
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500">
                {selectedBankQuestionIds.length} question(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQuestionBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedBankQuestionIds.length === 0}
                  onClick={() => {
                    const toImport = questionBankQuestions.filter((q) =>
                      selectedBankQuestionIds.includes(q.bankId || q.id)
                    );
                    handleImportSelectedQuestions(toImport);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
                >
                  Import Selected ({selectedBankQuestionIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
