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

const EMPTY_QUESTION: Question = {
  id: "user-interview-question",
  category: "",
  title: "",
  difficulty: "Medium",
  scenario: "",
  keyPoints: [],
};

interface InterviewPrepPageProps {
  onStartChat?: (prompt: string) => void;
}

export default function InterviewPrepPage({ onStartChat }: InterviewPrepPageProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question>({ ...EMPTY_QUESTION });
  const [userAnswer, setUserAnswer] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStartMockChat = (q: Question) => {
    if (!q.title.trim() || !q.scenario.trim()) {
      setFeedback("Enter an interview question title and scenario first.");
      return;
    }
    if (onStartChat) {
      onStartChat(
        `Let's conduct a mock technical interview on: "${q.title}" (${q.category}).\n\nScenario: ${q.scenario}\n\nPlease ask me questions step by step and evaluate my answers using the STAR method!`
      );
    }
  };

  const handleQuickEvaluate = async () => {
    if (!selectedQuestion.title.trim() || !selectedQuestion.scenario.trim()) {
      setFeedback("Enter an interview question title and scenario before requesting an evaluation.");
      return;
    }
    if (!userAnswer.trim() || isSimulating) return;
    setIsSimulating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              sender: "user",
              text: `Please evaluate this candidate's interview answer for the following question:

Question Title: ${selectedQuestion.title}
Category: ${selectedQuestion.category}
Scenario: ${selectedQuestion.scenario}
Key Principles: ${selectedQuestion.keyPoints.join(", ")}

Candidate's Response:
"${userAnswer}"

Provide an objective, structured, insightful evaluation report:
1. Overall Assessment & Score (out of 100)
2. Key Strengths Demonstrated
3. Missing Edge Cases or Concepts
4. Recommended Refinements (STAR format or architecture design improvements)`
            }
          ],
          systemInstruction: "You are a Senior Staff Technical Interviewer evaluating software engineering and computer science interview responses. Provide objective, structured, insightful evaluation reports."
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Evaluation failed");
      }
      setFeedback(data.text || "Assessment generated successfully.");
    } catch (err: any) {
      setFeedback(`Evaluation failed: ${err?.message || "Network error. Please try again."}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div id="interview-prep-container" className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Studio Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-3">
              <UserCheck className="w-3.5 h-3.5" />
              <span>AstraMind Career Simulator</span>
            </div>
            <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
              Technical Interview
            </h1>
            <p className="text-sm text-white/50 mt-1 font-normal tracking-wide">
              Practice system design, algorithms, and behavioral questions with live AI evaluation and scoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStartMockChat(selectedQuestion)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#a78bfa]" />
              <span>Launch Mock Interview</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Questions List + Answer & Feedback Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: user-authored interview question */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-mono-studio uppercase tracking-[0.15em] text-white/40 font-semibold px-1">
              Your Interview Question
            </h2>
            <div className="p-5 rounded-[24px] bg-[#151517] border border-white/[0.06] space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-studio uppercase text-white/50">Category</label>
                <input
                  value={selectedQuestion.category}
                  onChange={(e) => { setSelectedQuestion((q) => ({ ...q, category: e.target.value })); setFeedback(null); }}
                  placeholder="e.g. System Design, C Programming, Behavioral"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-studio uppercase text-white/50">Question title</label>
                <input
                  value={selectedQuestion.title}
                  onChange={(e) => { setSelectedQuestion((q) => ({ ...q, title: e.target.value })); setFeedback(null); }}
                  placeholder="Give your question a short title"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-studio uppercase text-white/50">Difficulty</label>
                <select
                  value={selectedQuestion.difficulty}
                  onChange={(e) => setSelectedQuestion((q) => ({ ...q, difficulty: e.target.value as Question["difficulty"] }))}
                  className="w-full bg-[#101012] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-studio uppercase text-white/50">Question / scenario</label>
                <textarea
                  value={selectedQuestion.scenario}
                  onChange={(e) => { setSelectedQuestion((q) => ({ ...q, scenario: e.target.value })); setFeedback(null); }}
                  placeholder="Paste the question or describe the interview scenario you want to practice."
                  rows={5}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] resize-y"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono-studio uppercase text-white/50">Key points (optional)</label>
                <textarea
                  value={selectedQuestion.keyPoints.join("\n")}
                  onChange={(e) => setSelectedQuestion((q) => ({
                    ...q,
                    keyPoints: e.target.value.split(/[\n,]/).map((p) => p.trim()).filter(Boolean),
                  }))}
                  placeholder="Add one rubric item per line, or leave blank for a general evaluation."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] resize-y"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Active Challenge & Practice Panel (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-6">
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] text-xs font-mono-studio">
                    {selectedQuestion.category}
                  </span>
                  <span className="text-xs text-white/40 font-mono-studio">• Active Scenario</span>
                </div>
                <h2 className="font-serif-studio text-2xl sm:text-3xl font-medium text-white tracking-tight">{selectedQuestion.title}</h2>
                <div className="text-sm text-white/70 mt-3 leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06]">
                  {selectedQuestion.scenario}
                </div>
              </div>

              {/* Key Talking Points Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono-studio uppercase tracking-wider text-white/40 font-semibold">
                  Key Principles To Cover:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedQuestion.keyPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-white/80 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                      <CheckCircle2 className="w-4 h-4 text-[#a78bfa] shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Answer Input Box */}
              <div className="space-y-2">
                <label className="text-xs font-mono-studio uppercase tracking-wider text-white/40 block font-semibold">
                  Type Your Answer or Outline Strategy:
                </label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Draft your solution using STAR or structural system design steps..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] min-h-[140px] resize-none scrollbar-thin transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleQuickEvaluate}
                  disabled={!userAnswer.trim() || isSimulating}
                  className="px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5" />
                      <span>Evaluate Strategy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleStartMockChat(selectedQuestion)}
                  className="px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Interactive Live AI Chat</span>
                </button>
              </div>

              {/* Evaluation Feedback */}
              {feedback && (
                <div className="p-5 rounded-2xl bg-[#1a1a1d] border border-[#a78bfa]/30 text-white/90 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-[#a78bfa] font-medium text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>AstraMind AI Evaluation Report</span>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-white/70">
                    {feedback}
                  </pre>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
