import { 
  ResumeData, 
  ResumeTemplateId, 
  ResumeAccentColor 
} from "../types";

export const SAMPLE_RESUME: ResumeData = {
  id: "sample-resume-1",
  title: "Senior Full-Stack Engineer Resume",
  lastUpdated: Date.now(),
  templateId: "modern-executive",
  accentColor: "indigo",
  sectionTitles: {
    summary: "PROFESSIONAL SUMMARY",
    experience: "WORK EXPERIENCE",
    projects: "PROJECTS",
    skills: "SKILLS & COMPETENCIES",
    education: "EDUCATION",
    certifications: "CERTIFICATIONS",
    achievements: "HONORS & ACHIEVEMENTS",
    languages: "LANGUAGES",
  },
  personalInfo: {
    fullName: "Alex V. Mercer",
    jobTitle: "Senior Full-Stack AI Engineer",
    email: "alex.mercer@astramind.ai",
    phone: "+1 (555) 234-8900",
    location: "San Francisco, CA",
    linkedinUrl: "linkedin.com/in/alex-mercer",
    githubUrl: "github.com/alexmercer-ai",
    portfolioUrl: "alexmercer.dev",
    summary: "High-impact Senior Full-Stack AI Engineer with 6+ years of experience architecting multi-modal web platforms, scalable distributed backend microservices, and real-time AI agents. Proven track record of boosting user engagement by 45% and reducing system latency by 300ms through modern caching and async streaming architectures."
  },
  education: [
    {
      id: "edu-1",
      degree: "B.S. in Computer Science & Artificial Intelligence",
      school: "Stanford University",
      location: "Stanford, CA",
      startDate: "2016",
      endDate: "2020",
      gpa: "3.92 / 4.0",
      highlights: "Dean's Honor List, Specialization in Deep Learning & Distributed Systems, ACM Programming Team Lead"
    }
  ],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Lead Full-Stack AI Engineer",
      company: "AstraMind Neural Systems",
      location: "San Francisco, CA",
      startDate: "2023",
      endDate: "Present",
      isCurrent: true,
      bulletPoints: [
        "Architected an ultra-low-latency web streaming gateway for Gemini 2.5 and Llama models, serving 120,000+ active monthly users with 99.98% uptime.",
        "Engineered real-time canvas visualizers and image-processing routers using React, TypeScript, and Tailwind CSS, reducing client render times by 40%.",
        "Pioneered automated fallback execution chains across multi-vendor AI providers, guaranteeing zero downtime during upstream service outages."
      ]
    },
    {
      id: "exp-2",
      jobTitle: "Senior Software Engineer",
      company: "Nexus Cloud Labs",
      location: "Palo Alto, CA",
      startDate: "2020",
      endDate: "2023",
      isCurrent: false,
      bulletPoints: [
        "Led a squad of 5 engineers in rebuilding core microservices using Express, Node.js, and PostgreSQL, increasing query performance by 3.5x.",
        "Implemented OAuth 2.0 and SAML SSO authentication flows for enterprise clients, passing SOC2 Type II compliance with zero critical findings.",
        "Created an internal component library adopted across 12 product teams, standardizing accessibility (WCAG AA) and design tokens."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "AstraMind AI Studio & Workspace",
      role: "Creator & Lead Developer",
      techStack: ["React 18", "TypeScript", "Tailwind CSS", "Gemini API", "Express"],
      link: "github.com/alexmercer-ai/astramind-studio",
      startDate: "2024",
      endDate: "2025",
      bulletPoints: [
        "Built a multi-modal AI studio suite with interactive image generation, real-time voice modal interface, and document intelligence.",
        "Integrated client-side state caching with Supabase backend synchronization, enabling seamless offline-first capability."
      ]
    },
    {
      id: "proj-2",
      title: "Distributed Task & Vector Stream Router",
      role: "Open Source Contributor",
      techStack: ["Node.js", "Redis", "Docker", "WebSockets"],
      link: "github.com/alexmercer-ai/vector-stream",
      startDate: "2023",
      endDate: "2024",
      bulletPoints: [
        "Developed a high-throughput WebSocket message router handling 50,000 concurrent events per second with sub-5ms latency."
      ]
    }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services",
      date: "2024",
      credentialUrl: "aws.amazon.com/verify/cert-109283"
    },
    {
      id: "cert-2",
      name: "Google Cloud Professional Machine Learning Engineer",
      issuer: "Google Cloud",
      date: "2023",
      credentialUrl: "credential.net/gcp-ml-883712"
    }
  ],
  skills: [
    {
      category: "Programming Languages" as any,
      skills: ["Python", "C++", "Java", "JavaScript (ES6+)", "TypeScript", "SQL"]
    },
    {
      category: "Web Technologies" as any,
      skills: ["React 18", "Next.js", "Node.js", "Express", "Tailwind CSS", "RESTful APIs", "HTML5/CSS3"]
    },
    {
      category: "AI & ML" as any,
      skills: ["Gemini API", "PyTorch", "Scikit-Learn", "LangChain", "OpenCV", "Prompt Engineering"]
    },
    {
      category: "Tools" as any,
      skills: ["Git & GitHub", "Docker", "PostgreSQL", "VS Code", "Postman", "Linux/Unix", "AWS / GCP"]
    }
  ],
  achievements: [
    {
      id: "ach-1",
      title: "1st Place Winner – Global AI Hackathon",
      organization: "Stanford AI Lab & TechCrunch",
      date: "2024",
      description: "Awarded top honor among 400+ teams for building an autonomous accessibility assistant powered by multimodal AI."
    }
  ],
  languages: [
    { id: "lang-1", name: "English", proficiency: "Native" },
    { id: "lang-2", name: "Spanish", proficiency: "Professional" }
  ]
};

