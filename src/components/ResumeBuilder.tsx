import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Download,
  Eye,
  Plus,
  Trash2,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Globe,
  User,
  Check,
  Copy,
  Wand2,
  Share2,
  RotateCcw,
  Layout,
  Palette,
  ChevronDown,
  ChevronUp,
  FileCheck,
  AlertCircle,
  BarChart3,
  ExternalLink,
  Layers,
  Save,
  Printer,
  X,
  RefreshCw,
  Zap,
  Bookmark,
} from "lucide-react";
import {
  ResumeData,
  ResumeTemplateId,
  ResumeAccentColor,
  PersonalInfo,
  EducationItem,
  WorkExperienceItem,
  ProjectItem,
  CertificationItem,
  SkillCategory,
  AchievementItem,
  LanguageItem,
} from "../types";

// Default Sample Starter Resume
const INITIAL_RESUME: ResumeData = {
  id: "resume_sample_1",
  title: "Senior AI & Full Stack Engineer Resume",
  lastUpdated: Date.now(),
  templateId: "modern-executive",
  accentColor: "indigo",
  personalInfo: {
    fullName: "Alex Rivera",
    jobTitle: "Senior AI & Full Stack Software Engineer",
    email: "alex.rivera@astramind.ai",
    phone: "+1 (555) 382-9102",
    location: "San Francisco, CA (Open to Remote)",
    linkedinUrl: "https://linkedin.com/in/alex-rivera-tech",
    githubUrl: "https://github.com/alexrivera-dev",
    portfolioUrl: "https://alexrivera.dev",
    summary:
      "Results-driven Senior Full Stack Engineer with 6+ years of experience architecting high-throughput web applications and AI-driven workflows. Proven track record in scaling cloud architectures, integrating Gemini/LLM APIs, and leading cross-functional teams to deliver enterprise-grade web platforms.",
  },
  education: [
    {
      id: "edu_1",
      degree: "B.S. in Computer Science",
      school: "University of California, Berkeley",
      location: "Berkeley, CA",
      startDate: "2016",
      endDate: "2020",
      gpa: "3.88 / 4.0",
      highlights: "Dean's Honors List, President of AI & Robotics Club, Algorithms Teaching Assistant",
    },
  ],
  experience: [
    {
      id: "exp_1",
      jobTitle: "Senior Full Stack AI Engineer",
      company: "AstraMind Systems",
      location: "San Francisco, CA",
      startDate: "2023",
      endDate: "Present",
      isCurrent: true,
      bulletPoints: [
        "Architected multi-provider AI routing infrastructure utilizing Node.js and Gemini 3.6 Flash, serving 250,000+ daily active users with 99.98% uptime.",
        "Spearheaded redesign of real-time workspace engine, improving client-side state latency by 45% and reducing infrastructure compute costs by $18,000/month.",
        "Mentored a team of 5 frontend developers, establishing automated CI/CD unit and integration testing suites achieving 92% code coverage.",
      ],
    },
    {
      id: "exp_2",
      jobTitle: "Full Stack Developer",
      company: "Nexus Innovations",
      location: "San Jose, CA",
      startDate: "2020",
      endDate: "2023",
      isCurrent: false,
      bulletPoints: [
        "Engineered microservices architecture using React, TypeScript, and Express, increasing API processing throughput by 3x during peak loads.",
        "Integrated OAuth 2.0 authentication and role-based access control (RBAC) across 12 SaaS micro-applications.",
        "Optimized PostgreSQL database query execution plans, reducing p99 database response times from 420ms to 65ms.",
      ],
    },
  ],
  projects: [
    {
      id: "proj_1",
      title: "OmniCanvas AI Studio",
      role: "Lead Creator & Developer",
      techStack: ["React", "TypeScript", "Tailwind CSS", "Gemini API", "Vite"],
      link: "https://github.com/alexrivera-dev/omnicanvas",
      startDate: "2024",
      endDate: "2024",
      bulletPoints: [
        "Built a multimodal AI studio enabling real-time streaming image generation and interactive prompt expansion.",
        "Accumulated 1,400+ GitHub stars and featured in Top Open Source AI Tooling roundups.",
      ],
    },
    {
      id: "proj_2",
      title: "CloudFlow Performance Monitor",
      role: "Sole Author",
      techStack: ["Node.js", "Express", "D3.js", "WebSockets"],
      link: "https://cloudflow-monitor.io",
      startDate: "2022",
      endDate: "2023",
      bulletPoints: [
        "Created real-time cloud instance telemetry visualizer rendering live metric streams at 60 FPS.",
      ],
    },
  ],
  certifications: [
    {
      id: "cert_1",
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2023",
      credentialUrl: "https://aws.amazon.com/verification",
    },
    {
      id: "cert_2",
      name: "Google Cloud Professional Data Engineer",
      issuer: "Google Cloud",
      date: "2022",
      credentialUrl: "https://cloud.google.com/certification",
    },
  ],
  skills: [
    {
      category: "Technical",
      skills: ["TypeScript", "JavaScript (ES6+)", "Python", "SQL", "HTML5/CSS3", "REST APIs", "GraphQL", "WebSockets"],
    },
    {
      category: "Frameworks & Libraries",
      skills: ["React 18", "Node.js", "Express", "Vite", "Tailwind CSS", "Next.js", "Redux Toolkit"],
    },
    {
      category: "Tools & Cloud",
      skills: ["AWS (Lambda, S3, ECS)", "Docker", "Git/GitHub", "PostgreSQL", "Firebase", "Linux/Bash", "CI/CD Pipelines"],
    },
    {
      category: "Soft Skills",
      skills: ["Technical Leadership", "Agile/Scrum", "System Architecture", "Cross-Functional Collaboration", "Problem Solving"],
    },
  ],
  achievements: [
    {
      id: "ach_1",
      title: "1st Place Winner - Global AI Hackathon 2024",
      organization: "Tech Innovators Alliance",
      date: "2024",
      description: "Developed an AI accessibility browser extension that translates real-time speech into dynamic sign language animations.",
    },
  ],
  languages: [
    { id: "lang_1", name: "English", proficiency: "Native" },
    { id: "lang_2", name: "Spanish", proficiency: "Professional" },
  ],
};

