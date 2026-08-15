import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Sparkles, 
  Crown, 
  Code2, 
  Cpu, 
  GraduationCap, 
  Compass, 
  Target, 
  Zap, 
  Layers, 
  Award, 
  ShieldCheck, 
  Atom, 
  Terminal, 
  Activity, 
  BarChart3, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Server, 
  TrendingUp,
  Quote,
  Database,
  Lock,
  Flag
} from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase";

interface FounderModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColorClass: string;
}

export default function FounderModal({ isOpen, onClose, accentColorClass }: FounderModalProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"keynote" | "dashboard">("keynote");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const skills = [
    { name: "Full-Stack Architecture", icon: Layers, highlight: "blue" },
    { name: "AI Agent Engineering", icon: Cpu, highlight: "purple" },
    { name: "Multimodal LLMs", icon: Atom, highlight: "gold" },
    { name: "Product UI/UX Engineering", icon: Sparkles, highlight: "blue" },
    { name: "React & TypeScript", icon: Code2, highlight: "cyan" },
    { name: "System Optimization", icon: Zap, highlight: "purple" },
    { name: "Cloud Infrastructure", icon: Terminal, highlight: "emerald" },
    { name: "Data Security & Privacy", icon: ShieldCheck, highlight: "gold" },
  ];

  const educationTimeline = [
    {
      degree: "Secondary Education (Class X)",
      institution: "Aurobindo Public School",
      period: "Secondary Schooling",
      description: "Completed secondary education with a strong foundation in mathematics, science, and computational logic.",
      badge: "Class X"
    },
    {
      degree: "Higher Secondary Education (Intermediate)",
      institution: "Pragathi Junior College",
      period: "Intermediate Studies",
      description: "Focused on Mathematics, Physics, and Chemistry, building a rigorous problem-solving mindset for software engineering.",
      badge: "Intermediate"
    },
    {
      degree: "Bachelor of Technology (B.Tech)",
      institution: "Vignan Institute of Technology and Science (Upcoming)",
      period: "CSE – AI & ML",
      description: "Computer Science & Engineering with specialization in Artificial Intelligence & Machine Learning (CSE – AI & ML).",
      badge: "Upcoming B.Tech"
    }
  ];

  const feedbackList = [
    { id: 1, user: "Elena Rostova", role: "AI Researcher", rating: 5, comment: "Streaming latency and reasoning output clarity are top tier! Replaced 3 other tools with AstraMind.", date: "Today" },
    { id: 2, user: "Marcus Vance", role: "Lead Systems Engineer", rating: 5, comment: "The fixed glassmorphic top navigation bar and code formatting are buttery smooth.", date: "Yesterday" },
    { id: 3, user: "Siddharth Verma", role: "Product Designer", rating: 5, comment: "Visual aesthetics and Project Titan prompt templates save me hours every single week.", date: "3 days ago" },
  ];

  return (
    <motion.div
      id="founder-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[#02040a]/85 backdrop-blur-3xl overflow-hidden"
    >
      {/* Interactive Mouse Glow Background */}
      <div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-amber-500/10 blur-[120px] transition-transform duration-500 ease-out z-0"
        style={{
          transform: `translate(${mousePos.x - 250}px, ${mousePos.y - 250}px)`,
        }}
      />

      {/* Main Glassmorphism Presentation Container */}
      <motion.div
        id="founder-modal-card"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl h-[90vh] max-h-[850px] flex flex-col bg-[#070b1a]/90 border border-white/15 rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden z-10"
      >
        {/* Top Floating Header & Tabs & Close Button */}
        <div className="relative shrink-0 flex items-center justify-between px-6 sm:px-8 py-4 border-b border-white/10 bg-white/[0.02] flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400 shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 inline" /> Executive Founder Center
              </span>
              <h2 className="text-sm font-bold text-slate-200 tracking-wide">Kolloju Ravi Charan</h2>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab("keynote")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "keynote"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Keynote &amp; Vision
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Founder Dashboard</span>
            </button>
          </div>

          <button
            id="close-founder-modal-btn"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
            title="Close presentation (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Presentation Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 space-y-10 scrollbar-thin">
          
          {activeTab === "keynote" ? (
            <>
              {/* HERO FOUNDER BANNER */}
              <section id="founder-hero-section" className="relative text-center pt-2 pb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium mb-6 shadow-lg shadow-amber-500/5 animate-pulse">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>ARCHITECT OF ASTRAMIND AI</span>
                </div>

                <div className="relative mx-auto w-24 h-24 mb-5 group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-blue-600 to-purple-600 blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-spin" style={{ animationDuration: '10s' }} />
                  <div className="relative w-full h-full rounded-full bg-[#080d22] border-2 border-white/20 p-1 flex items-center justify-center shadow-2xl">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white font-extrabold text-2xl tracking-wider shadow-inner">
                      RC
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center border-2 border-[#070b1a] shadow-lg" title="Founder Certified">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 uppercase font-sans mb-2">
                  Kolloju Ravi Charan
                </h1>
                <p className="text-xs sm:text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-blue-400 to-purple-400 tracking-wide font-mono">
                  Founder • Lead Developer • Product Architect
                </p>
              </section>

              {/* QUOTE BANNER */}
              <section id="founder-quote-section" className="relative p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-amber-950/30 border border-amber-500/30 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
                <Quote className="absolute top-3 left-3 w-10 h-10 text-amber-400/10 pointer-events-none" />
                <Quote className="absolute bottom-3 right-3 w-10 h-10 text-purple-400/10 rotate-180 pointer-events-none" />
                
                <p className="text-base sm:text-xl font-serif italic text-slate-100 tracking-wide leading-relaxed mb-2">
                  "Technology should empower people, not overwhelm them."
                </p>
                <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                  — Ravi Charan
                </span>
              </section>

              {/* VISION */}
              <section id="founder-narrative-section" className="space-y-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <Compass className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">A Vision Beyond Technology</h3>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3 backdrop-blur-md">
                  <p>
                    AstraMind AI was born from a fundamental realization: artificial intelligence should feel like a natural extension of human thought rather than a cold, complex tool.
                  </p>
                  <p>
                    Kolloju Ravi Charan is currently a 16-year-old aspiring Artificial Intelligence developer from Nalgonda, Telangana, India. As Founder, Lead Developer, and Product Architect, he created AstraMind AI with an obsession for visual harmony, zero-latency workflows, and privacy-first intelligence. By unifying cutting-edge generative models into one fluid interface, AstraMind sets a new standard for human-AI interaction.
                  </p>
                </div>
              </section>

              {/* CORE EXPERTISE */}
              <section id="core-expertise-section" className="space-y-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">Core Expertise</h3>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {skills.map((skill, idx) => {
                    const IconComponent = skill.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-200"
                      >
                        <IconComponent className="w-3.5 h-3.5 text-amber-400" />
                        <span>{skill.name}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* EDUCATION & INSTITUTIONS */}
              <section id="education-institutions-section" className="space-y-3">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">Education &amp; Institution Details</h3>
                </div>

                <div className="space-y-3">
                  {educationTimeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all backdrop-blur-md space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                            {item.badge}
                          </span>
                          <h4 className="text-sm font-bold text-white">{item.degree}</h4>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{item.period}</span>
                      </div>
                      <p className="text-xs font-semibold text-blue-300">{item.institution}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            /* FOUNDER DASHBOARD VIEW */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Professional Project Status Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-base font-bold text-white tracking-wide">Project Status &amp; System Architecture</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                    ACTIVE BETA BUILD
                  </span>
                </div>

                {/* Main Project Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Current Version */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Current Version</span>
                      <Code2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-xl font-extrabold text-white font-mono">v3.2.0 Titan</p>
                    <div className="text-[11px] text-slate-400">Stable Build with Multi-Model AI &amp; Cloud Sync</div>
                  </div>

                  {/* Development Stage */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Development Stage</span>
                      <Layers className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-xl font-extrabold text-white">Public Beta</p>
                    <div className="text-[11px] text-slate-400">Active feature expansion &amp; UX refinement</div>
                  </div>

                  {/* Authentication Status */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Authentication Status</span>
                      <Lock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-extrabold text-white">
                        {isSupabaseConfigured() ? "Supabase Auth" : "Local Session"}
                      </p>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isSupabaseConfigured() ? "JWT & Cloud Session Security" : "Client Browser Session"}
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Database Status</span>
                      <Database className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-extrabold text-white">
                        {isSupabaseConfigured() ? "Supabase Postgres" : "Local Storage Engine"}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isSupabaseConfigured() ? "Cloud Persistence & Realtime DB" : "Local Key-Value Storage"}
                    </div>
                  </div>

                  {/* Security Status */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Security Status</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xl font-extrabold text-white">SSL / TLS Protected</p>
                    <div className="text-[11px] text-slate-400">Client-Side Key Isolation &amp; Encrypted State</div>
                  </div>

                  {/* Current Development Focus */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Development Focus</span>
                      <Target className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-100 leading-snug">
                      Multi-Model AI Orchestration &amp; Real-Time Multimodal Workflows
                    </p>
                    <div className="text-[11px] text-slate-400">Optimizing streaming latency &amp; workspace tools</div>
                  </div>
                </div>

                {/* Next Milestone Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-amber-950/30 border border-blue-500/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold">
                        Next Major Milestone
                      </span>
                      <h4 className="text-sm font-bold text-white">v3.5 - Autonomous AI Agents &amp; Custom Workspace Extensions</h4>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-medium self-start sm:self-auto shrink-0">
                    In Progress
                  </span>
                </div>
              </div>

              {/* Platform Analytics & Telemetry (Coming Soon) Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white tracking-wide">Platform Analytics &amp; Telemetry</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Active Users</span>
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-400">Telemetry Pending</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-semibold">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Global active session tracking will be introduced in v3.5.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Stream Throughput</span>
                      <Zap className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-400">Telemetry Pending</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-semibold">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Live tokens/sec benchmark metric pipeline under construction.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Satisfaction Score</span>
                      <TrendingUp className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-400">Telemetry Pending</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-semibold">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">In-app feedback rating aggregation system in development.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>AI Engine Health</span>
                      <Activity className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-400">Telemetry Pending</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-semibold">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Centralized latency and uptime monitor coming soon.</p>
                  </div>
                </div>
              </div>

              {/* Service Integration Architecture (Truthful Component Status) */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Runtime Component Architecture</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                    HEALTHY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400">AstraMind-AI Gateway</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">@google/genai Proxy</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400">Multimodal Workspace Engine</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">PDF, DOCX, XLSX Parser</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400">Live Voice Gateway</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">Web Speech API</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ELEGANT FOOTER */}
        <div className="shrink-0 px-6 sm:px-8 py-4 border-t border-white/10 bg-[#040714]/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              AstraMind AI Project Titan • Built by <strong className="text-white">Ravi Charan</strong>
            </span>
          </div>
          <span className="text-xs font-mono text-amber-400/90 font-semibold tracking-wider">
            Founder &amp; Chief Architect
          </span>
        </div>

      </motion.div>
    </motion.div>
  );
}
