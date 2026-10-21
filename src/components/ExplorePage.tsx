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
    <div id="explore-page-wrapper" className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Prompt Vault &amp; Career Hub</span>
          </div>
          
          <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
            Curated Intelligence Templates
          </h1>
          <p className="text-sm text-white/50 max-w-lg mx-auto font-normal">
            Jumpstart your workflow with hand-crafted prompts optimized for reasoning, code, writing, and strategy.
          </p>
        </div>

        {/* Featured Career Hub / Learn Section: AI Resume Builder */}
        {onOpenResumeBuilder && (
          <div className="relative overflow-hidden rounded-[28px] bg-[#151517] border border-white/[0.06] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] text-[11px] font-mono-studio">
                <Sparkles className="w-3 h-3 text-[#a78bfa]" />
                <span>Career Hub Feature</span>
              </div>
              <h2 className="font-serif-studio text-2xl sm:text-3xl font-medium text-white tracking-tight">
                AI-Powered ATS Resume Builder
              </h2>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-normal">
                Craft professional, high-scoring ATS resumes with AI-assisted STAR bullet polishing, automated skill recommendations, real-time compliance scoring, and instant local PDF download.
              </p>
            </div>

            <button
              onClick={onOpenResumeBuilder}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#a78bfa]" />
              <span>Launch Resume Builder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Bar & Category Filters */}
        <div className="space-y-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search templates by keyword, skill, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151517] border border-white/[0.08] rounded-full py-3 pl-11 pr-5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] transition-all shadow-xl"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  activeCategory === cat
                    ? "bg-white text-[#0d0d0e] border-white shadow-md"
                    : "bg-[#151517] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="group relative flex flex-col justify-between p-6 rounded-[28px] bg-[#151517] border border-white/[0.06] hover:border-[#a78bfa]/40 hover:-translate-y-1 transition-all duration-300 shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#a78bfa] shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono-studio uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa]">
                      {template.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-serif-studio text-xl font-medium text-white group-hover:text-[#a78bfa] transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-normal">
                      {template.description}
                    </p>
                  </div>

                  {/* Prompt Preview snippet */}
                  <div className="p-3.5 rounded-2xl bg-[#0d0d0e]/60 border border-white/[0.04] text-[11px] font-mono-studio text-white/60 line-clamp-3 leading-relaxed">
                    "{template.prompt}"
                  </div>
                </div>

                <div className="pt-5">
                  <button
                    onClick={() => onSelectPrompt(template.prompt)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0d0d0e]/60 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
