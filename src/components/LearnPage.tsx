import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Sparkles,
  Send,
  Paperclip,
  Mic,
  MicOff,
  X,
  Code2,
  Check,
  Copy,
  Lightbulb,
  HelpCircle,
  Play,
  RotateCcw,
  BookOpen,
  ChevronDown,
  Award,
  CheckCircle2,
  Brain,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface LearnPageProps {
  accentColorClass?: string;
  onOpenResumeBuilder?: () => void;
  onStartChat?: (prompt: string) => void;
}

interface Message {
  id: string;
  sender: "user" | "tutor";
  text: string;
  image?: string;
  timestamp: string;
  step?: string;
}

interface SubjectProgress {
  currentLesson: string;
  completedLessons: string[];
  currentStep: number;
  lastActive: string;
}

const SUPPORTED_SUBJECTS = [
  { id: "Python", name: "Python", icon: "🐍", prompt: "Teach me Python step by step from scratch as a beginner." },
  { id: "Java", name: "Java", icon: "☕", prompt: "Teach me Java programming step by step from absolute scratch." },
  { id: "C++", name: "C++", icon: "💻", prompt: "Teach me C++ step by step, covering variables, pointers, OOP, and memory." },
  { id: "Web Development", name: "Web Development", icon: "🌐", prompt: "Teach me Web Development (HTML, CSS, JavaScript) step by step." },
  { id: "DSA", name: "DSA", icon: "📚", prompt: "Teach me Data Structures and Algorithms step by step with code examples." },
  { id: "Interview Prep", name: "Interview Prep", icon: "🎯", prompt: "Prepare me for coding interview problems step by step with mentor guidance." },
];

const MORE_LANGUAGES = [
  "C",
  "JavaScript",
  "TypeScript",
  "HTML",
  "CSS",
  "SQL",
  "React",
  "Node.js",
];

