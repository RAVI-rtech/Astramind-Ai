import React, { useState, useEffect } from "react";
import {
  Clock,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Trash2,
  CheckCircle2,
  FileText,
  Users,
  Shield,
  GraduationCap,
  Copy,
  Plus,
  Bookmark,
  Check,
  Eye
} from "lucide-react";
import { getSupabaseAuthHeaders } from "../../lib/supabase";
import { AcademicQuizDraft } from "../../types/academicLiveQuiz";

interface AcademicQuizHistoryProps {
  onLoadDraft: (draft: AcademicQuizDraft) => void;
  onClose: () => void;
  onOpenAuth?: (reason?: string) => void;
}

export default function AcademicQuizHistory({
  onLoadDraft,
  onClose,
  onOpenAuth,
}: AcademicQuizHistoryProps) {
  const [activeTab, setActiveTab] = useState<"created" | "participated" | "question_bank">("created");
  const [loading, setLoading] = useState(true);
  const [createdQuizzes, setCreatedQuizzes] = useState<any[]>([]);
  const [participatedQuizzes, setParticipatedQuizzes] = useState<any[]>([]);
  const [questionBank, setQuestionBank] = useState<any[]>([]);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchQuestionBank();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/history", {
        headers: authHeaders,
      });
      const data = await resp.json();
      if (resp.status === 401) {
        onOpenAuth?.("Please sign in to view your academic quiz history.");
        return;
      }
      if (data.success) {
        setCreatedQuizzes(data.createdQuizzes || []);
        setParticipatedQuizzes(data.participatedQuizzes || []);
      } else {
        setError(data.error || "Failed to load quiz history.");
      }
    } catch {
      setError("Unable to connect to quiz history service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionBank = async () => {
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/question-bank", {
        headers: authHeaders,
      });
      const data = await resp.json();
      if (data.success) {
        setQuestionBank(data.questions || []);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved draft?")) return;
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      await fetch(`/api/live-quiz/draft/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setCreatedQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch {
      // ignore
    }
  };

  const handleResumeDraft = async (draftId: string) => {
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch(`/api/live-quiz/draft/${draftId}`, {
        headers: authHeaders,
      });
      const data = await resp.json();
      if (data.success && data.draft) {
        onLoadDraft(data.draft);
      }
    } catch {
      alert("Failed to load draft.");
    }
  };

  const handleDuplicateQuiz = async (id: string) => {
    setDuplicatingId(id);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch(`/api/live-quiz/quiz/${id}/duplicate`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await resp.json();
      if (data.success && data.draft) {
        setSavedNotice(`Duplicated as "${data.draft.title}". Loading editor...`);
        setTimeout(() => {
          setSavedNotice(null);
          onLoadDraft(data.draft);
        }, 800);
      } else {
        alert(data.error || "Failed to duplicate quiz.");
      }
    } catch {
      alert("Error duplicating assessment.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleSaveQuestionsToBank = async (questions: any[], sourceTitle: string) => {
    if (!questions || questions.length === 0) return;
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/question-bank", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: questions.map((q) => ({
            ...q,
            sourceTitle,
          })),
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setSavedNotice(`Saved ${data.count} questions to your Reusable Question Bank!`);
        fetchQuestionBank();
        setTimeout(() => setSavedNotice(null), 3500);
      }
    } catch {
      alert("Error saving to question bank.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Assessment History & Reusable Question Bank
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review past assessment questions, duplicate quizzes with stable versioning, and access reusable questions.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          Back to Live Quiz
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab("created")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "created"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Created Assessments &amp; Drafts ({createdQuizzes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("question_bank")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "question_bank"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Bookmark className="w-4 h-4 text-amber-500" />
          <span>Question Bank ({questionBank.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("participated")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "participated"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Student Results ({participatedQuizzes.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading assessment records...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs text-center border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      ) : activeTab === "created" ? (
        <div className="space-y-4">
          {createdQuizzes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p>No created quizzes or drafts found under your account.</p>
            </div>
          ) : (
            createdQuizzes.map((q) => {
              const isExpanded = expandedQuizId === q.id;
              const hasQuestions = Array.isArray(q.questions) && q.questions.length > 0;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {q.title || `${q.subject} Assessment`}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === "draft"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {q.status === "draft" ? "Draft" : q.status === "ended" ? "Completed Room" : "Live Room"}
                        </span>
                        {q.roomCode && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                            PIN: {q.roomCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                        <span>{q.subject}</span>
                        <span>•</span>
                        <span>{q.branch}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{q.questionCount} Questions</span>
                        {q.totalMarks > 0 && <span>• {q.totalMarks} Marks</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Date: {new Date(q.updatedAt || q.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      {/* Review Questions Toggle */}
                      {hasQuestions && (
                        <button
                          onClick={() => setExpandedQuizId(isExpanded ? null : q.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{isExpanded ? "Hide Questions" : "Review Questions"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Reuse / Duplicate Quiz */}
                      <button
                        onClick={() => handleDuplicateQuiz(q.id)}
                        disabled={duplicatingId === q.id}
                        className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        title="Duplicate this assessment with fresh IDs so historical records are untouched"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{duplicatingId === q.id ? "Duplicating..." : "Reuse Quiz"}</span>
                      </button>

                      {/* Resume / Launch Draft */}
                      {q.id.startsWith("draft_") && (
                        <button
                          onClick={() => handleResumeDraft(q.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Edit / Launch</span>
                        </button>
                      )}

                      {q.id.startsWith("draft_") && (
                        <button
                          onClick={() => handleDeleteDraft(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Delete draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Questions Review Drawer */}
                  {isExpanded && hasQuestions && (
                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Reviewing Questions ({q.questions.length})
                        </span>
                        <button
                          onClick={() => handleSaveQuestionsToBank(q.questions, q.title)}
                          className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          Save All to Question Bank
                        </button>
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {q.questions.map((quest: any, qIdx: number) => (
                          <div
                            key={quest.id || qIdx}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {qIdx + 1}. {quest.questionText || quest.question}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 shrink-0">
                                {quest.questionType || "MCQ"} • {quest.marks || 1}m
                              </span>
                            </div>

                            {/* Options if MCQ */}
                            {Array.isArray(quest.options) && quest.options.length > 0 && quest.questionType !== "fill_blank" && quest.questionType !== "short_answer" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 pt-1">
                                {quest.options.map((opt: string, optIdx: number) => {
                                  const isCorrect = (quest.correctAnswers || [quest.correctIndex]).includes(optIdx);
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-1.5 rounded-lg text-[11px] flex items-center gap-1.5 ${
                                        isCorrect
                                          ? "bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30"
                                          : "text-slate-600 dark:text-slate-400"
                                      }`}
                                    >
                                      <span className="font-mono text-slate-400">{String.fromCharCode(65 + optIdx)}.</span>
                                      <span>{opt}</span>
                                      {isCorrect && <Check className="w-3 h-3 ml-auto text-emerald-400" />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Fill blank answer key */}
                            {quest.questionType === "fill_blank" && (
                              <p className="text-[11px] text-emerald-400 pl-2">
                                Expected: <strong className="font-mono">{quest.blanksExpected?.join(", ") || "—"}</strong>
                              </p>
                            )}

                            {/* Short answer keywords */}
                            {quest.questionType === "short_answer" && (
                              <p className="text-[11px] text-indigo-400 pl-2">
                                Mode: <strong className="font-mono">{quest.shortAnswerGrading || "auto"}</strong>
                                {quest.keywords && <span> • Keywords: {quest.keywords.join(", ")}</span>}
                              </p>
                            )}

                            {quest.explanation && (
                              <p className="text-[11px] text-slate-400 italic pl-2 pt-0.5 border-t border-slate-200 dark:border-slate-800">
                                Solution: {quest.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === "question_bank" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reusable questions saved from your assessments and question drafts. Select any question to insert into current or new assessment.
            </p>
            <span className="text-xs font-mono font-bold text-amber-500">
              {questionBank.length} Items Available
            </span>
          </div>

          {questionBank.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-500 space-y-2">
              <Bookmark className="w-8 h-8 text-slate-400 mx-auto" />
              <p>Your question bank is empty.</p>
              <p className="text-[11px] text-slate-400">
                You can save questions to your question bank by reviewing past quizzes in the "Created Assessments" tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {questionBank.map((qb, idx) => (
                <div
                  key={qb.bankId || idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {qb.questionText || qb.question}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {qb.questionType || "MCQ"}
                      </span>
                    </div>
                    {qb.sourceTitle && (
                      <p className="text-[11px] text-slate-400">
                        From: <span className="text-slate-300 font-medium">{qb.sourceTitle}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      // Create a new draft populated with this question
                      const newDraft: AcademicQuizDraft = {
                        title: "Custom Quiz from Question Bank",
                        college: "Vignan Institute of Science and Technology",
                        regulation: "VR25",
                        branch: "Computer Science and Engineering (CSE)",
                        year: "2nd Year",
                        semester: "Semester I",
                        subject: "Engineering Subject",
                        unit: "All Units",
                        assessmentType: "Class Assessment",
                        questionCount: 1,
                        totalMarks: qb.marks || 1,
                        timerType: "per_question",
                        timePerQuestion: 30,
                        marksPerCorrect: qb.marks || 1,
                        negativeMarks: 0,
                        questionOrder: "fixed",
                        explanationPolicy: "after_quiz",
                        difficulty: "Medium",
                        status: "draft",
                        questions: [
                          {
                            id: `q_qb_${Date.now()}_1`,
                            questionNumber: 1,
                            questionType: qb.questionType || "single_mcq",
                            questionText: qb.questionText || qb.question,
                            options: qb.options || ["A", "B", "C", "D"],
                            correctAnswers: qb.correctAnswers || [0],
                            explanation: qb.explanation || "",
                            marks: qb.marks || 1,
                            negativeMarks: qb.negativeMarks || 0,
                            isComplete: true,
                            blanksExpected: qb.blanksExpected,
                            acceptedAlternatives: qb.acceptedAlternatives,
                            caseSensitive: qb.caseSensitive,
                            shortAnswerGrading: qb.shortAnswerGrading,
                            keywords: qb.keywords,
                            sampleAnswer: qb.sampleAnswer,
                          },
                        ],
                      };
                      onLoadDraft(newDraft);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Start New Quiz with this Q
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {participatedQuizzes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Award className="w-8 h-8 text-slate-400 mx-auto" />
              <p>You haven't participated in any live quizzes yet.</p>
            </div>
          ) : (
            participatedQuizzes.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {p.quizTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Room {p.roomCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.subject} • {p.branch}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Date: {new Date(p.joinedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Score: {p.score} Marks
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.correctCount} / {p.totalQuestions} Correct
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
