import { VitsBranch, AcademicYear, AcademicSemester } from "./academicQuiz";

export type AssessmentType =
  | "Class Assessment"
  | "Mid-Term Practice"
  | "Mid-Term Assessment"
  | "Semester Revision"
  | "Unit Test"
  | "Weekly Unit Test"
  | "Lab Viva / Internal Assessment"
  | "Placement Training"
  | "GATE / Placement Practice"
  | "Grand Test"
  | "Weekly Challenge";

export type QuestionType = "single_mcq" | "multiple_mcq" | "true_false" | "fill_blank" | "short_answer";

export type TimerType = "none" | "overall" | "per_question";

export type ExplanationPolicy = "after_each" | "after_quiz" | "never";

export interface AcademicQuestionDraft {
  id: string;
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  imageUrl?: string;
  options: string[]; // For single/multiple MCQ, 4 options; for true_false, ["True", "False"]; for fill_blank/short_answer, can be empty or blank templates
  correctAnswers: number[]; // Array of correct option indices (0-indexed) for MCQ/TF
  // Fill in the blank specific fields
  blanksExpected?: string[]; // Expected answers for blank(s)
  acceptedAlternatives?: string[]; // Alternative acceptable answers
  caseSensitive?: boolean; // Case sensitivity for fill in the blank
  trimWhitespace?: boolean; // Normalization of whitespace
  // Short answer specific fields
  shortAnswerGrading?: "auto" | "manual"; // Evaluation mode: automatic keyword matching or manual host review
  keywords?: string[]; // Key concepts/phrases required for auto grading
  sampleAnswer?: string; // Model answer / reference
  explanation?: string;
  marks: number;
  negativeMarks: number;
  isComplete: boolean;
  validationError?: string;
}

export interface AcademicQuizDraft {
  id?: string;
  hostUserId?: string;
  hostName?: string;
  title: string;
  description?: string;
  college: string;
  regulation: string;
  /** Program/degree selected by the host (e.g. B.Tech, B.Sc., MBA, school). */
  programType?: string;
  /** Official college website used to locate a syllabus. */
  officialWebsiteUrl?: string;
  /** Direct official source link of the imported syllabus. */
  syllabusSourceUrl?: string;
  /** Extracted text from the selected official syllabus, used to ground AI questions. */
  sourceMaterialText?: string;
  branch: VitsBranch | string;
  year: AcademicYear | string;
  semester: AcademicSemester | string;
  subject: string;
  unit: string;
  topic?: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed";
  assessmentType: AssessmentType;
  questionCount: number;
  totalMarks: number;
  timerType: TimerType;
  durationSeconds?: number;
  durationMinutes?: number;
  timePerQuestion?: number;
  marksPerCorrect: number;
  negativeMarks: number;
  questionOrder: "fixed" | "randomized";
  explanationPolicy: ExplanationPolicy;
  status: "draft" | "ready" | "published" | "active" | "ended";
  roomCode?: string;
  questions: AcademicQuestionDraft[];
  createdAt?: number;
  updatedAt?: number;
}

export interface LiveQuizSummaryItem {
  id: string;
  title: string;
  subject: string;
  branch: string;
  year: string;
  semester: string;
  unit?: string;
  questionCount: number;
  totalMarks: number;
  roomCode?: string;
  status: string;
  createdAt: number;
  participantsCount?: number;
}

export interface ParticipantHistoryItem {
  id: string;
  roomId: string;
  roomCode: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  rank?: number;
  totalParticipants?: number;
  joinedAt: number;
  completedAt?: number;
}

export interface LiveQuizChatMessage {
  id: string;
  quiz_id?: string;
  room_code: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
  isHost?: boolean;
}

export interface EvaluatedQuestionResult {
  questionId: string;
  questionIndex: number;
  studentId: string;
  studentName?: string;
  selectedOptionId?: string;
  selectedAnswer?: any;
  selectedOption: string;
  correctOptionId: string;
  correctOption: string;
  isAnswered: boolean;
  isCorrect: boolean;
  marks: number;
  marksAwarded: number;
  status: "Correct" | "Wrong" | "Not Answered";
  answeredAt?: number;
  timeTakenMs?: number;
  explanation?: string;
}