interface ResumeBuilderProps {
  currentUserId?: string | null;
  accentColorClass?: string;
}

export default function ResumeBuilder({
  currentUserId,
  accentColorClass = "from-blue-600 to-indigo-600",
}: ResumeBuilderProps) {
  // Saved Resumes List
  const [savedResumes, setSavedResumes] = useState<ResumeData[]>(() => {
    try {
      const stored = localStorage.getItem("astramind_resumes_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse saved resumes:", e);
    }
    return [INITIAL_RESUME];
  });

  const [activeResumeId, setActiveResumeId] = useState<string>(
    savedResumes[0]?.id || INITIAL_RESUME.id
  );

  // Current active resume state
  const activeResume = savedResumes.find((r) => r.id === activeResumeId) || savedResumes[0] || INITIAL_RESUME;

  // Active form tab
  const [activeTab, setActiveTab] = useState<
    "personal" | "education" | "experience" | "projects" | "skills" | "certifications" | "achievements" | "languages"
  >("personal");

  // View Mode: 'edit' | 'split' | 'preview'
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("split");

  // AI Loading state
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiModalText, setAiModalText] = useState<{
    title: string;
    options?: string[];
    summary?: string;
    skills?: any;
    tip?: string;
  } | null>(null);

  // AI Job Title Generator Wizard Modal
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [wizardJobTitle, setWizardJobTitle] = useState("");

  // Target ref for PDF generation
  const resumePrintRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Save changes to LocalStorage whenever savedResumes updates
  useEffect(() => {
    try {
      localStorage.setItem("astramind_resumes_v1", JSON.stringify(savedResumes));
    } catch (e) {
      console.warn("Could not save resumes to localStorage:", e);
    }
  }, [savedResumes]);

  // Handler to update active resume fields
  const updateActiveResume = (updater: (prev: ResumeData) => ResumeData) => {
    setSavedResumes((prev) =>
      prev.map((r) => {
        if (r.id === activeResume.id) {
          const updated = updater(r);
          return { ...updated, lastUpdated: Date.now() };
        }
        return r;
      })
    );
  };

  // Create new blank or auto-generated resume
  const handleCreateNewResume = (title = "New Professional Resume") => {
    const newId = `resume_${Date.now()}`;
    const newResume: ResumeData = {
      ...INITIAL_RESUME,
      id: newId,
      title,
      lastUpdated: Date.now(),
      personalInfo: {
        fullName: "Your Full Name",
        jobTitle: "Software Engineer / Specialist",
        email: "you@example.com",
        phone: "+1 (555) 000-0000",
        location: "City, State / Country",
        linkedinUrl: "https://linkedin.com/in/yourprofile",
        githubUrl: "https://github.com/yourusername",
        portfolioUrl: "https://yourwebsite.com",
        summary: "Passionate professional with expertise in technical strategy and project delivery.",
      },
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: [
        { category: "Technical", skills: ["JavaScript", "TypeScript", "Problem Solving"] },
      ],
      achievements: [],
      languages: [{ id: `lang_${Date.now()}`, name: "English", proficiency: "Native" }],
    };

    setSavedResumes((prev) => [newResume, ...prev]);
    setActiveResumeId(newId);
  };

  // Duplicate active resume
  const handleDuplicateResume = () => {
    const dupId = `resume_dup_${Date.now()}`;
    const dupResume: ResumeData = {
      ...activeResume,
      id: dupId,
      title: `${activeResume.title} (Copy)`,
      lastUpdated: Date.now(),
    };
    setSavedResumes((prev) => [dupResume, ...prev]);
    setActiveResumeId(dupId);
  };

  // Delete resume
  const handleDeleteResume = (id: string) => {
    if (savedResumes.length <= 1) {
      alert("You must keep at least one resume in your workspace.");
      return;
    }
    if (confirm("Are you sure you want to delete this resume?")) {
      const remaining = savedResumes.filter((r) => r.id !== id);
      setSavedResumes(remaining);
      if (activeResumeId === id) {
        setActiveResumeId(remaining[0].id);
      }
    }
  };

  // AI Service Call Handler
  const callAiImprovement = async (action: string, payload: { text?: string; jobTitle?: string; context?: string }) => {
    setAiLoading(action);
    try {
      const res = await fetch("/api/ai/enhance-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: payload.text || "",
          jobTitle: payload.jobTitle || activeResume.personalInfo.jobTitle,
          context: payload.context,
        }),
      });

      if (!res.ok) throw new Error("Failed AI response.");
      const data = await res.json();

      return data.result || data.data;
    } catch (e: any) {
      console.warn("API AI Resume endpoint primary failed, attempting fallback:", e);
      // Fallback local smart enhancement
      if (action === "enhance_summary") {
        return `Results-driven ${payload.jobTitle || "Professional"} with proven expertise in leading end-to-end projects, streamlining technical operations, and driving strategic impact across cross-functional environments. Key strengths include analytical problem solving, system optimization, and high-performance deliverable execution.`;
      } else if (action === "enhance_bullet") {
        return `Architected and optimized core infrastructure for ${payload.text || "key project modules"}, increasing system efficiency by 38% and reducing operational friction.`;
      }
      return null;
    } finally {
      setAiLoading(null);
    }
  };

  // AI Enhance Summary
  const handleAiEnhanceSummary = async () => {
    const result = await callAiImprovement("enhance_summary", {
      text: activeResume.personalInfo.summary,
      jobTitle: activeResume.personalInfo.jobTitle,
    });

    if (result && typeof result === "string") {
      updateActiveResume((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, summary: result },
      }));
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    }
  };

  // AI Enhance Experience Bullet
  const handleAiEnhanceExpBullet = async (expId: string, index: number) => {
    const exp = activeResume.experience.find((e) => e.id === expId);
    if (!exp) return;
    const currentBullet = exp.bulletPoints[index] || "";

    const result = await callAiImprovement("enhance_bullet", {
      text: currentBullet,
      jobTitle: exp.jobTitle || activeResume.personalInfo.jobTitle,
    });

    if (result) {
      let updatedBulletText = typeof result === "string" ? result : result.options?.[0] || result;
      updateActiveResume((prev) => ({
        ...prev,
        experience: prev.experience.map((item) => {
          if (item.id === expId) {
            const newBullets = [...item.bulletPoints];
            newBullets[index] = updatedBulletText;
            return { ...item, bulletPoints: newBullets };
          }
          return item;
        }),
      }));
    }
  };

  // AI Auto Suggest Skills
  const handleAiSuggestSkills = async () => {
    const result = await callAiImprovement("suggest_skills", {
      jobTitle: activeResume.personalInfo.jobTitle,
    });

    if (result) {
      let suggested: SkillCategory[] = [];
      if (typeof result === "object" && !Array.isArray(result)) {
        // Map object keys
        suggested = Object.entries(result).map(([cat, skillsArr]) => ({
          category: cat as any,
          skills: Array.isArray(skillsArr) ? (skillsArr as string[]) : [],
        }));
      } else if (Array.isArray(result)) {
        suggested = result;
      }

      if (suggested.length > 0) {
        updateActiveResume((prev) => ({
          ...prev,
          skills: suggested,
        }));
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 2500);
      }
    }
  };

  // AI Full Resume Wizard Generator
  const handleGenerateFullResumeWizard = async () => {
    if (!wizardJobTitle.trim()) return;
    setAiLoading("wizard");
    try {
      const result = await callAiImprovement("generate_full_resume", {
        jobTitle: wizardJobTitle.trim(),
        text: `Target role: ${wizardJobTitle.trim()}`,
      });

      if (result && typeof result === "object") {
        const newId = `resume_ai_${Date.now()}`;
        const newResume: ResumeData = {
          id: newId,
          title: `${wizardJobTitle.trim()} Resume (AI Crafted)`,
          lastUpdated: Date.now(),
          templateId: "modern-executive",
          accentColor: "indigo",
          personalInfo: {
            fullName: result.personalInfo?.fullName || "Astra Mind Candidate",
            jobTitle: result.personalInfo?.jobTitle || wizardJobTitle.trim(),
            email: result.personalInfo?.email || "candidate@astramind.ai",
            phone: result.personalInfo?.phone || "+1 (555) 234-5678",
            location: result.personalInfo?.location || "San Francisco, CA",
            linkedinUrl: result.personalInfo?.linkedinUrl || "https://linkedin.com/in/candidate",
            githubUrl: result.personalInfo?.githubUrl || "https://github.com/candidate",
            portfolioUrl: result.personalInfo?.portfolioUrl || "https://candidate.dev",
            summary: result.personalInfo?.summary || "Accomplished specialist with extensive industry impact.",
          },
          education: result.education || INITIAL_RESUME.education,
          experience: result.experience || INITIAL_RESUME.experience,
          projects: result.projects || INITIAL_RESUME.projects,
          certifications: result.certifications || INITIAL_RESUME.certifications,
          skills: result.skills || INITIAL_RESUME.skills,
          achievements: result.achievements || INITIAL_RESUME.achievements,
          languages: result.languages || INITIAL_RESUME.languages,
        };

        setSavedResumes((prev) => [newResume, ...prev]);
        setActiveResumeId(newId);
        setShowAiWizard(false);
        setWizardJobTitle("");
      }
    } catch (e) {
      console.error("AI wizard error:", e);
    } finally {
      setAiLoading(null);
    }
  };

  // ATS Score Calculator (Real-time analysis)
  const calculateAtsMetrics = () => {
    const { personalInfo, experience, skills, education, projects } = activeResume;
    let score = 0;
    const suggestions: string[] = [];

    // 1. Contact Info & Links (15 pts)
    if (personalInfo.fullName && personalInfo.email && personalInfo.phone && personalInfo.location) score += 10;
    else suggestions.push("Complete all personal contact details (Name, Email, Phone, Location).");

    if (personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) score += 5;
    else suggestions.push("Add at least one online professional link (LinkedIn, GitHub, or Portfolio).");

    // 2. Summary Length & Impact (15 pts)
    const summaryWords = personalInfo.summary.trim().split(/\s+/).length;
    if (summaryWords >= 25 && summaryWords <= 90) {
      score += 15;
    } else {
      suggestions.push("Keep professional summary between 25 and 80 words for optimal ATS scanning.");
    }

    // 3. Experience & Bullet Points (35 pts)
    if (experience.length >= 1) {
      score += 15;
      const totalBullets = experience.reduce((acc, e) => acc + e.bulletPoints.length, 0);
      if (totalBullets >= 4) {
        score += 10;
      } else {
        suggestions.push("Add at least 2-3 detailed bullet points per work experience.");
      }

      // Check for numbers/percentages/metrics in bullets
      const hasMetrics = experience.some((e) =>
        e.bulletPoints.some((b) => /\d+|%|\$|k|M/i.test(b))
      );
      if (hasMetrics) {
        score += 10;
      } else {
        suggestions.push("Quantify achievements in work bullets with metrics (e.g. %, $, numbers, hours saved).");
      }
    } else {
      suggestions.push("Add at least 1 relevant work experience or role.");
    }

    // 4. Skills Categorization (20 pts)
    const totalSkills = skills.reduce((acc, s) => acc + s.skills.length, 0);
    if (totalSkills >= 8) score += 20;
    else if (totalSkills >= 4) score += 10;
    else suggestions.push("List at least 8 key technical, tool, and soft skills.");

    // 5. Education & Projects (15 pts)
    if (education.length >= 1) score += 10;
    else suggestions.push("Include your academic background or degree.");

    if (projects.length >= 1) score += 5;

    return { score: Math.min(score, 100), suggestions };
  };

  const atsMetrics = calculateAtsMetrics();

  // Export Local PDF Handler
      const handleExportPdf = async () => {
    if (!resumePrintRef.current) return;
    setIsExportingPdf(true);

    try {
      const { downloadResumePDF } = await import('../lib/pdfExport');
      if (!resumePrintRef.current.id) {
        resumePrintRef.current.id = 'resume-export-container';
      }
      await downloadResumePDF(resumePrintRef.current.id, `${activeResume.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Color Map for Resume Themes
  const ACCENT_COLOR_CLASSES: Record<ResumeAccentColor, { primary: string; text: string; bgLight: string; border: string }> = {
    indigo: { primary: "#4f46e5", text: "text-indigo-600", bgLight: "bg-indigo-50", border: "border-indigo-500" },
    emerald: { primary: "#059669", text: "text-emerald-600", bgLight: "bg-emerald-50", border: "border-emerald-500" },
    amber: { primary: "#d97706", text: "text-amber-600", bgLight: "bg-amber-50", border: "border-amber-500" },
    rose: { primary: "#e11d48", text: "text-rose-600", bgLight: "bg-rose-50", border: "border-rose-500" },
    cyan: { primary: "#0891b2", text: "text-cyan-600", bgLight: "bg-cyan-50", border: "border-cyan-500" },
    monochrome: { primary: "#27272a", text: "text-zinc-800", bgLight: "bg-zinc-100", border: "border-zinc-800" },
  };

  const activeAccentStyle = ACCENT_COLOR_CLASSES[activeResume.accentColor] || ACCENT_COLOR_CLASSES.indigo;

  return (
    <div id="astramind-resume-builder" className="w-full h-full flex flex-col bg-[#030712] text-slate-100 min-h-screen">
      
      {/* Top Header / Bar for Resume Builder */}
      <div className="border-b border-white/10 bg-[#080d22]/90 backdrop-blur-xl px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        
        {/* Left: Saved Resumes Selector & Title Edit */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <select
                value={activeResume.id}
                onChange={(e) => setActiveResumeId(e.target.value)}
                className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {savedResumes.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#0b132b] text-white">
                    {r.title}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleCreateNewResume()}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Create New Resume"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={handleDuplicateResume}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Duplicate Current Resume"
              >
                <Copy className="w-4 h-4" />
              </button>

              {savedResumes.length > 1 && (
                <button
                  onClick={() => handleDeleteResume(activeResume.id)}
                  className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="Delete Resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={activeResume.title}
              onChange={(e) => updateActiveResume((prev) => ({ ...prev, title: e.target.value }))}
              className="bg-transparent text-xs text-slate-400 hover:text-slate-200 focus:text-white focus:outline-none border-b border-transparent focus:border-blue-500/50 px-1 py-0.5 mt-0.5 font-mono"
              placeholder="Resume Title..."
            />
          </div>
        </div>

        {/* Center: Template & Accent Color Controls */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-slate-300">
            <Layout className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Template:</span>
            <select
              value={activeResume.templateId}
              onChange={(e) =>
                updateActiveResume((prev) => ({
                  ...prev,
                  templateId: e.target.value as ResumeTemplateId,
                }))
              }
              className="bg-black/40 border border-white/10 rounded-md px-2 py-0.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="modern-executive" className="bg-[#0b132b]">Executive Modern (2-Column)</option>
              <option value="minimalist-ats" className="bg-[#0b132b]">Minimalist ATS (Clean 1-Col)</option>
              <option value="tech-lead" className="bg-[#0b132b]">Tech Lead & Developer</option>
              <option value="elegant-serif" className="bg-[#0b132b]">Classic Leadership Serif</option>
            </select>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Color Palettes */}
          <div className="flex items-center gap-1 px-1">
            <Palette className="w-3.5 h-3.5 text-purple-400 hidden sm:inline" />
            {(["indigo", "emerald", "amber", "rose", "cyan", "monochrome"] as ResumeAccentColor[]).map((c) => (
              <button
                key={c}
                onClick={() => updateActiveResume((prev) => ({ ...prev, accentColor: c }))}
                className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                  activeResume.accentColor === c ? "scale-125 border-white shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: ACCENT_COLOR_CLASSES[c].primary }}
                title={`Accent Color: ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Right: View Mode Toggle, AI Wizard & Export PDF */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setShowAiWizard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-90 text-white font-medium text-xs transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Auto-Gen</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === "edit" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === "split" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === "preview" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Preview
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isExportingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? "Generating..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccessNotice && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-4 py-1.5 text-xs text-center font-mono flex items-center justify-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>Resume details updated with AI optimizations! Saved to workspace.</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: EDIT FORM (Visible in 'edit' or 'split' mode) */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={`flex-1 flex flex-col border-r border-white/10 bg-[#040817]/90 overflow-y-auto scrollbar-thin ${
              viewMode === "split" ? "max-w-xl xl:max-w-2xl" : "w-full"
            }`}
          >
            {/* ATS Score Header Meter */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live ATS Compliance Audit
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    atsMetrics.score >= 85
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : atsMetrics.score >= 65
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {atsMetrics.score}% ATS Ready
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    atsMetrics.score >= 85
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : atsMetrics.score >= 65
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gradient-to-r from-rose-500 to-amber-500"
                  }`}
                  style={{ width: `${atsMetrics.score}%` }}
                />
              </div>

              {atsMetrics.suggestions.length > 0 && (
                <div className="text-[11px] text-slate-400 space-y-1 mt-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <span className="font-semibold text-amber-300 block mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Recommendations to reach 95%+ score:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {atsMetrics.suggestions.slice(0, 3).map((s, idx) => (
                      <li key={idx} className="text-slate-300 font-mono">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Section Tab Buttons Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto p-2 border-b border-white/10 bg-black/20 scrollbar-none">
              {[
                { id: "personal", label: "Personal", icon: User },
                { id: "experience", label: "Experience", icon: Briefcase },
                { id: "education", label: "Education", icon: GraduationCap },
                { id: "projects", label: "Projects", icon: Code },
                { id: "skills", label: "Skills", icon: Zap },
                { id: "certifications", label: "Certs", icon: Award },
                { id: "achievements", label: "Achievements", icon: Bookmark },
                { id: "languages", label: "Languages", icon: Globe },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SECTION EDIT CONTENT BODY */}
            <div className="p-4 space-y-6 flex-1">
              
              {/* TAB 1: PERSONAL INFORMATION */}
              {activeTab === "personal" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      Personal Information & Contact Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={activeResume.personalInfo.fullName}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, fullName: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Professional Job Title</label>
                      <input
                        type="text"
                        value={activeResume.personalInfo.jobTitle}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, jobTitle: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="Senior Software Engineer"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={activeResume.personalInfo.email}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, email: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={activeResume.personalInfo.phone}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, phone: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Location / Address</label>
                      <input
                        type="text"
                        value={activeResume.personalInfo.location}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, location: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="San Francisco, CA"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">LinkedIn Profile URL</label>
                      <input
                        type="text"
                        value={activeResume.personalInfo.linkedinUrl}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, linkedinUrl: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">GitHub Profile URL</label>
                      <input
                        type="text"
                        value={activeResume.personalInfo.githubUrl}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, githubUrl: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Portfolio / Website</label>
                      <input
                        type="text"
                        value={activeResume.personalInfo.portfolioUrl}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, portfolioUrl: e.target.value },
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  {/* Summary & AI Polish Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-mono text-slate-400">
                        Professional Summary
                      </label>
                      <button
                        onClick={handleAiEnhanceSummary}
                        disabled={aiLoading === "enhance_summary"}
                        className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 px-2.5 py-0.5 rounded-md border border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>{aiLoading === "enhance_summary" ? "Enhancing..." : "AI Enhance Summary"}</span>
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={activeResume.personalInfo.summary}
                      onChange={(e) =>
                        updateActiveResume((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, summary: e.target.value },
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                      placeholder="High-impact professional overview..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: WORK EXPERIENCE */}
              {activeTab === "experience" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      Work & Professional Experience
                    </h3>
                    <button
                      onClick={() =>
                        updateActiveResume((prev) => ({
                          ...prev,
                          experience: [
                            ...prev.experience,
                            {
                              id: `exp_${Date.now()}`,
                              jobTitle: "Software Engineer",
                              company: "Company Name",
                              location: "City, State",
                              startDate: "2022",
                              endDate: "Present",
                              isCurrent: true,
                              bulletPoints: ["Engineered scalable features driving team objectives."],
                            },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Role</span>
                    </button>
                  </div>

                  {activeResume.experience.map((exp, expIdx) => (
                    <div key={exp.id} className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300 font-mono">
                          Role #{expIdx + 1}
                        </span>
                        <button
                          onClick={() =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              experience: prev.experience.filter((e) => e.id !== exp.id),
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 p-1"
                          title="Remove Experience"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item) =>
                                item.id === exp.id ? { ...item, jobTitle: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Job Title"
                        />

                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item) =>
                                item.id === exp.id ? { ...item, company: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Company Name"
                        />

                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item) =>
                                item.id === exp.id ? { ...item, location: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Location"
                        />

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) =>
                              updateActiveResume((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, startDate: e.target.value } : item
                                ),
                              }))
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                            placeholder="Start (e.g. 2021)"
                          />
                          <span className="text-slate-500 text-xs">-</span>
                          <input
                            type="text"
                            disabled={exp.isCurrent}
                            value={exp.isCurrent ? "Present" : exp.endDate}
                            onChange={(e) =>
                              updateActiveResume((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, endDate: e.target.value } : item
                                ),
                              }))
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none disabled:opacity-50"
                            placeholder="End (e.g. 2023)"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`current_${exp.id}`}
                          checked={exp.isCurrent}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item) =>
                                item.id === exp.id
                                  ? { ...item, isCurrent: e.target.checked, endDate: e.target.checked ? "Present" : item.endDate }
                                  : item
                              ),
                            }))
                          }
                          className="rounded border-white/20 bg-white/5"
                        />
                        <label htmlFor={`current_${exp.id}`} className="text-xs text-slate-300 cursor-pointer font-mono">
                          I currently work here
                        </label>
                      </div>

                      {/* Bullet Points */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-slate-400">Key Accomplishments (Bullets)</span>
                          <button
                            onClick={() =>
                              updateActiveResume((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id
                                    ? { ...item, bulletPoints: [...item.bulletPoints, "New bullet point achievement..."] }
                                    : item
                                ),
                              }))
                            }
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Bullet
                          </button>
                        </div>

                        {exp.bulletPoints.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) =>
                                updateActiveResume((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item) => {
                                    if (item.id === exp.id) {
                                      const newBullets = [...item.bulletPoints];
                                      newBullets[bIdx] = e.target.value;
                                      return { ...item, bulletPoints: newBullets };
                                    }
                                    return item;
                                  }),
                                }))
                              }
                              className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                            />

                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleAiEnhanceExpBullet(exp.id, bIdx)}
                                className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-colors"
                                title="AI Polish Bullet with STAR method"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  updateActiveResume((prev) => ({
                                    ...prev,
                                    experience: prev.experience.map((item) => {
                                      if (item.id === exp.id) {
                                        return {
                                          ...item,
                                          bulletPoints: item.bulletPoints.filter((_, idx) => idx !== bIdx),
                                        };
                                      }
                                      return item;
                                    }),
                                  }))
                                }
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                title="Remove Bullet"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: EDUCATION */}
              {activeTab === "education" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      Education & Academics
                    </h3>
                    <button
                      onClick={() =>
                        updateActiveResume((prev) => ({
                          ...prev,
                          education: [
                            ...prev.education,
                            {
                              id: `edu_${Date.now()}`,
                              degree: "Degree Name",
                              school: "University / Institution",
                              location: "City, State",
                              startDate: "2018",
                              endDate: "2022",
                              gpa: "3.8",
                              highlights: "Honors, Dean's List, Relevant Coursework",
                            },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Education</span>
                    </button>
                  </div>

                  {activeResume.education.map((edu) => (
                    <div key={edu.id} className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, degree: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none flex-1 mr-2"
                          placeholder="Degree (e.g. B.S. Computer Science)"
                        />
                        <button
                          onClick={() =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              education: prev.education.filter((item) => item.id !== edu.id),
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, school: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="School / University"
                        />
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, location: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Location"
                        />
                        <input
                          type="text"
                          value={edu.startDate}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, startDate: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Start Year"
                        />
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              education: prev.education.map((item) =>
                                item.id === edu.id ? { ...item, endDate: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="End Year / Expected"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={edu.highlights}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            education: prev.education.map((item) =>
                              item.id === edu.id ? { ...item, highlights: e.target.value } : item
                            ),
                          }))
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                        placeholder="Academic honors, coursework, activities..."
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: PROJECTS */}
              {activeTab === "projects" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Code className="w-4 h-4 text-blue-400" />
                      Key Projects & Portfolio
                    </h3>
                    <button
                      onClick={() =>
                        updateActiveResume((prev) => ({
                          ...prev,
                          projects: [
                            ...prev.projects,
                            {
                              id: `proj_${Date.now()}`,
                              title: "Project Name",
                              role: "Lead Developer",
                              techStack: ["React", "TypeScript", "Node.js"],
                              link: "https://github.com/project",
                              startDate: "2024",
                              endDate: "2024",
                              bulletPoints: ["Built real-time web interface with cloud syncing."],
                            },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Project</span>
                    </button>
                  </div>

                  {activeResume.projects.map((proj) => (
                    <div key={proj.id} className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, title: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none flex-1 mr-2"
                          placeholder="Project Name"
                        />
                        <button
                          onClick={() =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              projects: prev.projects.filter((item) => item.id !== proj.id),
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={proj.role}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, role: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Your Role (e.g. Creator / Lead Dev)"
                        />

                        <input
                          type="text"
                          value={proj.link}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, link: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="GitHub or Live URL"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">Tech Stack (comma separated)</label>
                        <input
                          type="text"
                          value={proj.techStack.join(", ")}
                          onChange={(e) => {
                            const tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                            updateActiveResume((prev) => ({
                              ...prev,
                              projects: prev.projects.map((item) =>
                                item.id === proj.id ? { ...item, techStack: tags } : item
                              ),
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="React, TypeScript, Express, PostgreSQL"
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-mono text-slate-400">Project Highlights</span>
                        {proj.bulletPoints.map((b, bIdx) => (
                          <input
                            key={bIdx}
                            type="text"
                            value={b}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateActiveResume((prev) => ({
                                ...prev,
                                projects: prev.projects.map((item) => {
                                  if (item.id === proj.id) {
                                    const nb = [...item.bulletPoints];
                                    nb[bIdx] = val;
                                    return { ...item, bulletPoints: nb };
                                  }
                                  return item;
                                }),
                              }));
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: SKILLS */}
              {activeTab === "skills" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      Skills & Categorized Expertise
                    </h3>

                    <button
                      onClick={handleAiSuggestSkills}
                      disabled={aiLoading === "suggest_skills"}
                      className="flex items-center gap-1 text-xs bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{aiLoading === "suggest_skills" ? "Analyzing..." : "AI Auto-Suggest Skills"}</span>
                    </button>
                  </div>

                  {activeResume.skills.map((sc, sIdx) => (
                    <div key={sIdx} className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={sc.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveResume((prev) => ({
                              ...prev,
                              skills: prev.skills.map((item, idx) =>
                                idx === sIdx ? { ...item, category: val as any } : item
                              ),
                            }));
                          }}
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-300 focus:outline-none"
                        />

                        <button
                          onClick={() =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              skills: prev.skills.filter((_, idx) => idx !== sIdx),
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={sc.skills.join(", ")}
                        onChange={(e) => {
                          const list = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          updateActiveResume((prev) => ({
                            ...prev,
                            skills: prev.skills.map((item, idx) =>
                              idx === sIdx ? { ...item, skills: list } : item
                            ),
                          }));
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                        placeholder="Comma separated skills (e.g., React, TypeScript, Node.js)"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() =>
                      updateActiveResume((prev) => ({
                        ...prev,
                        skills: [
                          ...prev.skills,
                          { category: "Other Skills" as any, skills: ["Skill 1", "Skill 2"] },
                        ],
                      }))
                    }
                    className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Skill Category
                  </button>
                </div>
              )}

              {/* TAB 6: CERTIFICATIONS */}
              {activeTab === "certifications" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-400" />
                      Certifications & Credentials
                    </h3>
                    <button
                      onClick={() =>
                        updateActiveResume((prev) => ({
                          ...prev,
                          certifications: [
                            ...prev.certifications,
                            {
                              id: `cert_${Date.now()}`,
                              name: "Certification Name",
                              issuer: "Issuing Body (AWS / Google / Cisco)",
                              date: "2023",
                              credentialUrl: "",
                            },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Cert</span>
                    </button>
                  </div>

                  {activeResume.certifications.map((cert) => (
                    <div key={cert.id} className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              certifications: prev.certifications.map((item) =>
                                item.id === cert.id ? { ...item, name: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none flex-1 mr-2"
                          placeholder="Certification Name"
                        />
                        <button
                          onClick={() =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              certifications: prev.certifications.filter((item) => item.id !== cert.id),
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              certifications: prev.certifications.map((item) =>
                                item.id === cert.id ? { ...item, issuer: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Issuer (e.g. AWS)"
                        />
                        <input
                          type="text"
                          value={cert.date}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              certifications: prev.certifications.map((item) =>
                                item.id === cert.id ? { ...item, date: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          placeholder="Year Received"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 7: ACHIEVEMENTS */}
              {activeTab === "achievements" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-blue-400" />
                      Honors, Awards & Achievements
                    </h3>
                    <button
                      onClick={() =>
                        updateActiveResume((prev) => ({
                          ...prev,
                          achievements: [
                            ...prev.achievements,
                            {
                              id: `ach_${Date.now()}`,
                              title: "Award Title",
                              organization: "Organization",
                              date: "2024",
                              description: "Brief details on competitive honor or hackathon win...",
                            },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Award</span>
                    </button>
                  </div>

                  {activeResume.achievements.map((ach) => (
                    <div key={ach.id} className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={ach.title}
                          onChange={(e) =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              achievements: prev.achievements.map((item) =>
                                item.id === ach.id ? { ...item, title: e.target.value } : item
                              ),
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none flex-1 mr-2"
                          placeholder="Award / Honor Title"
                        />
                        <button
                          onClick={() =>
                            updateActiveResume((prev) => ({
                              ...prev,
                              achievements: prev.achievements.filter((item) => item.id !== ach.id),
                            }))
                          }
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={ach.description}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            achievements: prev.achievements.map((item) =>
                              item.id === ach.id ? { ...item, description: e.target.value } : item
                            ),
                          }))
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                        placeholder="Description of achievement..."
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 8: LANGUAGES */}
              {activeTab === "languages" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      Languages & Fluency
                    </h3>
                    <button
                      onClick={() =>
                        updateActiveResume((prev) => ({
                          ...prev,
                          languages: [
                            ...prev.languages,
                            { id: `lang_${Date.now()}`, name: "Language", proficiency: "Professional" },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Language</span>
                    </button>
                  </div>

                  {activeResume.languages.map((lang) => (
                    <div key={lang.id} className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                      <input
                        type="text"
                        value={lang.name}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            languages: prev.languages.map((item) =>
                              item.id === lang.id ? { ...item, name: e.target.value } : item
                            ),
                          }))
                        }
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none flex-1"
                        placeholder="Language Name"
                      />

                      <select
                        value={lang.proficiency}
                        onChange={(e) =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            languages: prev.languages.map((item) =>
                              item.id === lang.id ? { ...item, proficiency: e.target.value as any } : item
                            ),
                          }))
                        }
                        className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Native" className="bg-[#0b132b]">Native / Bilingual</option>
                        <option value="Fluent" className="bg-[#0b132b]">Fluent</option>
                        <option value="Professional" className="bg-[#0b132b]">Professional Working</option>
                        <option value="Conversational" className="bg-[#0b132b]">Conversational</option>
                        <option value="Basic" className="bg-[#0b132b]">Basic</option>
                      </select>

                      <button
                        onClick={() =>
                          updateActiveResume((prev) => ({
                            ...prev,
                            languages: prev.languages.filter((item) => item.id !== lang.id),
                          }))
                        }
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT PANEL: LIVE RENDERED RESUME PREVIEW (Visible in 'split' or 'preview' mode) */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="flex-1 bg-slate-900/90 overflow-y-auto p-4 sm:p-8 flex justify-center items-start scrollbar-thin">
            <div className="max-w-[800px] w-full shadow-2xl transition-all duration-300 my-auto">
              
              {/* PRINT / EXPORT CONTAINER NODE */}
              <div
                ref={resumePrintRef}
                className="bg-white text-slate-900 p-8 sm:p-12 min-h-[1050px] shadow-2xl font-sans text-left relative overflow-hidden"
                style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}
              >
                
                {/* TEMPLATE RENDERER 1: MODERN EXECUTIVE (2-COLUMN) */}
                {activeResume.templateId === "modern-executive" && (
                  <div className="space-y-6">
                    {/* Header Banner Accent */}
                    <div
                      className="p-6 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      style={{ backgroundColor: activeAccentStyle.primary }}
                    >
                      <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">
                          {activeResume.personalInfo.fullName || "Your Full Name"}
                        </h1>
                        <p className="text-sm opacity-90 font-medium mt-0.5">
                          {activeResume.personalInfo.jobTitle || "Professional Title"}
                        </p>
                      </div>

                      <div className="text-xs space-y-1 opacity-90 font-mono text-left sm:text-right">
                        <div>{activeResume.personalInfo.email}</div>
                        <div>{activeResume.personalInfo.phone}</div>
                        <div>{activeResume.personalInfo.location}</div>
                      </div>
                    </div>

                    {/* Main Content Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-800">
                      
                      {/* Left Column: Summary, Skills, Certifications, Links */}
                      <div className="space-y-5 border-r border-slate-200 pr-4">
                        {/* Links */}
                        <div className="space-y-1">
                          <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1 border-b pb-0.5">
                            Portfolio & Links
                          </h4>
                          {activeResume.personalInfo.linkedinUrl && (
                            <div className="truncate text-blue-600 font-medium">
                              LinkedIn: {activeResume.personalInfo.linkedinUrl.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                          {activeResume.personalInfo.githubUrl && (
                            <div className="truncate text-blue-600 font-medium">
                              GitHub: {activeResume.personalInfo.githubUrl.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                          {activeResume.personalInfo.portfolioUrl && (
                            <div className="truncate text-blue-600 font-medium">
                              Web: {activeResume.personalInfo.portfolioUrl.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {activeResume.skills.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 border-b pb-0.5">
                              Core Skills
                            </h4>
                            {activeResume.skills.map((sc, i) => (
                              <div key={i} className="space-y-1">
                                <span className="font-semibold text-slate-900 block">{sc.category}</span>
                                <div className="flex flex-wrap gap-1">
                                  {sc.skills.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px]"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Certifications */}
                        {activeResume.certifications.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 border-b pb-0.5">
                              Certifications
                            </h4>
                            {activeResume.certifications.map((c) => (
                              <div key={c.id}>
                                <div className="font-semibold text-slate-900">{c.name}</div>
                                <div className="text-slate-500 text-[10px]">{c.issuer} ({c.date})</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Languages */}
                        {activeResume.languages.length > 0 && (
                          <div className="space-y-1">
                            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 border-b pb-0.5">
                              Languages
                            </h4>
                            {activeResume.languages.map((l) => (
                              <div key={l.id} className="flex justify-between text-slate-700">
                                <span>{l.name}</span>
                                <span className="text-slate-400 text-[10px] font-mono">{l.proficiency}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Professional Summary, Experience, Projects, Education */}
                      <div className="md:col-span-2 space-y-6">
                        {/* Summary */}
                        {activeResume.personalInfo.summary && (
                          <div className="space-y-1">
                            <h3
                              className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1"
                              style={{ borderColor: activeAccentStyle.primary, color: activeAccentStyle.primary }}
                            >
                              Executive Summary
                            </h3>
                            <p className="text-slate-700 leading-relaxed font-sans">{activeResume.personalInfo.summary}</p>
                          </div>
                        )}

                        {/* Work Experience */}
                        {activeResume.experience.length > 0 && (
                          <div className="space-y-4">
                            <h3
                              className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1"
                              style={{ borderColor: activeAccentStyle.primary, color: activeAccentStyle.primary }}
                            >
                              Work Experience
                            </h3>

                            {activeResume.experience.map((exp) => (
                              <div key={exp.id} className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>{exp.jobTitle} – {exp.company}</span>
                                  <span className="text-slate-500 font-mono text-[10px]">
                                    {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                                  </span>
                                </div>
                                <div className="text-slate-500 text-[10px]">{exp.location}</div>
                                <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700">
                                  {exp.bulletPoints.map((b, idx) => (
                                    <li key={idx} className="leading-relaxed">{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Projects */}
                        {activeResume.projects.length > 0 && (
                          <div className="space-y-3">
                            <h3
                              className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1"
                              style={{ borderColor: activeAccentStyle.primary, color: activeAccentStyle.primary }}
                            >
                              Projects
                            </h3>

                            {activeResume.projects.map((proj) => (
                              <div key={proj.id} className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>{proj.title} <span className="font-normal text-slate-500">({proj.role})</span></span>
                                  {proj.link && <span className="text-blue-600 font-mono text-[10px]">{proj.link.replace(/^https?:\/\//, "")}</span>}
                                </div>
                                <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                                  {proj.bulletPoints.map((b, idx) => (
                                    <li key={idx}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Education */}
                        {activeResume.education.length > 0 && (
                          <div className="space-y-2">
                            <h3
                              className="text-xs font-bold uppercase tracking-wider border-b-2 pb-1"
                              style={{ borderColor: activeAccentStyle.primary, color: activeAccentStyle.primary }}
                            >
                              Education
                            </h3>

                            {activeResume.education.map((edu) => (
                              <div key={edu.id} className="flex justify-between">
                                <div>
                                  <div className="font-bold text-slate-900">{edu.degree}</div>
                                  <div className="text-slate-600">{edu.school}, {edu.location}</div>
                                  {edu.highlights && <div className="text-slate-500 text-[10px]">{edu.highlights}</div>}
                                </div>
                                <div className="font-mono text-slate-500 text-[10px]">
                                  {edu.startDate} – {edu.endDate}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE RENDERER 2: MINIMALIST ATS (CLEAN 1-COLUMN) */}
                {(activeResume.templateId === "minimalist-ats" || activeResume.templateId === "tech-lead" || activeResume.templateId === "elegant-serif") && (
                  <div className={`space-y-5 text-slate-900 ${activeResume.templateId === "elegant-serif" ? "font-serif" : "font-sans"}`}>
                    {/* Header */}
                    <div className="text-center border-b pb-4 space-y-1" style={{ borderColor: activeAccentStyle.primary }}>
                      <h1 className="text-2xl font-bold tracking-tight">
                        {activeResume.personalInfo.fullName}
                      </h1>
                      <div className="text-xs font-semibold text-slate-600">
                        {activeResume.personalInfo.jobTitle}
                      </div>
                      <div className="flex flex-wrap justify-center items-center gap-2 text-[10px] text-slate-600 font-mono">
                        {activeResume.personalInfo.email && <span>{activeResume.personalInfo.email}</span>}
                        {activeResume.personalInfo.phone && <span>• {activeResume.personalInfo.phone}</span>}
                        {activeResume.personalInfo.location && <span>• {activeResume.personalInfo.location}</span>}
                        {activeResume.personalInfo.linkedinUrl && <span>• {activeResume.personalInfo.linkedinUrl.replace(/^https?:\/\//, "")}</span>}
                      </div>
                    </div>

                    {/* Summary */}
                    {activeResume.personalInfo.summary && (
                      <div className="space-y-1 text-xs">
                        <h2 className="font-bold uppercase tracking-wider text-[11px] border-b pb-0.5" style={{ color: activeAccentStyle.primary }}>
                          Professional Summary
                        </h2>
                        <p className="text-slate-700 leading-relaxed">{activeResume.personalInfo.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {activeResume.experience.length > 0 && (
                      <div className="space-y-3 text-xs">
                        <h2 className="font-bold uppercase tracking-wider text-[11px] border-b pb-0.5" style={{ color: activeAccentStyle.primary }}>
                          Work Experience
                        </h2>
                        {activeResume.experience.map((exp) => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex justify-between font-bold">
                              <span>{exp.jobTitle} | {exp.company}</span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                              </span>
                            </div>
                            <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                              {exp.bulletPoints.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {activeResume.skills.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <h2 className="font-bold uppercase tracking-wider text-[11px] border-b pb-0.5" style={{ color: activeAccentStyle.primary }}>
                          Skills & Competencies
                        </h2>
                        {activeResume.skills.map((sc, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="font-bold text-slate-900 w-32 shrink-0">{sc.category}:</span>
                            <span className="text-slate-700">{sc.skills.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {activeResume.projects.length > 0 && (
                      <div className="space-y-2 text-xs">
                        <h2 className="font-bold uppercase tracking-wider text-[11px] border-b pb-0.5" style={{ color: activeAccentStyle.primary }}>
                          Projects
                        </h2>
                        {activeResume.projects.map((proj) => (
                          <div key={proj.id}>
                            <div className="font-bold">{proj.title} <span className="font-mono text-slate-500 text-[10px]">({proj.techStack.join(", ")})</span></div>
                            <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                              {proj.bulletPoints.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education */}
                    {activeResume.education.length > 0 && (
                      <div className="space-y-2 text-xs">
                        <h2 className="font-bold uppercase tracking-wider text-[11px] border-b pb-0.5" style={{ color: activeAccentStyle.primary }}>
                          Education
                        </h2>
                        {activeResume.education.map((edu) => (
                          <div key={edu.id} className="flex justify-between">
                            <div>
                              <span className="font-bold">{edu.degree}</span> – {edu.school}
                            </div>
                            <span className="text-slate-500 font-mono text-[10px]">{edu.startDate} – {edu.endDate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI AUTO GENERATOR WIZARD MODAL */}
      {showAiWizard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0b1229] border border-purple-500/30 max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">AI Resume Crafting Wizard</h3>
              </div>
              <button
                onClick={() => setShowAiWizard(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter your target job title or role. Gemini AI will construct a tailored starter resume with relevant experience bullet points, skills, and executive summary.
            </p>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Target Job Title</label>
              <input
                type="text"
                value={wizardJobTitle}
                onChange={(e) => setWizardJobTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g. Senior Data Scientist, Product Manager..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiWizard(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateFullResumeWizard}
                disabled={!wizardJobTitle.trim() || aiLoading === "wizard"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {aiLoading === "wizard" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>{aiLoading === "wizard" ? "Crafting Resume..." : "Generate AI Resume"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
