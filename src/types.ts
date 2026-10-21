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
  id?: string;
  user_id?: string;
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
  rollNumber?: string;
  roll_number?: string;
  branch?: string;
  section?: string;
  streak?: number;
  longestStreak?: number;
  lastActiveDate?: string;
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

// ==========================================
// ASTRAMIND STUDY WORKSPACE TYPES
// ==========================================

export type BTechYear = "1st" | "2nd" | "3rd" | "4th";
export type BTechSemester = "I" | "II";

export type LearningGoal =
  | "Understand concepts"
  | "Prepare for exam"
  | "Practice MCQs"
  | "Revise notes"
  | "Complete syllabus"
  | "Prepare for viva"
  | "Prepare for placement";

export interface StudyMaterial {
  id: string;
  name: string;
  type: string; // "pdf" | "ppt" | "notes" | "image" | "text"
  size?: string;
  url?: string;
  base64?: string;
  content?: string;
  uploadedAt: number;
  profile?: DocumentProfile;
}

export interface DocumentProfile {
  fileName: string;
  detectedDomain: string; // Real subject/domain e.g. "Operating Systems", "DBMS", "Physics", "Python", "Computer Networks" - never defaulted to Mathematics
  confidence: "High" | "Medium" | "Low";
  confidenceNote?: string;
  title?: string;
  topics: string[];
  estimatedSections: number;
  pages?: number;
  extractedTextLength?: number;
  summary?: string;
  hasFormulas?: boolean;
  hasCode?: boolean;
  hasTables?: boolean;
  keyTerminology?: string[];
  processingStatus: {
    contentExtracted: boolean;
    topicsIdentified: boolean;
    studyToolsReady: boolean;
  };
}

export type WorkspaceTab = 
  | "overview" 
  | "materials" 
  | "pdf-study"
  | "knowledge-base"
  | "ai-tutor"
  | "tutor"
  | "learn" 
  | "lessons"
  | "mcq" 
  | "flashcards" 
  | "mock-exam"
  | "exam"
  | "important-questions" 
  | "important"
  | "summary-notes"
  | "practice"
  | "progress";

export interface WorkspaceStats {
  lessonsCompleted: number;
  quizzesAttempted: number;
  quizAccuracy: number; // percentage 0 - 100
  flashcardsReviewed: number;
  materialsUploaded: number;
  topicsCompleted: number;
}

export interface StudyWorkspace {
  id: string;
  name: string;
  college: string;
  branch: string;
  year: BTechYear;
  semester: BTechSemester;
  subject: string;
  learningGoal: LearningGoal;
  materials: StudyMaterial[];
  detectedTopics: string[];
  createdAt: number;
  lastActive: number;
  progressPercent: number;
  stats: WorkspaceStats;
  recommendedNextAction?: string;
  documentProfile?: DocumentProfile;
  studyContext?: StudyContext;
}

// ==========================================
// VR25 KNOWLEDGE BASE & RAG HIERARCHY TYPES
// ==========================================

export type SourceMode = "vr25_knowledge_base" | "uploaded_material" | "manual";

export interface StudyContext {
  regulation: string; // "VR25"
  year: string;       // "1st Year", "2nd Year", etc.
  semester: string;   // "1st Semester", "2nd Semester"
  branch?: string;    // "CSE", "ECE", "EEE", etc.
  subject: string;    // e.g. "Programming for Problem Solving"
  subjectCode?: string;// e.g. "PPS"
  unit?: string;      // e.g. "Unit 1"
  topic?: string;     // e.g. "Pointers & Dynamic Memory"
  subtopic?: string;
  sourceType: "drive_material" | "uploaded_material" | "manual";
  sourceDocumentIds?: string[];
}

