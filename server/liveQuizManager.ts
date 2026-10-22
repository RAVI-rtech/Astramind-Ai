import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { AcademicQuizDraft, AcademicQuestionDraft, AssessmentType, TimerType, ExplanationPolicy } from "../src/types/academicLiveQuiz";

export interface LiveQuizQuestion {
  id: string;
  questionNumber?: number;
  questionType?: "single_mcq" | "multiple_mcq" | "true_false" | "fill_blank" | "short_answer";
  question: string;
  options: string[]; // Options array (for MCQ/TF; can be empty for fill_blank/short_answer)
  correctIndex?: number; // For single MCQ backwards compatibility
  correctAnswers?: number[]; // Array of correct option indices
  blanksExpected?: string[]; // Expected answers for blank(s)
  acceptedAlternatives?: string[]; // Alternative acceptable answers
  caseSensitive?: boolean; // Case sensitivity for fill in the blank
  trimWhitespace?: boolean; // Normalization of whitespace
  shortAnswerGrading?: "auto" | "manual"; // Evaluation mode: automatic keyword matching or manual host review
  keywords?: string[]; // Key concepts/phrases required for auto grading
  sampleAnswer?: string; // Model answer / reference
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  imageUrl?: string;
}

export interface ParticipantAnswerRecord {
  studentId?: string;
  studentName?: string;
  questionId?: string;
  questionIndex?: number;
  selectedIndex?: number;
  selectedIndices?: number[];
  selectedOptionId?: string;
  selectedAnswer?: any;
  selectedOption?: string;
  textAnswer?: string; // For fill_blank and short_answer
  manualGraded?: boolean;
  evaluationStatus?: "graded" | "pending_manual_review";
  correctOptionId?: string;
  correctOption?: string;
  isAnswered?: boolean;
  status?: "Correct" | "Wrong" | "Not Answered" | "Pending Review" | string;
  timeTakenMs: number;
  isCorrect: boolean;
  marksAwarded: number;
  marks?: number;
  pointsEarned: number;
  submittedAt: number;
  answeredAt?: number;
  explanation?: string;
}

export interface LiveQuizParticipant {
  id: string;
  userId: string; // Authenticated Supabase User ID
  displayName: string;
  rollNumber?: string;
  branch?: string;
  section?: string;
  joinedAt: number;
  lastSeenAt?: number;
  connectionStatus?: "Active" | "Disconnected" | "Submitted";
  status?: string;
  disconnectGraceTimeout?: any;
  score: number; // Total marks / score
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answers: Record<number, ParticipantAnswerRecord>;
  completedAt?: number;
}

export interface LiveQuizRoom {
  id: string;
  roomCode: string; // 6-character code (e.g. AM7K2P)
  quizId?: string;
  title: string;
  college: string;
  regulation: string; // "VR25"
  branch: string;
  year: string;
  semester: string;
  subject: string;
  unit: string;
  topic?: string;
  assessmentType: AssessmentType;
  hostId: string;
  hostUserId: string; // Authenticated Supabase User ID of host
  hostName: string;
  timePerQuestion: number; // in seconds
  timerType: TimerType;
  durationSeconds: number; // For overall timer
  marksPerCorrect: number;
  negativeMarks: number;
  questionOrder: "fixed" | "randomized";
  explanationPolicy: ExplanationPolicy;
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed";
  mode: "Classic" | "Speed" | "Exam";
  status: "lobby" | "in_progress" | "paused" | "ended";
  currentQuestionIndex: number;
  questionStartTime: number | null;
  quizStartTime: number | null;
  questions: LiveQuizQuestion[];
  participants: Map<string, LiveQuizParticipant>;
  showLeaderboard: boolean;
  chatDisabled?: boolean;
  removedParticipantIds?: Set<string>;
  removedUserIds?: Set<string>;
  createdAt: number;
  endedAt?: number;
}

// In-memory room cache: roomCode -> LiveQuizRoom
const rooms = new Map<string, LiveQuizRoom>();

// In-memory drafts cache: draftId -> AcademicQuizDraft
const draftQuizzes = new Map<string, AcademicQuizDraft>();

// In-memory completed quiz results history: userId -> items
const userCompletedQuizzes = new Map<string, Array<{
  roomId: string;
  roomCode: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctCount: number;
  rank: number;
  totalParticipants: number;
  completedAt: number;
}>>();

// WebSocket client subscriptions: roomCode -> Set<ClientConnection>
interface ClientConnection {
  ws: WebSocket;
  participantId?: string;
  isHost?: boolean;
}
const roomConnections = new Map<string, Set<ClientConnection>>();

// Lobby Chat Storage: roomCode -> LiveQuizChatMessage[]
export interface LiveQuizChatMessage {
  id: string;
  quiz_id: string;
  room_code: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
  isHost?: boolean;
}
const roomChats = new Map<string, LiveQuizChatMessage[]>();

export function addRoomChatMessage(params: {
  roomCode: string;
  userId: string;
  displayName: string;
  message: string;
  quizId?: string;
}): { success: boolean; message?: LiveQuizChatMessage; error?: string } {
  const code = (params.roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return { success: false, error: "Room not found. Check the 6-character code." };
  }

  // Requirement 2: Chat exists ONLY inside the quiz lobby. Once exam starts, chat is locked.
  if (room.status !== "lobby") {
    return { success: false, error: "Lobby chat is closed once the assessment starts." };
  }

  if (room.removedUserIds?.has(params.userId)) {
    return { success: false, error: "You were removed by the host." };
  }

  const isHost = room.hostUserId === params.userId;

  // Requirement 2: Host can disable/enable chat
  if (room.chatDisabled && !isHost) {
    return { success: false, error: "Chat has been disabled by the host." };
  }

  const trimmed = (params.message || "").trim();
  if (!trimmed) {
    return { success: false, error: "Message cannot be empty." };
  }
  if (trimmed.length > 500) {
    return { success: false, error: "Message cannot exceed 500 characters." };
  }

  let isParticipant = false;
  for (const p of room.participants.values()) {
    if (p.userId === params.userId) {
      isParticipant = true;
      break;
    }
  }

  if (!isHost && !isParticipant) {
    return { success: false, error: "Unauthorized: You must join this quiz room to send messages." };
  }

  const chatMsg: LiveQuizChatMessage = {
    id: "msg_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8),
    quiz_id: params.quizId || room.id,
    room_code: code,
    user_id: params.userId,
    display_name: (params.displayName || "").trim() || (isHost ? room.hostName || "Host" : "Participant"),
    message: trimmed,
    created_at: new Date().toISOString(),
    isHost,
  };

  if (!roomChats.has(code)) {
    roomChats.set(code, []);
  }
  const list = roomChats.get(code)!;
  list.push(chatMsg);
  if (list.length > 200) {
    list.shift();
  }

  // Realtime broadcast to all connected WebSocket clients in this room
  broadcastRoomEvent(code, {
    type: "chat_message",
    message: chatMsg,
  });

  return { success: true, message: chatMsg };
}

export function getRoomChatMessages(
  roomCode: string,
  userId: string
): { success: boolean; messages?: LiveQuizChatMessage[]; error?: string } {
  const code = (roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return { success: false, error: "Room not found." };
  }

  const isHost = room.hostUserId === userId;
  let isParticipant = false;
  for (const p of room.participants.values()) {
    if (p.userId === userId) {
      isParticipant = true;
      break;
    }
  }

  if (!isHost && !isParticipant) {
    return { success: false, error: "Unauthorized: You must join this quiz room to view chat messages." };
  }

  const list = roomChats.get(code) || [];
  return { success: true, messages: [...list] };
}


// Code generator (6 characters, alphanumeric, uppercase, unambiguous)
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

// ==========================================
// DRAFTS MANAGEMENT
// ==========================================

export function saveDraftQuiz(draft: AcademicQuizDraft, hostUserId: string): AcademicQuizDraft {
  const id = draft.id || "draft_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
  const now = Date.now();
  const saved: AcademicQuizDraft = {
    ...draft,
    id,
    hostUserId,
    createdAt: draft.createdAt || now,
    updatedAt: now,
  };
  draftQuizzes.set(id, saved);
  return saved;
}

