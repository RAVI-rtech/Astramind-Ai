import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Sparkles,
  Send,
  Code2,
  Check,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Layers,
  Cpu,
  Globe,
  Terminal,
  Calculator,
  Compass,
  Briefcase,
  HelpCircle,
  Bug,
  BookOpen,
  Award,
  Users,
  MessageSquare,
  FileQuestion,
  Mic,
  Rocket
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import EngineeringAcademicsView from "./EngineeringAcademicsView";
import AdSenseBanner from "./AdSenseBanner";
import { ADSENSE_CONFIG } from "../config/adsense";

interface LearnPageProps {
  accentColorClass?: string;
  onOpenResumeBuilder?: () => void;
  onStartChat?: (prompt: string) => void;
}

export type BTechTrack =
  | "Programming & DSA"
  | "Web Development"
  | "AI & Machine Learning"
  | "Core Computer Science"
  | "Engineering Academics"
  | "Technical Skills & Tools"
  | "NPTEL Training"
  | "Project & Hackathon"
  | "Placements & Aptitude"
  | "Interview & Career Roadmap";

export type BTechYear = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
export type BTechBranch = "CSE / IT" | "ECE / EEE" | "Mechanical" | "Civil" | "Other Branch";

export type MentorMode =
  | "Learn a Concept"
  | "Solve a Problem"
  | "Coding Practice"
  | "Debugging"
  | "Mock Interview"
  | "Project Guidance"
  | "Career Roadmap"
  | "NPTEL & Courses"
  | "Certifications"
  | "Placement Prep"
  | "Communication Skills"
  | "Hackathon Mentor"
  | "Dynamic Quiz";

interface ChatMessage {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
}

const BTECH_TRACKS: { id: BTechTrack; label: string; icon: React.ElementType }[] = [
  { id: "Programming & DSA", label: "Programming & DSA", icon: Code2 },
  { id: "Web Development", label: "Web Development", icon: Globe },
  { id: "AI & Machine Learning", label: "AI & Machine Learning", icon: Cpu },
  { id: "Core Computer Science", label: "Core CS (DBMS, OS, CN)", icon: Terminal },
  { id: "Engineering Academics", label: "Engineering Academics", icon: Calculator },
  { id: "Technical Skills & Tools", label: "Skills (Git, Linux, Cloud)", icon: Layers },
  { id: "NPTEL Training", label: "NPTEL Training", icon: Award },
  { id: "Project & Hackathon", label: "Project & Hackathon", icon: Compass },
  { id: "Placements & Aptitude", label: "Placements & Aptitude", icon: Briefcase },
  { id: "Interview & Career Roadmap", label: "Interview & Career", icon: Users },
];

