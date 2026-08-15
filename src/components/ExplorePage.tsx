import React, { useState } from "react";
import { 
  Compass, 
  GraduationCap, 
  Code2, 
  Sparkles, 
  Feather, 
  Briefcase, 
  ArrowRight, 
  Search,
  Zap,
  Bookmark,
  FileText
} from "lucide-react";

interface ExplorePageProps {
  onSelectPrompt: (promptText: string) => void;
  onOpenResumeBuilder?: () => void;
  accentColorClass: string;
}

interface PromptTemplate {
  id: string;
  category: "Students" | "Developers" | "Creators" | "Writers" | "Professionals";
  title: string;
  description: string;
  prompt: string;
  badge: string;
  icon: React.ElementType;
}

export default function ExplorePage({ onSelectPrompt, onOpenResumeBuilder, accentColorClass }: ExplorePageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const templates: PromptTemplate[] = [
    // Students
    {
      id: "std-1",
      category: "Students",
      title: "Socratic Study Partner",
      description: "Break down complex topics into simple intuitive analogies and quiz me on key concepts.",
      prompt: "Act as a world-class tutor. Explain [Concept, e.g., Quantum Entanglement or Inflationary Economics] to me using a simple analogy. Then ask me 3 progressive quiz questions to test my understanding.",
      badge: "Learning",
      icon: GraduationCap,
    },
    {
      id: "std-2",
      category: "Students",
      title: "Research Paper Summarizer & Key Takeaways",
      description: "Extract methodology, findings, limitations, and key insights from dense academic papers.",
      prompt: "I am researching [Topic]. Help me analyze the core arguments: 1. Executive Summary 2. Key Methodologies 3. Core Findings 4. Potential Criticisms or Future Research Directions.",
      badge: "Academic",
      icon: GraduationCap,
    },
    {
      id: "std-3",
      category: "Students",
      title: "Step-by-Step Math & Logic Solver",
      description: "Solve complex mathematical or logic problems with clear step-by-step reasoning.",
      prompt: "Solve this problem step by step: [Paste Math/Logic Problem]. Explain the reasoning behind each transformation and highlight common pitfalls students make.",
      badge: "STEM",
      icon: GraduationCap,
    },

    // Developers
    {
      id: "dev-1",
      category: "Developers",
      title: "Full-Stack System Architecture Blueprint",
      description: "Design scalable backend services, database schemas, and API contracts for modern apps.",
      prompt: "Act as a Principal System Architect. Design a production-ready architecture for [App idea, e.g., Real-time collaborative whiteboard]. Include database schema (PostgreSQL/Firestore), API endpoints, caching strategy, and security considerations.",
      badge: "Architecture",
      icon: Code2,
    },
    {
      id: "dev-2",
      category: "Developers",
      title: "Code Refactoring & Performance Optimizer",
      description: "Upgrade messy code for readability, type-safety, algorithmic efficiency, and memory usage.",
      prompt: "Refactor the following code snippet for maximum performance, modern TypeScript best practices, and clean architecture: \n```ts\n// Paste code here\n```",
      badge: "Optimization",
      icon: Code2,
    },
    {
      id: "dev-3",
      category: "Developers",
      title: "Bug Hunter & Root Cause Analysis",
      description: "Diagnose subtle memory leaks, race conditions, type mismatches, and async stack traces.",
      prompt: "I am encountering this error in my codebase: [Paste Error Log / Stack Trace]. Identify the root cause, explain why it happens, and provide the exact corrected code block.",
      badge: "Debugging",
      icon: Code2,
    },

    // Creators
    {
      id: "crt-1",
      category: "Creators",
      title: "Viral Tech YouTube Script Outline",
      description: "Draft engaging hook-driven video scripts with visual cues, pacing notes, and CTAs.",
      prompt: "Write a high-retention 8-minute YouTube video script about [Topic]. Structure: 1. High-impact 15-second Hook 2. Problem Statement 3. 3 Core Pillars with Visual B-Roll Notes 4. Compelling Call to Action.",
      badge: "Video",
      icon: Sparkles,
    },
    {
      id: "crt-2",
      category: "Creators",
      title: "Multi-Platform Content Atomizer",
      description: "Repurpose a single core blog or article into a Twitter thread, LinkedIn post, and Newsletter.",
      prompt: "Transform this key message into 3 distinct formats: 1. A punchy 5-tweet X thread 2. An insightful LinkedIn post with line breaks 3. A 2-paragraph newsletter summary: [Paste Content/Idea].",
      badge: "Social",
      icon: Sparkles,
    },

    // Writers
    {
      id: "wrt-1",
      category: "Writers",
      title: "Creative Story & Narrative World-Building",
      description: "Develop rich fictional universes, character arcs, atmospheric descriptions, and dialogue.",
      prompt: "Help me craft a sci-fi cyberpunk narrative set in a flooded metropolis. Outline 3 main characters with conflicting motivations, a central world mystery, and draft a gripping opening scene.",
      badge: "Fiction",
      icon: Feather,
    },
    {
      id: "wrt-2",
      category: "Writers",
      title: "Tone & Clarity Polisher",
      description: "Elevate draft prose to sound elegant, persuasive, punchy, or authoritative.",
      prompt: "Rewrite the following text to make it sound highly polished, compelling, and authoritative while preserving its core message: [Paste text].",
      badge: "Editing",
      icon: Feather,
    },

    // Professionals
    {
      id: "pro-1",
      category: "Professionals",
      title: "Executive Strategic Proposal",
      description: "Structure persuasive business proposals with executive summary, ROI, and roadmap.",
      prompt: "Draft a 1-page executive proposal to introduce [New Initiative/Tool] to C-suite leadership. Include: Executive Summary, Strategic Value & ROI, Resource Plan, and Risk Mitigation.",
      badge: "Executive",
      icon: Briefcase,
    },
    {
      id: "pro-2",
      category: "Professionals",
      title: "High-Stakes Salary & Negotiation Email",
      description: "Draft professional, polite, and persuasive communication for job offers and contracts.",
      prompt: "Draft a diplomatic yet confident response to a job offer for [Role], expressing excitement while professionally proposing a 15% increase in base compensation or additional equity.",
      badge: "Career",
      icon: Briefcase,
    },
  ];

  const categories = ["All", "Students", "Developers", "Creators", "Writers", "Professionals"];

  const filteredTemplates = templates.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="explore-page-wrapper" className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>PROJECT TITAN PROMPT VAULT &amp; CAREER HUB</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Curated Intelligence Templates
        </h1>
        <p className="text-sm md:text-base text-slate-400">
          Jumpstart your workflow with hand-crafted prompts optimized for reasoning, code, writing, and strategy.
        </p>
      </div>

      {/* Featured Career Hub / Learn Section: AI Resume Builder */}
      {onOpenResumeBuilder && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border border-blue-500/30 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AstraMind Career Hub &amp; Learn</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              AI-Powered ATS Resume Builder
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Craft professional, high-scoring ATS resumes with AI-assisted STAR bullet polishing, automated skill recommendations, real-time compliance scoring, and instant local PDF download.
            </p>
          </div>

          <button
            onClick={onOpenResumeBuilder}
            className="shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs md:text-sm transition-all shadow-xl shadow-blue-500/20 cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Launch Resume Builder</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar & Category Filters */}
      <div className="space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates by keyword, skill, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 backdrop-blur-xl transition-all shadow-inner"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1.5 transition-all duration-300 shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    {template.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Prompt Preview snippet */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 line-clamp-3 leading-relaxed">
                  "{template.prompt}"
                </div>
              </div>

              <div className="pt-5">
                <button
                  onClick={() => onSelectPrompt(template.prompt)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 border border-white/10 hover:border-transparent text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
