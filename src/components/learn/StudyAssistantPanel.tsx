import React, { useState } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  Zap,
  HelpCircle,
  Calendar,
  Layers,
  RotateCw,
  CheckCircle,
  Clock,
  Download,
  X
} from "lucide-react";
import { Flashcard } from "./learnTypes";

interface StudyAssistantPanelProps {
  onClose?: () => void;
  onAddXp: (amount: number) => void;
}

export default function StudyAssistantPanel({ onClose, onAddXp }: StudyAssistantPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"summarizer" | "flashcards" | "quiz" | "planner">("summarizer");

  // Document Summarizer State
  const [pastedText, setPastedText] = useState("");
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Flashcards State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: "fc-1", question: "What is Time Complexity of Binary Search?", answer: "O(log n) time complexity because it cuts the search space in half each iteration.", category: "Algorithms" },
    { id: "fc-2", question: "What is the difference between let, const, and var in JS?", answer: "let and const are block-scoped. const prevents re-assignment. var is function-scoped and hoisted.", category: "JavaScript" },
    { id: "fc-3", question: "What is the main advantage of PyTorch over TensorFlow 1.x?", answer: "PyTorch uses dynamic computational graphs (eager execution) making debugging much easier.", category: "Deep Learning" }
  ]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newTopicForFlashcards, setNewTopicForFlashcards] = useState("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  // AI Quiz Generator
  const [quizTopic, setQuizTopic] = useState("");
  const [generatedQuiz, setGeneratedQuiz] = useState<{ question: string; options: string[]; correctIndex: number; explanation: string }[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Revision Planner
  const [examSubject, setExamSubject] = useState("");
  const [daysUntilExam, setDaysUntilExam] = useState("14");
  const [revisionPlan, setRevisionPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Summarize Document / Text
  const handleSummarize = async () => {
    if (!pastedText.trim() || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ sender: "user", text: `Summarize the following study notes/PDF text into executive bullet points, key terminology, and high-yield exam takeaways:\n\n${pastedText}` }],
          systemInstruction: "You are an expert study assistant and notes summarizer. Format outputs cleanly using Markdown headings, bullet points, and key takeaways."
        })
      });
      const data = await res.json();
      setSummaryResult(data.text || "Summary completed.");
      onAddXp(20);
    } catch (err) {
      setSummaryResult("Failed to generate summary. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Generate Flashcards via AI
  const handleGenerateFlashcards = async () => {
    if (!newTopicForFlashcards.trim() || isGeneratingFlashcards) return;
    setIsGeneratingFlashcards(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ sender: "user", text: `Generate 4 high-yield active recall flashcards for topic: "${newTopicForFlashcards}". Return valid JSON array of objects with keys: question, answer, category.` }],
          systemInstruction: "Return ONLY a valid JSON array of flashcards without markdown formatting or introductory text."
        })
      });
      const data = await res.json();
      try {
        const cleanJson = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed: Flashcard[] = JSON.parse(cleanJson);
        const formatted = parsed.map((fc, i) => ({ ...fc, id: `gen-${Date.now()}-${i}` }));
        setFlashcards(prev => [...formatted, ...prev]);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        setNewTopicForFlashcards("");
        onAddXp(30);
      } catch (e) {
        // fallback
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // Generate AI Quiz
  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim() || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    setQuizSubmitted(false);
    setUserQuizAnswers({});
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ sender: "user", text: `Generate 3 multiple choice questions for topic: "${quizTopic}". Return valid JSON array of objects with keys: question, options (array of 4 strings), correctIndex (0-3), explanation.` }],
          systemInstruction: "Return ONLY valid JSON array of quiz questions."
        })
      });
      const data = await res.json();
      const cleanJson = data.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      setGeneratedQuiz(parsed);
      onAddXp(30);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Generate Revision Schedule Plan
  const handleGeneratePlan = async () => {
    if (!examSubject.trim() || isGeneratingPlan) return;
    setIsGeneratingPlan(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ sender: "user", text: `Create a structured day-by-day revision schedule for "${examSubject}" over the next ${daysUntilExam} days. Include daily review topics, practice problems, and rest intervals.` }],
          systemInstruction: "You are an expert exam strategist. Return a well-structured Markdown daily timetable."
        })
      });
      const data = await res.json();
      setRevisionPlan(data.text);
      onAddXp(25);
    } catch (e) {
      setRevisionPlan("Failed to generate revision schedule.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="bg-[#080d22] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Study Assistant & Productivity Suite</h2>
            <p className="text-xs text-slate-400">Summarize PDFs, practice active recall flashcards, and build exam schedules</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: "summarizer", label: "PDF / Notes Summarizer", icon: FileText },
          { id: "flashcards", label: "Active Recall Flashcards", icon: Layers },
          { id: "quiz", label: "AI Quiz Generator", icon: HelpCircle },
          { id: "planner", label: "Exam Revision Planner", icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30"
                  : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab Content */}
      <div className="space-y-4">
        {/* SUMMARIZER */}
        {activeSubTab === "summarizer" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Paste Study Notes or Document Content</label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste lecture notes, textbook chapters, or article text here..."
                className="w-full h-40 bg-[#040612] border border-white/10 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 resize-none scrollbar-thin"
              />
            </div>
            <button
              onClick={handleSummarize}
              disabled={isSummarizing || !pastedText.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSummarizing ? "Summarizing with AI..." : "Generate High-Yield Summary (+20 XP)"}</span>
            </button>

            {summaryResult && (
              <div className="bg-[#040612] border border-white/10 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-emerald-400">AI Generated Summary & Exam Takeaways</div>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{summaryResult}</div>
              </div>
            )}
          </div>
        )}

        {/* FLASHCARDS */}
        {activeSubTab === "flashcards" && (
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Generate Flashcards Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicForFlashcards}
                onChange={(e) => setNewTopicForFlashcards(e.target.value)}
                placeholder="Enter topic to generate flashcards (e.g. Dynamic Programming)..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleGenerateFlashcards}
                disabled={isGeneratingFlashcards || !newTopicForFlashcards.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {isGeneratingFlashcards ? "Generating..." : "Generate"}
              </button>
            </div>

            {/* Flashcard 3D Interactive Card */}
            {flashcards.length > 0 && (
              <div className="space-y-4">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-56 bg-gradient-to-br from-indigo-950 via-[#0b0f2a] to-purple-950 border border-indigo-500/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xl transition-transform duration-300 hover:scale-[1.01]"
                >
                  <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest mb-2">
                    {flashcards[currentCardIdx].category} • {isFlipped ? "ANSWER" : "QUESTION (CLICK TO FLIP)"}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {isFlipped ? flashcards[currentCardIdx].answer : flashcards[currentCardIdx].question}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx(prev => (prev > 0 ? prev - 1 : flashcards.length - 1));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx(prev => (prev < flashcards.length - 1 ? prev + 1 : 0));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                    >
                      Next Card
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI QUIZ GENERATOR */}
        {activeSubTab === "quiz" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="Topic for Quiz (e.g. React Hooks, Python OOP)..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz || !quizTopic.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
              </button>
            </div>

            {generatedQuiz.length > 0 && (
              <div className="space-y-4">
                {generatedQuiz.map((q, idx) => (
                  <div key={idx} className="bg-[#040612] border border-white/10 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-white">{idx + 1}. {q.question}</div>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          disabled={quizSubmitted}
                          onClick={() => setUserQuizAnswers(prev => ({ ...prev, [idx]: oIdx }))}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs border cursor-pointer ${
                            quizSubmitted
                              ? oIdx === q.correctIndex
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                                : userQuizAnswers[idx] === oIdx
                                ? "bg-rose-500/20 border-rose-500 text-rose-300"
                                : "bg-white/5 border-white/5 text-slate-400"
                              : userQuizAnswers[idx] === oIdx
                              ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!quizSubmitted && (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Grade Quiz Answers
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* REVISION PLANNER */}
        {activeSubTab === "planner" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold">Exam / Target Subject</label>
                <input
                  type="text"
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold">Days Until Exam</label>
                <input
                  type="number"
                  value={daysUntilExam}
                  onChange={(e) => setDaysUntilExam(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500 mt-1"
                />
              </div>
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan || !examSubject.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPlan ? "Planning Schedule..." : "Build Daily Revision Timetable"}
            </button>

            {revisionPlan && (
              <div className="bg-[#040612] border border-white/10 rounded-xl p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {revisionPlan}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