export interface KnowledgeDocument {
  id: string;
  driveFileId: string;
  documentName: string;
  sourceUrl: string;
  mimeType: string;
  regulation: string;
  year: string;
  semester: string;
  branch?: string;
  subject: string;
  subjectCode?: string;
  unit?: string;
  pageCount?: number;
  extractedLength?: number;
  chunkCount?: number;
  status: "indexed" | "failed" | "pending";
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  driveFileId: string;
  documentName: string;
  sourceUrl: string;
  regulation: string;
  year: string;
  semester: string;
  branch?: string;
  subject: string;
  subjectCode?: string;
  unit: string;
  topic: string;
  subtopic?: string;
  pageNumber: number;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  tokenCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeBaseStatus {
  totalDocuments: number;
  indexedDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  subjects: string[];
  units: Record<string, string[]>;
  topics: Record<string, string[]>;
  lastSync: number;
  ingestionJobs: Array<{
    id: string;
    status: "running" | "completed" | "failed";
    progress: number;
    startedAt: number;
    completedAt?: number;
    error?: string;
  }>;
}

export interface KnowledgeQueryResult {
  chunks: Array<{
    chunk: KnowledgeChunk;
    score: number;
    relevanceReason?: string;
  }>;
  detectedSubject: string;
  detectedUnit?: string;
  detectedTopic?: string;
  retrievalScope: string;
}

export interface LearningActivityRecord {
  id: string;
  workspaceId: string;
  userId?: string;
  regulation: string;
  year: string;
  semester: string;
  subject: string;
  unit?: string;
  topic?: string;
  activityType: 
    | "lesson_completed" 
    | "quiz_attempted" 
    | "flashcard_mastered" 
    | "mock_exam_completed" 
    | "question_asked" 
    | "practice_completed";
  sourceDoc?: string;
  pageNumber?: number;
  score?: number;
  accuracy?: number;
  timeSpentSeconds?: number;
  createdAt: number;
}

export interface GuidedLesson {
  id: string;
  workspaceId: string;
  topic: string;
  conceptTitle: string;
  conceptExplanation: string;
  example: string;
  checkQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  completed?: boolean;
  userAnsweredCorrectly?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic?: string;
  questionType?: "mcq" | "true_false" | "concept" | "definition" | "application" | "numerical" | "code";
}

export interface QuizResult {
  id: string;
  workspaceId: string;
  subject: string;
  timestamp: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  questions: QuizQuestion[];
  userAnswers: Record<number, number>; // questionIndex -> selectedOptionIndex
  missedTopics?: string[];
  recommendedReviewTopics?: Array<{ topic: string; reason: string }>;
}

export interface Flashcard {
  id: string;
  workspaceId: string;
  front: string; // Question / Term
  back: string; // Answer / Explanation
  topic?: string;
  status: "unreviewed" | "known" | "needs_revision";
  lastReviewed?: number;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export interface MockExam {
  id: string;
  workspaceId: string;
  subject: string;
  unitsOrTopics: string;
  difficulty: "Easy" | "Medium" | "Hard";
  durationMinutes: number;
  questions: QuizQuestion[];
  createdAt: number;
  completedAt?: number;
  score?: number;
  totalScore?: number;
  accuracy?: number;
  userAnswers?: Record<number, number>;
  markedForReview?: number[];
  weakTopics?: string[];
  reviewPlan?: Array<{ topic: string; suggestion: string }>;
}

export interface ImportantQuestion {
  id: string;
  workspaceId: string;
  unit: string;
  topic: string;
  question: string;
  difficulty: "Low" | "Medium" | "High";
  frequency: "Repeated" | "High Probability" | "Conceptual Must-Know";
  answerSummary: string;
}

export interface SummaryNotesData {
  title: string;
  domain: string;
  overview: string;
  unitSummaries: Array<{
    title: string;
    keyPoints: string[];
  }>;
  keyTerminologyAndFormulas: Array<{
    term: string;
    explanation: string;
    detailOrCode?: string;
  }>;
  examTakeaways: string[];
}

export interface PracticeExercise {
  id: string;
  title: string;
  topic: string;
  type: "code" | "problem" | "concept" | "scenario";
  difficulty: "Easy" | "Medium" | "Hard";
  problemStatement: string;
  hint?: string;
  solution: string;
  explanation: string;
}

// ==========================================
// LIVE QUIZ (REAL-TIME MULTIPLAYER) TYPES
// ==========================================

export interface LiveQuizQuestion {
  id: string;
  questionNumber?: number;
  questionType?: "single_mcq" | "multiple_mcq" | "true_false" | "fill_blank" | "short_answer";
  question: string;
  options: string[];
  correctIndex?: number;
  correctAnswers?: number[];
  blanksExpected?: string[];
  acceptedAlternatives?: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  shortAnswerGrading?: "auto" | "manual";
  keywords?: string[];
  sampleAnswer?: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  imageUrl?: string;
}

export interface LiveQuizParticipant {
  id: string;
  userId?: string;
  displayName: string;
  rollNumber?: string;
  branch?: string;
  section?: string;
  joinedAt?: number;
  score: number;
  correctCount: number;
  incorrectCount?: number;
  unansweredCount?: number;
  connectionStatus?: "Active" | "Disconnected" | "Submitted";
  status?: string;
  rank?: number;
  totalMarks?: number;
  percentage?: number;
  answeredCurrentQuestion?: boolean;
  hasAnswered?: boolean;
  selectedOptionIndex?: number;
  responseTimeMs?: number;
  streak?: number;
  accuracy?: number;
  answers?: Record<number, any>;
  completedAt?: number;
}

export interface LiveQuizRoom {
  id: string;
  quizId?: string;
  roomCode: string;
  title: string;
  college?: string;
  regulation?: string;
  subject: string;
  branch: string;
  year: string;
  semester: string;
  unit?: string;
  topic?: string;
  assessmentType?: string;
  durationMinutes?: number;
  hostUserId?: string;
  hostId?: string;
  hostName: string;
  timePerQuestion: number;
  timeRemaining?: number;
  timerType?: "per_question" | "total_assessment";
  durationSeconds?: number;
  marksPerCorrect?: number;
  negativeMarks?: number;
  totalMarks?: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed";
  mode: "Classic" | "Speed" | "Exam";
  status: "lobby" | "in_progress" | "paused" | "ended" | "removed";
  chatDisabled?: boolean;
  isRemoved?: boolean;
  removedParticipantIds?: string[];
  answerMonitor?: any;
  currentQuestionIndex: number;
  questionStartTime: number | null;
  quizStartTime?: number | null;
  totalQuestions: number;
  questions: LiveQuizQuestion[];
  participants: LiveQuizParticipant[] | Record<string, LiveQuizParticipant>;
  participantsCount?: number;
  leaderboard?: {
    id: string;
    userId?: string;
    displayName: string;
    score: number;
    correctCount: number;
    incorrectCount?: number;
    unansweredCount?: number;
    rank: number;
  }[];
  myParticipant?: LiveQuizParticipant | null;
  showLeaderboard: boolean;
  explanationPolicy?: "immediate" | "after_each" | "end_of_quiz" | "never";
  createdAt: number;
  endedAt?: number;
}

// ==========================================
// ASTRAMIND PDF STUDY SECTION TYPES
// ==========================================

export interface PDFStudyDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize?: string;
  pageCount: number;
  sourceType: "google_drive" | "uploaded" | "workspace";
  driveFileId?: string;
  driveFolder?: string;
  driveWebUrl?: string;
  subject?: string;
  unit?: string;
  uploadedAt: number;
  rawContent?: string;
  base64Data?: string;
  previewUrl?: string;
  topics?: string[];
}

export type PDFStudyAction = 
  | "chat"
  | "summarize"
  | "notes"
  | "flashcards"
  | "questions"
  | "explain-topic"
  | "important-topics"
  | "preview";

export interface PDFChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
  citations?: Array<{
    pageNumber?: number;
    chapter?: string;
    topic?: string;
    excerpt?: string;
  }>;
}

