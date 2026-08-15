import React, { useState, useRef, useEffect } from "react";
import {
  GraduationCap,
  Sparkles,
  Bot,
  Code2,
  Send,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Brain,
  RotateCw,
  Target,
  FileText,
  ChevronRight,
  Flame,
  Bookmark,
  Copy,
  Check,
  Zap,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  Trash2,
  Smile
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
  topicTag?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
}

interface CodingPageProps {
  accentColorClass: string;
  onStartChat?: (prompt: string) => void;
}

const SYSTEM_INSTRUCTION = `You are AstraMind AI Coding Tutor, a warm, patient, and highly encouraging computer science professor teaching first-year B.Tech students and beginner programmers.

CRITICAL FORMATTING REQUIREMENT:
You MUST structure EVERY single concept explanation using the EXACT headings in this exact order:

### • Simple Definition
(Write 1-2 short, crystal-clear sentences. Avoid complex jargon.)

### • Easy Example
\`\`\`python
# Simple, clean 3-5 line code snippet with helpful beginner comments
\`\`\`

### • Real-life Analogy
(Provide a relatable real-world everyday analogy, e.g. comparing variables to labeled boxes or arrays to numbered lockers.)

### • Key Points
- Bullet point 1
- Bullet point 2
- Bullet point 3

### • Common Mistakes
- Mistake 1: Explain a classic beginner trap and how to avoid it.
- Mistake 2: Explain another common mistake.

### • One Practice Question
(Ask ONE simple, encouraging question for the student to solve and reply back.)

### • One Follow-up Question
(Ask ONE curiosity question to deepen their learning.)

RESPONSE STYLE RULES:
1. Keep all text short and easy to read. Use bullet points and subheadings.
2. NO large walls of text or dense paragraphs.
3. Always sound like a friendly, supportive B.Tech university professor.
4. Encourage active learning.
5. If the user asks for advanced topics (e.g. Dynamic Programming, Red-Black Trees, Graph Algorithms), gradually step up the technical depth while maintaining the exact same structured 7-part format!`;

const STARTER_TOPICS = [
  {
    category: "Python Basics",
    icon: "🐍",
    title: "Variables & Data Types",
    prompt: "Can you explain Variables and Data Types in Python?",
    desc: "How Python stores numbers, text, and booleans in memory."
  },
  {
    category: "C & C++",
    icon: "⚡",
    title: "Pointers & Memory",
    prompt: "What are Pointers in C language and how do they work?",
    desc: "Understanding memory addresses without the headache."
  },
  {
    category: "Control Flow",
    icon: "🔁",
    title: "For vs While Loops",
    prompt: "What is the difference between For loops and While loops?",
    desc: "When to repeat code and how to avoid infinite loops."
  },
  {
    category: "Data Structures",
    icon: "📦",
    title: "Arrays vs Linked Lists",
    prompt: "Explain Arrays vs Linked Lists for a 1st year CS student.",
    desc: "Contiguous memory blocks vs pointers chaining nodes."
  },
  {
    category: "Core Concepts",
    icon: "🧠",
    title: "Recursion Made Easy",
    prompt: "What is Recursion in programming with a simple analogy?",
    desc: "Functions calling themselves until reaching a base condition."
  },
  {
    category: "Algorithms",
    icon: "⏱️",
    title: "Time Complexity Big-O",
    prompt: "Explain Big-O notation and Time Complexity simply.",
    desc: "Measuring how program runtime scales as data grows."
  },
  {
    category: "Object Oriented",
    icon: "🧩",
    title: "Classes & Objects",
    prompt: "What are Classes and Objects in Object Oriented Programming?",
    desc: "Blueprints vs real instances in C++ or Java/Python."
  },
  {
    category: "Web & DB",
    icon: "🗄️",
    title: "SQL & Primary Keys",
    prompt: "What is SQL and how do database tables work?",
    desc: "Querying rows and columns with simple SELECT commands."
  }
];

