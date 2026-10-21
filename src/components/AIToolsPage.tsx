import React from "react";
import { Wrench, Code2, Sparkles, Image, GraduationCap, Brain, Zap, ArrowRight, FileText, Cpu, MessageSquare, Linkedin, BookOpen } from "lucide-react";

interface AIToolsPageProps {
  onNavigateTab?: (tab: any) => void;
  onStartChat?: (prompt: string) => void;
}

export default function AIToolsPage({ onNavigateTab, onStartChat }: AIToolsPageProps) {
  const tools = [
    {
      id: "workspace",
      title: "Engineering Study Workspace",
      description: "Autonomous syllabus-aligned workspace with smart document extraction, guided lessons, flashcards, and mock exam simulation.",
      icon: BookOpen,
      category: "Academic Suite",
      badge: "CORE",
      gradient: "from-blue-600/30 to-indigo-600/20 border-blue-500/30",
      action: () => onNavigateTab?.("workspace"),
      prompt: "Open engineering study workspace for semester syllabus review.",
    },
    {
      id: "profile-enhancer",
      title: "LinkedIn Profile Enhancer",
      description: "AI-powered LinkedIn presence optimizer designed for B.Tech students & freshers to elevate headline, about, projects, and skills.",
      icon: Linkedin,
      category: "Career & HR",
      badge: "NEW",
      gradient: "from-blue-600/30 to-indigo-600/20 border-blue-500/30",
      action: () => onNavigateTab?.("profile-enhancer"),
      prompt: "Help me optimize my LinkedIn headline and about section for a Software Developer role.",
    },
    {
      id: "code-tutor",
      title: "AI Coding Tutor & Compiler",
      description: "Interactive 1st Year CS coding mentor with live debugging, refactoring, and algorithm explanations.",
      icon: Code2,
      category: "Developer Tools",
      badge: "FEATURED",
      gradient: "from-indigo-600/30 to-purple-600/20 border-indigo-500/30",
      action: () => onNavigateTab?.("coding"),
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
    <div id="ai-tools-page-container" className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Studio Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-3">
              <Wrench className="w-3.5 h-3.5" />
              <span>AstraMind Tool Suite</span>
            </div>
            <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
              AI Tools & Workstations
            </h1>
            <p className="text-sm text-white/50 mt-1 font-normal tracking-wide">
              Specialized workstations engineered for coding, career prep, syllabus extraction, and study.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab?.("chat")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#a78bfa]" />
              <span>Open Astra Chat</span>
            </button>
          </div>
        </div>

        {/* Grid of Studio Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={tool.action}
                className="p-6 sm:p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] flex flex-col justify-between gap-5 cursor-pointer hover:border-[#a78bfa]/40 transition-all duration-300 group hover:-translate-y-1 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-[#a78bfa]" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[10px] font-mono-studio font-medium text-[#a78bfa] tracking-wider">
                      {tool.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono-studio uppercase tracking-wider text-white/40 font-medium">
                      {tool.category}
                    </span>
                    <h3 className="font-medium text-lg text-white group-hover:text-[#a78bfa] transition-colors mt-0.5">
                      {tool.title}
                    </h3>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed font-normal">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-medium text-white/70 group-hover:text-[#a78bfa] flex items-center gap-1 transition-colors">
                    Launch Workstation
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/60 group-hover:bg-[#a78bfa] group-hover:text-[#0d0d0e] transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