export function getDraftsForUser(hostUserId: string): AcademicQuizDraft[] {
  const list: AcademicQuizDraft[] = [];
  for (const draft of draftQuizzes.values()) {
    if (draft.hostUserId === hostUserId) {
      list.push(draft);
    }
  }
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getDraftById(id: string, hostUserId?: string): AcademicQuizDraft | null {
  const draft = draftQuizzes.get(id);
  if (!draft) return null;
  if (hostUserId && draft.hostUserId !== hostUserId) return null;
  return draft;
}

export function deleteDraft(id: string, hostUserId: string): boolean {
  const draft = draftQuizzes.get(id);
  if (!draft || draft.hostUserId !== hostUserId) return false;
  return draftQuizzes.delete(id);
}

// In-memory question bank cache: userId -> questions[]
const userQuestionBanks = new Map<string, any[]>();

export function duplicateQuizDraftOrRoom(quizOrRoomId: string, hostUserId: string): { success: boolean; draft?: AcademicQuizDraft; error?: string } {
  let original: any = draftQuizzes.get(quizOrRoomId);
  if (!original) {
    for (const r of rooms.values()) {
      if (r.id === quizOrRoomId || r.roomCode === quizOrRoomId) {
        original = {
          title: `${r.title} (Copy)`,
          college: r.college,
          regulation: r.regulation,
          branch: r.branch,
          year: r.year,
          semester: r.semester,
          subject: r.subject,
          unit: r.unit,
          topic: r.topic,
          assessmentType: r.assessmentType,
          hostUserId,
          hostName: r.hostName,
          timerType: r.timerType,
          timePerQuestion: r.timePerQuestion,
          durationMinutes: r.durationSeconds ? Math.ceil(r.durationSeconds / 60) : 20,
          marksPerCorrect: r.marksPerCorrect,
          negativeMarks: r.negativeMarks,
          questionOrder: r.questionOrder,
          explanationPolicy: r.explanationPolicy,
          difficulty: r.difficulty,
          questionCount: r.questions.length,
          totalMarks: r.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
          status: "draft",
          questions: r.questions.map((q, idx) => ({
            id: `q_copy_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            questionNumber: idx + 1,
            questionType: q.questionType || "single_mcq",
            questionText: q.question,
            options: [...(q.options || [])],
            correctAnswers: q.correctAnswers ? [...q.correctAnswers] : [q.correctIndex ?? 0],
            explanation: q.explanation || "",
            marks: q.marks || 1,
            negativeMarks: q.negativeMarks || 0,
            isComplete: true,
            blanksExpected: q.blanksExpected ? [...q.blanksExpected] : undefined,
            acceptedAlternatives: q.acceptedAlternatives ? [...q.acceptedAlternatives] : undefined,
            caseSensitive: q.caseSensitive,
            trimWhitespace: q.trimWhitespace,
            shortAnswerGrading: q.shortAnswerGrading,
            keywords: q.keywords ? [...q.keywords] : undefined,
            sampleAnswer: q.sampleAnswer,
          })),
        };
        break;
      }
    }
  }

  if (!original) {
    return { success: false, error: "Assessment record not found to duplicate." };
  }

  const newId = "draft_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
  const copiedQuestions = (original.questions || []).map((q: any, idx: number) => ({
    ...q,
    id: `q_copy_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    questionNumber: idx + 1,
  }));

  const newDraft: AcademicQuizDraft = {
    ...original,
    id: newId,
    title: original.title.includes("(Copy)") ? original.title : `${original.title} (Copy)`,
    hostUserId,
    status: "draft",
    questions: copiedQuestions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  draftQuizzes.set(newId, newDraft);
  return { success: true, draft: newDraft };
}

export function saveQuestionsToUserBank(userId: string, questionsToAdd: any[]): { success: boolean; count: number } {
  if (!userQuestionBanks.has(userId)) {
    userQuestionBanks.set(userId, []);
  }
  const bank = userQuestionBanks.get(userId)!;
  let added = 0;
  for (const q of questionsToAdd) {
    const bankId = `qb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    bank.push({
      ...q,
      bankId,
      savedAt: Date.now(),
    });
    added++;
  }
  return { success: true, count: added };
}

export function getUserQuestionBank(userId: string): any[] {
  return userQuestionBanks.get(userId) || [];
}

// ==========================================
// USER ACADEMIC QUIZ HISTORY
// ==========================================

export function getUserQuizHistory(userId: string) {
  // 1. Quizzes created by this user (drafts and active/completed rooms)
  const createdQuizzes: any[] = [];
  
  // From drafts
  for (const draft of draftQuizzes.values()) {
    if (draft.hostUserId === userId) {
      createdQuizzes.push({
        id: draft.id,
        title: draft.title,
        subject: draft.subject,
        branch: draft.branch,
        year: draft.year,
        semester: draft.semester,
        unit: draft.unit,
        questionCount: draft.questions?.length || draft.questionCount || 0,
        totalMarks: draft.totalMarks || 0,
        status: draft.status || "draft",
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        questions: draft.questions || [],
      });
    }
  }

  // From created rooms
  for (const room of rooms.values()) {
    if (room.hostUserId === userId) {
      // check if not already represented
      const exists = createdQuizzes.some((q) => q.roomCode === room.roomCode || (room.quizId && q.id === room.quizId));
      if (!exists) {
        createdQuizzes.push({
          id: room.id,
          title: room.title,
          subject: room.subject,
          branch: room.branch,
          year: room.year,
          semester: room.semester,
          unit: room.unit,
          roomCode: room.roomCode,
          questionCount: room.questions.length,
          totalMarks: room.questions.reduce((sum, q) => sum + (q.marks || room.marksPerCorrect || 1), 0),
          status: room.status,
          createdAt: room.createdAt,
          participantsCount: room.participants.size,
          questions: room.questions.map((q) => ({
            id: q.id,
            questionNumber: q.questionNumber,
            questionType: q.questionType || "single_mcq",
            questionText: q.question,
            options: q.options,
            correctAnswers: q.correctAnswers,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            blanksExpected: q.blanksExpected,
            acceptedAlternatives: q.acceptedAlternatives,
            caseSensitive: q.caseSensitive,
            shortAnswerGrading: q.shortAnswerGrading,
            keywords: q.keywords,
            sampleAnswer: q.sampleAnswer,
          })),
        });
      }
    }
  }

  // 2. Participated Quizzes
  const participatedQuizzes: any[] = [];
  for (const room of rooms.values()) {
    for (const p of room.participants.values()) {
      if (p.userId === userId) {
        participatedQuizzes.push({
          id: `${room.roomCode}-${p.id}`,
          roomId: room.id,
          roomCode: room.roomCode,
          quizTitle: room.title,
          subject: room.subject,
          branch: room.branch,
          year: room.year,
          semester: room.semester,
          unit: room.unit,
          score: p.score,
          correctCount: p.correctCount,
          totalQuestions: room.questions.length,
          joinedAt: p.joinedAt,
          status: room.status === "ended" ? "Completed" : "Active",
          completedAt: p.completedAt || room.endedAt,
        });
      }
    }
  }

  // 3. Recent completed results
  const recentResults = (userCompletedQuizzes.get(userId) || []).slice(-10).reverse();

  return {
    createdQuizzes: createdQuizzes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    participatedQuizzes: participatedQuizzes.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0)),
    recentResults,
  };
}

// ==========================================
// AUTHORITATIVE ANSWER NORMALIZATION
// ==========================================

/**
 * Authoritatively normalizes any representation of an answer:
 * - Number: 0, 1, 2, 3
 * - Numeric string: "0", "1", "2"
 * - Letter string: "A", "B", "C", "D" (or lowercase "a", "b", "c", "d")
 * - Option text matching one of the options
 * - Boolean string: "True", "False"
 * Returns a 0-based option index, or null if unmatchable.
 */
export function normalizeAnswerToOptionIndex(answer: any, options: string[] = []): number | null {
  if (answer === null || answer === undefined) return null;

  // 0. Object with index / id
  if (typeof answer === "object") {
    if (typeof answer.selectedIndex === "number") return answer.selectedIndex;
    if (typeof answer.selectedOptionIndex === "number") return answer.selectedOptionIndex;
    if (typeof answer.index === "number") return answer.index;
    if (answer.id !== undefined) return normalizeAnswerToOptionIndex(answer.id, options);
    if (answer.value !== undefined) return normalizeAnswerToOptionIndex(answer.value, options);
  }

  // 1. Direct number check (e.g. 0, 1, 2, 3)
  if (typeof answer === "number" && !isNaN(answer)) {
    return Math.floor(answer);
  }

  const str = String(answer).trim();
  if (!str) return null;

  // 2. Option ID patterns: opt_0, opt_1, opt_A, option_0, option_A
  const optNumMatch = str.match(/^(?:opt|option)[_-]?(\d+)$/i);
  if (optNumMatch) {
    const parsed = parseInt(optNumMatch[1], 10);
    // If 1-indexed (e.g., opt_1..opt_4) and options has 4 items
    if (parsed >= 1 && parsed <= options.length && !options[parsed]) {
      return parsed - 1;
    }
    return parsed;
  }
  const optLetterMatch = str.match(/^(?:opt|option)[_-]?([A-Za-z])$/i);
  if (optLetterMatch) {
    const code = optLetterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (code >= 0 && (options.length === 0 || code < options.length)) {
      return code;
    }
  }

  // 3. Numeric string (e.g. "0", "1", "2")
  if (/^-?\d+$/.test(str)) {
    const parsed = parseInt(str, 10);
    if (!isNaN(parsed)) return parsed;
  }

  // 4. Single letter "A", "B", "C", "D" or "a", "b", "c", "d"
  if (/^[A-Za-z]$/.test(str)) {
    const code = str.toUpperCase().charCodeAt(0) - 65; // A -> 0, B -> 1, C -> 2, D -> 3
    if (code >= 0 && (options.length === 0 || code < options.length)) {
      return code;
    }
  }

  // 5. Match against options text (case-insensitive and trimmed)
  if (Array.isArray(options) && options.length > 0) {
    const lowerStr = str.toLowerCase();
    const foundIdx = options.findIndex((opt) => opt && String(opt).trim().toLowerCase() === lowerStr);
    if (foundIdx !== -1) {
      return foundIdx;
    }
  }

  // 6. True/False conversion
  if (str.toLowerCase() === "true") {
    const tfIdx = options.findIndex((o) => String(o).trim().toLowerCase() === "true");
    return tfIdx !== -1 ? tfIdx : 0;
  }
  if (str.toLowerCase() === "false") {
    const tfIdx = options.findIndex((o) => String(o).trim().toLowerCase() === "false");
    return tfIdx !== -1 ? tfIdx : 1;
  }

  return null;
}

// ==========================================
// ROOM CREATION & MANAGEMENT
// ==========================================

export function createLiveQuizRoom(params: {
  quizId?: string;
  title: string;
  college?: string;
  regulation?: string;
  branch: string;
  year: string;
  semester: string;
  subject: string;
  unit?: string;
  topic?: string;
  assessmentType?: AssessmentType;
  hostName: string;
  hostUserId: string; // Authenticated Supabase User ID
  timePerQuestion?: number;
  timerType?: TimerType;
  durationSeconds?: number;
  marksPerCorrect?: number;
  negativeMarks?: number;
  questionOrder?: "fixed" | "randomized";
  explanationPolicy?: ExplanationPolicy;
  difficulty?: "Easy" | "Medium" | "Hard" | "Mixed";
  mode?: "Classic" | "Speed" | "Exam";
  questions: any[];
}): LiveQuizRoom {
  const roomCode = generateRoomCode();
  const hostId = "host-" + Date.now().toString(36);

  // Normalize questions authoritatively
  let rawQuestions: LiveQuizQuestion[] = (params.questions || []).map((q, idx) => {
    const options = Array.isArray(q.options) && q.options.length > 0
      ? q.options
      : ["Option A", "Option B", "Option C", "Option D"];

    const questionType = q.questionType || (options.length === 2 && (options[0] === "True" || options[0] === "true") ? "true_false" : "single_mcq");

    // Gather raw correct answer representations from all possible formats
    let rawCorrectList: any[] = [];
    if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
      rawCorrectList = q.correctAnswers;
    } else if (Array.isArray(q.correctIndices) && q.correctIndices.length > 0) {
      rawCorrectList = q.correctIndices;
    } else if (q.correctIndex !== undefined && q.correctIndex !== null) {
      rawCorrectList = [q.correctIndex];
    } else if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
      rawCorrectList = [q.correctAnswer];
    } else if (q.correct !== undefined && q.correct !== null) {
      rawCorrectList = [q.correct];
    }

    // Authoritatively convert to 0-based option number indices
    let correctAnswers: number[] = rawCorrectList
      .map((ans) => normalizeAnswerToOptionIndex(ans, options))
      .filter((idx): idx is number => typeof idx === "number" && idx >= 0);

    if (correctAnswers.length === 0) {
      correctAnswers = [0];
    }

    return {
      id: q.id || `q_${idx + 1}_${Date.now().toString(36)}`,
      questionNumber: idx + 1,
      questionType,
      question: q.question || q.questionText || `Question ${idx + 1}`,
      options,
      correctIndex: correctAnswers[0] ?? 0,
      correctAnswers,
      blanksExpected: Array.isArray(q.blanksExpected) ? q.blanksExpected : (typeof q.expectedAnswer === "string" ? [q.expectedAnswer] : undefined),
      acceptedAlternatives: Array.isArray(q.acceptedAlternatives) ? q.acceptedAlternatives : undefined,
      caseSensitive: !!q.caseSensitive,
      trimWhitespace: q.trimWhitespace !== false,
      shortAnswerGrading: q.shortAnswerGrading || "auto",
      keywords: Array.isArray(q.keywords) ? q.keywords : undefined,
      sampleAnswer: q.sampleAnswer || "",
      explanation: q.explanation || "",
      marks: typeof q.marks === "number" && q.marks > 0 ? q.marks : (params.marksPerCorrect ?? 1),
      negativeMarks: typeof q.negativeMarks === "number" && q.negativeMarks >= 0 ? q.negativeMarks : (params.negativeMarks ?? 0),
      imageUrl: q.imageUrl,
    };
  });

  // Question ordering: fixed vs randomized
  if (params.questionOrder === "randomized") {
    // Fisher-Yates shuffle
    rawQuestions = [...rawQuestions];
    for (let i = rawQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawQuestions[i], rawQuestions[j]] = [rawQuestions[j], rawQuestions[i]];
    }
    // Re-number
    rawQuestions.forEach((q, idx) => {
      q.questionNumber = idx + 1;
    });
  }

  const room: LiveQuizRoom = {
    id: "lq-" + Date.now().toString(36),
    roomCode,
    quizId: params.quizId,
    title: params.title || `${params.subject} Academic Live Quiz`,
    college: params.college || "Vignan Institute of Science and Technology",
    regulation: params.regulation || "VR25",
    branch: params.branch,
    year: params.year,
    semester: params.semester,
    subject: params.subject,
    unit: params.unit || "",
    topic: params.topic || "",
    assessmentType: params.assessmentType || "Class Assessment",
    hostId,
    hostUserId: params.hostUserId,
    hostName: params.hostName || "Faculty / Host",
    timePerQuestion: Math.max(5, Math.min(300, params.timePerQuestion || 30)),
    timerType: params.timerType || "per_question",
    durationSeconds: params.durationSeconds || 0,
    marksPerCorrect: params.marksPerCorrect ?? 1,
    negativeMarks: params.negativeMarks ?? 0,
    questionOrder: params.questionOrder || "fixed",
    explanationPolicy: params.explanationPolicy || "after_quiz",
    difficulty: params.difficulty || "Medium",
    mode: params.mode || "Classic",
    status: "lobby",
    currentQuestionIndex: -1,
    questionStartTime: null,
    quizStartTime: null,
    questions: rawQuestions,
    participants: new Map(),
    showLeaderboard: false,
    chatDisabled: false,
    removedParticipantIds: new Set<string>(),
    removedUserIds: new Set<string>(),
    createdAt: Date.now(),
  };

  rooms.set(roomCode, room);
  return room;
}

// Join Room with authentication
export function joinLiveQuizRoom(params: {
  roomCode: string;
  displayName: string;
  authenticatedUserId: string;
  rollNumber?: string;
  branch?: string;
  section?: string;
}): {
  success: boolean;
  participantId?: string;
  participant?: any;
  error?: string;
  room?: any;
  reconnected?: boolean;
  message?: string;
} {
  const code = (params.roomCode || "").trim().toUpperCase();

  // Validate code pattern
  if (code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
    return { success: false, error: "Room not found. Check the 6-character code." };
  }

  const room = rooms.get(code);

  if (!room) {
    return { success: false, error: "Room not found. Check the 6-character code." };
  }

  if (room.status === "ended") {
    return { success: false, error: "This quiz room has already ended." };
  }

  if (room.removedUserIds && room.removedUserIds.has(params.authenticatedUserId)) {
    return { success: false, error: "You were removed by the host." };
  }

  if (!params.authenticatedUserId) {
    return { success: false, error: "Please sign in to join the quiz." };
  }

  // Check if this authenticated user already joined this room (reconnection)
  let existingParticipantId: string | undefined;
  for (const [id, p] of room.participants.entries()) {
    if (p.userId === params.authenticatedUserId) {
      existingParticipantId = id;
      break;
    }
  }

  if (existingParticipantId) {
    const existingP = room.participants.get(existingParticipantId)!;
    if (params.displayName && params.displayName.trim()) {
      existingP.displayName = params.displayName.trim();
    }
    if (params.rollNumber) existingP.rollNumber = params.rollNumber;
    if (params.branch) existingP.branch = params.branch;
    if (params.section) existingP.section = params.section;

    return {
      success: true,
      reconnected: true,
      message: "You're already registered in this room. Reconnecting...",
      participantId: existingParticipantId,
      participant: {
        id: existingParticipantId,
        displayName: existingP.displayName,
        score: existingP.score,
        correctCount: existingP.correctCount,
      },
      room: sanitizeRoomForParticipant(room, existingParticipantId),
    };
  }

  // College-scale capacity: Allow up to 300 students per assessment room
  if (room.participants.size >= 300) {
    return { success: false, error: "This quiz room has reached maximum student capacity (300 students)." };
  }

  const participantId = "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
  const newParticipant: LiveQuizParticipant = {
    id: participantId,
    userId: params.authenticatedUserId,
    displayName: (params.displayName || "").trim() || `Student ${room.participants.size + 1}`,
    rollNumber: params.rollNumber || "",
    branch: params.branch || "",
    section: params.section || "",
    joinedAt: Date.now(),
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    answers: {},
  };

  room.participants.set(participantId, newParticipant);

  // Real-time broadcast of new participant
  broadcastRoomEvent(code, {
    type: "participant_joined",
    participantCount: room.participants.size,
    participant: {
      id: newParticipant.id,
      displayName: newParticipant.displayName,
      score: newParticipant.score,
    },
    participants: Array.from(room.participants.values()).map((p) => ({
      id: p.id,
      displayName: p.displayName,
      score: p.score,
    })),
  });

  return {
    success: true,
    participantId,
    participant: {
      id: newParticipant.id,
      displayName: newParticipant.displayName,
      score: newParticipant.score,
    },
    room: sanitizeRoomForParticipant(room, participantId),
  };
}

// ==========================================
// ANSWER SECURITY & SANITIZATION
// ==========================================

export function sanitizeRoomForParticipant(room: LiveQuizRoom, participantId?: string) {
  const isEnded = room.status === "ended";
  const myParticipant = participantId ? room.participants.get(participantId) : null;

  // Requirement 1: Removed student check
  const isRemoved = !!(
    (participantId && room.removedParticipantIds?.has(participantId)) ||
    (myParticipant?.userId && room.removedUserIds?.has(myParticipant.userId))
  );

  if (isRemoved) {
    return {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      subject: room.subject,
      status: "ended",
      isRemoved: true,
      removedMessage: "You were removed by the host.",
      questions: [],
      participants: [],
      leaderboard: [],
      participantsCount: 0,
      totalQuestions: 0,
      currentQuestionIndex: -1,
    } as any;
  }

  const hasAnsweredCurrent = !!(myParticipant && room.currentQuestionIndex >= 0 && myParticipant.answers[room.currentQuestionIndex]);

  // Determine explanation permission
  const canSeeCurrentExplanation = 
    isEnded || 
    (room.explanationPolicy === "after_each" && hasAnsweredCurrent);

  const participantsList = Array.from(room.participants.values()).map((p) => ({
    id: p.id,
    userId: p.userId,
    displayName: p.displayName,
    score: p.score,
    correctCount: p.correctCount,
    incorrectCount: p.incorrectCount,
    unansweredCount: p.unansweredCount,
    hasAnswered: room.currentQuestionIndex >= 0 ? !!p.answers[room.currentQuestionIndex] : false,
  }));

  // Server-authoritative leaderboard with academic tie handling
  const sortedForLeaderboard = [...participantsList].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.displayName.localeCompare(b.displayName);
  });

  let curRank = 1;
  const leaderboard = sortedForLeaderboard.map((p, idx) => {
    if (idx > 0) {
      const prev = sortedForLeaderboard[idx - 1];
      if (p.score === prev.score && p.correctCount === prev.correctCount) {
        // Tied with previous participant: keep same rank
      } else {
        curRank = idx + 1;
      }
    }
    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      score: p.score,
      correctCount: p.correctCount,
      incorrectCount: p.incorrectCount,
      unansweredCount: p.unansweredCount,
      rank: curRank,
    };
  });

  const timeElapsedSec = room.questionStartTime ? Math.floor((Date.now() - room.questionStartTime) / 1000) : 0;
  const timeRemaining = room.timerType === "per_question"
    ? Math.max(0, room.timePerQuestion - timeElapsedSec)
    : room.durationSeconds > 0 && room.quizStartTime
      ? Math.max(0, room.durationSeconds - Math.floor((Date.now() - room.quizStartTime) / 1000))
      : room.timePerQuestion;

  // Questions sanitized: Correct answers NEVER sent unless room is ended or authorized by policy
  const sanitizedQuestions = room.questions.map((q, idx) => {
    const isThisCurrent = idx === room.currentQuestionIndex;
    const canSeeThisAnswer = isEnded || (isThisCurrent && canSeeCurrentExplanation);

    return {
      id: q.id,
      questionNumber: q.questionNumber || idx + 1,
      questionType: q.questionType || "single_mcq",
      question: q.question,
      options: q.options,
      imageUrl: q.imageUrl,
      marks: q.marks || room.marksPerCorrect || 1,
      negativeMarks: q.negativeMarks || room.negativeMarks || 0,
      ...(canSeeThisAnswer && room.explanationPolicy !== "never" ? {
        correctIndex: q.correctIndex,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation,
      } : {}),
    };
  });

  const currentQ = (room.currentQuestionIndex >= 0 && room.currentQuestionIndex < room.questions.length)
    ? {
        index: room.currentQuestionIndex,
        total: room.questions.length,
        id: room.questions[room.currentQuestionIndex].id,
        questionNumber: room.questions[room.currentQuestionIndex].questionNumber || room.currentQuestionIndex + 1,
        questionType: room.questions[room.currentQuestionIndex].questionType || "single_mcq",
        question: room.questions[room.currentQuestionIndex].question,
        options: room.questions[room.currentQuestionIndex].options,
        imageUrl: room.questions[room.currentQuestionIndex].imageUrl,
        marks: room.questions[room.currentQuestionIndex].marks || room.marksPerCorrect || 1,
        negativeMarks: room.questions[room.currentQuestionIndex].negativeMarks || room.negativeMarks || 0,
        ...(canSeeCurrentExplanation && room.explanationPolicy !== "never" ? {
          correctIndex: room.questions[room.currentQuestionIndex].correctIndex,
          correctAnswers: room.questions[room.currentQuestionIndex].correctAnswers,
          explanation: room.questions[room.currentQuestionIndex].explanation,
        } : {}),
      }
    : null;

  const totalMarks = room.questions.reduce((sum, q) => sum + (q.marks || room.marksPerCorrect || 1), 0);

  const myRank = myParticipant
    ? leaderboard.find((item) => item.id === myParticipant.id)?.rank ?? 1
    : 1;

  return {
    id: room.id,
    roomCode: room.roomCode,
    quizId: room.quizId,
    title: room.title,
    college: room.college,
    regulation: room.regulation,
    branch: room.branch,
    year: room.year,
    semester: room.semester,
    subject: room.subject,
    unit: room.unit,
    topic: room.topic,
    assessmentType: room.assessmentType,
    hostId: room.hostId,
    hostUserId: room.hostUserId,
    hostName: room.hostName,
    timePerQuestion: room.timePerQuestion,
    timerType: room.timerType,
    durationSeconds: room.durationSeconds,
    marksPerCorrect: room.marksPerCorrect,
    negativeMarks: room.negativeMarks,
    questionOrder: room.questionOrder,
    explanationPolicy: room.explanationPolicy,
    timeRemaining,
    serverTime: Date.now(),
    difficulty: room.difficulty,
    mode: room.mode,
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    questionStartTime: room.questionStartTime,
    quizStartTime: room.quizStartTime,
    totalQuestions: room.questions.length,
    totalMarks,
    questions: sanitizedQuestions,
    currentQuestion: currentQ,
    participantsCount: room.participants.size,
    participants: participantsList,
    leaderboard,
    showLeaderboard: room.showLeaderboard,
    chatDisabled: !!room.chatDisabled,
    myParticipant: myParticipant ? {
      id: myParticipant.id,
      userId: myParticipant.userId,
      displayName: myParticipant.displayName,
      score: myParticipant.score,
      correctCount: myParticipant.correctCount,
      incorrectCount: myParticipant.incorrectCount,
      unansweredCount: myParticipant.unansweredCount,
      rank: myRank,
      totalMarks,
      percentage: totalMarks > 0 ? Math.round((Math.max(0, myParticipant.score) / totalMarks) * 100) : 0,
      answers: isEnded ? myParticipant.answers : undefined,
    } : null,
    // When quiz ends, always provide full questions so all students can review
    allQuestions: isEnded ? room.questions : undefined,
    myAnswer: myParticipant && room.currentQuestionIndex >= 0
      ? myParticipant.answers[room.currentQuestionIndex] || null
      : null,
    myAllAnswers: isEnded && myParticipant ? myParticipant.answers : undefined,
  };
}

export function getSanitizedRoom(roomCode: string, participantId?: string) {
  const code = (roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return null;
  return sanitizeRoomForParticipant(room, participantId);
}

export function formatSelectedOptionLabel(ans: any, options?: string[]): string {
  if (!ans) return "—";

  if (Array.isArray(ans.selectedIndices) && ans.selectedIndices.length > 0) {
    return ans.selectedIndices
      .map((idx: number) => (typeof idx === "number" && idx >= 0 && idx < 26 ? String.fromCharCode(65 + idx) : String(idx)))
      .join(", ");
  }

  const idx = typeof ans.selectedIndex === "number"
    ? ans.selectedIndex
    : (typeof ans.selectedOptionIndex === "number" ? ans.selectedOptionIndex : null);

  if (idx !== null && idx >= 0 && idx < 26) {
    return String.fromCharCode(65 + idx);
  }

  if (typeof ans.selectedAnswer === "number" && ans.selectedAnswer >= 0 && ans.selectedAnswer < 26) {
    return String.fromCharCode(65 + ans.selectedAnswer);
  }

  if (typeof ans.selectedAnswer === "string") {
    const trimmed = ans.selectedAnswer.trim();
    if (/^[A-Z]$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    if (options && options.length > 0) {
      const foundIdx = options.findIndex((o) => o.trim().toLowerCase() === trimmed.toLowerCase());
      if (foundIdx >= 0 && foundIdx < 26) {
        return String.fromCharCode(65 + foundIdx);
      }
    }
    return trimmed;
  }

  return "—";
}

export function formatCorrectOptionLabel(question?: LiveQuizQuestion | null): string {
  if (!question) return "—";
  if (Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0) {
    return question.correctAnswers
      .map((idx: any) => {
        const norm = typeof idx === "number" ? idx : normalizeAnswerToOptionIndex(idx, question.options);
        return norm !== null && norm >= 0 && norm < 26 ? String.fromCharCode(65 + norm) : String(idx);
      })
      .join(", ");
  }
  const norm = typeof question.correctIndex === "number"
    ? question.correctIndex
    : normalizeAnswerToOptionIndex(question.correctIndex, question.options);
  if (norm !== null && norm >= 0 && norm < 26) {
    return String.fromCharCode(65 + norm);
  }
  return "A";
}

export function getFullRoomForHost(roomCode: string) {
  const code = roomCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return null;

  const currentQ = (room.currentQuestionIndex >= 0 && room.currentQuestionIndex < room.questions.length)
    ? room.questions[room.currentQuestionIndex]
    : null;

  const correctOptionLabel = currentQ ? formatCorrectOptionLabel(currentQ) : "—";

  const participantsList = Array.from(room.participants.values()).map((p) => {
    const curAns = room.currentQuestionIndex >= 0 ? p.answers[room.currentQuestionIndex] : null;
    const selectedOption = curAns ? formatSelectedOptionLabel(curAns, currentQ?.options) : "—";
    const isAnswered = !!curAns;
    const isCorrect = curAns ? !!curAns.isCorrect : false;
    const marks = curAns ? curAns.marksAwarded : 0;
    const connectionStatus: "Active" | "Disconnected" | "Submitted" =
      isAnswered || p.connectionStatus === "Submitted"
        ? "Submitted"
        : (p.connectionStatus === "Disconnected" ? "Disconnected" : "Active");

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      rollNumber: p.rollNumber,
      branch: p.branch,
      section: p.section,
      score: p.score,
      correctCount: p.correctCount,
      incorrectCount: p.incorrectCount,
      unansweredCount: p.unansweredCount,
      connectionStatus,
      status: connectionStatus,
      answers: p.answers,
      currentAnswer: curAns ? {
        selectedIndex: curAns.selectedIndex,
        selectedIndices: curAns.selectedIndices,
        selectedAnswer: curAns.selectedAnswer,
        submittedAt: curAns.submittedAt,
        selectedOption,
        correctOption: correctOptionLabel,
        isCorrect,
        marks,
        textAnswer: curAns.textAnswer,
        manualGraded: curAns.manualGraded,
        evaluationStatus: curAns.evaluationStatus,
        timeTakenMs: curAns.timeTakenMs,
      } : null,
      selectedOption,
      correctOption: correctOptionLabel,
      isCorrect,
      marks,
      hasAnswered: isAnswered,
      answeredCurrentQuestion: isAnswered,
      completedAt: p.completedAt,
    };
  });

  const totalStudents = participantsList.length;
  const answeredStudents = participantsList.filter((p) => p.hasAnswered);
  const waitingStudents = participantsList.filter((p) => !p.hasAnswered);
  const activeStudents = participantsList.filter((p) => p.connectionStatus === "Active");
  const disconnectedStudents = participantsList.filter((p) => p.connectionStatus === "Disconnected");
  const submittedStudents = participantsList.filter((p) => p.connectionStatus === "Submitted");

  const answerMonitor = {
    questionIndex: room.currentQuestionIndex,
    questionId: currentQ?.id || `q-${room.currentQuestionIndex}`,
    correctOption: correctOptionLabel,
    total: totalStudents,
    answered: answeredStudents.length,
    waiting: waitingStudents.length,
    notAnswered: waitingStudents.length,
    active: activeStudents.length,
    disconnected: disconnectedStudents.length,
    submitted: submittedStudents.length,
    list: participantsList.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      rollNumber: p.rollNumber,
      branch: p.branch,
      section: p.section,
      questionId: currentQ?.id || `q-${room.currentQuestionIndex}`,
      status: p.connectionStatus as "Active" | "Disconnected" | "Submitted",
      connectionStatus: p.connectionStatus,
      selectedOption: p.selectedOption,
      correctOption: correctOptionLabel,
      isCorrect: p.isCorrect,
      marks: p.marks,
      textAnswer: p.currentAnswer?.textAnswer,
      manualGraded: p.currentAnswer?.manualGraded,
      evaluationStatus: p.currentAnswer?.evaluationStatus,
      submittedAt: p.currentAnswer?.submittedAt,
    })),
  };

  // Authoritative leaderboard with academic tie handling
  const sortedForLeaderboard = [...participantsList].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.displayName.localeCompare(b.displayName);
  });

  let curRank = 1;
  const leaderboard = sortedForLeaderboard.map((p, idx) => {
    if (idx > 0) {
      const prev = sortedForLeaderboard[idx - 1];
      if (p.score === prev.score && p.correctCount === prev.correctCount) {
        // Tied
      } else {
        curRank = idx + 1;
      }
    }
    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      score: p.score,
      correctCount: p.correctCount,
      incorrectCount: p.incorrectCount,
      unansweredCount: p.unansweredCount,
      rank: curRank,
    };
  });

  const timeElapsedSec = room.questionStartTime ? Math.floor((Date.now() - room.questionStartTime) / 1000) : 0;
  const timeRemaining = room.timerType === "per_question"
    ? Math.max(0, room.timePerQuestion - timeElapsedSec)
    : room.durationSeconds > 0 && room.quizStartTime
      ? Math.max(0, room.durationSeconds - Math.floor((Date.now() - room.quizStartTime) / 1000))
      : room.timePerQuestion;

  const totalMarks = room.questions.reduce((sum, q) => sum + (q.marks || room.marksPerCorrect || 1), 0);

  return {
    ...room,
    totalMarks,
    timeRemaining,
    serverTime: Date.now(),
    participants: participantsList,
    leaderboard,
    answerMonitor,
    participantsCount: room.participants.size,
  };
}


// ==========================================
// ANSWER SUBMISSION & ACCURATE MARKING
// ==========================================

export function submitLiveQuizAnswer(params: {
  roomCode: string;
  participantId: string;
  authenticatedUserId?: string;
  questionIndex: number;
  selectedIndex?: number;
  selectedOptionIndex?: number;
  selectedIndices?: number[];
  selectedAnswer?: any;
  textAnswer?: string;
}): {
  success: boolean;
  error?: string;
  marksAwarded?: number;
  isCorrect?: boolean;
  score?: number;
  correctCount?: number;
  totalMarks?: number;
  percentage?: number;
  explanation?: string;
} {
  const code = (params.roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) return { success: false, error: "Room not found. Check the 6-character code." };
  if (room.status !== "in_progress") return { success: false, error: "Quiz is not currently accepting answers." };
  if (room.currentQuestionIndex !== params.questionIndex) {
    return { success: false, error: "This question is no longer active." };
  }

  const participant = room.participants.get(params.participantId);
  if (!participant) return { success: false, error: "Participant not found." };

  // Requirement 1: Removed students cannot submit answers
  if (
    room.removedParticipantIds?.has(params.participantId) ||
    (params.authenticatedUserId && room.removedUserIds?.has(params.authenticatedUserId))
  ) {
    return { success: false, error: "You were removed by the host." };
  }

  // Validate identity
  if (params.authenticatedUserId && participant.userId && participant.userId !== params.authenticatedUserId) {
    return { success: false, error: "Unauthorized: You can only submit answers for your own account." };
  }

  // Prevent duplicate submissions
  if (participant.answers[params.questionIndex]) {
    return { success: false, error: "You have already submitted an answer for this question." };
  }

  const question = room.questions[params.questionIndex];
  if (!question) return { success: false, error: "Question not found." };

  const timeElapsedMs = room.questionStartTime ? Math.max(0, Date.now() - room.questionStartTime) : 0;
  const maxTimeMs = room.timePerQuestion * 1000;

  // 3-second network latency grace period
  if (room.timerType === "per_question" && timeElapsedMs > maxTimeMs + 3000) {
    return { success: false, error: "Time expired for this question." };
  }

  const qType = question.questionType || "single_mcq";
  let isCorrect = false;

  // Authoritative correct option indices
  const correctIndices: number[] = (
    Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0
      ? question.correctAnswers
      : [question.correctIndex ?? 0]
  ).map((c) => normalizeAnswerToOptionIndex(c, question.options) ?? 0);

  const rawTextAnswer = typeof params.textAnswer === "string"
    ? params.textAnswer
    : (typeof params.selectedAnswer === "string" ? params.selectedAnswer : "");

  if (qType === "single_mcq" || qType === "true_false") {
    const rawSelected = params.selectedIndex !== undefined
      ? params.selectedIndex
      : (params.selectedOptionIndex !== undefined ? params.selectedOptionIndex : params.selectedAnswer);

    const selectedIdx = normalizeAnswerToOptionIndex(rawSelected, question.options);
    isCorrect = selectedIdx !== null && selectedIdx === correctIndices[0];
  } else if (qType === "multiple_mcq") {
    const rawList: any[] = Array.isArray(params.selectedIndices)
      ? params.selectedIndices
      : Array.isArray(params.selectedAnswer)
        ? params.selectedAnswer
        : (params.selectedIndex !== undefined ? [params.selectedIndex] : (params.selectedOptionIndex !== undefined ? [params.selectedOptionIndex] : []));

    const selectedIndices = rawList
      .map((item) => normalizeAnswerToOptionIndex(item, question.options))
      .filter((i): i is number => typeof i === "number" && i >= 0);

    const sortedSelected = [...new Set(selectedIndices)].sort((a, b) => a - b);
    const sortedCorrect = [...new Set(correctIndices)].sort((a, b) => a - b);

    isCorrect = sortedSelected.length === sortedCorrect.length &&
      sortedSelected.every((val, idx) => val === sortedCorrect[idx]);
  } else if (qType === "fill_blank") {
    const caseSensitive = !!question.caseSensitive;
    const normalize = (s: string) => {
      let res = s || "";
      if (question.trimWhitespace !== false) {
        res = res.trim().replace(/\s+/g, " ");
      }
      return caseSensitive ? res : res.toLowerCase();
    };

    const studentNorm = normalize(rawTextAnswer);
    const expectedList = [
      ...(question.blanksExpected || []),
      ...(question.acceptedAlternatives || []),
    ];
    isCorrect = studentNorm.length > 0 && expectedList.some((exp) => normalize(exp) === studentNorm);
  } else if (qType === "short_answer") {
    if (question.shortAnswerGrading === "manual") {
      // Manual evaluation: Do not mark incorrect automatically!
      isCorrect = false;
    } else {
      // Automatic keyword / key phrase evaluation
      const keywords = (question.keywords || []).map((k) => k.trim().toLowerCase()).filter(Boolean);
      const lower = rawTextAnswer.toLowerCase().trim();
      if (keywords.length > 0) {
        const matches = keywords.filter((k) => lower.includes(k)).length;
        isCorrect = matches >= Math.ceil(keywords.length * 0.5);
      } else if (question.sampleAnswer) {
        isCorrect = lower.length >= 5;
      } else {
        isCorrect = lower.length > 0;
      }
    }
  }

  const questionMarks = typeof question.marks === "number" && question.marks > 0
    ? question.marks
    : (typeof room.marksPerCorrect === "number" && room.marksPerCorrect > 0 ? room.marksPerCorrect : 1);
  const negativeMarks = typeof question.negativeMarks === "number" && question.negativeMarks >= 0
    ? question.negativeMarks
    : (typeof room.negativeMarks === "number" && room.negativeMarks >= 0 ? room.negativeMarks : 0);

  let marksAwarded = 0;
  let statusStr: "Correct" | "Wrong" | "Pending Review" = isCorrect ? "Correct" : "Wrong";
  let evalStatus: "graded" | "pending_manual_review" = "graded";

  if (qType === "short_answer" && question.shortAnswerGrading === "manual") {
    marksAwarded = 0;
    statusStr = "Pending Review";
    evalStatus = "pending_manual_review";
  } else if (isCorrect) {
    marksAwarded = questionMarks;
    participant.correctCount += 1;
    participant.score += marksAwarded;
  } else {
    marksAwarded = -negativeMarks;
    participant.incorrectCount += 1;
    participant.score = Math.max(0, participant.score + marksAwarded); // Prevent negative total score
  }

  participant.unansweredCount = Math.max(0, room.questions.length - (participant.correctCount + participant.incorrectCount));
  participant.connectionStatus = "Submitted";

  let selectedOpt = formatSelectedOptionLabel(
    {
      selectedIndex: params.selectedIndex ?? params.selectedOptionIndex,
      selectedIndices: params.selectedIndices,
      selectedAnswer: params.selectedAnswer,
    },
    question.options
  );

  if (qType === "fill_blank" || qType === "short_answer") {
    selectedOpt = rawTextAnswer || "—";
  }

  let correctOpt = formatCorrectOptionLabel(question);
  if (qType === "fill_blank") {
    correctOpt = (question.blanksExpected && question.blanksExpected[0]) || "—";
  } else if (qType === "short_answer") {
    correctOpt = question.sampleAnswer || (question.keywords && question.keywords.join(", ")) || "Subjective Evaluation";
  }

  const rawSelected = params.selectedIndex !== undefined
    ? params.selectedIndex
    : (params.selectedOptionIndex !== undefined ? params.selectedOptionIndex : params.selectedAnswer);

  const selectedOptId = rawSelected !== undefined && rawSelected !== null ? String(rawSelected) : undefined;
  const correctOptId = correctIndices.map((ci) => `opt_${ci}`).join(", ");

  participant.answers[params.questionIndex] = {
    studentId: participant.id,
    studentName: participant.displayName,
    questionId: question.id,
    questionIndex: params.questionIndex,
    selectedOptionId: selectedOptId,
    selectedIndex: params.selectedIndex ?? params.selectedOptionIndex,
    selectedIndices: params.selectedIndices,
    selectedAnswer: params.selectedAnswer ?? params.selectedIndex ?? params.selectedOptionIndex ?? rawTextAnswer,
    selectedOption: selectedOpt,
    textAnswer: rawTextAnswer,
    manualGraded: false,
    evaluationStatus: evalStatus,
    correctOptionId: correctOptId,
    correctOption: correctOpt,
    isAnswered: true,
    status: statusStr,
    timeTakenMs: timeElapsedMs,
    isCorrect,
    marksAwarded,
    marks: marksAwarded,
    pointsEarned: Math.round(marksAwarded * 1000),
    submittedAt: Date.now(),
    answeredAt: Date.now(),
    explanation: question.explanation || "",
  };

  const totalMarks = room.questions.reduce((sum, q) => sum + (q.marks || room.marksPerCorrect || 1), 0);
  const percentage = totalMarks > 0 ? Math.round((Math.max(0, participant.score) / totalMarks) * 100) : 0;

  // Real-time broadcast updated authoritative room state immediately to both host and students
  broadcastRoomState(code);

  const shouldRevealExplanation = room.explanationPolicy === "after_each";

  return {
    success: true,
    isCorrect,
    marksAwarded,
    score: participant.score,
    correctCount: participant.correctCount,
    totalMarks,
    percentage,
    explanation: shouldRevealExplanation ? question.explanation : undefined,
  };
}

export function manualGradeStudentAnswer(params: {
  roomCode: string;
  participantId: string;
  questionIndex: number;
  marksAwarded: number;
  hostUserId: string;
}): { success: boolean; error?: string; room?: any } {
  const code = (params.roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return { success: false, error: "Room not found." };
  if (room.hostUserId !== params.hostUserId) {
    return { success: false, error: "Unauthorized: Only the host can grade answers." };
  }

  const participant = room.participants.get(params.participantId);
  if (!participant) return { success: false, error: "Participant not found." };
  const ans = participant.answers[params.questionIndex];
  if (!ans) return { success: false, error: "No submitted response found for this question." };

  const oldMarks = ans.marksAwarded || 0;
  const newMarks = Math.max(0, Number(params.marksAwarded) || 0);
  ans.marksAwarded = newMarks;
  ans.marks = newMarks;
  ans.pointsEarned = Math.round(newMarks * 1000);
  ans.isCorrect = newMarks > 0;
  ans.status = newMarks > 0 ? "Correct" : "Wrong";
  ans.manualGraded = true;
  ans.evaluationStatus = "graded";

  participant.score = Math.max(0, participant.score - oldMarks + newMarks);
  if (newMarks > 0 && oldMarks === 0) {
    participant.correctCount += 1;
    participant.incorrectCount = Math.max(0, participant.incorrectCount - 1);
  } else if (newMarks === 0 && oldMarks > 0) {
    participant.correctCount = Math.max(0, participant.correctCount - 1);
    participant.incorrectCount += 1;
  }

  broadcastRoomState(code);
  return { success: true, room: getFullRoomForHost(code) };
}

// ==========================================
// HOST CONTROLS (START, PAUSE, NEXT, END)
// ==========================================

export function removeStudentFromQuizRoom(params: {
  roomCode: string;
  participantId: string;
  hostUserId?: string;
}): { success: boolean; error?: string; room?: any } {
  const code = (params.roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return { success: false, error: "Room not found." };

  if (room.hostUserId && params.hostUserId && params.hostUserId !== room.hostUserId) {
    return { success: false, error: "Unauthorized: Only the host can remove students." };
  }

  const p = room.participants.get(params.participantId);
  if (!p) {
    return { success: true, room: getFullRoomForHost(code) };
  }

  if (!room.removedParticipantIds) room.removedParticipantIds = new Set();
  if (!room.removedUserIds) room.removedUserIds = new Set();

  room.removedParticipantIds.add(params.participantId);
  if (p.userId) {
    room.removedUserIds.add(p.userId);
  }

  // Remove participant from room
  room.participants.delete(params.participantId);

  // Send real-time removal event to connected clients
  broadcastRoomEvent(code, {
    type: "participant_removed",
    participantId: params.participantId,
    userId: p.userId,
    message: "You were removed by the host.",
  });

  // Broadcast updated room state
  broadcastRoomState(code);

  return { success: true, room: getFullRoomForHost(code) };
}

export function handleRoomControl(params: {
  roomCode: string;
  action: string;
  hostUserId?: string;
  participantId?: string;
}): { success: boolean; room?: any; error?: string; chatDisabled?: boolean } {
  const code = (params.roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return { success: false, error: "Room not found. Check the 6-character code." };

  // Host authorization check
  if (room.hostUserId && params.hostUserId && params.hostUserId !== room.hostUserId) {
    return { success: false, error: "Unauthorized: Only the host can manage this quiz room." };
  }

  const normalizedAction = params.action === "next_question" ? "next" : params.action;

  switch (normalizedAction) {
    case "start":
      if (room.questions.length === 0) {
        return { success: false, error: "Cannot start an assessment without any questions." };
      }
      room.status = "in_progress";
      room.currentQuestionIndex = 0;
      room.questionStartTime = Date.now();
      room.quizStartTime = Date.now();
      room.showLeaderboard = false;
      break;

    case "next":
      if (room.currentQuestionIndex + 1 < room.questions.length) {
        const prevQIdx = room.currentQuestionIndex;
        if (prevQIdx >= 0 && prevQIdx < room.questions.length) {
          const prevQ = room.questions[prevQIdx];
          const correctOpt = formatCorrectOptionLabel(prevQ);
          for (const p of room.participants.values()) {
            if (!p.answers[prevQIdx]) {
              p.answers[prevQIdx] = {
                studentId: p.id,
                studentName: p.displayName,
                questionId: prevQ.id,
                questionIndex: prevQIdx,
                selectedOption: "—",
                selectedAnswer: undefined,
                correctOption: correctOpt,
                correctOptionId: correctOpt,
                isAnswered: false,
                isCorrect: false,
                marksAwarded: 0,
                marks: 0,
                pointsEarned: 0,
                status: "Not Answered",
                timeTakenMs: 0,
                submittedAt: 0,
                answeredAt: 0,
                explanation: prevQ.explanation || "",
              };
            }
          }
        }
        room.currentQuestionIndex += 1;
        room.questionStartTime = Date.now();
        room.status = "in_progress";
        room.showLeaderboard = false;
      } else {
        // All questions completed: finish assessment
        finalizeRoomResults(room);
      }
      break;

    case "pause":
      room.status = "paused";
      break;

    case "resume":
      room.status = "in_progress";
      // extend start time to account for pause
      room.questionStartTime = Date.now();
      break;

    case "toggle_leaderboard":
      room.showLeaderboard = !room.showLeaderboard;
      break;

    case "toggle_chat":
    case "disable_chat":
    case "enable_chat":
      room.chatDisabled = params.action === "disable_chat" ? true : (params.action === "enable_chat" ? false : !room.chatDisabled);
      broadcastRoomEvent(code, {
        type: "chat_status",
        chatDisabled: room.chatDisabled,
      });
      broadcastRoomState(code);
      return { success: true, chatDisabled: room.chatDisabled, room: getFullRoomForHost(code) };

    case "remove_participant":
      if (!params.participantId) {
        return { success: false, error: "participantId is required to remove student." };
      }
      return removeStudentFromQuizRoom({
        roomCode: code,
        participantId: params.participantId,
        hostUserId: params.hostUserId,
      });

    case "end":
      finalizeRoomResults(room);
      break;

    case "cancel":
      room.status = "ended";
      room.endedAt = Date.now();
      broadcastRoomEvent(code, {
        type: "room_cancelled",
        message: "The host has cancelled this live room.",
      });
      break;

    default:
      return { success: false, error: `Unknown host action: ${params.action}` };
  }

  // Broadcast state update to everyone in room
  broadcastRoomState(code);

  return { success: true, room: getFullRoomForHost(code) };
}

function finalizeRoomResults(room: LiveQuizRoom) {
  room.status = "ended";
  room.endedAt = Date.now();
  room.showLeaderboard = true;

  const totalMarks = room.questions.reduce((sum, q) => sum + (q.marks || room.marksPerCorrect || 1), 0);

  // Authoritative re-evaluation of all participants across all questions
  for (const p of room.participants.values()) {
    p.completedAt = Date.now();
    let computedCorrect = 0;
    let computedIncorrect = 0;
    let computedUnanswered = 0;
    let computedScore = 0;

    room.questions.forEach((q, qIdx) => {
      const ans = p.answers[qIdx];
      const correctOpt = formatCorrectOptionLabel(q);

      if (ans && ans.isAnswered !== false && (ans.selectedIndex !== undefined || ans.selectedIndices !== undefined || ans.selectedAnswer !== undefined || (ans.selectedOption && ans.selectedOption !== "—"))) {
        ans.isAnswered = true;
        ans.status = ans.isCorrect ? "Correct" : "Wrong";
        ans.marks = ans.marksAwarded;
        ans.correctOption = correctOpt;
        if (ans.isCorrect) {
          computedCorrect++;
          computedScore += ans.marksAwarded;
        } else {
          computedIncorrect++;
          computedScore = Math.max(0, computedScore + ans.marksAwarded);
        }
      } else {
        computedUnanswered++;
        p.answers[qIdx] = {
          studentId: p.id,
          studentName: p.displayName,
          questionId: q.id,
          questionIndex: qIdx,
          selectedOption: "—",
          selectedAnswer: undefined,
          correctOption: correctOpt,
          correctOptionId: correctOpt,
          isAnswered: false,
          isCorrect: false,
          marksAwarded: 0,
          marks: 0,
          pointsEarned: 0,
          status: "Not Answered",
          timeTakenMs: 0,
          submittedAt: 0,
          answeredAt: 0,
          explanation: q.explanation || "",
        };
      }
    });

    p.correctCount = computedCorrect;
    p.incorrectCount = computedIncorrect;
    p.unansweredCount = computedUnanswered;
    p.score = computedScore;
  }

  // Sort participants by score desc, correctCount desc, displayName asc
  const sortedParticipants = Array.from(room.participants.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.displayName.localeCompare(b.displayName);
  });

  // Calculate ranks with proper tie handling
  let currentRank = 1;
  sortedParticipants.forEach((p, idx) => {
    if (idx > 0) {
      const prev = sortedParticipants[idx - 1];
      if (p.score === prev.score && p.correctCount === prev.correctCount) {
        // Tied with previous participant
      } else {
        currentRank = idx + 1;
      }
    }
    const finalRank = currentRank;

    if (p.userId) {
      if (!userCompletedQuizzes.has(p.userId)) {
        userCompletedQuizzes.set(p.userId, []);
      }
      userCompletedQuizzes.get(p.userId)!.push({
        roomId: room.id,
        roomCode: room.roomCode,
        quizTitle: room.title,
        subject: room.subject,
        score: p.score,
        totalMarks,
        totalQuestions: room.questions.length,
        correctCount: p.correctCount,
        rank: finalRank,
        totalParticipants: sortedParticipants.length,
        completedAt: Date.now(),
      });
    }
  });

  broadcastRoomState(room.roomCode);
}

// ==========================================
// REAL-TIME WEBSOCKET & SYNC LOOP
// ==========================================

export function broadcastRoomState(roomCode: string) {
  const code = (roomCode || "").trim().toUpperCase();
  const conns = roomConnections.get(code);
  const room = rooms.get(code);
  if (!conns || !room) return;

  const hostPayload = JSON.stringify({ type: "state_update", room: getFullRoomForHost(code) });

  for (const conn of conns) {
    if (conn.ws.readyState === WebSocket.OPEN) {
      try {
        if (conn.isHost) {
          conn.ws.send(hostPayload);
        } else {
          const participantPayload = JSON.stringify({
            type: "state_update",
            room: sanitizeRoomForParticipant(room, conn.participantId),
          });
          conn.ws.send(participantPayload);
        }
      } catch {
        // ignore send error
      }
    }
  }
}

function broadcastRoomEvent(roomCode: string, payload: any) {
  const conns = roomConnections.get(roomCode);
  if (!conns) return;

  const msg = JSON.stringify(payload);
  for (const conn of conns) {
    if (conn.ws.readyState === WebSocket.OPEN) {
      try {
        conn.ws.send(msg);
      } catch {
        // ignore send error
      }
    }
  }
}

export function setupLiveQuizWebSocket(server: Server) {
  const quizWss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/quiz-live") {
      quizWss.handleUpgrade(request, socket, head, (ws) => {
        quizWss.emit("connection", ws, request);
      });
    }
  });

  quizWss.on("connection", (ws, request: any) => {
    let currentRoomCode: string | null = null;
    let currentConn: ClientConnection = { ws };

    // Auto-subscribe from connection URL query parameters if present
    try {
      const reqUrl = new URL(request?.url || "", `http://${request?.headers?.host || "localhost"}`);
      const queryRoomCode = (reqUrl.searchParams.get("roomCode") || "").trim().toUpperCase();
      const queryIsHost = reqUrl.searchParams.get("isHost") === "true";
      const queryParticipantId = reqUrl.searchParams.get("participantId") || undefined;

      if (queryRoomCode) {
        currentRoomCode = queryRoomCode;
        currentConn = {
          ws,
          participantId: queryParticipantId,
          isHost: queryIsHost,
        };

        if (!roomConnections.has(queryRoomCode)) {
          roomConnections.set(queryRoomCode, new Set());
        }
        roomConnections.get(queryRoomCode)!.add(currentConn);

        const room = rooms.get(queryRoomCode);
        if (room) {
          if (queryParticipantId && !queryIsHost) {
            const p = room.participants.get(queryParticipantId);
            if (p) {
              if (p.disconnectGraceTimeout) {
                clearTimeout(p.disconnectGraceTimeout);
                p.disconnectGraceTimeout = undefined;
              }
              const hasAnsweredCur = room.currentQuestionIndex >= 0 && !!p.answers[room.currentQuestionIndex];
              p.connectionStatus = hasAnsweredCur ? "Submitted" : "Active";
              p.lastSeenAt = Date.now();
              // Broadcast updated roster to host
              broadcastRoomState(queryRoomCode);
            }
          }

          ws.send(
            JSON.stringify({
              type: "sync",
              room: queryIsHost ? getFullRoomForHost(queryRoomCode) : sanitizeRoomForParticipant(room, queryParticipantId),
            })
          );
        }
      }
    } catch {
      // ignore url parse error
    }

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === "subscribe") {
          const roomCode = (data.roomCode || "").trim().toUpperCase();
          if (roomCode) {
            // Remove previous conn if room changed
            if (currentRoomCode && currentRoomCode !== roomCode && roomConnections.has(currentRoomCode)) {
              roomConnections.get(currentRoomCode)!.delete(currentConn);
            }

            currentRoomCode = roomCode;
            currentConn = {
              ws,
              participantId: data.participantId,
              isHost: !!data.isHost,
            };

            if (!roomConnections.has(roomCode)) {
              roomConnections.set(roomCode, new Set());
            }
            roomConnections.get(roomCode)!.add(currentConn);

            const room = rooms.get(roomCode);
            if (room) {
              if (data.participantId && !data.isHost) {
                const p = room.participants.get(data.participantId);
                if (p) {
                  if (p.disconnectGraceTimeout) {
                    clearTimeout(p.disconnectGraceTimeout);
                    p.disconnectGraceTimeout = undefined;
                  }
                  const hasAnsweredCur = room.currentQuestionIndex >= 0 && !!p.answers[room.currentQuestionIndex];
                  p.connectionStatus = hasAnsweredCur ? "Submitted" : "Active";
                  p.lastSeenAt = Date.now();
                  broadcastRoomState(roomCode);
                }
              }

              ws.send(
                JSON.stringify({
                  type: "sync",
                  room: data.isHost ? getFullRoomForHost(roomCode) : sanitizeRoomForParticipant(room, data.participantId),
                })
              );
            }
          }
        } else if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", serverTime: Date.now() }));
        }
      } catch (err) {
        console.error("Live quiz websocket message error:", err);
      }
    });

    ws.on("close", () => {
      const roomCode = currentRoomCode;
      const participantId = currentConn.participantId;
      const isHost = currentConn.isHost;

      if (roomCode && roomConnections.has(roomCode)) {
        roomConnections.get(roomCode)!.delete(currentConn);
      }

      if (roomCode && participantId && !isHost) {
        const room = rooms.get(roomCode);
        const p = room?.participants.get(participantId);
        if (p) {
          if (p.disconnectGraceTimeout) {
            clearTimeout(p.disconnectGraceTimeout);
          }
          // 4-second grace period to absorb page refreshes and momentary packet drops
          p.disconnectGraceTimeout = setTimeout(() => {
            const conns = roomConnections.get(roomCode);
            let hasActiveConn = false;
            if (conns) {
              for (const c of conns) {
                if (c.participantId === participantId && c.ws.readyState === WebSocket.OPEN) {
                  hasActiveConn = true;
                  break;
                }
              }
            }
            if (!hasActiveConn) {
              const liveRoom = rooms.get(roomCode);
              const liveP = liveRoom?.participants.get(participantId);
              if (liveP && liveP.connectionStatus !== "Submitted") {
                liveP.connectionStatus = "Disconnected";
                broadcastRoomState(roomCode);
              }
            }
          }, 4000);
        }
      }
    });
  });

  // Server-authoritative timer synchronization loop (ticks every 1 second)
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      if (room.status === "in_progress" && room.questionStartTime) {
        const timeElapsedSec = Math.floor((now - room.questionStartTime) / 1000);
        const timeRemaining = Math.max(0, room.timePerQuestion - timeElapsedSec);

        // Broadcast authoritative time tick to keep all clients perfectly in sync
        broadcastRoomEvent(code, {
          type: "time_tick",
          questionIndex: room.currentQuestionIndex,
          timeRemaining,
          serverTime: now,
        });
      }
    }
  }, 1000);
}

