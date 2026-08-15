import React from "react";
import { Wrench, Code2, Sparkles, Image, GraduationCap, Brain, Zap, ArrowRight, FileText, Cpu, MessageSquare } from "lucide-react";

interface AIToolsPageProps {
  onNavigateTab?: (tab: any) => void;
  onStartChat?: (prompt: string) => void;
}

export default function AIToolsPage({ onNavigateTab, onStartChat }: AIToolsPageProps) {
  const tools = [
    {
      id: "code-tutor",
      title: "AI Coding Tutor & Compiler",
      description: "Interactive 1st Year CS coding mentor with live debugging, refactoring, and algorithm explanations.",
      icon: Code2,
      category: "Developer Tools",
      badge: "FEATURED",
      gradient: "from-indigo-600/30 to-purple-600/20 border-indigo-500/30",
      action: () => onStartChat?.("Help me write and optimize code in TypeScript:"),
      prompt: "Help me optimize this TypeScript recursive function for O(n) space complexity:",
    },
    {
      id: "resume-builder",
      title: "ATS Resume Architect",
      description: "Build ATS-friendly tech resumes with native vector PDF exports and instant AI section enhancements.",
      icon: FileText,
      category: "Career & HR",
      badge: "POPULAR",
      gradient: "from-blue-600/30 to-cyan-600/20 border-blue-500/30",
      action: () => onNavigateTab?.("resume-builder"),
      prompt: "Generate 3 high-impact bullet points for a Senior Full Stack Engineer role:",
    },
    {
      id: "interview-prep",
      title: "AI Technical Interview Simulator",
      description: "Mock interviews with real-time feedback, STAR method evaluation, and system design challenges.",
      icon: Brain,
      category: "Career Prep",
      badge: "FEATURED",
      gradient: "from-purple-600/30 to-pink-600/20 border-purple-500/30",
      action: () => onNavigateTab?.("interview-prep"),
      prompt: "Conduct a mock interview question on designing a distributed rate limiter.",
    },
    {
      id: "learning-hub",
      title: "AI Learning & Skill Master",
      description: "Structured learning paths for computer science, machine learning, web dev, and Cloud infrastructure.",
      icon: GraduationCap,
      category: "Education",
      badge: "NEW",
      gradient: "from-emerald-600/30 to-teal-600/20 border-emerald-500/30",
      action: () => onNavigateTab?.("learn"),
      prompt: "Create a 4-week structured roadmap to master React 18 & Server Components.",
    },
    {
      id: "ai-studio",
      title: "Multimodal AI Studio",
      description: "Generate images, convert speech-to-text, analyze complex documents, and prototype ideas.",
      icon: Sparkles,
      category: "Creative Suite",
      badge: "LIVE",
      gradient: "from-amber-600/30 to-red-600/20 border-amber-500/30",
      action: () => onNavigateTab?.("ai-studio"),
      prompt: "Generate a high-tech UI design mockup for an AI operating system dashboard.",
    },
    {
      id: "system-architecture",
      title: "Cloud System Architect",
      description: "Architect high-availability microservices, database schemas, and GCP/AWS infrastructure blueprints.",
      icon: Cpu,
      category: "Engineering",
      badge: "ENTERPRISE",
      gradient: "from-cyan-600/30 to-blue-600/20 border-cyan-500/30",
      action: () => onStartChat?.("Propose a scalable Cloud Run microservices architecture with Firestore and Cloud SQL:"),
      prompt: "Architect a fault-tolerant payment processing system with idempotent retries.",
    },
  ];

  return (
    <div id="ai-tools-page-container" className="flex-1 overflow-y-auto z-10 px-4 md:px-8 py-8 max-w-7xl mx-auto w-full space-y-8 scrollbar-thin">
      
      {/* Hero Section */}
      <div className="glass-panel p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-500/20 shadow-2xl shadow-purple-950/30">
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-600/30 via-purple-600/20 to-transparent blur-3xl pointer-events-none" />
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Wrench className="w-3.5 h-3.5" />
            <span>AstraMind Tool Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Specialized AI Utilities &amp; Workstations
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Unleash powerful specialized AI tools built on Gemini models for coding, career development, learning, and system engineering.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigateTab?.("chat")}
            className="glass-button-primary px-5 py-3 flex items-center gap-2 cursor-pointer text-sm shadow-xl shadow-purple-600/30"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Astra Chat</span>
          </button>
        </div>
      </div>

      {/* Grid of Floating Translucent Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={tool.action}
              className={`glass-card p-6 flex flex-col justify-between gap-5 cursor-pointer border hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1 shadow-xl bg-gradient-to-br ${tool.gradient}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono font-bold text-white tracking-wider">
                    {tool.badge}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                    {tool.category}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors mt-0.5">
                    {tool.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-300 group-hover:text-white flex items-center gap-1">
                  Launch Tool
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
