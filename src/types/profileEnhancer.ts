export type CareerGoal =
  | "Software Developer"
  | "AI/ML Engineer"
  | "Data Scientist"
  | "Data Analyst"
  | "Full Stack Developer"
  | "Frontend Developer"
  | "Backend Developer"
  | "Cybersecurity"
  | "Cloud / DevOps"
  | "Student"
  | "Internship"
  | "Placement / Job"
  | "Startup / Entrepreneurship"
  | "Other";

export interface ProjectInput {
  id: string;
  title: string;
  tech: string;
  description: string;
}

export interface ExperienceInput {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProfileEnhancerInput {
  fullName: string;
  currentRole: string; // e.g. "3rd Year B.Tech CSE Student"
  branchDegree: string; // e.g. "B.Tech in Computer Science & Engineering"
  collegeUniversity: string;
  careerGoal: string;
  customGoal?: string;
  linkedinHeadline: string;
  linkedinAbout: string;
  skills: string; // comma separated or raw
  projects: ProjectInput[];
  experience: ExperienceInput[]; // internships / work experience (optional)
  certifications: string;
  achievements: string;
  hackathons: string;
  education: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface SectionFeedbackItem {
  section: string;
  score: number;
  issue: string;
  improvement: string;
}

export interface EnhancedProjectItem {
  originalTitle: string;
  title: string;
  problem: string;
  solution: string;
  technology: string;
  keyFeatures: string[];
  impact: string;
  learningOutcome: string;
  fullDescription: string;
}

export interface SkillsCategorized {
  programming: string[];
  aiMl: string[];
  webDev: string[];
  database: string[];
  cloud: string[];
  tools: string[];
  softSkills: string[];
  other: string[];
}

export interface RecommendedSkill {
  skill: string;
  category: string;
  reason: string;
}

export interface KeywordPlacementAdvice {
  keyword: string;
  whereToUse: string;
  tip: string;
}

export interface EnhancedExperienceItem {
  role: string;
  company: string;
  bulletPoints: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  note: string;
}

export interface ProfileAnalysisResult {
  overallScore: number;
  subScores: {
    headline: number;
    about: number;
    skills: number;
    projects: number;
    experience: number;
    education: number;
    achievements: number;
    keywords: number;
  };
  sectionFeedback: SectionFeedbackItem[];
  headlines: string[];
  enhancedAbout: {
    original: string;
    enhanced: string;
  };
  enhancedProjects: EnhancedProjectItem[];
  skillsAnalysis: {
    yourSkills: SkillsCategorized;
    recommendedSkillsToLearn: RecommendedSkill[];
  };
  keywords: {
    existing: string[];
    missing: string[];
    placementAdvice: KeywordPlacementAdvice[];
  };
  enhancedExperience: {
    hasExperience: boolean;
    items: EnhancedExperienceItem[];
    suggestionsForNoExperience: string[];
  };
  enhancedEducation: {
    original: string;
    enhanced: string;
  };
  enhancedAchievements: {
    original: string;
    enhancedList: string[];
  };
  checklist: ChecklistItem[];
  top5Improvements: string[];
  missingInfoWarnings: string[];
}