const INITIAL_WELCOME_MSG: Message = {
  id: "welcome-1",
  sender: "tutor",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  level: "Beginner",
  text: `### • Simple Definition
Hello! I am your **AstraMind AI Coding Tutor**. I am here to explain computer science and programming concepts step-by-step in plain, beginner-friendly English for first-year B.Tech and beginner students!

### • Easy Example
\`\`\`python
# Welcome to your first step in programming!
user_name = "Future Engineer"
print(f"Welcome to AstraMind, {user_name}!")
\`\`\`

### • Real-life Analogy
Think of learning to code like learning to cook with a recipe book. The computer is your assistant chef, following your exact step-by-step instructions!

### • Key Points
- **No Complex IDEs Needed**: Ask me any question, code snippet, or algorithm concept.
- **Structured Explanations**: Every concept is broken down into simple definitions, real-life analogies, key takeaways, and common traps.
- **Interactive Practice**: I will give you practice questions and friendly feedback on your answers.

### • Common Mistakes
- **Trying to memorize code**: Focus on understanding logic rather than memorizing syntax.
- **Being afraid of errors**: Error messages are just your friendly computer telling you what to fix!

### • One Practice Question
What topic or programming language are you currently learning in class (e.g., Python, C, C++, Java, Data Structures)?

### • One Follow-up Question
Would you like to start with basic fundamentals like **Variables & Loops**, or dive into **Data Structures & Algorithms**?`
};

