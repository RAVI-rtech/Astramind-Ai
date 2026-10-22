import { 
  ResumeData, 
  ResumeTemplateId, 
  ResumeAccentColor 
} from "../types";

const RESUMES_STORAGE_KEY = "astramind_user_resumes";

export function loadAllResumes(): ResumeData[] {
  try {
    const raw = localStorage.getItem(RESUMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const realResumes = parsed.filter((resume: ResumeData) =>
      resume &&
      resume.id !== "sample-resume-1" &&
      resume.id !== "resume_sample_1" &&
      resume.personalInfo?.fullName !== "Alex V. Mercer" &&
      resume.personalInfo?.fullName !== "Alex Rivera"
    );
    if (realResumes.length !== parsed.length) {
      localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(realResumes));
    }
    return realResumes;
  } catch (e) {
    console.error("Error loading saved resumes:", e);
    return [];
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
    const list = loadAllResumes().filter((resume) => resume.id !== id);
    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.error("Error deleting resume:", e);
    return loadAllResumes();
  }
}

export function duplicateResume(id: string): ResumeData {
  const list = loadAllResumes();
  const source = list.find((resume) => resume.id === id);
  if (!source) throw new Error("Resume not found. Create or select a resume before duplicating.");
  const newResume: ResumeData = {
    ...JSON.parse(JSON.stringify(source)),
    id: "resume-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    title: `${source.title} (Copy)`,
    lastUpdated: Date.now(),
  };
  saveResume(newResume);
  return newResume;
}

export function createNewResume(title?: string, templateId?: ResumeTemplateId, persist = true): ResumeData {
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
  if (persist) saveResume(newResume);
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

