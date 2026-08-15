export interface Attachment {
  name: string;
  type: string; // e.g. "image/png", "application/pdf", "text/plain", etc.
  url: string;
  base64?: string; // base64 encoded payload for API
  content?: string; // raw text content for txt/md/docx/xlsx previews
  size?: number; // size in bytes
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title?: string; placeAnswerSources?: { reviewSnippets?: any[] } };
}

export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
  attachment?: Attachment;
  isStreaming?: boolean;
  generatedImage?: string; // URL of generated image
  generatedVideo?: { uri?: string, operationName?: string, status?: string }; // Video info
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

export type Theme = "dark" | "light" | "system" | "deep_space" | "obsidian" | "midnight_glass";
export type AccentColor = "blue" | "purple" | "cyan" | "emerald" | "amber" | "rose";

export interface UserSessionDevice {
  id: string;
  deviceName: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  age: string;
  className: string;
  bio: string;
  avatarUrl?: string;
  memberSince?: string;
  plan?: string;
  currentPlan?: string;
  defaultMode?: string;
  language?: string;
  responseLength?: "concise" | "balanced" | "detailed";
  autoMode?: boolean;
}

export interface Settings {
  theme: Theme;
  accentColor: AccentColor;
  animationsEnabled: boolean;
  language: string;
  defaultMode: string;
  responseLength: "concise" | "balanced" | "detailed";
  voiceSpeed: number;
  voicePitch: number;
  autoVoiceOutput: boolean;
}

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  summary: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  highlights: string;
}

export interface WorkExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bulletPoints: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  role: string;
  techStack: string[];
  link: string;
  startDate: string;
  endDate: string;
  bulletPoints: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

export interface SkillCategory {
  category: "Technical" | "Frameworks & Libraries" | "Tools & Cloud" | "Soft Skills" | "Other";
  skills: string[];
}

export interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  date: string;
  description: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: "Native" | "Fluent" | "Professional" | "Conversational" | "Basic";
}

export type ResumeTemplateId = "regular-ats" | "modern-executive" | "minimalist-ats" | "tech-lead" | "elegant-serif";

export type ResumeAccentColor = "indigo" | "emerald" | "amber" | "rose" | "cyan" | "monochrome";

export interface SectionTitles {
  summary?: string;
  experience?: string;
  projects?: string;
  skills?: string;
  education?: string;
  certifications?: string;
  achievements?: string;
  languages?: string;
}

export interface ResumeData {
  id: string;
  title: string;
  lastUpdated: number;
  templateId: ResumeTemplateId;
  accentColor: ResumeAccentColor;
  sectionTitles?: SectionTitles;
  personalInfo: PersonalInfo;
  education: EducationItem[];
  experience: WorkExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  skills: SkillCategory[];
  achievements: AchievementItem[];
  languages: LanguageItem[];
  isExtended?: boolean;
}



