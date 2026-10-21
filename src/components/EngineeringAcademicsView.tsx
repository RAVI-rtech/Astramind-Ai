import React, { useState, useEffect, useRef } from "react";
import {
  Calculator,
  BookOpen,
  ExternalLink,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Brain,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Target,
  Send,
  MessageSquare,
  GraduationCap,
  X
} from "lucide-react";
import {
  VitsBranch,
  AcademicYear,
  AcademicSemester,
  QuizDifficulty,
  AcademicQuizQuestion,
  AcademicQuizResult
} from "../types/academicQuiz";
import {
  VITS_COLLEGE_NAME,
  VITS_SYLLABUS_URL,
  VITS_BRANCHES,
  VITS_YEARS,
  VITS_SEMESTERS,
  getVitsSubjects
} from "../data/vitsAcademics";

interface EngineeringAcademicsViewProps {
  accentColorClass?: string;
  onSwitchToGeneralTutor?: () => void;
}

type AcademicScreen = "setup" | "quiz" | "result" | "review";

export default function EngineeringAcademicsView({
  accentColorClass = "from-indigo-600 to-purple-600",
  onSwitchToGeneralTutor
}: EngineeringAcademicsViewProps) {
  const getInitialBranch = (): VitsBranch => {
    try {
      const raw = localStorage.getItem("astramind_profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.branch) {
          const match = VITS_BRANCHES.find(
            (b) => b.toLowerCase().includes(p.branch.toLowerCase()) || p.branch.toLowerCase().includes(b.toLowerCase())
          );
          if (match) return match as VitsBranch;
        }
      }
    } catch {}
    return "Computer Science and Engineering (CSE)";
  };

  // Setup State
  const [selectedBranch, setSelectedBranch] = useState<VitsBranch>(getInitialBranch);
  const [selectedYear, setSelectedYear] = useState<AcademicYear>("2nd Year");
  const [selectedSemester, setSelectedSemester] = useState<AcademicSemester>("Semester II");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [customSubjectText, setCustomSubjectText] = useState<string>("");
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("Mixed");
  const [numQuestions, setNumQuestions] = useState<number>(10);

  // Flow & Quiz State
  const [currentScreen, setCurrentScreen] = useState<AcademicScreen>("setup");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Quiz State
  const [questions, setQuestions] = useState<AcademicQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Results State
  const [quizResult, setQuizResult] = useState<AcademicQuizResult | null>(null);

  // AI Tutor in-quiz explanation modal state
  const [explainingQuestion, setExplainingQuestion] = useState<AcademicQuizQuestion | null>(null);
  const [explanationText, setExplanationText] = useState<string>("");
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [customTutorQuery, setCustomTutorQuery] = useState<string>("");

  // Update subjects whenever Branch, Year, or Semester changes
  const availableSubjects = getVitsSubjects(selectedBranch, selectedYear, selectedSemester);

  useEffect(() => {
    if (!isCustomSubject) {
      if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
      }
    }
  }, [selectedBranch, selectedYear, selectedSemester, availableSubjects, isCustomSubject, selectedSubject]);

  // Timer effect for active quiz
  useEffect(() => {
    if (currentScreen === "quiz") {
      setStartTime(Date.now());
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentScreen]);

  const activeSubjectName = isCustomSubject ? customSubjectText.trim() : selectedSubject;

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start / Generate MCQ Quiz
  const handleStartQuiz = async (weakAreasOverride?: string[]) => {
    if (!activeSubjectName) {
      setErrorMessage("Please select or specify a subject first.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/academic-quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: VITS_COLLEGE_NAME,
          branch: selectedBranch,
          year: selectedYear,
          semester: selectedSemester,
          subject: activeSubjectName,
          difficulty,
          numQuestions,
          weakAreas: weakAreasOverride,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data.message || data.error || "Failed to generate questions.");
      }

      setQuestions(data.questions);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setCurrentScreen("quiz");
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      setErrorMessage("Unable to generate the quiz right now. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Option Selection
  const handleSelectOption = (option: "A" | "B" | "C" | "D") => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  // Move to Next Question or Submit
  const handleNextOrSubmit = () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !selectedAnswers[currentQ.id]) return;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate Results
      calculateAndShowResults();
    }
  };

  // Calculate Results
  const calculateAndShowResults = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    let correctCount = 0;
    const weakTopicsSet = new Set<string>();

    const reviewed = questions.map((q) => {
      const studentAns = selectedAnswers[q.id] || null;
      const isCorrect = studentAns === q.correctAnswer;
      if (isCorrect) {
        correctCount++;
      } else {
        if (q.topic) {
          weakTopicsSet.add(q.topic);
        }
      }
      return {
        question: q,
        selectedOption: studentAns,
        isCorrect,
      };
    });

    const total = questions.length;
    const incorrectCount = total - correctCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const percentage = accuracy;

    const result: AcademicQuizResult = {
      totalQuestions: total,
      score: correctCount,
      percentage,
      correctCount,
      incorrectCount,
      accuracy,
      timeSpentSeconds: elapsedSeconds,
      weakAreas: Array.from(weakTopicsSet),
      reviewedQuestions: reviewed,
    };

    setQuizResult(result);
    setCurrentScreen("result");
  };

  // AI Tutor Explain Question Handler
  const handleOpenExplainer = async (
    q: AcademicQuizQuestion,
    customPrompt?: string
  ) => {
    setExplainingQuestion(q);
    setExplanationText("");
    setIsExplaining(true);
    setCustomTutorQuery("");

    try {
      const studentAns = selectedAnswers[q.id] || undefined;
      const response = await fetch("/api/academic-quiz/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: VITS_COLLEGE_NAME,
          branch: selectedBranch,
          subject: activeSubjectName,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          studentAnswer: studentAns,
          query: customPrompt || (studentAns ? `Why is option ${q.correctAnswer} correct instead of my choice option ${studentAns}?` : "Why is this answer correct?"),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to retrieve explanation.");
      }

      setExplanationText(data.explanation);
    } catch (err: any) {
      setExplanationText("Unable to generate live tutor explanation right now. " + (q.explanation || ""));
    } finally {
      setIsExplaining(false);
    }
  };

  // Practice Weak Areas
  const handlePracticeWeakAreas = () => {
    if (!quizResult || quizResult.weakAreas.length === 0) return;
    handleStartQuiz(quizResult.weakAreas);
  };

  return (
    <div id="engineering-academics-root" className="w-full max-w-4xl mx-auto pb-12 px-3 sm:px-6 animate-fade-in">
      {/* INSTITUTION HEADER & OFFICIAL SYLLABUS BANNER */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/25 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>{VITS_COLLEGE_NAME}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <span>Engineering Academics MCQ Practice</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-generated practice questions based on the selected academic subject.
            </p>
          </div>

          {/* OFFICIAL SYLLABUS BUTTON */}
          <div className="shrink-0 flex items-center gap-2">
            <a
              id="btn-vits-official-syllabus"
              href={VITS_SYLLABUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-indigo-600/20 text-indigo-200 hover:text-white border border-indigo-500/30 hover:border-indigo-400 transition-all text-xs font-semibold shadow-sm cursor-pointer group"
              title="Open Official VITS Syllabus page in a new window"
            >
              <BookOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>View Official VITS Syllabus</span>
              <ExternalLink className="w-3 h-3 text-indigo-400/80" />
            </a>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleStartQuiz()}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 1: ACADEMIC MCQ SETUP PANEL */}
      {/* ========================================================================= */}
      {currentScreen === "setup" && (
        <div id="academic-setup-panel" className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-5 backdrop-blur-xl shadow-lg">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Academic Curriculum Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your branch, academic year, semester, and course subject to formulate relevant practice MCQs.
              </p>
            </div>

            {/* COLLEGE (FIXED & READ-ONLY) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>College / Institution</span>
                <span className="text-[10px] text-indigo-400 font-mono font-normal">(Locked / Read-Only)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={VITS_COLLEGE_NAME}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-medium cursor-not-allowed select-none pl-9"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* BRANCH (11 OFFICIAL VITS BRANCHES) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Engineering Branch (Official VITS Syllabus)
              </label>
              <select
                id="select-vits-branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as VitsBranch)}
                className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer transition-colors"
              >
                {VITS_BRANCHES.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-white">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* YEAR & SEMESTER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Year
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                  {VITS_YEARS.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYear(yr)}
                      className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        selectedYear === yr
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Semester
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                  {VITS_SEMESTERS.map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSelectedSemester(sem)}
                      className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        selectedSemester === sem
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SUBJECT SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Course Subject ({selectedYear} • {selectedSemester})
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSubject(!isCustomSubject)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                >
                  {isCustomSubject ? "Pick from syllabus list" : "Enter other/elective subject"}
                </button>
              </div>

              {isCustomSubject ? (
                <input
                  type="text"
                  placeholder="e.g. Theory of Computation, Cloud Computing, VLSI Design..."
                  value={customSubjectText}
                  onChange={(e) => setCustomSubjectText(e.target.value)}
                  className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              ) : (
                <select
                  id="select-vits-subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none cursor-pointer transition-colors"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub} className="bg-slate-900 text-white">
                      {sub}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* QUIZ SETTINGS CARD */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-5 backdrop-blur-xl shadow-lg">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Quiz Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose the question count and conceptual difficulty level.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumQuestions(num)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        numQuestions === num
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                  {(["Easy", "Medium", "Hard", "Mixed"] as QuizDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        difficulty === diff
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2">
              <button
                id="btn-start-academic-quiz"
                onClick={() => handleStartQuiz()}
                disabled={isGenerating || !activeSubjectName}
                className={`w-full py-3 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                  isGenerating || !activeSubjectName
                    ? "bg-indigo-900/50 text-indigo-300 cursor-not-allowed opacity-60"
                    : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-indigo-600/30 active:scale-[0.99]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Formulating Academic MCQs with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Start MCQ Quiz ({numQuestions} Questions • {difficulty})</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: ACTIVE QUIZ EXPERIENCE (ONE QUESTION AT A TIME) */}
      {/* ========================================================================= */}
      {currentScreen === "quiz" && questions.length > 0 && (
        <div id="academic-quiz-active" className="space-y-4">
          {/* QUIZ TOP BAR */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-indigo-300">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                {activeSubjectName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-indigo-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              <button
                onClick={() => {
                  if (confirm("Are you sure you want to exit the current quiz? Progress will be lost.")) {
                    setCurrentScreen("setup");
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* CURRENT QUESTION CARD */}
          {(() => {
            const currentQ = questions[currentQuestionIndex];
            const currentAnswer = selectedAnswers[currentQ.id];

            return (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl backdrop-blur-xl">
                {/* Topic badge */}
                {currentQ.topic && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
                    <Target className="w-3 h-3" />
                    <span>Topic: {currentQ.topic}</span>
                  </div>
                )}

                {/* Question text */}
                <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* 4 Options: A, B, C, D */}
                <div className="space-y-2.5">
                  {(["A", "B", "C", "D"] as const).map((optKey) => {
                    const isSelected = currentAnswer === optKey;
                    const optText = currentQ.options[optKey];

                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => handleSelectOption(optKey)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-150 flex items-start gap-3 cursor-pointer group ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-400 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400/50"
                            : "bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.06] hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? "bg-indigo-500 text-white shadow-sm"
                              : "bg-white/10 text-slate-400 group-hover:text-white group-hover:bg-white/20"
                          }`}
                        >
                          {optKey}
                        </span>
                        <span className="pt-0.5 leading-normal">{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* IN-QUIZ AI TUTOR QUESTION QUERY BUTTON */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenExplainer(currentQ)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ask AI Tutor about this question</span>
                  </button>

                  {/* NEXT / SUBMIT BUTTON */}
                  <button
                    type="button"
                    onClick={handleNextOrSubmit}
                    disabled={!currentAnswer}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                      currentAnswer
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 active:scale-[0.99]"
                        : "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    <span>
                      {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Submit Quiz"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: QUIZ RESULT */}
      {/* ========================================================================= */}
      {currentScreen === "result" && quizResult && (
        <div id="academic-quiz-result" className="space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Quiz Completed
              </h3>
              <p className="text-xs text-slate-400">
                {activeSubjectName} • {selectedBranch}
              </p>
            </div>

            {/* SCORE DISPLAY */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 max-w-sm mx-auto">
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                {quizResult.score} / {quizResult.totalQuestions}
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                Score: {quizResult.percentage}% Percentage
              </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Correct</div>
                <div className="text-lg font-bold text-emerald-400">{quizResult.correctCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Incorrect</div>
                <div className="text-lg font-bold text-rose-400">{quizResult.incorrectCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</div>
                <div className="text-lg font-bold text-indigo-300">{quizResult.accuracy}%</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Time Taken</div>
                <div className="text-lg font-bold text-slate-200">
                  {formatTime(quizResult.timeSpentSeconds)}
                </div>
              </div>
            </div>

            {/* ADAPTIVE WEAK AREAS SECTION */}
            {quizResult.weakAreas.length > 0 ? (
              <div className="max-w-xl mx-auto text-left p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Target className="w-4 h-4" />
                  <span>Your Identified Weak Areas ({quizResult.weakAreas.length})</span>
                </div>
                <p className="text-xs text-amber-200/80">
                  You missed questions covering the following concepts:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quizResult.weakAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
                <div className="pt-2">
                  <button
                    onClick={handlePracticeWeakAreas}
                    disabled={isGenerating}
                    className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Practice Weak Areas (Adaptive Quiz)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Flawless performance! You mastered all topics tested in this session.</span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCurrentScreen("review")}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Review Answers & Explanations
              </button>

              <button
                onClick={() => handleStartQuiz()}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => setCurrentScreen("setup")}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-semibold text-xs transition-all cursor-pointer"
              >
                Configure New Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: ANSWER REVIEW */}
      {/* ========================================================================= */}
      {currentScreen === "review" && quizResult && (
        <div id="academic-quiz-review" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Reviewing Answers ({quizResult.score} / {quizResult.totalQuestions} Correct)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Detailed explanations and AI Tutor insights for {activeSubjectName}.
              </p>
            </div>

            <button
              onClick={() => setCurrentScreen("result")}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Results</span>
            </button>
          </div>

          <div className="space-y-4">
            {quizResult.reviewedQuestions.map((item, idx) => {
              const q = item.question;
              const isCorrect = item.isCorrect;

              return (
                <div
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? "bg-emerald-950/10 border-emerald-500/25"
                      : "bg-rose-950/10 border-rose-500/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-400">
                        Q{idx + 1}.
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase">
                          <XCircle className="w-3 h-3" /> Incorrect
                        </span>
                      )}
                      {q.topic && (
                        <span className="text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {q.topic}
                        </span>
                      )}
                    </div>

                    {/* Ask AI Tutor Why Button */}
                    <button
                      onClick={() => handleOpenExplainer(q)}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition-colors cursor-pointer"
                    >
                      <GraduationCap className="w-3 h-3" />
                      <span>Ask AI Tutor Why</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-white mb-3">
                    {q.question}
                  </p>

                  {/* Options List */}
                  <div className="space-y-1.5 text-xs mb-3">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                      const isChosen = item.selectedOption === key;
                      const isTheRightAnswer = q.correctAnswer === key;

                      let optClasses = "bg-white/[0.02] border-white/5 text-slate-300";
                      if (isTheRightAnswer) {
                        optClasses = "bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-semibold";
                      } else if (isChosen && !isTheRightAnswer) {
                        optClasses = "bg-rose-500/15 border-rose-500/40 text-rose-200 line-through";
                      }

                      return (
                        <div
                          key={key}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${optClasses}`}
                        >
                          <span className="font-bold shrink-0">{key})</span>
                          <span>{q.options[key]}</span>
                          {isTheRightAnswer && (
                            <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400 shrink-0">
                              (Correct Answer)
                            </span>
                          )}
                          {isChosen && !isTheRightAnswer && (
                            <span className="ml-auto text-[10px] uppercase font-bold text-rose-400 shrink-0">
                              (Your Choice)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1">
                      <div className="font-semibold text-indigo-300 text-[11px] uppercase tracking-wider">
                        Concept & Explanation:
                      </div>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentScreen("result")}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer border border-white/10"
            >
              Back to Scorecard
            </button>

            <button
              onClick={() => setCurrentScreen("setup")}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              Start Another Quiz
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI TUTOR QUESTION EXPLAINER MODAL / SLIDEOVER */}
      {/* ========================================================================= */}
      {explainingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1021] border border-indigo-500/40 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    AstraMind AI Tutor Explanation
                  </h4>
                  <p className="text-[10px] text-indigo-300">
                    {activeSubjectName} • {VITS_COLLEGE_NAME}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExplainingQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs scrollbar-thin">
              {/* Question Context */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target Question:
                </div>
                <p className="text-white font-medium">{explainingQuestion.question}</p>
                <div className="pt-1 text-[11px] text-emerald-400 font-semibold">
                  Correct Answer: Option {explainingQuestion.correctAnswer} -{" "}
                  {explainingQuestion.options[explainingQuestion.correctAnswer]}
                </div>
              </div>

              {/* Live Tutor Explanation */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Professor Explanation:</span>
                </div>

                {isExplaining ? (
                  <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                    <span>Analyzing academic principles and crafting explanation...</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-slate-200 leading-relaxed whitespace-pre-line">
                    {explanationText || explainingQuestion.explanation}
                  </div>
                )}
              </div>

              {/* Custom Student Follow-up Question */}
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">
                  Still have a doubt about this question? Ask the AI Tutor:
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Why isn't option C possible here?"
                    value={customTutorQuery}
                    onChange={(e) => setCustomTutorQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customTutorQuery.trim()) {
                        handleOpenExplainer(explainingQuestion, customTutorQuery.trim());
                      }
                    }}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => {
                      if (customTutorQuery.trim()) {
                        handleOpenExplainer(explainingQuestion, customTutorQuery.trim());
                      }
                    }}
                    disabled={isExplaining || !customTutorQuery.trim()}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02] flex justify-end">
              <button
                onClick={() => setExplainingQuestion(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
              >
                Close & Return to Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