const TUTOR_SYSTEM_INSTRUCTION = `You are an expert, encouraging AI Personal Coding Mentor and Teacher.
Your goal is to teach programming step-by-step from beginner to advanced.
Supported subjects & languages: Python, C, C++, Java, JavaScript, TypeScript, HTML, CSS, SQL, React, Node.js, DSA, and Interview Prep.

TEACHING METHOD & STRUCTURE:
Never dump all information at once! Act like a patient, 1-on-1 human coding mentor.
Follow this structure step-by-step:
Step 1: Introduction - Introduce the topic clearly and briefly.
Step 2: Explain the concept - Use simple language, real-world analogies, and no unnecessary jargon.
Step 3: Show a simple example - Provide clean code blocks with syntax highlighting and explain every line of code clearly.
Step 4: Give a small practice problem - Ask the student to solve a small, clear hands-on exercise.
Step 5: Wait for student's answer - Do NOT give away the answer immediately.
Step 6: Check the answer & correct mistakes - When the student responds, evaluate gently and explain why.
Step 7: Explain why - Provide hints instead of direct answers when they get stuck.
Step 8: Move to the next lesson only after the student understands.

TEACHER RULES:
- Teach from beginner to advanced systematically without skipping core concepts.
- Always encourage the student like a world-class mentor.
- Use clean code blocks (e.g. \`\`\`python ... \`\`\`) and explain what every line does.
- Generate quizzes after completing every major topic.
- Generate mini projects after every chapter.
- Generate one final project after completing a full subject course.
- Keep responses clean, well-formatted, and visually appealing using Markdown.`;

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-2xl border border-white/10 bg-[#070b19] overflow-hidden shadow-xl group">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-mono text-slate-400">
        <span className="uppercase font-semibold text-indigo-400 tracking-wider text-[11px]">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || "text"}
        PreTag="div"
        customStyle={{ margin: 0, padding: "1rem", background: "transparent", fontSize: "0.85rem", lineHeight: "1.5" }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export default function LearnPage({ accentColorClass, onOpenResumeBuilder, onStartChat }: LearnPageProps) {
  const [activeSubject, setActiveSubject] = useState<string>("Python");
  const [showMoreLangs, setShowMoreLangs] = useState(false);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Persistence for Chat & Progress
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`astramind_tutor_messages_v2_${activeSubject}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "msg-welcome",
        sender: "tutor",
        text: `Welcome to your **AI Coding Tutor**! 🎓\n\nI'm your personal coding mentor. We'll learn **${activeSubject}** step by step, starting from the basics all the way to advanced projects.\n\n### How We Learn:\n1. **Concept Explanation**: Simple, clear explanations with analogies.\n2. **Code Examples**: Line-by-line code breakdowns.\n3. **Practice Problems**: Hands-on exercises for you to solve.\n4. **Feedback & Hints**: Personalized guidance as you learn.\n\nReady to get started? Type **"Let's start"** or ask any question!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const [progress, setProgress] = useState<Record<string, SubjectProgress>>(() => {
    try {
      const saved = localStorage.getItem("astramind_tutor_progress_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Python: { currentLesson: "1. Introduction to Python", completedLessons: [], currentStep: 1, lastActive: "Today" },
    };
  });

  // Load messages whenever activeSubject changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`astramind_tutor_messages_v2_${activeSubject}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        const initialMsg: Message = {
          id: `msg-welcome-${activeSubject}`,
          sender: "tutor",
          text: `Welcome to your **${activeSubject} AI Mentor**! 🎓\n\nI will guide you step by step from absolute beginner concepts to building real-world applications.\n\n### Lesson 1: Introduction to ${activeSubject}\nLet's start with what ${activeSubject} is and why developers use it.\n\n**Ready to begin?** Click a topic or type a question below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages([initialMsg]);
      }
    } catch (e) {}
  }, [activeSubject]);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`astramind_tutor_messages_v2_${activeSubject}`, JSON.stringify(messages));
    } catch (e) {}
  }, [messages, activeSubject]);

  // Save progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("astramind_tutor_progress_v2", JSON.stringify(progress));
    } catch (e) {}
  }, [progress]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubjectSelect = (subjectName: string, initialPrompt?: string) => {
    setActiveSubject(subjectName);
    setShowMoreLangs(false);
    if (initialPrompt) {
      handleSendMessage(initialPrompt, subjectName);
    }
  };

  const handleResetSubject = () => {
    if (confirm(`Reset learning history for ${activeSubject}?`)) {
      localStorage.removeItem(`astramind_tutor_messages_v2_${activeSubject}`);
      const resetMsg: Message = {
        id: `msg-reset-${Date.now()}`,
        sender: "tutor",
        text: `Starting fresh with **${activeSubject}**! 🚀\n\nLet's begin from Lesson 1. What would you like to explore first?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([resetMsg]);
    }
  };

  const handleSendMessage = async (textToSend?: string, targetSubject?: string) => {
    const queryText = textToSend || input;
    if ((!queryText.trim() && !attachedImage) || isLoading) return;

    const currentSub = targetSubject || activeSubject;
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: queryText,
      image: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Build conversation payload for AI API
      const apiMessages = newMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      // Prepend system prompt context
      const fullContext = [
        {
          role: "system",
          content: `${TUTOR_SYSTEM_INSTRUCTION}\n\nCurrent Learning Subject: ${currentSub}.\nRemember to check their answer, provide step-by-step mentor guidance, and explain every line of code.`,
        },
        ...apiMessages,
      ];

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullContext,
          model: "gemini-3.6-flash",
          systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
        }),
      });

      if (!response.ok || !response.body) {
        // Fallback to non-stream /api/chat
        const fallbackRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: fullContext,
            model: "gemini-3.6-flash",
          }),
        });
        const fallbackData = await fallbackRes.json();
        const replyText = fallbackData.text || fallbackData.content || "I am your AI tutor! Let's continue learning together.";
        
        setMessages((prev) => [
          ...prev,
          {
            id: `tutor-${Date.now()}`,
            sender: "tutor",
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Handle stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let tutorText = "";
      const tutorMsgId = `tutor-${Date.now()}`;

      // Insert placeholder tutor message
      setMessages((prev) => [
        ...prev,
        {
          id: tutorMsgId,
          sender: "tutor",
          text: "...",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE chunk formatted as data: ...
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                tutorText += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: tutorText } : msg))
                );
              }
            } catch (e) {
              // Direct string chunk
              tutorText += dataStr;
              setMessages((prev) =>
                prev.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: tutorText } : msg))
              );
            }
          }
        }
      }

      if (!tutorText.trim()) {
        tutorText = "Great question! Let me break down this concept for you step by step...";
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: tutorText } : msg))
        );
      }
    } catch (error) {
      console.error("Tutor API error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `tutor-err-${Date.now()}`,
          sender: "tutor",
          text: "I encountered a brief connection issue. Let's try again! Tell me what concept you'd like to learn or solve.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Top Title & Subtitle Section - Clean, Minimal Apple Design */}
      <div className="w-full max-w-4xl mx-auto pt-4 sm:pt-8 pb-3 sm:pb-4 px-3 sm:px-4 text-center shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2 sm:mb-3">
          <GraduationCap className="w-4 h-4" />
          <span>1-on-1 Personalized Coding Mentor</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          AI Coding Tutor
        </h1>
        <p className="text-xs sm:text-base text-slate-400 mt-1 sm:mt-2 font-medium">
          Learn programming step by step.
        </p>

        {/* Quick Subject Switcher Buttons above Chat (Horizontally scrollable on mobile) */}
        <div className="mt-4 sm:mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin max-w-full justify-start sm:justify-center">
          {SUPPORTED_SUBJECTS.map((sub) => {
            const isActive = activeSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => handleSubjectSelect(sub.id, sub.prompt)}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-102"
                    : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10"
                }`}
              >
                <span>{sub.icon}</span>
                <span className="whitespace-nowrap">{sub.name}</span>
              </button>
            );
          })}

          {/* Additional Languages Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMoreLangs(!showMoreLangs)}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showMoreLangs && (
              <div className="absolute top-full mt-2 right-0 w-48 p-2 rounded-2xl bg-[#0b0f24] border border-white/10 shadow-2xl z-30 grid grid-cols-2 gap-1 backdrop-blur-xl">
                {MORE_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleSubjectSelect(lang, `Teach me ${lang} step by step from scratch.`)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-indigo-600/50 transition-colors font-medium truncate"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject Info & Reset Bar */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 mb-2 sm:mb-3 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">Current: <strong className="text-white">{activeSubject}</strong></span>
        </div>
        <button
          onClick={handleResetSubject}
          className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer text-[11px] shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restart</span>
        </button>
      </div>

      {/* Main Center Chat Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 flex flex-col min-h-0">
        <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 scrollbar-thin shadow-2xl backdrop-blur-xl">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 sm:gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 overflow-hidden text-[11px] sm:text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 border border-slate-700/60 shadow-md"
                }`}
              >
                {msg.sender === "user" ? "You" : <img src="/logo.png" alt="AstraMind AI Logo" className="w-full h-full object-contain p-0.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl px-3.5 sm:px-5 py-3 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600/90 text-white rounded-tr-sm shadow-lg shadow-indigo-600/20"
                    : "bg-white/[0.05] border border-white/10 text-slate-200 rounded-tl-sm backdrop-blur-md"
                }`}
              >
                {/* User Attachment Image */}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="User Upload"
                    className="max-h-60 rounded-2xl mb-3 border border-white/10 object-contain"
                  />
                )}

                {/* Content */}
                {msg.sender === "user" ? (
                  <p className="whitespace-pre-wrap font-medium break-words">{msg.text}</p>
                ) : (
                  <div className="space-y-2 markdown-body text-slate-200 break-words">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline ? (
                            <CodeBlock
                              language={match ? match[1] : ""}
                              value={String(children).replace(/\n$/, "")}
                            />
                          ) : (
                            <code className="bg-white/10 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono font-semibold break-words" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Mentor Quick Assistance Chips for Tutor Messages */}
                {msg.sender === "tutor" && msg.id !== "msg-welcome" && (
                  <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleSendMessage("Give me a hint for this problem.")}
                      className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-white/5 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer border border-white/5"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span>Give a Hint</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage("Explain this code line by line.")}
                      className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-white/5 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer border border-white/5"
                    >
                      <Code2 className="w-3 h-3 text-cyan-400" />
                      <span>Breakdown</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage("Give me a quick quiz on this topic.")}
                      className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-white/5 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer border border-white/5"
                    >
                      <Brain className="w-3 h-3 text-purple-400" />
                      <span>Quiz Me</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage("I understand! Move to the next lesson.")}
                      className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-white/5 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer border border-white/5"
                    >
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                      <span>Next Lesson</span>
                    </button>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 mt-1.5 text-right font-mono">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs animate-pulse py-2">
              <div className="w-7 h-7 rounded-2xl bg-indigo-600/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              </div>
              <span className="font-mono text-xs">Mentor is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Large Rounded Apple-Inspired Chat Input Container */}
        <div className="my-2 sm:my-4 shrink-0">
          <div className="relative bg-[#0d122b]/90 border border-white/15 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-2xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            
            {/* Image Preview Pill if attached */}
            {attachedImage && (
              <div className="mb-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 inline-flex items-center gap-2">
                <img src={attachedImage} alt="Attachment" className="w-6 h-6 object-cover rounded-lg" />
                <span className="text-xs text-slate-300 font-mono">Image attached</span>
                <button onClick={() => setAttachedImage(null)} className="text-slate-400 hover:text-white p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Attach Image Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach Image / Screenshot"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Input Button */}
              <button
                onClick={toggleVoiceInput}
                title={isRecording ? "Stop Listening" : "Voice Input"}
                className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl transition-all cursor-pointer shrink-0 ${
                  isRecording
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask AI Tutor... e.g., Teach me Python"
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none px-1.5 font-medium"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && !attachedImage) || isLoading}
                className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