const BTECH_YEARS: BTechYear[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const BTECH_BRANCHES: BTechBranch[] = ["CSE / IT", "ECE / EEE", "Mechanical", "Civil", "Other Branch"];

const MENTOR_MODES: { id: MentorMode; label: string; icon: React.ElementType; shortDesc: string }[] = [
  { id: "Learn a Concept", label: "Learn a Concept", icon: BookOpen, shortDesc: "Step-by-step interactive teaching" },
  { id: "Solve a Problem", label: "Solve a Problem", icon: HelpCircle, shortDesc: "Hints, logic & time complexity" },
  { id: "Coding Practice", label: "Coding Practice", icon: Code2, shortDesc: "Challenges, code review & scoring" },
  { id: "Debugging", label: "Debugging", icon: Bug, shortDesc: "Isolate bugs & explain root causes" },
  { id: "Mock Interview", label: "Mock Interview", icon: MessageSquare, shortDesc: "1-by-1 questions with feedback" },
  { id: "Project Guidance", label: "Project Guidance", icon: Compass, shortDesc: "Idea to architecture & deployment" },
  { id: "Career Roadmap", label: "Career Roadmap", icon: Users, shortDesc: "Personalized B.Tech milestones" },
  { id: "NPTEL & Courses", label: "NPTEL & Courses", icon: Award, shortDesc: "Weekly plans, concepts & exams" },
  { id: "Certifications", label: "Certifications", icon: Layers, shortDesc: "AWS, Azure, GCP roadmaps" },
  { id: "Placement Prep", label: "Placement Prep", icon: Briefcase, shortDesc: "Aptitude, reasoning & technical" },
  { id: "Communication Skills", label: "Communication", icon: Mic, shortDesc: "Speaking, emails & self-intro" },
  { id: "Hackathon Mentor", label: "Hackathon Mentor", icon: Rocket, shortDesc: "Problem analysis, MVP & pitch" },
  { id: "Dynamic Quiz", label: "Dynamic Quiz", icon: FileQuestion, shortDesc: "Interactive questions with scores" },
];

const MODE_QUICK_STARTS: Record<MentorMode, { title: string; prompt: string }[]> = {
  "Learn a Concept": [
    { title: "Teach me pointers in C", prompt: "Teach me pointers in C from the basics step by step." },
    { title: "Explain Recursion simply", prompt: "Explain recursion and base cases with a simple real-world analogy." },
    { title: "DBMS Normalization (1NF, 2NF, 3NF)", prompt: "Explain 1NF, 2NF, and 3NF database normalization with a clear example." },
    { title: "Operating System Deadlocks", prompt: "Explain deadlocks and the 4 necessary conditions in Operating Systems." },
  ],
  "Solve a Problem": [
    { title: "Max element in Array", prompt: "Solve this: find the maximum element in an array step-by-step." },
    { title: "Two Sum problem logic", prompt: "Guide me through solving the Two Sum problem with optimal time complexity." },
    { title: "Reverse a Linked List", prompt: "Help me solve: how to reverse a singly linked list iteratively." },
    { title: "Engineering Math (Eigenvalues)", prompt: "Help me solve this matrix eigenvalue and eigenvector problem step by step." },
  ],
  "Coding Practice": [
    { title: "Python + Easy + Arrays", prompt: "Give me an easy Python array problem for coding practice." },
    { title: "C++ + Medium + Strings", prompt: "Give me a medium C++ string manipulation coding practice challenge." },
    { title: "Java + Easy + Loops", prompt: "Give me a beginner Java loops coding challenge to test my fundamentals." },
    { title: "JavaScript + Functions & Arrays", prompt: "Give me an interactive JavaScript coding practice problem." },
  ],
  "Debugging": [
    { title: "Python IndexError / TypeError", prompt: "Why does this Python code give an error? Can you help me debug it?" },
    { title: "C Segmentation Fault", prompt: "My C program crashes with a segmentation fault. Guide me to locate and fix it." },
    { title: "React State Async Bug", prompt: "My React state variable doesn't update immediately after setState. Why?" },
    { title: "Java NullPointerException", prompt: "Help me debug a Java NullPointerException in my object initialization." },
  ],
  "Mock Interview": [
    { title: "Start DSA Interview", prompt: "Start a DSA mock interview. Ask me one question at a time and evaluate my answers." },
    { title: "Core CS (OS & DBMS)", prompt: "Conduct a technical interview on Operating Systems and Database Management Systems." },
    { title: "Web Development Interview", prompt: "Start a technical interview for a Frontend/Full-Stack developer position." },
    { title: "HR & Behavioral Interview", prompt: "Conduct a mock HR round. Ask me standard behavioral and situational questions." },
  ],
  "Project Guidance": [
    { title: "AI Study Mentor App", prompt: "I want to build an AI study app for engineering students. Review my architecture and tech stack." },
    { title: "Suggest Strong Project Ideas", prompt: "I am a B.Tech student and don't know what to build. Suggest 3 strong portfolio projects for my branch." },
    { title: "Full-Stack Project Stack", prompt: "What database, backend, and authentication stack should I choose for my college project?" },
    { title: "Project Deployment Guide", prompt: "Guide me through deploying my web project with a free database and live domain." },
  ],
  "Career Roadmap": [
    { title: "AI / ML Career Roadmap", prompt: "I am a first-year CSE student interested in AI/ML. Create a realistic year-by-year roadmap." },
    { title: "Software Developer (SDE) Roadmap", prompt: "What skills, projects, and milestones should I achieve to land an SDE job by 4th year?" },
    { title: "Non-CSE to Tech Switch", prompt: "I am in a non-CSE engineering branch. How can I prepare for software developer roles?" },
    { title: "College Internship Roadmap", prompt: "How do I secure a good technical internship in my 2nd or 3rd year?" },
  ],
  "NPTEL & Courses": [
    { title: "NPTEL Weekly Study Plan", prompt: "Help me prepare for an NPTEL course with a structured 8-week study schedule." },
    { title: "NPTEL Exam Scoring Strategy", prompt: "What is the best strategy to score 75%+ (Elite / Silver) in NPTEL proctored exams?" },
    { title: "Explain Course Concept", prompt: "Help me understand a difficult concept from my university/NPTEL syllabus." },
    { title: "Practice Assignment Questions", prompt: "Give me practice conceptual questions similar to standard NPTEL assessments." },
  ],
  "Certifications": [
    { title: "AWS Cloud Practitioner / SAA", prompt: "Which AWS certification should a B.Tech student take first, and how do I prepare?" },
    { title: "Google Cloud / Azure Roadmaps", prompt: "Guide me through the prerequisites and preparation strategy for Cloud certifications." },
    { title: "Best Certifications for 1st-2nd Year", prompt: "What technical certifications actually add value to a B.Tech resume?" },
    { title: "Cybersecurity Certifications", prompt: "What are the best entry-level certifications for a career in cybersecurity?" },
  ],
  "Placement Prep": [
    { title: "Start Quantitative Aptitude", prompt: "Start aptitude practice. Give me one quantitative aptitude question to solve." },
    { title: "Logical Reasoning Practice", prompt: "Give me one logical reasoning placement question and wait for my answer." },
    { title: "Verbal Ability Practice", prompt: "Test my verbal ability and sentence correction for campus placement exams." },
    { title: "Placement Coding Round", prompt: "Give me a commonly asked campus placement coding question with constraints." },
  ],
  "Communication Skills": [
    { title: "Practice Self-Introduction", prompt: "Help me practice my 'Tell me about yourself' self-introduction for campus placements." },
    { title: "Professional Email Writing", prompt: "How do I write a professional cold email for internship inquiries to recruiters?" },
    { title: "Technical Presentation Skills", prompt: "How should I structure and deliver my final-year project presentation to professors?" },
    { title: "Group Discussion (GD) Tips", prompt: "What are the key dos and don'ts to clear the Group Discussion round in campus hiring?" },
  ],
  "Hackathon Mentor": [
    { title: "Analyze Hackathon Idea", prompt: "Help me analyze my hackathon idea: validate the problem statement and suggest an MVP feature set." },
    { title: "24-Hour MVP Plan", prompt: "How should our 4-member team divide development tasks during a 24-hour hackathon?" },
    { title: "Hackathon Pitch & Demo Prep", prompt: "How do I create a 3-minute winning demo pitch for hackathon judges?" },
    { title: "Prepare for Judges' Questions", prompt: "What tricky questions do hackathon judges typically ask about scalability and tech choices?" },
  ],
  "Dynamic Quiz": [
    { title: "Python Fundamentals Quiz", prompt: "Give me a Python quiz. Ask me one question at a time and score my answers." },
    { title: "DSA & Algorithms Quiz", prompt: "Start an interactive quiz on Data Structures (Arrays, Linked Lists, Trees)." },
    { title: "DBMS SQL & Concepts Quiz", prompt: "Start an interactive quiz on Database Management Systems and SQL queries." },
    { title: "Operating Systems Quiz", prompt: "Test my knowledge with an interactive quiz on Operating Systems concepts." },
  ],
};

function buildComprehensiveMentorPrompt(
  track: BTechTrack,
  year: BTechYear,
  branch: BTechBranch,
  mode: MentorMode
): string {
  let modeSpecificInstructions = "";

  switch (mode) {
    case "Learn a Concept":
      modeSpecificInstructions = `ACTIVE MODE: LEARN A CONCEPT.
- Explain ONE single concept at a time.
- Keep explanations short, clear, and conversational (1-2 sentences per line). Avoid long paragraphs.
- Give a tiny example (2 to 5 lines of code or an everyday analogy).
- Ask ONE small question to check understanding.
- Wait for the student's answer before proceeding.
- When they answer, evaluate, correct mistakes, and continue to the next small piece.`;
      break;

    case "Solve a Problem":
      modeSpecificInstructions = `ACTIVE MODE: SOLVE A PROBLEM.
- Understand the problem provided by the student.
- Identify what is asked.
- Ask what they have tried if appropriate.
- Give a small hint first; do not dump the full solution immediately unless requested.
- For coding: explain logic, algorithm, time & space complexity. Review student's code if provided.
- For math/engineering: show step-by-step calculations with reasoning without skipping steps.`;
      break;

    case "Coding Practice":
      modeSpecificInstructions = `ACTIVE MODE: CODING PRACTICE.
- If the student specifies language, difficulty, and topic (e.g. 'C + Easy + Arrays'), generate exactly ONE coding problem with description, example input/output, and constraints. Do NOT reveal the solution.
- If the student submits code: analyze logic, syntax errors, edge cases, time/space complexity. Give hints or feedback first, score their attempt, and ask if they want another problem.
- Difficulty should adapt based on their performance.`;
      break;

    case "Debugging":
      modeSpecificInstructions = `ACTIVE MODE: DEBUGGING.
- Understand the programming language, intended behavior, actual behavior, and error trace.
- Actually analyze the supplied code.
- Identify the likely problem and explain WHY it happens.
- Point to the specific line/section.
- Give a targeted hint first to let the student attempt the fix.
- If requested or if the student struggles, provide the corrected snippet and explain the corrected logic.`;
      break;

    case "Mock Interview":
      modeSpecificInstructions = `ACTIVE MODE: MOCK INTERVIEW.
- Act as a professional, realistic engineering interviewer.
- Start with 'Sure. Let's start your mock interview.' or acknowledge the topic.
- Ask EXACTLY ONE question at a time.
- DO NOT dump 10-20 questions at once!
- Wait for the student's answer.
- After the student answers: evaluate what was correct, what was missing/wrong, provide concise feedback, score it (e.g., 8/10), and ask the NEXT interview question.
- Support Technical, DSA, OOP, DBMS, OS, CN, AI/ML, Web, HR, Behavioral, or Project-based questions.`;
      break;

    case "Project Guidance":
      modeSpecificInstructions = `ACTIVE MODE: PROJECT GUIDANCE.
- Help the student across the full project lifecycle: Idea → Requirements → Tech Stack → Architecture → Database → APIs → UI → Implementation → Testing → Deployment → Presentation.
- If student says 'I don't know what to build' or asks for ideas: suggest 2-3 tailored project ideas based on their year (${year}), branch (${branch}), and career interests, explaining the real-world value of each.
- Never dump a complete finished codebase for them; teach and guide them to build it step by step.`;
      break;

    case "Career Roadmap":
      modeSpecificInstructions = `ACTIVE MODE: CAREER ROADMAP.
- Gather/utilize student profile: Year (${year}), Branch (${branch}), current skills, interests, available time, career goal.
- Produce a structured, realistic, progressive roadmap (e.g. for a 1st year CSE student interested in AI, start with Python, Calculus, Linear Algebra, and basic Git before jumping to Transformers).
- Break down into milestones: Foundational skills, Core CS, Portfolio projects, Internships, Placements.`;
      break;

    case "NPTEL & Courses":
      modeSpecificInstructions = `ACTIVE MODE: NPTEL & COURSE PREPARATION.
- Help student with course understanding, study strategy, weekly module schedules, revision, and practice questions.
- CRITICAL: Do not pretend to know exact private current assignment questions unless the student pastes them; when provided, use that material as the primary basis for teaching and problem solving.`;
      break;

    case "Certifications":
      modeSpecificInstructions = `ACTIVE MODE: CERTIFICATIONS.
- Guide student on technical certifications (AWS, Azure, GCP, Red Hat, Oracle, edX, etc.).
- Detail prerequisites, required skills, preparation timeline, cost/budget considerations, hands-on practice, and project relevance without unsupported claims.`;
      break;

    case "Placement Prep":
      modeSpecificInstructions = `ACTIVE MODE: PLACEMENT PREPARATION.
- Cover Quantitative Aptitude, Logical Reasoning, Verbal Ability, Technical rounds, HR rounds, and Coding rounds.
- Practice ONE question at a time. Wait for the answer. Evaluate, explain shortcuts/mistakes, and provide the next question.`;
      break;

    case "Communication Skills":
      modeSpecificInstructions = `ACTIVE MODE: COMMUNICATION & PROFESSIONAL ENGLISH.
- Help with professional spoken/written English, self-introduction, technical presentations, email writing, interview communication.
- For speaking/introduction practice: ask a prompt or question, let the student answer, politely point out grammar/vocabulary improvements, suggest a polished professional version, and continue.`;
      break;

    case "Hackathon Mentor":
      modeSpecificInstructions = `ACTIVE MODE: HACKATHON MENTOR.
- Guide through problem statement analysis, ideation, feature MVP planning, tech stack, architecture, live demo prep, pitch deck, and judges' Q&A.
- If the student provides a hackathon problem statement, analyze THAT specific problem statement thoroughly.`;
      break;

    case "Dynamic Quiz":
      modeSpecificInstructions = `ACTIVE MODE: DYNAMIC QUIZ.
- Generate quiz questions dynamically.
- Flow: Ask ONE question (multiple choice or short technical answer) with options.
- Wait for the student's answer.
- Evaluate the answer, explain why the correct option is right and others are wrong, show the running score, and ask the next question.`;
      break;
  }

  return `You are AstraMind AI Tutor, a dedicated Personal AI Mentor for B.Tech and Engineering Students.
Your mission is to guide the student across their complete engineering journey:
LEARNING → SKILLS → PROJECTS → CERTIFICATIONS → INTERNSHIPS → INTERVIEWS → CAREER.

STUDENT PROFILE CONTEXT:
- Academic Year: ${year} B.Tech
- Engineering Branch: ${branch}
- Current Track: ${track}
- Active Mode: ${mode}

${modeSpecificInstructions}

MODE SWITCHING NOTIFICATION:
If the student changed mode recently or previously discussed a topic in another mode, seamlessly transition to handling that same topic under the active ${mode} rules. For example, if they were learning binary search and switch to Mock Interview, immediately become an interviewer asking an interview question about binary search.

CONVERSATIONAL & PEDAGOGICAL RULES:
- Sound like an approachable, knowledgeable 1-on-1 human engineering mentor.
- Strictly avoid robotic conversational filler (do NOT say "Great question!", "Certainly!", "Let's dive in!").
- Keep explanations clear, structured, and digestible.
- Adaptive teaching: if the student understands, increase the depth; if they struggle, simplify with analogies; if they ask for a hint, give a focused hint; if they ask for a full solution, explain the rationale behind it.
- Allow the student to control the pace, interrupt, or change topics freely.
- Wrap all code in triple backtick code blocks with language tags.
- Identify only as AstraMind AI Mentor. Never mention external AI models (Gemini, OpenAI, etc.).`;
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl border border-white/10 bg-[#050818] overflow-hidden shadow-lg group">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10 text-xs font-mono text-slate-400">
        <span className="uppercase font-semibold text-indigo-400 tracking-wider text-[11px]">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy Code"}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "0.85rem 1rem",
          background: "transparent",
          fontSize: "0.85rem",
          lineHeight: "1.5",
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export default function LearnPage({ accentColorClass }: LearnPageProps) {
  // Student Profile & B.Tech Context State
  const [track, setTrack] = useState<BTechTrack>(() => {
    try {
      const saved = localStorage.getItem("astramind_btech_track_v6");
      if (saved && BTECH_TRACKS.some((t) => t.id === saved)) return saved as BTechTrack;
    } catch {}
    return "Programming & DSA";
  });

  const [year, setYear] = useState<BTechYear>(() => {
    try {
      const saved = localStorage.getItem("astramind_btech_year_v6");
      if (saved && BTECH_YEARS.includes(saved as BTechYear)) return saved as BTechYear;
    } catch {}
    return "1st Year";
  });

  const [branch, setBranch] = useState<BTechBranch>(() => {
    try {
      const saved = localStorage.getItem("astramind_btech_branch_v6");
      if (saved && BTECH_BRANCHES.includes(saved as BTechBranch)) return saved as BTechBranch;
    } catch {}
    return "CSE / IT";
  });

  const [mode, setMode] = useState<MentorMode>(() => {
    try {
      const saved = localStorage.getItem("astramind_btech_mode_v6");
      if (saved && MENTOR_MODES.some((m) => m.id === saved)) return saved as MentorMode;
    } catch {}
    return "Learn a Concept";
  });

  // Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`astramind_btech_chat_v6_${track}_${mode}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync track, mode & messages
  useEffect(() => {
    const handleSetTrack = (e: any) => {
      if (e.detail && BTECH_TRACKS.some((t) => t.id === e.detail)) {
        setTrack(e.detail as BTechTrack);
      }
    };
    const handleSetMode = (e: any) => {
      if (e.detail && MENTOR_MODES.some((m) => m.id === e.detail)) {
        setMode(e.detail as MentorMode);
      }
    };

    window.addEventListener("astramind-set-learn-track", handleSetTrack);
    window.addEventListener("astramind-set-learn-mode", handleSetMode);

    return () => {
      window.removeEventListener("astramind-set-learn-track", handleSetTrack);
      window.removeEventListener("astramind-set-learn-mode", handleSetMode);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("astramind_btech_track_v6", track);
      localStorage.setItem("astramind_btech_mode_v6", mode);
      const saved = localStorage.getItem(`astramind_btech_chat_v6_${track}_${mode}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([]);
      }
    } catch {}
    setHasError(false);
    setLastFailedMessage(null);
  }, [track, mode]);

  // Sync profile options
  useEffect(() => {
    try {
      localStorage.setItem("astramind_btech_year_v6", year);
      localStorage.setItem("astramind_btech_branch_v6", branch);
    } catch {}
  }, [year, branch]);

  // Save messages per track & mode
  useEffect(() => {
    try {
      localStorage.setItem(`astramind_btech_chat_v6_${track}_${mode}`, JSON.stringify(messages));
    } catch {}
  }, [messages, track, mode]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setHasError(false);
    setLastFailedMessage(null);
    setInput("");
    try {
      localStorage.removeItem(`astramind_btech_chat_v6_${track}_${mode}`);
    } catch {}
  };

  const handleClearConversation = () => {
    if (messages.length === 0) return;
    if (window.confirm(`Clear conversation for "${mode}" in "${track}"?`)) {
      handleNewChat();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageContent || isLoading) return;

    setHasError(false);
    setLastFailedMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tutorMessageId = `tutor-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tutorMessageId,
        sender: "tutor",
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    const systemInstruction = buildComprehensiveMentorPrompt(track, year, branch, mode);

    // Filter out client-side greeting placeholders and empty text
    const serverMessages = updatedHistory
      .filter((m) => m.id !== "welcome-msg" && m.text.trim().length > 0)
      .map((m) => ({
        sender: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

    try {
      abortControllerRef.current = new AbortController();

      // Priority 1: /api/chat/stream
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        signal: abortControllerRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: serverMessages,
          systemInstruction,
        }),
      });

      if (!response.ok || !response.body) {
        // Fallback to /api/chat
        const fallbackRes = await fetch("/api/chat", {
          method: "POST",
          signal: abortControllerRef.current.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            messages: serverMessages,
            systemInstruction,
          }),
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.text || errData.error || `HTTP error ${fallbackRes.status}`);
        }

        const data = await fallbackRes.json();
        const fullAnswer =
          data.text || data.content || "Let's explore this together. What specific part would you like to start with?";

        setMessages((prev) =>
          prev.map((msg) => (msg.id === tutorMessageId ? { ...msg, text: fullAnswer } : msg))
        );
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === tutorMessageId ? { ...msg, text: accumulatedText } : msg))
                );
              }
              if (parsed.error) {
                setHasError(true);
                setErrorMessage(typeof parsed.error === "string" ? parsed.error : "AI Service encountered an error");
                setLastFailedMessage(messageContent);
              }
            } catch {
              if (dataStr && !dataStr.startsWith("{")) {
                accumulatedText += dataStr;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === tutorMessageId ? { ...msg, text: accumulatedText } : msg))
                );
              }
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        const fallback = `I'm ready in **${mode}** mode for **${track}** (${year} • ${branch}).\n\nWhat would you like to explore or solve first?`;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tutorMessageId ? { ...msg, text: fallback } : msg))
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("[AI Mentor Error]", err);
      setHasError(true);
      setErrorMessage(err?.message || "Connection error to AI Tutor");
      setLastFailedMessage(messageContent);
      setMessages((prev) => prev.filter((m) => m.id !== tutorMessageId));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    } else {
      const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
      if (lastUserMsg) {
        handleSendMessage(lastUserMsg.text);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPlaceholder = (currentMode: MentorMode, currentTrack: BTechTrack) => {
    switch (currentMode) {
      case "Learn a Concept":
        return `Ask a concept in ${currentTrack} (e.g. pointers in C, recursion, normalization)...`;
      case "Solve a Problem":
        return `Paste a problem to solve step-by-step (coding, math, algorithms)...`;
      case "Coding Practice":
        return `Name language & topic (e.g. Python + Easy + Arrays) or submit code...`;
      case "Debugging":
        return `Paste your code snippet and the error or unexpected behavior...`;
      case "Mock Interview":
        return `Type 'Start interview' or specify topic (DSA, System Design, HR)...`;
      case "Project Guidance":
        return `Share your project idea, architecture query, or tech stack...`;
      case "Career Roadmap":
        return `Tell me your career goal (AI Engineer, Full-Stack, Placements)...`;
      case "NPTEL & Courses":
        return `Enter NPTEL course name, weekly module topic, or assignment...`;
      case "Certifications":
        return `Ask about AWS, Azure, GCP, or tech certification roadmaps...`;
      case "Placement Prep":
        return `Type 'Start aptitude' or choose topic (Quant, Logical, Verbal)...`;
      case "Communication Skills":
        return `Practice self-introduction, email writing, or interview speaking...`;
      case "Hackathon Mentor":
        return `Describe your hackathon problem statement or MVP feature plan...`;
      case "Dynamic Quiz":
        return `Type 'Start quiz' or specify topic (e.g. Python OOP Quiz)...`;
    }
  };

  const currentQuickStarts = MODE_QUICK_STARTS[mode] || MODE_QUICK_STARTS["Learn a Concept"];

  return (
    <div
      id="ai-tutor-root"
      className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans"
    >
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="relative z-10 w-full max-w-5xl mx-auto pb-4 text-center shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-3">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Your Personal AI Mentor for B.Tech</span>
        </div>

        <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
          AstraMind AI Tutor
        </h1>

        <p className="text-sm text-white/50 mt-1.5 max-w-2xl mx-auto leading-relaxed font-normal">
          Interactive guidance across every engineering phase: Learning → Problem Solving → Coding → Projects → Interviews → Career
        </p>

        {/* B.TECH ENGINEERING TRACKS SELECTOR */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin px-1 justify-start md:justify-center">
            {BTECH_TRACKS.map((item) => {
              const Icon = item.icon;
              const isSelected = track === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTrack(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                    isSelected
                      ? "bg-white text-[#0d0d0e] border-white shadow-md"
                      : "bg-[#151517] text-white/70 hover:text-white hover:bg-white/[0.04] border-white/[0.06]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {track !== "Engineering Academics" && (
          <>
            {/* ALL 13 MENTOR MODES (HORIZONTAL SELECTOR CHIPS) */}
            <div className="mt-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin px-1 justify-start">
                {MENTOR_MODES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setMode(item.id)}
                      title={item.shortDesc}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all cursor-pointer shrink-0 border ${
                        isSelected
                          ? "bg-[#a78bfa]/20 text-white border-[#a78bfa]/50 shadow-sm"
                          : "bg-[#151517] text-white/60 hover:text-white hover:bg-white/[0.04] border-white/[0.06]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#a78bfa]" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STUDENT PROFILE & CONVERSATION CONTROLS BAR */}
            <div className="mt-3 bg-[#151517] border border-white/[0.06] rounded-[24px] p-3 text-xs shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Year & Branch */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-white/40 text-[10px] font-mono-studio uppercase tracking-wider font-semibold">
                    Profile:
                  </span>
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-full border border-white/[0.06]">
                    {BTECH_YEARS.map((y) => (
                      <button
                        key={y}
                        onClick={() => setYear(y)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          year === y ? "bg-white text-[#0d0d0e] shadow-sm" : "text-white/50 hover:text-white"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as BTechBranch)}
                    className="bg-black/50 border border-white/[0.08] text-white rounded-full px-3 py-1 text-xs font-medium focus:outline-none focus:border-[#a78bfa] cursor-pointer"
                  >
                    {BTECH_BRANCHES.map((b) => (
                      <option key={b} value={b} className="bg-[#151517] text-white">
                        {b}
                      </option>
                    ))}
                  </select>

                  <div className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 text-[11px] font-mono-studio">
                    Active: <span className="font-semibold text-white">{mode}</span>
                  </div>
                </div>

                {/* Conversation Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleNewChat}
                    title="Start a new chat for this mode"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 transition-all text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span>New Chat</span>
                  </button>

                  {messages.length > 0 && (
                    <button
                      onClick={handleClearConversation}
                      title="Clear conversation"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-rose-500/20 text-white/60 hover:text-rose-300 transition-all text-xs font-medium cursor-pointer border border-white/[0.06]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ===================================================================== */}
      {/* 2. AI TUTOR — SMALL AD BETWEEN SECTIONS                               */}
      {/* ===================================================================== */}
      <AdSenseBanner
        id="ai-tutor-section-ad"
        slotId={ADSENSE_CONFIG.slots.aiTutorSection}
        format="horizontal"
        responsive={true}
        variant="compact"
        className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-1.5 shrink-0"
      />

      {/* RENDER ENGINEERING ACADEMICS MCQ PANEL OR CHAT VIEW */}
      {track === "Engineering Academics" ? (
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 flex flex-col min-h-0 mb-3 sm:mb-4">
          <EngineeringAcademicsView
            accentColorClass={accentColorClass}
            onSwitchToGeneralTutor={() => setTrack("Programming & DSA")}
          />
        </main>
      ) : (
        /* MAIN CHAT & WELCOME AREA */
        <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col min-h-0 mb-4">
          <div className="flex-1 bg-[#151517] border border-white/[0.06] rounded-[28px] p-5 sm:p-7 overflow-y-auto space-y-5 scrollbar-thin shadow-2xl">
          {/* WELCOME SCREEN (When no active conversation in this mode) */}
          {messages.length === 0 && (
            <div className="py-8 sm:py-12 px-4 max-w-2xl mx-auto text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1f1b2e] to-[#2d224d] border border-[#a78bfa]/30 flex items-center justify-center mx-auto shadow-xl text-[#a78bfa]">
                <GraduationCap className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h2 className="font-serif-studio text-2xl sm:text-3xl font-medium text-white tracking-tight">
                  {mode} Mode Active
                </h2>
                <p className="text-xs sm:text-sm font-mono-studio text-[#a78bfa]">
                  Tailored for {year} {branch} • {track}
                </p>
                <p className="text-xs sm:text-sm text-white/50 max-w-lg mx-auto leading-relaxed font-normal">
                  Pick a starter prompt below or ask your own question to start the interactive mentor session.
                </p>
              </div>

              {/* DYNAMIC QUICK START BUTTONS FOR ACTIVE MODE */}
              <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {currentQuickStarts.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-4 rounded-[20px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#a78bfa]/40 text-xs text-white/80 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="pr-2">
                        <div className="font-semibold text-white group-hover:text-[#a78bfa]">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-white/40 line-clamp-1 mt-0.5">
                          {item.prompt}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#a78bfa] transition-transform group-hover:translate-x-1 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3.5 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-xs font-semibold ${
                  msg.sender === "user"
                    ? "bg-white text-[#0d0d0e] shadow-md"
                    : "bg-[#1f1b2e] border border-[#a78bfa]/30 text-[#a78bfa] shadow-md"
                }`}
              >
                {msg.sender === "user" ? (
                  "You"
                ) : (
                  <img
                    src="/logo.png"
                    alt="AstraMind AI Tutor"
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.currentTarget as any).style.display = "none";
                    }}
                  />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-[22px] px-5 py-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-white text-[#0d0d0e] rounded-tr-sm shadow-lg font-medium"
                    : "bg-[#1f1f23] border border-white/[0.06] text-white/90 rounded-tl-sm shadow-md"
                }`}
              >
                {msg.sender === "user" ? (
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                ) : (
                  <div className="space-y-2.5 markdown-body text-white/90 break-words">
                    <ReactMarkdown
                      components={{
                        p({ children, ...props }: any) {
                          return <div className="mb-2 leading-relaxed" {...props}>{children}</div>;
                        },
                        pre({ children }: any) {
                          return <>{children}</>;
                        },
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline ? (
                            <CodeBlock
                              language={match ? match[1] : ""}
                              value={String(children).replace(/\n$/, "")}
                            />
                          ) : (
                            <code
                              className="bg-white/10 text-[#a78bfa] px-1.5 py-0.5 rounded text-xs font-mono font-semibold break-words"
                              {...props}
                            >
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

                <div className={`text-[10px] mt-2 text-right font-mono-studio ${msg.sender === "user" ? "text-black/50" : "text-white/40"}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Typing/Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-white/60 text-xs animate-pulse py-2">
              <div className="w-8 h-8 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#a78bfa] animate-spin" />
              </div>
              <span className="font-mono-studio text-xs text-[#a78bfa]">
                {mode} mentor is formulating response...
              </span>
            </div>
          )}

          {/* Error Handling & Retry */}
          {hasError && !isLoading && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>AI Tutor Request Notice</span>
                </div>
                <p className="text-white/70 text-[11px] pl-6 leading-relaxed">
                  {errorMessage || "Connection error occurred while contacting AI service. Please retry."}
                </p>
              </div>

              <button
                onClick={handleRetry}
                className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* CHAT INPUT CONTAINER */}
        <div className="mt-3 shrink-0">
          <div className="relative bg-[#151517] border border-white/[0.08] rounded-full px-4 py-2.5 shadow-2xl focus-within:border-[#a78bfa] transition-all flex items-center gap-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder(mode, track)}
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none px-2 py-1 font-normal resize-none max-h-36 scrollbar-thin"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-xs font-semibold transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
              title="Send Message"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
      )}
    </div>
  );
}