// Optional AI Question Assistant (never replaces manual questions silently)
export async function generateAIQuestions(params: {
  subject: string;
  branch: string;
  college?: string;
  regulation?: string;
  programType?: string;
  year?: string;
  semester?: string;
  topic?: string;
  unit?: string;
  count: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed";
}): Promise<AcademicQuestionDraft[]> {
  const count = Math.min(25, Math.max(1, params.count || 5));

  const prompt = `You are an academic assessment author creating questions for the institution and program explicitly selected below.
Create questions only for the stated subject and academic level. Do not claim alignment to a regulation or official syllabus unless actual source text was supplied; use the selected academic details only as context.
Institution: ${params.college || "Not specified"}
Regulation / curriculum: ${params.regulation || "Not specified"}
Degree / program: ${params.programType || "Not specified"}
Year / level: ${params.year || "Not specified"}
Term / semester: ${params.semester || "Not specified"}
Generate ${count} assessment multiple-choice questions.
Subject: "${params.subject}"
Branch / major: "${params.branch}"
Unit / topic: "${params.unit || params.topic || "Not specified"}"
Difficulty: ${params.difficulty}.

Return valid JSON only using this structure. Field descriptions are not to be copied as answer content:
[
  {
    "questionText": "A clear question answerable within the selected subject",
    "options": ["Plausible answer one", "Plausible answer two", "Plausible answer three", "Plausible answer four"],
    "correctAnswers": [0],
    "explanation": "Explain why the correct answer is right.",
    "marks": 1,
    "negativeMarks": 0
  }
]
Each question must have exactly four non-empty options and a correctAnswers array containing valid zero-based option indexes. Do not invent a source citation, college-specific fact, or regulation-specific claim.
No markdown codeblocks. Output raw JSON only.`;

  const errors: string[] = [];
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiModels = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    for (const model of geminiModels) {
      try {
        const resp = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        const rawText = resp.text?.trim() || "";
        const parsed = extractJSON(rawText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validQuestions = parsed.filter((question) =>
            question &&
            typeof (question.questionText || question.question) === "string" &&
            String(question.questionText || question.question).trim().length > 0 &&
            Array.isArray(question.options) &&
            question.options.length === 4 &&
            question.options.every((option) => typeof option === "string" && option.trim().length > 0) &&
            Array.isArray(question.correctAnswers) &&
            question.correctAnswers.length > 0 &&
            question.correctAnswers.every((index) => Number.isInteger(index) && index >= 0 && index < question.options.length) &&
            typeof question.explanation === "string" && question.explanation.trim().length > 0
          );
          if (validQuestions.length === 0) throw new Error("The AI returned no quiz questions with a valid answer key. Please retry.");
          return validQuestions.map((question, idx) => ({
            id: `q_${idx + 1}_${Date.now().toString(36)}`,
            questionNumber: idx + 1,
            questionType: "single_mcq" as const,
            questionText: String(question.questionText || question.question).trim(),
            options: question.options.map((option) => option.trim()),
            correctAnswers: question.correctAnswers,
            explanation: question.explanation.trim(),
            marks: typeof question.marks === "number" && question.marks > 0 ? question.marks : 1,
            negativeMarks: typeof question.negativeMarks === "number" && question.negativeMarks >= 0 ? question.negativeMarks : 0,
            isComplete: true,
          }));
        }
      } catch (err: any) {
        errors.push(`Gemini (${model}): ${err?.message || err}`);
      }
    }
  }

  // NVIDIA Fallback
  const nvidiaKeys = [
    process.env.NVIDIA_API_KEY,
    process.env.NVIDIA_KEY_1,
    process.env.NVIDIA_API_KEY_2,
    process.env.NVIDIA_API_KEY_3,
  ].filter(Boolean) as string[];

  for (const nKey of nvidiaKeys) {
    try {
      const client = new OpenAI({
        apiKey: nKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      const resp = await client.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
      const rawText = resp.choices[0]?.message?.content?.trim() || "";
      const parsed = extractJSON(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q, idx) => ({
          id: `q_${idx + 1}_${Date.now().toString(36)}`,
          questionNumber: idx + 1,
          questionType: "single_mcq" as const,
          questionText: q.questionText || q.question || `Question ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
          correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [typeof q.correctIndex === "number" ? q.correctIndex : 0],
          explanation: q.explanation || "Correct as per VR25 syllabus.",
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0,
          isComplete: true,
        }));
      }
    } catch (err: any) {
      errors.push(`NVIDIA: ${err?.message || err}`);
    }
  }

  throw new Error(`Unable to generate questions: ${errors.slice(-2).join("; ") || "No AI API configured"}`);
}

function extractJSON(text: string): any {
  if (!text) throw new Error("Empty AI response");
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // continue
      }
    }
    throw new Error("Unable to parse JSON from AI response");
  }
}
