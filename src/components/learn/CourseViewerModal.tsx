import React, { useState } from "react";
import {
  X,
  BookOpen,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Award,
  Layers,
  ChevronRight,
  Send,
  Bookmark,
  Brain,
  Lightbulb,
  ExternalLink,
  Code2,
  ListTodo
} from "lucide-react";
import { Course, Lesson } from "./learnTypes";

interface CourseViewerModalProps {
  course: Course;
  onClose: () => void;
  completedLessons: Record<string, boolean>;
  onToggleLessonComplete: (lessonId: string, courseId: string) => void;
  onAddXp: (amount: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: (courseId: string) => void;
  onOpenNotes: (courseId: string, lessonId?: string, lessonTitle?: string) => void;
}

export default function CourseViewerModal({
  course,
  onClose,
  completedLessons,
  onToggleLessonComplete,
  onAddXp,
  isBookmarked,
  onToggleBookmark,
  onOpenNotes
}: CourseViewerModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "lessons" | "practice" | "quiz" | "interview" | "tutor" | "resources"
  >("overview");

  const [selectedLesson, setSelectedLesson] = useState<Lesson>(course.lessons[0] || {
    id: "default-1",
    title: "1. Course Overview",
    duration: "10 min",
    description: course.description,
    content: `### Welcome to ${course.title}\n\n${course.description}\n\nExplore lessons, practice challenges, and AI Tutor assistance in the tabs above!`,
  });

  // AI Tutor state
  const [tutorMessages, setTutorMessages] = useState<{ sender: "user" | "tutor"; text: string }[]>([
    {
      sender: "tutor",
      text: `Hello! I am your AI Mentor & Personal Teacher for **${course.title}**. Ask me any doubt, request code hints, or ask me to explain difficult concepts step-by-step!`
    }
  ]);
  const [tutorInput, setTutorInput] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Calculate course completion
  const totalLessons = course.lessons.length;
  const completedCount = course.lessons.filter(l => completedLessons[l.id]).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const handleSendTutorMessage = async () => {
    if (!tutorInput.trim() || isTutorLoading) return;
    const userMsg = tutorInput.trim();
    setTutorInput("");

    const updated = [...tutorMessages, { sender: "user" as const, text: userMsg }];
    setTutorMessages(updated);
    setIsTutorLoading(true);

    try {
      const systemInstruction = `You are an AI Tutor and Personal Teacher for the course: "${course.title}".
Your goal:
1. Explain concepts simply and conceptually.
2. Answer student doubts encouragingly.
3. Give helpful hints and ask guiding questions to help the student think.
4. NEVER immediately reveal the full solution to homework or code challenges—guide them to discover it!`;

      const apiMessages = updated.map(m => ({ sender: m.sender === "user" ? "user" : "assistant", text: m.text }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, systemInstruction })
      });
      const data = await res.json();

      setTutorMessages(prev => [...prev, { sender: "tutor", text: data.text || "I'm here to help you learn! What concept would you like to explore next?" }]);
    } catch (e) {
      setTutorMessages(prev => [...prev, { sender: "tutor", text: "I'm having a brief connection delay. Feel free to rephrase your doubt!" }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const handleGradeQuiz = () => {
    if (course.quizzes.length === 0) return;
    let correct = 0;
    course.quizzes.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    const score = Math.round((correct / course.quizzes.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    if (score >= 70) {
      onAddXp(100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn">
      <div className="bg-[#0b0f24] border border-white/10 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Course Header */}
        <div className="px-5 py-3.5 bg-[#080c1d] border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl bg-gradient-to-r ${course.colorGradient} text-white font-bold shadow-lg shrink-0`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">{course.title}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {course.level}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>{completedCount}/{totalLessons} Lessons ({progressPercent}%)</span>
                <span className="text-slate-600">•</span>
                <span>⏱ ~{course.estimatedHours} hrs</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(course.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isBookmarked
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
              title="Bookmark Course"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400" : ""}`} />
            </button>
            <button
              onClick={() => onOpenNotes(course.id, selectedLesson.id, selectedLesson.title)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Take Notes</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 py-2 bg-[#060918] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x">
          {[
            { id: "overview", label: "Overview & Roadmaps", icon: Layers },
            { id: "lessons", label: "Lessons", icon: BookOpen },
            { id: "practice", label: "Practice & Projects", icon: Code2 },
            { id: "quiz", label: `Quiz (${course.quizzes.length})`, icon: Award },
            { id: "interview", label: "Interview Prep", icon: HelpCircle },
            { id: "tutor", label: "AI Tutor", icon: Brain },
            { id: "resources", label: "Resources", icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                    : "bg-white/5 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          
          {/* TAB 1: OVERVIEW & ROADMAPS */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  About {course.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{course.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {course.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-indigo-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Roadmaps Split: Beginner, Intermediate, Advanced */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-emerald-400" />
                  Structured Mastery Roadmaps
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Beginner Roadmap */}
                  <div className="bg-[#080d22] border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Beginner Phase</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-mono text-emerald-300">Level 1</span>
                    </div>
                    {course.roadmaps.beginner.map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1.5">
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </div>
                    ))}
                  </div>

                  {/* Intermediate Roadmap */}
                  <div className="bg-[#080d22] border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Intermediate Phase</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] font-mono text-indigo-300">Level 2</span>
                    </div>
                    {course.roadmaps.intermediate.map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1.5">
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </div>
                    ))}
                  </div>

                  {/* Advanced Roadmap */}
                  <div className="bg-[#080d22] border border-purple-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Advanced Phase</span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-[10px] font-mono text-purple-300">Level 3</span>
                    </div>
                    {course.roadmaps.advanced.map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1.5">
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LESSONS VIEWER */}
          {activeTab === "lessons" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Lessons Sidebar */}
              <div className="lg:col-span-4 bg-[#080d22] border border-white/10 rounded-2xl p-3 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Course Modules ({course.lessons.length})
                </div>
                {course.lessons.map((lesson) => {
                  const isDone = completedLessons[lesson.id];
                  const isSelected = selectedLesson.id === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setSelectedLesson(lesson);
                        
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md"
                          : "bg-white/5 border-white/5 hover:border-white/20 text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLessonComplete(lesson.id, course.id);
                          }}
                          className={`p-1 rounded-lg border cursor-pointer transition-colors ${
                            isDone ? "bg-emerald-500 text-white border-emerald-400" : "bg-white/5 border-white/20 text-slate-500"
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{lesson.title}</div>
                          <div className="text-[10px] text-slate-400">{lesson.duration}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Lesson Reader */}
              <div className="lg:col-span-8 bg-[#080d22] border border-white/10 rounded-2xl p-5 space-y-5 overflow-y-auto max-h-[600px] scrollbar-thin">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedLesson.title}</h3>
                    <p className="text-xs text-slate-400">{selectedLesson.description}</p>
                  </div>
                  <button
                    onClick={() => onToggleLessonComplete(selectedLesson.id, course.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      completedLessons[selectedLesson.id]
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{completedLessons[selectedLesson.id] ? "Completed" : "Mark Complete (+25 XP)"}</span>
                  </button>
                </div>

                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed whitespace-pre-wrap">
                  {selectedLesson.content}
                </div>

                {selectedLesson.codeExample && (
                  <div className="bg-[#040612] border border-white/10 rounded-xl p-4 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
                      <span className="text-[11px] font-bold uppercase text-indigo-400">Code Example</span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Syntax Verified</span>
                    </div>
                    <pre className="text-emerald-400 overflow-x-auto p-2">{selectedLesson.codeExample}</pre>
                  </div>
                )}

                {selectedLesson.keyTakeaways && selectedLesson.keyTakeaways.length > 0 && (
                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      Key Takeaways
                    </div>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {selectedLesson.keyTakeaways.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRACTICE & MINI PROJECTS */}
          {activeTab === "practice" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  Practice Challenges
                </h3>
                {course.practiceChallenges.length === 0 ? (
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-400">
                    Practice challenges for this course are updated continuously. Check back soon!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.practiceChallenges.map((ch) => (
                      <div key={ch.id} className="bg-[#080d22] border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{ch.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                            {ch.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{ch.description}</p>
                        <div className="bg-[#040612] border border-white/10 rounded-xl p-3 font-mono text-xs text-emerald-300">
                          <div className="text-[10px] text-slate-500 font-sans font-bold uppercase mb-1">Starter Template</div>
                          <pre className="overflow-x-auto whitespace-pre-wrap">{ch.starterCode}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: QUIZ */}
          {activeTab === "quiz" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {course.quizzes.length === 0 ? (
                <div className="p-6 bg-[#080d22] border border-white/10 rounded-2xl text-center space-y-2">
                  <Award className="w-8 h-8 text-indigo-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Quiz Coming Soon</h3>
                  <p className="text-xs text-slate-400">Our AI is generating custom questions for this module!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {quizSubmitted && quizScore !== null && (
                    <div className={`p-5 rounded-2xl border ${quizScore >= 70 ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200" : "bg-rose-950/60 border-rose-500/40 text-rose-200"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">Quiz Results: {quizScore}%</h3>
                          <p className="text-xs mt-1">{quizScore >= 70 ? "Passed! You earned +100 XP!" : "Keep practicing and try again!"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setQuizSubmitted(false);
                            setQuizAnswers({});
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                        >
                          Retake Quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {course.quizzes.map((q, idx) => (
                    <div key={q.id} className="bg-[#080d22] border border-white/10 rounded-2xl p-5 space-y-3">
                      <div className="text-sm font-bold text-white">
                        {idx + 1}. {q.question}
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = quizAnswers[q.id] === oIdx;
                          let btnClass = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
                          if (quizSubmitted) {
                            if (oIdx === q.correctIndex) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                            else if (isSelected) btnClass = "bg-rose-500/20 border-rose-500 text-rose-300";
                          } else if (isSelected) {
                            btnClass = "bg-indigo-600 border-indigo-500 text-white font-bold";
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                              className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${btnClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <p className="text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="font-bold text-indigo-300">Explanation:</span> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted && (
                    <button
                      onClick={handleGradeQuiz}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl cursor-pointer"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INTERVIEW PREP */}
          {activeTab === "interview" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  Common Interview Questions
                </h3>
                {course.interviewQuestions.map((iq) => (
                  <div key={iq.id} className="bg-[#080d22] border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{iq.question}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300">
                        {iq.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {iq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AI TUTOR */}
          {activeTab === "tutor" && (
            <div className="space-y-4 max-w-4xl mx-auto h-[520px] flex flex-col bg-[#080d22] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Socratic AI Teacher for {course.title}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Personal Mentor
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 p-2 scrollbar-thin">
                {tutorMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        m.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white/10 text-slate-200 border border-white/10 rounded-bl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTutorLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-indigo-300 p-3 rounded-2xl text-xs animate-pulse">
                      AI Tutor is thinking...
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={tutorInput}
                  onChange={(e) => setTutorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendTutorMessage()}
                  placeholder={`Ask a question or ask for a hint about ${course.title}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendTutorMessage}
                  disabled={isTutorLoading}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: RESOURCES */}
          {activeTab === "resources" && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-indigo-400" />
                Recommended Official Resources
              </h3>
              <div className="space-y-3">
                {course.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-[#080d22] border border-white/10 hover:border-indigo-500/50 rounded-2xl flex items-center justify-between text-xs text-slate-300 transition-all group"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-indigo-300">{res.name}</div>
                      <div className="text-[10px] text-slate-400">{res.type}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
