import React, { useState } from "react";
import {
  Sparkles,
  Linkedin,
  Copy,
  Check,
  RefreshCw,
  Award,
  BookOpen,
  Briefcase,
  Code2,
  FolderKanban,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  Info,
  ShieldCheck,
  Search,
  Sliders,
  RotateCcw,
} from "lucide-react";
import {
  CareerGoal,
  ProfileEnhancerInput,
  ProfileAnalysisResult,
  ProjectInput,
  ExperienceInput,
} from "../types/profileEnhancer";

const CAREER_GOALS: CareerGoal[] = [
  "Software Developer",
  "AI/ML Engineer",
  "Data Scientist",
  "Data Analyst",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Cybersecurity",
  "Cloud / DevOps",
  "Student",
  "Internship",
  "Placement / Job",
  "Startup / Entrepreneurship",
  "Other",
];

const INITIAL_EMPTY_PROFILE: ProfileEnhancerInput = {
  fullName: "",
  currentRole: "",
  branchDegree: "",
  collegeUniversity: "",
  careerGoal: "Software Developer",
  linkedinHeadline: "",
  linkedinAbout: "",
  skills: "",
  projects: [
    {
      id: "p-init-1",
      title: "",
      tech: "",
      description: "",
    },
  ],
  experience: [],
  certifications: "",
  achievements: "",
  hackathons: "",
  education: "",
  githubUrl: "",
  portfolioUrl: "",
};

interface ProfileEnhancerPageProps {
  accentColorClass?: string;
}