export default function CodingPage({ accentColorClass, onStartChat }: CodingPageProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem("astramind_coding_tutor_chat");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [INITIAL_WELCOME_MSG];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [currentLevel, setCurrentLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem("astramind_coding_tutor_chat", JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Handle message sending to AI Tutor
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: currentLevel,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setIsLoading(true);

    const tutorMsgId = `tutor-${Date.now()}`;
    const initialTutorMsg: Message = {
      id: tutorMsgId,
      sender: "tutor",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: currentLevel,
    };

    setMessages((prev) => [...prev, initialTutorMsg]);

    try {
      // Build conversation history for context
      const formattedHistory = newMessages.map((m) => ({
        sender: m.sender === "user" ? "user" : "assistant",
        text: m.text,
      }));

      // Add student level context to prompt if level changed
      const levelPrompt = `[Student Knowledge Level: ${currentLevel} Level]. User Question: ${query}`;
      formattedHistory[formattedHistory.length - 1].text = levelPrompt;

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedHistory,
          systemInstruction: SYSTEM_INSTRUCTION,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to AI Tutor server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") break;
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tutorMsgId ? { ...m, text: accumulatedText } : m
                  )
                );
              }
            } catch (e) {}
          }
        }
      }

      if (!accumulatedText.trim()) {
        // Fallback to non-streaming endpoint
        const fallbackRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: formattedHistory,
            systemInstruction: SYSTEM_INSTRUCTION,
          }),
        });
        const fallbackData = await fallbackRes.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tutorMsgId
              ? { ...m, text: fallbackData.text || "I'm ready to explain this topic! Please ask your question again." }
              : m
          )
        );
      }
    } catch (error) {
      console.error("[AI Tutor Error]", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tutorMsgId
            ? {
                ...m,
                text: "Sorry, I ran into a connection glitch while processing your question. Please try asking again!",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to reset the AI Tutor chat history?")) {
      setMessages([INITIAL_WELCOME_MSG]);
      localStorage.removeItem("astramind_coding_tutor_chat");
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Render formatted markdown-like text with clean sections
  const renderTutorText = (text: string) => {
    if (!text) return <p className="animate-pulse text-indigo-300">AI Tutor is thinking...</p>;

    // Split text by section headers starting with ### • or ### or •
    const sections = text.split(/(?=###\s*•|###\s*)/g);

    return (
      <div className="space-y-4 text-sm leading-relaxed text-slate-200">
        {sections.map((sec, idx) => {
          const trimmed = sec.trim();
          if (!trimmed) return null;

          // Check section type
          if (trimmed.includes("Simple Definition")) {
            const body = trimmed.replace(/###\s*•?\s*Simple Definition/i, "").trim();
            return (
              <div key={idx} className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Simple Definition</span>
                </div>
                <div className="text-slate-200 text-sm font-medium">{body}</div>
              </div>
            );
          }

          if (trimmed.includes("Easy Example")) {
            const body = trimmed.replace(/###\s*•?\s*Easy Example/i, "").trim();
            // extract code blocks
            const codeMatch = body.match(/```(?:\w+)?\n([\s\S]*?)```/);
            const codeContent = codeMatch ? codeMatch[1].trim() : body;

            return (
              <div key={idx} className="bg-[#05091a] border border-white/10 rounded-xl p-3.5 space-y-2 font-mono">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-sans font-bold text-xs uppercase tracking-wider">
                    <Code2 className="w-4 h-4" />
                    <span>Easy Code Example</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">Beginner Friendly Syntax</span>
                </div>
                <pre className="text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap p-1 font-mono">
                  {codeContent}
                </pre>
              </div>
            );
          }

          if (trimmed.includes("Real-life Analogy")) {
            const body = trimmed.replace(/###\s*•?\s*Real-life Analogy/i, "").trim();
            return (
              <div key={idx} className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Brain className="w-4 h-4 text-amber-400" />
                  <span>Real-life Analogy</span>
                </div>
                <p className="text-amber-100/90 text-xs sm:text-sm italic">{body}</p>
              </div>
            );
          }

          if (trimmed.includes("Key Points")) {
            const body = trimmed.replace(/###\s*•?\s*Key Points/i, "").trim();
            const points = body.split("\n").filter((p) => p.trim());

            return (
              <div key={idx} className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Key Points</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {points.map((p, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{p.replace(/^[-*•]\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          if (trimmed.includes("Common Mistakes")) {
            const body = trimmed.replace(/###\s*•?\s*Common Mistakes/i, "").trim();
            const mistakes = body.split("\n").filter((m) => m.trim());

            return (
              <div key={idx} className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Common Traps & Mistakes to Avoid</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {mistakes.map((m, mIdx) => (
                    <li key={mIdx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-200/90">
                      <span className="text-rose-400 mt-1">⚠️</span>
                      <span>{m.replace(/^[-*•]\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          if (trimmed.includes("One Practice Question")) {
            const body = trimmed.replace(/###\s*•?\s*One Practice Question/i, "").trim();
            return (
              <div key={idx} className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>Practice Challenge</span>
                  </div>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">Try Answer Below</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-purple-100">{body}</p>
                <button
                  onClick={() => handleSend(`Here is my answer to the practice question: ${body}`)}
                  className="mt-2 text-xs font-bold text-purple-300 hover:text-purple-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Answer this question now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          }

          if (trimmed.includes("One Follow-up Question")) {
            const body = trimmed.replace(/###\s*•?\s*One Follow-up Question/i, "").trim();
            return (
              <div key={idx} className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Curiosity & Deep Dive Question</span>
                </div>
                <p className="text-xs sm:text-sm text-cyan-100">{body}</p>
                <button
                  onClick={() => handleSend(`Tell me more about: ${body}`)}
                  className="mt-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore this follow-up topic</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          // Regular fallback markdown block
          return (
            <div key={idx} className="whitespace-pre-wrap text-slate-200">
              {trimmed}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="coding-tutor-page-wrapper" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-[#070b24] to-blue-950/80 border border-indigo-500/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                1st Year B.Tech &amp; Beginner Friendly
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Mentor 2.0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>AstraMind AI Coding Tutor</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your personal 24/7 Computer Science Professor. Complex coding concepts explained with simple definitions, easy examples, real-world analogies, and step-by-step practice questions!
            </p>
          </div>

          {/* Difficulty Level Switcher */}
          <div className="flex flex-col gap-1.5 bg-black/40 p-2 rounded-2xl border border-white/10 backdrop-blur-md self-stretch sm:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Knowledge Depth</span>
            <div className="flex items-center gap-1">
              {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setCurrentLevel(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentLevel === lvl
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK TOPIC CHIPS / STARTER QUESTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Popular Beginner Topics (1-Click Learning)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Filter Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white outline-none"
            >
              <option value="All">All Subjects</option>
              <option value="Python">Python</option>
              <option value="C & C++">C &amp; C++</option>
              <option value="Data Structures">Data Structures</option>
              <option value="Algorithms">Algorithms</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STARTER_TOPICS.filter((t) => selectedSubject === "All" || t.category.includes(selectedSubject) || selectedSubject.includes(t.category)).map((topic, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(topic.prompt)}
              disabled={isLoading}
              className="group text-left p-3 rounded-2xl bg-[#080d26] border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/30 transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{topic.icon}</span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {topic.category}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {topic.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                  {topic.desc}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 pt-1 border-t border-white/5">
                <span>Ask AI Tutor</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI TUTOR CHAT SECTION */}
      <div id="ai-tutor-chat-section" className="bg-[#050818] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 bg-[#0f1424] flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.08)] shrink-0 p-1">
              <img src="/logo.png" alt="AstraMind Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Tutor Conversation</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-400">Structured B.Tech explanation format active • Asking in {currentLevel} Mode</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Reset AI Tutor Session"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Chat</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="space-y-6 min-h-[380px] max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              } space-y-2 animate-in fade-in duration-200`}
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                {msg.sender === "user" ? (
                  <>
                    <span>You (Student)</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AstraMind AI Mentor
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              {msg.sender === "user" ? (
                <div className="max-w-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 text-sm font-medium shadow-md">
                  {msg.text}
                </div>
              ) : (
                <div className="w-full bg-[#080d26] border border-white/10 rounded-2xl rounded-tl-none p-4 sm:p-5 shadow-xl space-y-4">
                  {renderTutorText(msg.text)}

                  {/* Actions under AI response */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleSend(`Can you give me another simpler real-life analogy for this?`)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-white/10 cursor-pointer disabled:opacity-50"
                      >
                        <Brain className="w-3 h-3 text-amber-400" />
                        <span>Simpler Analogy</span>
                      </button>
                      <button
                        onClick={() => handleSend(`Give me another practice question on this concept to test my knowledge.`)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-white/10 cursor-pointer disabled:opacity-50"
                      >
                        <Target className="w-3 h-3 text-purple-400" />
                        <span>More Practice Questions</span>
                      </button>
                      <button
                        onClick={() => handleSend(`Can you explain this at a deeper / advanced level now?`)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-white/10 cursor-pointer disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3 text-indigo-400" />
                        <span>Deepen Technical Level</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <button
                        onClick={() => toggleBookmark(msg.id)}
                        className={`p-1.5 rounded-lg border border-white/10 hover:text-white transition-colors cursor-pointer ${
                          bookmarks[msg.id] ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-white/5"
                        }`}
                        title="Bookmark Explanation"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white transition-colors cursor-pointer"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 bg-[#080d26] border border-white/10 rounded-2xl w-fit animate-pulse text-xs text-indigo-300 font-medium">
              <Bot className="w-4 h-4 animate-spin text-indigo-400" />
              <span>AstraMind AI Tutor is preparing your structured B.Tech explanation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BOX */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-[#080d26] border border-white/15 rounded-2xl p-2 focus-within:border-indigo-500/80 transition-all shadow-inner"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI Tutor any coding question (e.g. 'What is a binary tree?', 'Explain recursion')..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-40 transition-all"
            >
              <span>Ask AI Mentor</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
            <span>💡 Tip: Reply to practice questions to get instant feedback from your AI Mentor!</span>
            <span>AstraMind CS Education Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
