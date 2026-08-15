export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  content: string; // Markdown / formatted explanation
  codeExample?: string;
  codeLanguage?: string;
  keyTakeaways?: string[];
  practiceProblem?: {
    title: string;
    description: string;
    starterCode: string;
    solutionCode: string;
    hints: string[];
  };
}

export interface RoadmapMilestone {
  title: string;
  description: string;
  topics: string[];
  isCompleted?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticeChallenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  starterCode: string;
  expectedOutput?: string;
  solutionHint: string;
}

export interface MiniProject {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  requirements: string[];
  starterTemplate?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  answer: string;
  keyConcepts: string[];
}

export interface CommonMistake {
  title: string;
  mistake: string;
  solution: string;
  whyItMatters: string;
}

export interface Course {
  id: string;
  title: string;
  category: "Programming" | "Computer Science" | "Artificial Intelligence" | "Web Development" | "Science & Math" | "Career" | "Study Assistant";
  subcategory: string;
  description: string;
  iconName: string;
  colorGradient: string;
  level: SkillLevel;
  estimatedHours: number;
  rating: number;
  studentsEnrolled: number;
  tags: string[];
  roadmaps: {
    beginner: RoadmapMilestone[];
    intermediate: RoadmapMilestone[];
    advanced: RoadmapMilestone[];
  };
  lessons: Lesson[];
  practiceChallenges: PracticeChallenge[];
  miniProjects: MiniProject[];
  quizzes: QuizQuestion[];
  interviewQuestions: InterviewQuestion[];
  commonMistakes: CommonMistake[];
  resources: { name: string; url: string; type: "Documentation" | "Book" | "Video" | "Tool" }[];
}

export interface UserProgress {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyGoalMinutes: number;
  minutesStudiedToday: number;
  completedLessons: Record<string, boolean>; // lessonId -> true
  completedQuizzes: Record<string, number>; // courseId -> score
  completedChallenges: Record<string, boolean>;
  bookmarks: string[]; // lessonId or courseId
  earnedBadges: { id: string; title: string; description: string; icon: string; date: string }[];
}

export interface NoteItem {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface PersonalProfile {
  skillLevel: SkillLevel;
  collegeYear: string;
  goals: string;
  weeklyHours: number;
  targetJob: string;
  generatedRoadmap?: {
    title: string;
    summary: string;
    weeks: { week: number; focus: string; tasks: string[] }[];
  };
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
}
