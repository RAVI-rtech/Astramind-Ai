export type VitsBranch =
  | "Computer Science and Engineering (CSE)"
  | "CSE (Artificial Intelligence & Machine Learning)"
  | "CSE (Data Science)"
  | "Information Technology"
  | "Artificial Intelligence & Machine Learning (AI&ML)"
  | "Artificial Intelligence & Data Science (AI&DS)"
  | "Electronics and Communication Engineering (ECE)"
  | "Electronics and Instrumentation Engineering (EIE)"
  | "Electrical and Electronics Engineering (EEE)"
  | "Mechanical Engineering (ME)"
  | "Civil Engineering (CE)";

export type AcademicYear = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
export type AcademicSemester = "Semester I" | "Semester II";
export type QuizDifficulty = "Easy" | "Medium" | "Hard" | "Mixed";

export interface AcademicQuizQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
}

export interface AcademicQuizConfig {
  college: string;
  branch: VitsBranch;
  year: AcademicYear;
  semester: AcademicSemester;
  subject: string;
  difficulty: QuizDifficulty;
  numQuestions: number;
  weakAreas?: string[];
}

export interface AcademicQuizSubmission {
  questionId: number;
  selectedOption: "A" | "B" | "C" | "D";
  isCorrect: boolean;
}

export interface AcademicQuizResult {
  totalQuestions: number;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  timeSpentSeconds: number;
  weakAreas: string[];
  reviewedQuestions: Array<{
    question: AcademicQuizQuestion;
    selectedOption: "A" | "B" | "C" | "D" | null;
    isCorrect: boolean;
  }>;
}