const RESUMES_STORAGE_KEY = "astramind_user_resumes";

export function loadAllResumes(): ResumeData[] {
  try {
    const raw = localStorage.getItem(RESUMES_STORAGE_KEY);
    if (!raw) {
      // Save default sample resume
      const defaults = [SAMPLE_RESUME];
      localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [SAMPLE_RESUME];
  } catch (e) {
    console.error("Error loading saved resumes:", e);
    return [SAMPLE_RESUME];
  }
}

export function saveResume(resume: ResumeData): void {
  try {
    const list = loadAllResumes();
    const updatedResume = { ...resume, lastUpdated: Date.now() };
    const index = list.findIndex((r) => r.id === resume.id);
    if (index >= 0) {
      list[index] = updatedResume;
    } else {
      list.unshift(updatedResume);
    }
    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error saving resume:", e);
  }
}

export function deleteResume(id: string): ResumeData[] {
  try {
    let list = loadAllResumes();
    list = list.filter((r) => r.id !== id);
    if (list.length === 0) {
      list = [{ ...SAMPLE_RESUME, id: "resume-" + Date.now(), title: "My Resume" }];
    }
    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error("Error deleting resume:", e);
    return [SAMPLE_RESUME];
  }
}

export function duplicateResume(id: string): ResumeData {
  const list = loadAllResumes();
  const source = list.find((r) => r.id === id) || SAMPLE_RESUME;
  const newResume: ResumeData = {
    ...JSON.parse(JSON.stringify(source)),
    id: "resume-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    title: `${source.title} (Copy)`,
    lastUpdated: Date.now(),
  };
  saveResume(newResume);
  return newResume;
}

export function createNewResume(title?: string, templateId?: ResumeTemplateId): ResumeData {
  const newResume: ResumeData = {
    id: "resume-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    title: title || "New Professional Resume",
    lastUpdated: Date.now(),
    templateId: templateId || "modern-executive",
    accentColor: "indigo",
    sectionTitles: {
      summary: "PROFESSIONAL SUMMARY",
      experience: "WORK EXPERIENCE",
      projects: "PROJECTS",
      skills: "SKILLS & COMPETENCIES",
      education: "EDUCATION",
      certifications: "CERTIFICATIONS",
      achievements: "HONORS & ACHIEVEMENTS",
      languages: "LANGUAGES",
    },
    personalInfo: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
      summary: "",
    },
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    skills: [
      { category: "Programming Languages" as any, skills: [] },
      { category: "Web Technologies" as any, skills: [] },
      { category: "AI & ML" as any, skills: [] },
      { category: "Tools" as any, skills: [] },
    ],
    achievements: [],
    languages: [],
  };
  saveResume(newResume);
  return newResume;
}

// Client API Helper for AI Enhancements
export async function callAIResumeImprove(payload: {
  action: "enhance_bullet" | "generate_summary" | "suggest_skills" | "fix_grammar" | "analyze_ats";
  text?: string;
  jobTitle?: string;
  context?: string;
  resumeData?: ResumeData;
}) {
  try {
    const res = await fetch("/api/ai-resume-improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error("Failed to get response from AI resume service.");
    }
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.warn("AI Resume service API call error:", err);
    throw err;
  }
}

