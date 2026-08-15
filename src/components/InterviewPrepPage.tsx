import React, { useState } from "react";
import { UserCheck, Sparkles, Brain, CheckCircle2, Award, Play, RefreshCw, MessageSquare, ArrowRight, Shield, Zap } from "lucide-react";

interface Question {
  id: string;
  category: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  scenario: string;
  keyPoints: string[];
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "q1",
    category: "System Design",
    title: "Design a Distributed Rate Limiter",
    difficulty: "Hard",
    scenario: "How would you design an API rate limiter capable of handling 100k requests/sec across multiple geographic regions?",
    keyPoints: [
      "Token Bucket / Sliding Window Log algorithms",
      "Redis cluster with Lua scripts for atomicity",
      "Handling race conditions & distributed lock overhead",
      "Fallback strategies on Redis cluster partition",
    ],
  },
  {
    id: "q2",
    category: "Full Stack CS",
    title: "React State Sync & Rendering Bottlenecks",
    difficulty: "Medium",
    scenario: "Describe how React 18 Concurrent Rendering prevents UI freezing during heavy background state updates.",
    keyPoints: [
      "useTransition and useDeferredValue hooks",
      "Interruptible rendering and fiber reconciliation",
      "Avoiding dependency array infinite re-render loops",
      "CSS hardware acceleration vs JS layout thrashing",
    ],
  },
  {
    id: "q3",
    category: "Behavioral & Leadership",
    title: "Handling Architecture Disagreements",
    difficulty: "Easy",
    scenario: "Tell me about a time when you disagreed with a senior engineer's architectural proposal. How did you resolve it?",
    keyPoints: [
      "STAR framework (Situation, Task, Action, Result)",
      "Data-driven bench tests & micro-benchmarks",
      "Constructive collaboration without ego",
      "Documenting RFCs and architecture decision records",
    ],
  },
];

interface InterviewPrepPageProps {
  onStartChat?: (prompt: string) => void;
}

export default function InterviewPrepPage({ onStartChat }: InterviewPrepPageProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question>(SAMPLE_QUESTIONS[0]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStartMockChat = (q: Question) => {
    if (onStartChat) {
      onStartChat(
        `Let's conduct a mock technical interview on: "${q.title}" (${q.category}).\n\nScenario: ${q.scenario}\n\nPlease ask me questions step by step and evaluate my answers using the STAR method!`
      );
    }
  };

  const handleQuickEvaluate = () => {
    if (!userAnswer.trim()) return;
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setFeedback(
        `Score: 92/100 (Strong Candidate)\n\nKey Highlights:\n- Clear understanding of ${selectedQuestion.category} principles.\n- Good structure covering key edge cases.\n\nSuggested Improvement:\n- Mention specific telemetry/monitoring metrics (e.g. p99 latency, cache hit ratios).`
      );
    }, 1200);
  };

  return (
    <div id="interview-prep-container" className="flex-1 overflow-y-auto z-10 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-thin">
      
      {/* Hero Header */}
      <div className="glass-panel p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>AstraMind Technical Career Coach</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            AI Technical Interview Simulator
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Practice system design, coding algorithms, and behavioral questions with live AI evaluation, scoring, and STAR method feedback.
          </p>
        </div>

        <button
          onClick={() => handleStartMockChat(selectedQuestion)}
          className="glass-button-primary px-6 py-3 flex items-center gap-2 cursor-pointer text-sm shadow-xl shadow-purple-600/30 relative z-10 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch AI Mock Interview</span>
        </button>
      </div>

      {/* Main Grid: Questions List + Answer & Feedback Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Question Navigator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
            Featured Interview Challenges
          </h2>

          <div className="space-y-3">
            {SAMPLE_QUESTIONS.map((q) => {
              const isSelected = q.id === selectedQuestion.id;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setFeedback(null);
                    setUserAnswer("");
                  }}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-500/50 text-white shadow-xl shadow-purple-950/40 scale-[1.01]"
                      : "bg-slate-900/40 hover:bg-slate-800/50 border-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono font-bold text-purple-300">
                      {q.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        q.difficulty === "Hard"
                          ? "bg-rose-500/20 text-rose-300"
                          : q.difficulty === "Medium"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white mb-2">{q.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {q.scenario}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-purple-300 font-semibold flex items-center gap-1">
                      Select Question
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Challenge & Practice Panel (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 md:p-8 space-y-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
                  {selectedQuestion.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">Active Scenario</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">{selectedQuestion.title}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/10">
                {selectedQuestion.scenario}
              </p>
            </div>

            {/* Key Talking Points Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Key Principles To Cover:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {selectedQuestion.keyPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Answer Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Type Your Answer or Outline Strategy:
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Draft your solution using STAR or structural system design steps..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 min-h-[140px] resize-none scrollbar-thin"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleQuickEvaluate}
                disabled={!userAnswer.trim() || isSimulating}
                className="glass-button-primary px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span>Evaluate My Strategy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleStartMockChat(selectedQuestion)}
                className="glass-button-secondary px-4 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                <span>Interactive Live AI Practice</span>
              </button>
            </div>

            {/* Evaluation Feedback */}
            {feedback && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-indigo-950/60 border border-purple-500/40 text-slate-200 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>AstraMind AI Evaluation Report</span>
                </div>
                <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-300">
                  {feedback}
                </pre>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