export interface PDFStudySummary {
  id: string;
  documentId: string;
  documentTitle: string;
  summaryType: "entire" | "chapter" | "selected-page" | "short" | "detailed";
  chapterOrScope?: string;
  keyConcepts: string[];
  importantDefinitions: Array<{ term: string; definition: string; page?: number }>;
  formulas: Array<{ formula: string; description: string; page?: number }>;
  examples: Array<{ title: string; explanation: string; page?: number }>;
  importantPoints: string[];
  examFocusedPoints: string[];
  overviewText?: string;
  createdAt: number;
}

export interface PDFStudyNote {
  id: string;
  documentId: string;
  documentTitle: string;
  topic: string;
  title: string;
  markdownContent: string;
  definitions: Array<{ term: string; meaning: string }>;
  formulas: Array<{ name: string; formula: string }>;
  examples: Array<{ concept: string; example: string }>;
  examTips: string[];
  createdAt: number;
}

export interface PDFFlashcardItem {
  id: string;
  front: string;
  back: string;
  topic?: string;
  pageNumber?: number;
  category?: "Definition" | "Formula" | "Law/Principle" | "Comparison" | "Core Concept" | "Exam Concept";
}

export interface PDFFlashcardDeck {
  id: string;
  documentId: string;
  documentTitle: string;
  title: string;
  scope: "entire" | "chapter" | "pages" | "topic";
  scopeDetail?: string;
  cardCount: number;
  cards: PDFFlashcardItem[];
  knownCardIds: string[];
  reviewCardIds: string[];
  createdAt: number;
  lastStudiedAt?: number;
}

export type PDFQuestionType = "mcq" | "short" | "long" | "fill-blanks" | "true-false" | "exam-style";

export interface PDFStudyQuestion {
  id: string;
  type: PDFQuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  pageReference?: number;
  marks?: number;
  difficulty?: "Easy" | "Medium" | "Hard" | "Exam Preparation";
  topic?: string;
}

export interface PDFQuestionSet {
  id: string;
  documentId: string;
  documentTitle: string;
  title: string;
  difficulty: string;
  questionTypes: PDFQuestionType[];
  questions: PDFStudyQuestion[];
  createdAt: number;
}

export interface PDFTopicExplanation {
  topic: string;
  documentTitle: string;
  analogy: string;
  coreDefinition: string;
  stepByStepBreakdown: string[];
  keyFormulas: string[];
  examTakeaways: string[];
  pageReference?: number;
}

export interface PDFImportantTopic {
  rank: number;
  topic: string;
  importance: "Critical" | "High" | "Medium";
  examFrequency: string;
  keyConcepts: string[];
  expectedMarks?: string;
  pageReference?: number;
  whyImportant: string;
}