export default function ProfileEnhancerPage({
  accentColorClass = "from-blue-600 to-indigo-600",
}: ProfileEnhancerPageProps) {
  const [profile, setProfile] = useState<ProfileEnhancerInput>(INITIAL_EMPTY_PROFILE);
  const [selectedGoal, setSelectedGoal] = useState<string>("Software Developer");
  const [customGoal, setCustomGoal] = useState<string>("");

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ProfileAnalysisResult | null>(null);

  // Active sub-tab in analysis view
  const [activeEnhancementTab, setActiveEnhancementTab] = useState<
    "overview" | "headline" | "about" | "projects" | "skills" | "keywords" | "experience" | "education" | "achievements" | "checklist"
  >("overview");

  // Copy feedback toast
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Section regeneration tracking
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [regenerationCount, setRegenerationCount] = useState<Record<string, number>>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGoalSelect = (goal: CareerGoal) => {
    setSelectedGoal(goal);
    setProfile((prev) => ({ ...prev, careerGoal: goal }));
  };

  const handleClearForm = () => {
    setProfile(INITIAL_EMPTY_PROFILE);
    setSelectedGoal("Software Developer");
    setCustomGoal("");
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  // Add & remove project
  const handleAddProject = () => {
    setProfile((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { id: `proj-${Date.now()}`, title: "", tech: "", description: "" },
      ],
    }));
  };

  const handleRemoveProject = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateProject = (index: number, field: keyof ProjectInput, value: string) => {
    setProfile((prev) => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  };

  // Add & remove experience
  const handleAddExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { id: `exp-${Date.now()}`, role: "", company: "", duration: "", description: "" },
      ],
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateExperience = (index: number, field: keyof ExperienceInput, value: string) => {
    setProfile((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  // Analyze Profile API Call
  const handleAnalyzeProfile = async () => {
    if (!profile.fullName.trim()) {
      setAnalysisError("Please enter your Full Name to begin profile analysis.");
      return;
    }
    if (!profile.skills.trim() && profile.projects.length === 0) {
      setAnalysisError("Please provide at least some skills or a project to evaluate your profile effectively.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    const finalGoal = selectedGoal === "Other" && customGoal.trim() ? customGoal.trim() : selectedGoal;

    try {
      const res = await fetch("/api/profile-enhancer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          careerGoal: finalGoal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to analyze profile.");
      }

      setAnalysisResult(data.data);
      setActiveEnhancementTab("overview");
    } catch (err: any) {
      console.error("Profile analysis error:", err);
      setAnalysisError(err?.message || "All AI providers are temporarily unavailable. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Section Regeneration API Call
  const handleRegenerateSection = async (section: "headlines" | "about" | "projects" | "experience" | "education" | "achievements") => {
    if (!analysisResult) return;

    setRegeneratingSection(section);
    const count = (regenerationCount[section] || 1) + 1;
    setRegenerationCount((prev) => ({ ...prev, [section]: count }));

    const finalGoal = selectedGoal === "Other" && customGoal.trim() ? customGoal.trim() : selectedGoal;

    try {
      const res = await fetch("/api/profile-enhancer/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          profile,
          careerGoal: finalGoal,
          variation: count,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Regeneration failed");
      }

      setAnalysisResult((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (section === "headlines" && data.data?.headlines) {
          updated.headlines = data.data.headlines;
        } else if (section === "about" && data.data?.enhancedAbout) {
          updated.enhancedAbout = data.data.enhancedAbout;
        } else if (section === "projects" && data.data?.enhancedProjects) {
          updated.enhancedProjects = data.data.enhancedProjects;
        } else if (section === "experience" && data.data?.enhancedExperience) {
          updated.enhancedExperience = data.data.enhancedExperience;
        } else if (section === "education" && data.data?.enhancedEducation) {
          updated.enhancedEducation = data.data.enhancedEducation;
        } else if (section === "achievements" && data.data?.enhancedAchievements) {
          updated.enhancedAchievements = data.data.enhancedAchievements;
        }
        return updated;
      });

      handleCopy("", `regen-${section}`);
    } catch (err: any) {
      console.error(`Error regenerating ${section}:`, err);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Helper for score badge styling
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    if (score >= 40) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Exceptional Profile";
    if (score >= 70) return "Strong Candidate";
    if (score >= 50) return "Good Foundation — Needs Polish";
    return "Early Stage — Needs Optimization";
  };

  return (
    <div id="profile-enhancer-page" className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 pb-16">
        {/* Toast Notification */}
        {copiedKey && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#151517] border border-[#a78bfa]/40 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{copiedKey.startsWith("regen-") ? "Section regenerated successfully!" : "Copied to clipboard!"}</span>
          </div>
        )}

        {/* Studio Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] text-xs font-mono-studio mb-2.5">
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn Presence Optimizer</span>
              <span className="text-white/30">•</span>
              <span>B.Tech & Freshers Edition</span>
            </div>
            <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
              Profile Enhancer
            </h1>
            <p className="mt-1 text-sm text-white/50 max-w-2xl font-normal leading-relaxed">
              Build a credible professional presence with AI. Tailored for students, graduates, internship seekers, career switchers, and professionals to highlight genuine skills, projects, and experience.
            </p>
          </div>

          {/* Quick Demo and Reset Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="clear-profile-form-btn"
              type="button"
              onClick={handleClearForm}
              className="px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all fields"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Form on Left/Top, Results on Right/Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#151517] border border-white/[0.06] rounded-[28px] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                <h2 className="text-xs font-mono-studio uppercase tracking-wider text-white/40 font-semibold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#a78bfa]" />
                  <span>1. Student Profile Details</span>
                </h2>
                <span className="text-[11px] font-mono-studio text-white/30">Auto-analyzed</span>
              </div>

            {/* Error Banner */}
            {analysisError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Analysis Notice</p>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{analysisError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name & Current Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-full-name"
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Role / Student Status <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="input-current-role"
                    type="text"
                    value={profile.currentRole}
                    onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })}
                    placeholder="e.g. 3rd Year B.Tech Student"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Branch / Degree & College */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Branch / Degree
                  </label>
                  <input
                    id="input-branch-degree"
                    type="text"
                    value={profile.branchDegree}
                    onChange={(e) => setProfile({ ...profile, branchDegree: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    College / University
                  </label>
                  <input
                    id="input-college"
                    type="text"
                    value={profile.collegeUniversity}
                    onChange={(e) => setProfile({ ...profile, collegeUniversity: e.target.value })}
                    placeholder="e.g. Vellore Institute of Technology"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Career Goal Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Target Career Goal <span className="text-blue-400 font-semibold">• Personalizes Output</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Select best fit</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 py-0.5">
                  {CAREER_GOALS.map((goal) => {
                    const isSelected = selectedGoal === goal;
                    return (
                      <button
                        key={goal}
                        id={`goal-pill-${goal.toLowerCase().replace(/\s+/g, "-")}`}
                        type="button"
                        onClick={() => handleGoalSelect(goal)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-950/50 border border-blue-400/30"
                            : "bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
                {selectedGoal === "Other" && (
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="Enter custom career aspiration..."
                    className="mt-2 w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* LinkedIn Headline (Optional / Current) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Current LinkedIn Headline <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Draft or existing</span>
                </div>
                <input
                  id="input-linkedin-headline"
                  type="text"
                  value={profile.linkedinHeadline}
                  onChange={(e) => setProfile({ ...profile, linkedinHeadline: e.target.value })}
                  placeholder="e.g. Student at ABC University | Aspiring Developer"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all"
                />
              </div>

              {/* LinkedIn About (Optional / Current) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Current LinkedIn About Section <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Draft or existing summary</span>
                </div>
                <textarea
                  id="input-linkedin-about"
                  rows={3}
                  value={profile.linkedinAbout}
                  onChange={(e) => setProfile({ ...profile, linkedinAbout: e.target.value })}
                  placeholder="Paste current summary or draft thoughts..."
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all resize-none"
                />
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Technical & Professional Skills <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Comma-separated</span>
                </div>
                <textarea
                  id="input-skills"
                  rows={2}
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  placeholder="e.g. C++, Python, React, Node.js, SQL, Git, Data Structures..."
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition-all resize-none"
                />
              </div>

              {/* Projects (Dynamic List) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Projects <span className="text-slate-400 font-normal">({profile.projects.length})</span>
                  </label>
                  <button
                    id="add-project-btn"
                    type="button"
                    onClick={handleAddProject}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {profile.projects.map((proj, idx) => (
                    <div
                      key={proj.id || idx}
                      className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 relative space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">Project #{idx + 1}</span>
                        {profile.projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            title="Remove project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => handleUpdateProject(idx, "title", e.target.value)}
                        placeholder="Project Title (e.g. AI Resume Scanner)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={proj.tech}
                        onChange={(e) => handleUpdateProject(idx, "tech", e.target.value)}
                        placeholder="Technologies used (e.g. Python, FastAPI, React, Docker)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => handleUpdateProject(idx, "description", e.target.value)}
                        placeholder="What problem did it solve? Key features or what you built..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience / Internships (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Internships & Experience <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <button
                    id="add-experience-btn"
                    type="button"
                    onClick={handleAddExperience}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Experience</span>
                  </button>
                </div>
                {profile.experience.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-2 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    No experience added. If you have no internships yet, AI will generate targeted substitute suggestions (Open Source, Hackathons, Personal Projects) instead of fabricating job history.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profile.experience.map((exp, idx) => (
                      <div
                        key={exp.id || idx}
                        className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-400">Experience #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => handleUpdateExperience(idx, "role", e.target.value)}
                            placeholder="Role (e.g. Web Intern)"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleUpdateExperience(idx, "company", e.target.value)}
                            placeholder="Company (e.g. TechCorp)"
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => handleUpdateExperience(idx, "duration", e.target.value)}
                          placeholder="Duration (e.g. May 2024 – July 2024)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={(e) => handleUpdateExperience(idx, "description", e.target.value)}
                          placeholder="Responsibilities, tools used, results achieved..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Sections: Certifications, Achievements, Hackathons, Education */}
              <div className="space-y-3 pt-1 border-t border-slate-800/60">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Certifications <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="input-certifications"
                    type="text"
                    value={profile.certifications}
                    onChange={(e) => setProfile({ ...profile, certifications: e.target.value })}
                    placeholder="e.g. AWS Cloud Practitioner, Meta Frontend Certificate"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Achievements & Awards <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="input-achievements"
                    type="text"
                    value={profile.achievements}
                    onChange={(e) => setProfile({ ...profile, achievements: e.target.value })}
                    placeholder="e.g. Winner at College Hackathon, Top 5% CodeChef rating"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hackathons & Competitions <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="input-hackathons"
                    type="text"
                    value={profile.hackathons}
                    onChange={(e) => setProfile({ ...profile, hackathons: e.target.value })}
                    placeholder="e.g. Smart India Hackathon 2024, Unstop Techathon"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Education Timeline <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="input-education"
                    type="text"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                    placeholder="e.g. B.Tech CSE (2022 - 2026), 12th CBSE (2022)"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      GitHub URL <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="input-github-url"
                      type="text"
                      value={profile.githubUrl || ""}
                      onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Portfolio URL <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="input-portfolio-url"
                      type="text"
                      value={profile.portfolioUrl || ""}
                      onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                      placeholder="https://myportfolio.dev"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-3">
                <button
                  id="analyze-profile-btn"
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleAnalyzeProfile}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isAnalyzing
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-950/60 hover:shadow-blue-900/50"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Analyzing Profile with Multi-Provider AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results & AI Enhancements (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {!analysisResult && !isAnalyzing && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[440px]">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
                <Linkedin className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Ready to Enhance Your Profile</h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                Enter your own information, projects, skills, and experience, then choose <span className="text-blue-300 font-medium">"Analyze Profile"</span> to receive a personalized review. Blank fields are left blank; AstraMind does not insert a fictional profile.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[440px]">
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center" />
                <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Analyzing Candidate Profile</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Evaluating headline resonance, quantifying project bullet points, auditing keyword density, and tailoring recommendations for <span className="text-blue-300 font-medium">{selectedGoal}</span>...
              </p>
            </div>
          )}

          {analysisResult && !isAnalyzing && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Overall Score & Sub-scores Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border font-bold ${getScoreColor(
                        analysisResult.overallScore
                      )}`}
                    >
                      <span className="text-2xl leading-none">{analysisResult.overallScore}</span>
                      <span className="text-[10px] font-normal opacity-80">/100</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Overall Profile Score</h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getScoreColor(
                            analysisResult.overallScore
                          )}`}
                        >
                          {getScoreLabel(analysisResult.overallScore)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Targeted for: <span className="text-blue-300 font-medium">{profile.careerGoal || selectedGoal}</span>
                      </p>
                    </div>
                  </div>

                  {/* Re-analyze quick trigger */}
                  <button
                    type="button"
                    onClick={handleAnalyzeProfile}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-Analyze</span>
                  </button>
                </div>

                {/* 8 Sub-scores Grid */}
                <div className="mt-4">
                  <span className="text-[11px] font-medium text-slate-400 block mb-2.5">
                    Section Breakdown & Diagnostics:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(analysisResult.subScores).map(([key, val]) => (
                      <div
                        key={key}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between"
                      >
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                          {key}
                        </span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className={`text-sm font-bold ${getScoreColor(val).split(" ")[0]}`}>{val}</span>
                          <span className="text-[9px] text-slate-600">/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Feedback & Actionable Improvement */}
                {analysisResult.sectionFeedback && analysisResult.sectionFeedback.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/70">
                    <span className="text-[11px] font-medium text-slate-400 block mb-2">
                      Diagnosed Weak Points & High-Impact Fixes:
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {analysisResult.sectionFeedback.map((fb, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-300">{fb.section}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getScoreColor(fb.score)}`}>
                              Score: {fb.score}/100
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]"><strong className="text-slate-300">Issue:</strong> {fb.issue}</p>
                          <p className="text-emerald-400 text-[11px]"><strong className="text-emerald-300">Action:</strong> {fb.improvement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Info Warnings */}
                {analysisResult.missingInfoWarnings && analysisResult.missingInfoWarnings.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/70">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <span>Recommended Additions for More Impact:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px] pl-1">
                        {analysisResult.missingInfoWarnings.map((warn, wIdx) => (
                          <li key={wIdx}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs for Enhancements */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
                {[
                  { id: "overview", label: "Action Plan", icon: Target },
                  { id: "headline", label: "Headline (3-5)", icon: Award },
                  { id: "about", label: "About Section", icon: BookOpen },
                  { id: "projects", label: "Projects", icon: FolderKanban },
                  { id: "skills", label: "Skills Taxonomy", icon: Code2 },
                  { id: "keywords", label: "Keywords", icon: Search },
                  { id: "experience", label: "Experience", icon: Briefcase },
                  { id: "education", label: "Education", icon: Layers },
                  { id: "achievements", label: "Achievements", icon: Award },
                  { id: "checklist", label: "Checklist (13)", icon: CheckCircle2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeEnhancementTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-enhancer-${tab.id}`}
                      type="button"
                      onClick={() => setActiveEnhancementTab(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-950/40 border border-blue-400/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: Action Plan & Top 5 Improvements */}
              {activeEnhancementTab === "overview" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span>Profile Improvement Plan: Top 5 Things to Improve First</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Prioritized highest-impact steps for immediate profile visibility
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {analysisResult.top5Improvements.map((imp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">{imp}</p>
                      </div>
                    ))}
                  </div>

                  {/* Summary of what to check next */}
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveEnhancementTab("headline")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Headline Options</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEnhancementTab("about")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Enhanced About</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEnhancementTab("checklist")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View LinkedIn Checklist</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: Headline Enhancer */}
              {activeEnhancementTab === "headline" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-400" />
                        <span>LinkedIn Headline Options</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Generated based on your real background — no fake skills or unearned roles
                      </p>
                    </div>
                    <button
                      id="regen-headline-btn"
                      type="button"
                      disabled={regeneratingSection === "headlines"}
                      onClick={() => handleRegenerateSection("headlines")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${regeneratingSection === "headlines" ? "animate-spin text-blue-400" : ""}`}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {analysisResult.headlines.map((hl, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between gap-3 hover:border-slate-700 transition-all group"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                            #{idx + 1}
                          </span>
                          <p className="text-xs sm:text-sm text-slate-100 font-medium leading-snug">{hl}</p>
                        </div>
                        <button
                          id={`copy-headline-${idx}`}
                          type="button"
                          onClick={() => handleCopy(hl, `hl-${idx}`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                        >
                          {copiedKey === `hl-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: About Section Enhancer */}
              {activeEnhancementTab === "about" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <span>About Section Enhancer</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Human-sounding, first-person, professional, and free of generic AI clichés
                      </p>
                    </div>
                    <button
                      id="regen-about-btn"
                      type="button"
                      disabled={regeneratingSection === "about"}
                      onClick={() => handleRegenerateSection("about")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${regeneratingSection === "about" ? "animate-spin text-blue-400" : ""}`}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                          Original About Section
                        </span>
                        <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {analysisResult.enhancedAbout?.original || profile.linkedinAbout || "(No prior about section provided)"}
                        </p>
                      </div>
                    </div>

                    {/* Enhanced */}
                    <div className="p-4 rounded-xl bg-blue-950/15 border border-blue-500/30 flex flex-col justify-between shadow-inner">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                            Enhanced LinkedIn Summary
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                            Ready to Paste
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                          {analysisResult.enhancedAbout?.enhanced}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-blue-500/20 flex justify-end">
                        <button
                          id="copy-enhanced-about-btn"
                          type="button"
                          onClick={() => handleCopy(analysisResult.enhancedAbout?.enhanced, "about-enhanced")}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          {copiedKey === "about-enhanced" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span className="font-semibold">Copied to Clipboard</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Enhanced About</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Project Enhancer */}
              {activeEnhancementTab === "projects" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-blue-400" />
                        <span>Project Enhancer</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Professional LinkedIn project descriptions without fabricated metrics
                      </p>
                    </div>
                    <button
                      id="regen-projects-btn"
                      type="button"
                      disabled={regeneratingSection === "projects"}
                      onClick={() => handleRegenerateSection("projects")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${regeneratingSection === "projects" ? "animate-spin text-blue-400" : ""}`}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {analysisResult.enhancedProjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No projects provided in profile input.</p>
                  ) : (
                    <div className="space-y-4">
                      {analysisResult.enhancedProjects.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h5 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{p.title || p.originalTitle}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-mono">
                                {p.technology}
                              </span>
                            </h5>
                            <button
                              id={`copy-project-${idx}`}
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `${p.title}\nTech: ${p.technology}\n\n• Problem: ${p.problem}\n• Solution: ${p.solution}\n• Impact & Learning: ${p.impact || p.learningOutcome}\n\n${p.fullDescription || ""}`,
                                  `proj-${idx}`
                                )
                              }
                              className="self-start sm:self-auto px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-all"
                            >
                              {copiedKey === `proj-${idx}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Writeup</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80">
                              <span className="font-semibold text-slate-300 block mb-1">Problem Statement</span>
                              <p className="text-slate-400">{p.problem || "Not specified"}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80">
                              <span className="font-semibold text-slate-300 block mb-1">Technical Solution</span>
                              <p className="text-slate-400">{p.solution || "Not specified"}</p>
                            </div>
                          </div>

                          {p.keyFeatures && p.keyFeatures.length > 0 && (
                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                                Key Engineering Highlights:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-300 pl-1">
                                {p.keyFeatures.map((kf, kfIdx) => (
                                  <li key={kfIdx}>{kf}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {p.fullDescription && (
                            <div className="p-3 rounded-lg bg-blue-950/15 border border-blue-500/20 text-xs text-slate-200 leading-relaxed">
                              <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">
                                LinkedIn-Ready Project Summary:
                              </span>
                              <p>{p.fullDescription}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Skills Enhancer */}
              {activeEnhancementTab === "skills" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
                  <div className="pb-3 border-b border-slate-800/80">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span>Skills Taxonomy & Career Roadmap</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Your skills categorized cleanly, with recommended skills to learn separated explicitly.
                    </p>
                  </div>

                  {/* Your Skills (Categorized) */}
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Your Verified Skills (Categorized)</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(analysisResult.skillsAnalysis.yourSkills).map(([cat, skillsList]) => {
                        if (!skillsList || skillsList.length === 0) return null;
                        return (
                          <div
                            key={cat}
                            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
                          >
                            <span className="text-[11px] font-semibold text-slate-300 capitalize">{cat}</span>
                            <div className="flex flex-wrap gap-1">
                              {skillsList.map((sk, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommended Skills To Learn */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5" />
                      <span>Recommended Skills to Learn for {selectedGoal}</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mb-3">
                      High-demand competencies to add to your study roadmap. Not falsely claimed on your profile.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisResult.skillsAnalysis.recommendedSkillsToLearn.map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3 rounded-xl bg-slate-950/70 border border-blue-500/20 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-300">{rec.skill}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {rec.category}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">{rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Keyword Optimizer */}
              {activeEnhancementTab === "keywords" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-800/80">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-400" />
                      <span>LinkedIn Search & Recruiter Keyword Optimizer</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tailored to help recruiter searches discover your profile for {selectedGoal}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Existing Keywords */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Existing Relevant Keywords Found:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.keywords.existing.map((kw, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                        High-Impact Missing Keywords:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.keywords.missing.map((kw, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Placement Advice */}
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-slate-300 block mb-2">
                      Where & How to Integrate Missing Keywords:
                    </span>
                    <div className="space-y-2">
                      {analysisResult.keywords.placementAdvice.map((adv, aIdx) => (
                        <div
                          key={aIdx}
                          className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                              {adv.keyword}
                            </span>
                            <span className="text-[11px] text-blue-400 font-medium">
                              Place in: {adv.whereToUse}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 italic">{adv.tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: Experience Enhancer */}
              {activeEnhancementTab === "experience" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        <span>Experience Enhancer</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Professional action-oriented bullets. No fabricated roles or artificial numbers.
                      </p>
                    </div>
                    <button
                      id="regen-experience-btn"
                      type="button"
                      disabled={regeneratingSection === "experience"}
                      onClick={() => handleRegenerateSection("experience")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${regeneratingSection === "experience" ? "animate-spin text-blue-400" : ""}`}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  {analysisResult.enhancedExperience.hasExperience ? (
                    <div className="space-y-4">
                      {analysisResult.enhancedExperience.items.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-bold text-white">{exp.role}</h5>
                              <span className="text-xs text-blue-400 font-medium">{exp.company}</span>
                            </div>
                            <button
                              id={`copy-exp-${idx}`}
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `${exp.role} at ${exp.company}\n\n${exp.bulletPoints.map((b) => `• ${b}`).join("\n")}`,
                                  `exp-${idx}`
                                )
                              }
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-all"
                            >
                              {copiedKey === `exp-${idx}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Bullets</span>
                                </>
                              )}
                            </button>
                          </div>
                          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 pl-1 leading-relaxed">
                            {exp.bulletPoints.map((bp, bpIdx) => (
                              <li key={bpIdx}>{bp}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                        <Info className="w-4 h-4" />
                        <span>No Prior Internship / Work Experience Provided</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Rather than fabricating work history, top tech recruiters value concrete proof of initiative. Here are high-impact substitute activities tailored for your profile:
                      </p>
                      <div className="space-y-2 pt-1">
                        {analysisResult.enhancedExperience.suggestionsForNoExperience?.map((sug, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                          >
                            <span className="text-blue-400 font-bold">•</span>
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: Education Enhancer */}
              {activeEnhancementTab === "education" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span>Education Section Enhancer</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Clean, professional LinkedIn formatting without inventing CGPA, ranks, or coursework
                      </p>
                    </div>
                    <button
                      id="regen-education-btn"
                      type="button"
                      disabled={regeneratingSection === "education"}
                      onClick={() => handleRegenerateSection("education")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${regeneratingSection === "education" ? "animate-spin text-blue-400" : ""}`}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                      Optimized LinkedIn Education Entry:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {analysisResult.enhancedEducation?.enhanced || "No education details provided"}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        id="copy-education-btn"
                        type="button"
                        onClick={() =>
                          handleCopy(analysisResult.enhancedEducation?.enhanced || "", "education-enhanced")
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        {copiedKey === "education-enhanced" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Education</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: Achievement Enhancer */}
              {activeEnhancementTab === "achievements" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-400" />
                        <span>Achievement & Hackathon Enhancer</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Sharpened technical achievements written for maximum recruiter retention
                      </p>
                    </div>
                    <button
                      id="regen-achievements-btn"
                      type="button"
                      disabled={regeneratingSection === "achievements"}
                      onClick={() => handleRegenerateSection("achievements")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${regeneratingSection === "achievements" ? "animate-spin text-blue-400" : ""}`}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                      Enhanced Accomplishment Bullets:
                    </span>
                    {analysisResult.enhancedAchievements?.enhancedList?.length > 0 ? (
                      <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-200 pl-1 leading-relaxed">
                        {analysisResult.enhancedAchievements.enhancedList.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No achievements or hackathons provided in form.</p>
                    )}

                    {analysisResult.enhancedAchievements?.enhancedList?.length > 0 && (
                      <div className="pt-2 flex justify-end">
                        <button
                          id="copy-achievements-btn"
                          type="button"
                          onClick={() =>
                            handleCopy(
                              analysisResult.enhancedAchievements.enhancedList.map((a) => `• ${a}`).join("\n"),
                              "achievements-enhanced"
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          {copiedKey === "achievements-enhanced" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy All Achievements</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 10: Checklist */}
              {activeEnhancementTab === "checklist" && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-800/80">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>13-Point LinkedIn Profile Checklist</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Audited against your provided profile information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {analysisResult.checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                          item.completed
                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-950/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold ${item.completed ? "text-slate-200" : "text-slate-300"}`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
