import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Users,
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  Clock,
  Award,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  Shield,
  Zap,
  HelpCircle,
  GraduationCap,
  Layers,
  BookOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Flame,
  Info,
  Eye,
  EyeOff,
  Edit3
} from "lucide-react";
import {
  LiveQuizRoom,
  LiveQuizQuestion,
  LiveQuizParticipant,
  UserProfile
} from "../types";
import { AcademicQuizDraft } from "../types/academicLiveQuiz";
import { VITS_BRANCHES } from "../lib/studyWorkspaceStorage";
import { getSupabaseAuthHeaders } from "../lib/supabase";
import AcademicQuizCreator from "./livequiz/AcademicQuizCreator";
import AcademicQuizHistory from "./livequiz/AcademicQuizHistory";
import { LiveQuizLobbyChat } from "./LiveQuizLobbyChat";
import { LiveQuizAnswerMonitor } from "./LiveQuizAnswerMonitor";
import { LiveQuizHostReports } from "./livequiz/LiveQuizHostReports";
import { downloadStudentReportPDF, downloadCompleteQuizReportPDF, buildStudentCompleteReportData } from "../utils/quizPdfGenerator";

interface LiveQuizPageProps {
  userProfile?: UserProfile | null;
  onBackToDashboard?: () => void;
  onOpenAuth?: (redirectReason?: string) => void;
}

type ViewMode = "lobby-choice" | "host-create" | "host-game" | "student-join" | "student-game" | "history";

export default function LiveQuizPage({ userProfile, onBackToDashboard, onOpenAuth }: LiveQuizPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("lobby-choice");

  // Selected draft for editing / resuming
  const [resumedDraft, setResumedDraft] = useState<AcademicQuizDraft | null>(null);

  // Active Room State
  const [activeRoom, setActiveRoom] = useState<LiveQuizRoom | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [myParticipantId, setMyParticipantId] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRemovedByHost, setIsRemovedByHost] = useState(false);
  const [hostReportTab, setHostReportTab] = useState<"reports" | "scoreboard">("reports");
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Host Screen Answers Toggle (for classroom projectors and digital boards)
  const [hideAnswersOnHost, setHideAnswersOnHost] = useState(false);

  // Student join state
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // In-Game student state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<number[]>([]);
  const [studentTextAnswer, setStudentTextAnswer] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [showStudentScoreboard, setShowStudentScoreboard] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    isCorrect?: boolean;
    marksAwarded?: number;
    score?: number;
    correctCount?: number;
    totalMarks?: number;
    percentage?: number;
    explanation?: string;
  } | null>(null);

  // Resume Quiz Feature: Ongoing attempt detection & restoration
  const [resumableSession, setResumableSession] = useState<{
    roomCode: string;
    participantId: string;
    displayName: string;
    quizTitle?: string;
    subject?: string;
    currentQuestionIndex?: number;
    totalQuestions?: number;
  } | null>(null);
  const [isResumingQuiz, setIsResumingQuiz] = useState(false);

  // Check for existing ongoing attempt on mount / lobby visit
  useEffect(() => {
    const checkOngoingAttempt = async () => {
      try {
        const stored = localStorage.getItem("astramind_active_quiz_session");
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (!parsed?.roomCode || !parsed?.participantId) return;

        const authHeaders = await getSupabaseAuthHeaders();
        const resp = await fetch(`/api/live-quiz/room/${parsed.roomCode}?participantId=${parsed.participantId}`, {
          headers: authHeaders,
        });
        const data = await resp.json();
        if (data.success && data.room) {
          if (data.room.status !== "ended" && !data.room.isRemoved) {
            setResumableSession({
              roomCode: parsed.roomCode,
              participantId: parsed.participantId,
              displayName: parsed.displayName,
              quizTitle: data.room.title,
              subject: data.room.subject,
              currentQuestionIndex: data.room.currentQuestionIndex,
              totalQuestions: data.room.questions?.length,
            });
          } else {
            localStorage.removeItem("astramind_active_quiz_session");
          }
        }
      } catch {
        // ignore storage/network check failure
      }
    };
    checkOngoingAttempt();
  }, [viewMode]);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Setup WebSocket connection & Polling
  useEffect(() => {
    if (!activeRoom?.roomCode) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/quiz-live?roomCode=${activeRoom.roomCode}&isHost=${isHost ? "true" : "false"}&participantId=${myParticipantId}`;
    
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setWsConnection(ws);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "participant_removed") {
            if (data.participantId && data.participantId === myParticipantId) {
              setIsRemovedByHost(true);
            }
          }
          if ((data.type === "state_update" || data.type === "state_changed" || data.type === "sync" || data.type === "participant_joined" || data.type === "answer_submitted" || data.type === "participant_removed" || data.type === "chat_status") && data.room) {
            if (data.room.isRemoved || (data.room.removedParticipantIds && myParticipantId && data.room.removedParticipantIds.includes(myParticipantId))) {
              setIsRemovedByHost(true);
            }
            setActiveRoom(data.room);
          } else if (data.type === "timer_tick") {
            setActiveRoom((prev) => prev ? { ...prev, timeRemaining: data.timeRemaining } : null);
          } else if (data.type === "quiz_ended") {
            setActiveRoom(data.room);
          }
        } catch (err) {
          console.error("WS Parse error:", err);
        }
      };

      ws.onerror = () => {
        console.warn("Live Quiz WS fallback to HTTP polling");
      };
    } catch (e) {
      console.warn("WebSocket init failed:", e);
    }

    // Polling fallback every 2s
    const pollInterval = setInterval(async () => {
      try {
        const authHeaders = await getSupabaseAuthHeaders();
        const resp = await fetch(`/api/live-quiz/room/${activeRoom.roomCode}?isHost=${isHost}&participantId=${myParticipantId}`, {
          headers: authHeaders,
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.room) {
            if (data.room.isRemoved || (data.room.removedParticipantIds && myParticipantId && data.room.removedParticipantIds.includes(myParticipantId))) {
              setIsRemovedByHost(true);
            }
            setActiveRoom(data.room);
          }
        }
      } catch (e) {
        // ignore polling error
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
      setWsConnection(null);
    };
  }, [activeRoom?.roomCode, isHost, myParticipantId]);

  // Reset answer selection when question changes
  useEffect(() => {
    setSelectedOption(null);
    setSelectedMultiOptions([]);
    setStudentTextAnswer("");
    setAnswerSubmitted(false);
    setSubmissionFeedback(null);
  }, [activeRoom?.currentQuestionIndex]);

  // Launch Room from Academic Quiz Creator
  const handleLaunchAcademicRoom = async (draft: AcademicQuizDraft) => {
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      if (!authHeaders.Authorization) {
        onOpenAuth?.("Please sign in to launch live quiz assessment.");
        return;
      }

      const questionsPayload = draft.questions.map((q) => ({
        id: q.id,
        question: q.questionText,
        options: q.options,
        correctIndex: q.correctAnswers[0] ?? 0,
        correctIndices: q.correctAnswers,
        questionType: q.questionType,
        explanation: q.explanation || "",
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        blanksExpected: q.blanksExpected,
        acceptedAlternatives: q.acceptedAlternatives,
        caseSensitive: q.caseSensitive,
        trimWhitespace: q.trimWhitespace,
        shortAnswerGrading: q.shortAnswerGrading,
        keywords: q.keywords,
        sampleAnswer: q.sampleAnswer,
      }));

      const resp = await fetch("/api/live-quiz/create", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: draft.title,
          college: draft.college,
          regulation: draft.regulation,
          programType: draft.programType,
          subject: draft.subject,
          branch: draft.branch,
          year: draft.year,
          semester: draft.semester,
          unit: draft.unit,
          topic: draft.topic,
          hostName: draft.hostName || userProfile?.name || "Faculty / Host",
          timePerQuestion: draft.timerType === "per_question" ? draft.timePerQuestion || 30 : 30,
          durationMinutes: draft.timerType === "overall" ? draft.durationMinutes || 15 : undefined,
          timerType: draft.timerType,
          difficulty: draft.difficulty,
          assessmentType: draft.assessmentType,
          marksPerCorrect: draft.marksPerCorrect,
          negativeMarks: draft.negativeMarks,
          explanationPolicy: draft.explanationPolicy,
          questionOrder: draft.questionOrder,
          mode: "Classic",
          questions: questionsPayload,
        }),
      });

      const data = await resp.json();
      if (resp.status === 401) {
        onOpenAuth?.("Please sign in to launch live quiz assessment.");
        return;
      }

      if (data.success && data.room) {
        setActiveRoom(data.room);
        setIsHost(true);
        setViewMode("host-game");
      } else {
        alert(data.error || "Failed to launch room. Please try again.");
      }
    } catch (err: any) {
      console.error("Create room failed:", err);
      alert("Error connecting to live assessment service.");
    }
  };

  // Join Room as Student
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = joinRoomCode.trim().toUpperCase();

    if (!normalizedCode) {
      setJoinError("Room not found. Check the 6-character code.");
      return;
    }

    if (normalizedCode.length !== 6 || !/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setJoinError("Room not found. Check the 6-character code.");
      return;
    }

    const authHeaders = await getSupabaseAuthHeaders();
    if (!authHeaders.Authorization) {
      setJoinError("Please sign in to join the quiz.");
      onOpenAuth?.("Please sign in to join the quiz.");
      return;
    }

    setIsJoining(true);
    setJoinError("");

    try {
      const resp = await fetch("/api/live-quiz/join", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: normalizedCode,
          displayName: joinDisplayName.trim() || userProfile?.name || "Student",
          rollNumber: userProfile?.rollNumber || userProfile?.roll_number || "",
          branch: userProfile?.branch || "",
          section: userProfile?.section || "",
        }),
      });

      const data = await resp.json();
      if (resp.status === 401) {
        setJoinError("Please sign in to join the quiz.");
        onOpenAuth?.("Please sign in to join the quiz.");
        return;
      }

      if (data.success && data.room) {
        setActiveRoom(data.room);
        setIsHost(false);
        setMyParticipantId(data.participantId);
        setViewMode("student-game");
        try {
          localStorage.setItem("astramind_active_quiz_session", JSON.stringify({
            roomCode: normalizedCode,
            participantId: data.participantId,
            displayName: joinDisplayName.trim() || userProfile?.name || "Student",
            savedAt: Date.now(),
          }));
        } catch {
          // ignore
        }
      } else {
        setJoinError(data.error || "Failed to join room.");
      }
    } catch (e: any) {
      setJoinError("Connection failure. Please check network.");
    } finally {
      setIsJoining(false);
    }
  };

  // Resume Existing In-Progress Quiz Attempt
  const handleResumeActiveQuiz = async () => {
    if (!resumableSession) return;
    setIsResumingQuiz(true);
    setJoinError("");
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch(`/api/live-quiz/room/${resumableSession.roomCode}?participantId=${resumableSession.participantId}`, {
        headers: authHeaders,
      });
      const data = await resp.json();
      if (!data.success || !data.room) {
        setJoinError("Unable to resume this quiz. The session has concluded or expired.");
        localStorage.removeItem("astramind_active_quiz_session");
        setResumableSession(null);
        return;
      }

      const room = data.room;
      if (room.status === "ended") {
        setJoinError("This quiz has already concluded.");
        localStorage.removeItem("astramind_active_quiz_session");
        setResumableSession(null);
        return;
      }

      setActiveRoom(room);
      setMyParticipantId(resumableSession.participantId);
      setIsHost(false);
      setViewMode("student-game");

      // Restore participant's submitted response for the active question if already answered
      const participant = room.participants?.find((p: any) => p.id === resumableSession.participantId);
      if (participant && room.currentQuestionIndex >= 0) {
        const curAns = participant.answers?.[room.currentQuestionIndex];
        if (curAns && (curAns.isAnswered || curAns.submittedAt)) {
          setAnswerSubmitted(true);
          if (curAns.selectedIndex !== undefined) setSelectedOption(curAns.selectedIndex);
          if (Array.isArray(curAns.selectedIndices)) setSelectedMultiOptions(curAns.selectedIndices);
          if (curAns.textAnswer) setStudentTextAnswer(curAns.textAnswer);
          setSubmissionFeedback({
            isCorrect: curAns.isCorrect,
            marksAwarded: curAns.marksAwarded,
            score: participant.score,
            correctCount: participant.correctCount,
            totalMarks: room.totalMarks,
            explanation: curAns.explanation,
          });
        } else {
          setAnswerSubmitted(false);
          setSelectedOption(null);
          setSelectedMultiOptions([]);
          setStudentTextAnswer("");
          setSubmissionFeedback(null);
        }
      }
    } catch {
      setJoinError("Network error while resuming assessment.");
    } finally {
      setIsResumingQuiz(false);
    }
  };

  // Submit Textual Answer for Fill in the Blank and Short Answer
  const handleSubmitTextAnswer = async () => {
    if (isRemovedByHost || answerSubmitted || !activeRoom || activeRoom.status !== "in_progress") return;
    if (!studentTextAnswer.trim()) {
      alert("Please enter your answer before submitting.");
      return;
    }
    setAnswerSubmitted(true);

    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/submit", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: activeRoom.roomCode,
          participantId: myParticipantId,
          questionIndex: activeRoom.currentQuestionIndex,
          textAnswer: studentTextAnswer.trim(),
          selectedAnswer: studentTextAnswer.trim(),
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setSubmissionFeedback({
          isCorrect: data.isCorrect,
          marksAwarded: data.marksAwarded,
          score: data.score,
          correctCount: data.correctCount,
          totalMarks: data.totalMarks,
          percentage: data.percentage,
          explanation: data.explanation,
        });
      }
    } catch (e) {
      console.error("Submit text answer failed:", e);
    }
  };

  // Submit Answer as Student
  const handleSubmitSingleAnswer = async (optIdx: number) => {
    if (isRemovedByHost || answerSubmitted || !activeRoom || activeRoom.status !== "in_progress") return;
    setSelectedOption(optIdx);
    setAnswerSubmitted(true);

    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/submit", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: activeRoom.roomCode,
          participantId: myParticipantId,
          questionIndex: activeRoom.currentQuestionIndex,
          selectedIndex: optIdx,
          selectedOptionIndex: optIdx,
          selectedAnswer: optIdx,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setSubmissionFeedback({
          isCorrect: data.isCorrect,
          marksAwarded: data.marksAwarded,
          score: data.score,
          correctCount: data.correctCount,
          totalMarks: data.totalMarks,
          percentage: data.percentage,
          explanation: data.explanation,
        });
      }
    } catch (e) {
      console.error("Submit answer failed:", e);
    }
  };

  const handleSubmitMultipleAnswer = async () => {
    if (isRemovedByHost || answerSubmitted || !activeRoom || activeRoom.status !== "in_progress") return;
    if (selectedMultiOptions.length === 0) {
      alert("Please select at least one option before submitting.");
      return;
    }
    setAnswerSubmitted(true);

    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/submit", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: activeRoom.roomCode,
          participantId: myParticipantId,
          questionIndex: activeRoom.currentQuestionIndex,
          selectedIndex: selectedMultiOptions[0],
          selectedOptionIndex: selectedMultiOptions[0],
          selectedIndices: selectedMultiOptions,
          selectedAnswer: selectedMultiOptions,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setSubmissionFeedback({
          isCorrect: data.isCorrect,
          marksAwarded: data.marksAwarded,
          score: data.score,
          correctCount: data.correctCount,
          totalMarks: data.totalMarks,
          percentage: data.percentage,
          explanation: data.explanation,
        });
      }
    } catch (e) {
      console.error("Submit multi answer failed:", e);
    }
  };

  const toggleMultiOption = (idx: number) => {
    if (answerSubmitted) return;
    setSelectedMultiOptions((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Host Controls
  const handleHostControl = async (action: "start" | "next_question" | "end" | "pause" | "toggle_leaderboard") => {
    if (!activeRoom) return;
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/control", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: activeRoom.roomCode,
          action,
        }),
      });
      const data = await resp.json();
      if (data.success && data.room) {
        setActiveRoom(data.room);
      }
    } catch (e) {
      console.error("Control failed:", e);
    }
  };

  // Host Action: Remove Student
  const handleRemoveStudent = async (participantId: string, displayName?: string) => {
    if (!activeRoom) return;
    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${displayName || "this student"} from the assessment? Their access will be revoked immediately and they cannot submit further answers.`
    );
    if (!confirmRemove) return;

    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/remove-student", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: activeRoom.roomCode,
          participantId,
        }),
      });
      const data = await resp.json();
      if (data.success && data.room) {
        setActiveRoom(data.room);
      }
    } catch (err) {
      console.error("Failed to remove student:", err);
    }
  };

  // Host Action: Manual Grade Student Answer
  const handleGradeStudentAnswer = async (participantId: string, questionIndex: number, marksAwarded: number) => {
    if (!activeRoom) return;
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/grade-answer", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: activeRoom.roomCode,
          participantId,
          questionIndex,
          marksAwarded,
        }),
      });
      const data = await resp.json();
      if (data.success && data.room) {
        setActiveRoom(data.room);
      }
    } catch (err) {
      console.error("Failed to grade answer:", err);
    }
  };

  // Host Action: Toggle Lobby Chat
  const handleToggleChat = async () => {
    if (!activeRoom) return;
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const action = activeRoom.chatDisabled ? "enable_chat" : "disable_chat";
      const resp = await fetch("/api/live-quiz/control", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: activeRoom.roomCode,
          action,
        }),
      });
      const data = await resp.json();
      if (data.success && data.room) {
        setActiveRoom(data.room);
      }
    } catch (err) {
      console.error("Failed to toggle chat:", err);
    }
  };

  const copyRoomCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Authoritative participants list derivation
  const participantsList: any[] = useMemo(() => {
    if (!activeRoom?.participants) return [];
    return Array.isArray(activeRoom.participants)
      ? activeRoom.participants
      : Object.values(activeRoom.participants);
  }, [activeRoom?.participants]);

  // Authoritative server-synchronized leaderboard with academic tie handling
  const leaderboard: any[] = useMemo(() => {
    if (Array.isArray(activeRoom?.leaderboard) && activeRoom.leaderboard.length > 0) {
      return activeRoom.leaderboard;
    }
    const sorted = [...participantsList].sort((a, b) => {
      const scoreA = Number(a.score ?? 0);
      const scoreB = Number(b.score ?? 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      const corA = Number(a.correctCount ?? 0);
      const corB = Number(b.correctCount ?? 0);
      if (corB !== corA) return corB - corA;
      return String(a.displayName || "").localeCompare(String(b.displayName || ""));
    });

    let curRank = 1;
    return sorted.map((p, idx) => {
      if (idx > 0) {
        const prev = sorted[idx - 1];
        if (p.score === prev.score && p.correctCount === prev.correctCount) {
          // Tied with previous participant
        } else {
          curRank = idx + 1;
        }
      }
      return {
        ...p,
        rank: curRank,
      };
    });
  }, [activeRoom?.leaderboard, participantsList]);

  // Authoritative current student stats (marks, score, rank, correct count, etc.)
  const myStats = useMemo(() => {
    if (activeRoom?.myParticipant) {
      return activeRoom.myParticipant;
    }
    const found = participantsList.find((p) => p.id === myParticipantId);
    const foundRank = leaderboard.find((l) => l.id === myParticipantId)?.rank ?? 1;
    const totalMarks = activeRoom?.totalMarks || activeRoom?.questions?.length || 1;
    const score = found?.score ?? 0;
    const correctCount = found?.correctCount ?? 0;
    const incorrectCount = found?.incorrectCount ?? 0;
    const unansweredCount = found?.unansweredCount ?? Math.max(0, (activeRoom?.questions?.length ?? 0) - (correctCount + incorrectCount));
    const percentage = totalMarks > 0 ? Math.round((Math.max(0, score) / totalMarks) * 100) : 0;
    return {
      ...found,
      score,
      correctCount,
      incorrectCount,
      unansweredCount,
      rank: foundRank,
      totalMarks,
      percentage,
    };
  }, [activeRoom?.myParticipant, participantsList, myParticipantId, leaderboard, activeRoom?.totalMarks, activeRoom?.questions]);

  const currentQ = activeRoom ? activeRoom.questions[activeRoom.currentQuestionIndex] : null;
  const isCurrentMultiSelect = (currentQ as any)?.questionType === "multiple_mcq" || (Array.isArray((currentQ as any)?.correctIndices) && (currentQ as any).correctIndices.length > 1);

  return (
    <div className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 max-w-5xl mx-auto w-full mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-2.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Live Academic Assessment</span>
          </div>
          <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
            Live Assessment
          </h1>
          <p className="text-sm text-white/50 mt-1 font-normal tracking-wide">
            Real-time synchronized assessments for schools, colleges, universities, and independent learners
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {viewMode === "lobby-choice" && (
            <button
              onClick={() => {
                if (!userProfile) {
                  onOpenAuth?.("Please sign in to view your quiz history and drafts.");
                  return;
                }
                setViewMode("history");
              }}
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>My History &amp; Drafts</span>
            </button>
          )}

          {viewMode !== "lobby-choice" && (
            <button
              onClick={() => setViewMode("lobby-choice")}
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
            >
              Lobby
            </button>
          )}

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Sign-in prompt if not authenticated */}
      {!userProfile && (
        <div className="relative z-10 max-w-5xl mx-auto w-full mb-6 p-5 rounded-[24px] bg-[#151517] border border-[#a78bfa]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#a78bfa] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Sign-in Required for Live Quiz</p>
              <p className="text-xs text-white/60">
                Please sign in to enter Live Quiz, create academic rooms, or join class sessions.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenAuth?.("Please sign in to enter Live Quiz.")}
            className="px-5 py-2.5 bg-white text-[#0d0d0e] hover:bg-slate-200 font-semibold rounded-full text-xs transition shadow-md whitespace-nowrap cursor-pointer"
          >
            Sign In to Continue
          </button>
        </div>
      )}

      {/* ======================================================= */}
      {/* 1. LOBBY CHOICE (JOIN OR CREATE) */}
      {/* ======================================================= */}
      {viewMode === "lobby-choice" && (
        <div className="relative z-10 max-w-5xl mx-auto w-full space-y-6 my-auto">
          {/* Ongoing Attempt Resumption Banner */}
          {resumableSession && (
            <div className="p-5 sm:p-6 rounded-[24px] bg-gradient-to-r from-indigo-950/90 via-[#18181b] to-purple-950/90 border border-indigo-500/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in-50">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Ongoing Quiz In Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-white tracking-widest">
                      PIN: {resumableSession.roomCode}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                    {resumableSession.quizTitle || "Live Academic Assessment"}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Candidate: <strong>{resumableSession.displayName}</strong>
                    {resumableSession.currentQuestionIndex !== undefined && (
                      <span> • Question {resumableSession.currentQuestionIndex + 1} of {resumableSession.totalQuestions || "—"}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("astramind_active_quiz_session");
                    setResumableSession(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleResumeActiveQuiz}
                  disabled={isResumingQuiz}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isResumingQuiz ? (
                    "Reconnecting..."
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Resume Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Join Room Card */}
            <div className="p-7 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] hover:border-[#a78bfa]/40 transition-all flex flex-col justify-between shadow-2xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-[#a78bfa] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="font-serif-studio text-2xl font-medium text-white">Join Live Assessment</h2>
                <p className="text-xs text-white/50 mt-2 leading-relaxed font-normal">
                  Enter the 6-character room PIN provided by your course faculty or host to enter the live synchronized assessment session.
                </p>
              </div>

              <form onSubmit={handleJoinRoom} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-mono-studio uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                    6-Character Room PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinRoomCode}
                    onChange={(e) => {
                      setJoinRoomCode(e.target.value.toUpperCase());
                      setJoinError("");
                    }}
                    placeholder="e.g. VT7M9K"
                    className="w-full text-center text-xl font-mono font-bold tracking-widest px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Your Name / Roll No
                  </label>
                  <input
                    type="text"
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                    placeholder={userProfile?.name || "e.g. 23891A0501 / Rahul"}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {joinError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{joinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isJoining ? (
                    "Connecting..."
                  ) : (
                    <>
                      Enter Assessment Room <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Host Assessment Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/70 border border-neutral-800 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-2xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Host Academic Quiz</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    Faculty & Student Leads
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Build custom assessments mapped to the VITS VR25 curriculum (All 4 Years & Branches). Create manual questions or draft comprehensive unit tests with persistent drafts.
                </p>

                <div className="mt-4 space-y-2 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VR25 Syllabus mapping (Year, Sem, Subject, Unit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Manual Question Builder with full formatting & scoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live real-time roster & synchronized countdown timers</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => {
                    if (!userProfile) {
                      onOpenAuth?.("Please sign in to enter Live Quiz.");
                      return;
                    }
                    setResumedDraft(null);
                    setViewMode("host-create");
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Academic Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 2. ACADEMIC ASSESSMENT CREATOR (4-STEP WIZARD) */}
      {/* ======================================================= */}
      {viewMode === "host-create" && (
        <AcademicQuizCreator
          initialDraft={resumedDraft || undefined}
          userProfile={userProfile}
          onLaunchRoom={handleLaunchAcademicRoom}
          onCancel={() => setViewMode("lobby-choice")}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* ======================================================= */}
      {/* 3. ASSESSMENT HISTORY & DRAFTS */}
      {/* ======================================================= */}
      {viewMode === "history" && (
        <AcademicQuizHistory
          onLoadDraft={(draft) => {
            setResumedDraft(draft);
            setViewMode("host-create");
          }}
          onClose={() => setViewMode("lobby-choice")}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* ======================================================= */}
      {/* 4. HOST LIVE GAME & LOBBY DASHBOARD */}
      {/* ======================================================= */}
      {viewMode === "host-game" && activeRoom && (
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Room PIN & Info Banner */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  VR25 • {activeRoom.branch} ({activeRoom.year} Year)
                </span>
                <span className="text-xs text-neutral-400">
                  {activeRoom.subject} {activeRoom.unit ? `• Unit ${activeRoom.unit}` : ""}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-indigo-400 flex items-center gap-3">
                {activeRoom.roomCode}
                <button
                  onClick={copyRoomCode}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs flex items-center gap-1 font-sans font-normal"
                  title="Copy 6-digit room PIN"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="text-[11px]">{copiedCode ? "Copied" : "Copy PIN"}</span>
                </button>
              </div>
              <div className="text-xs font-semibold text-neutral-200 mt-1">{activeRoom.title}</div>
            </div>

            {/* Host Controls */}
            <div className="flex items-center gap-2">
              {activeRoom.status === "lobby" && (
                <button
                  onClick={() => handleHostControl("start")}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Play className="w-4 h-4" /> Start Assessment
                </button>
              )}
              {activeRoom.status === "in_progress" && (
                <>
                  {/* Hide Answers Toggle for classroom digital boards / projectors */}
                  <button
                    onClick={() => setHideAnswersOnHost(!hideAnswersOnHost)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      hideAnswersOnHost
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
                    }`}
                    title="Toggle hiding answer keys and indicators for classroom digital boards / projectors"
                  >
                    {hideAnswersOnHost ? (
                      <>
                        <EyeOff className="w-4 h-4 text-amber-400" />
                        <span>Hide Answers (ON)</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-neutral-400" />
                        <span>Hide Answers</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleHostControl("toggle_leaderboard")}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeRoom.showLeaderboard
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    }`}
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    {activeRoom.showLeaderboard ? "Hide Scoreboard" : "Live Scoreboard"}
                  </button>
                  <button
                    onClick={() => handleHostControl("next_question")}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleHostControl("end")}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                  >
                    End Quiz
                  </button>
                </>
              )}
              {activeRoom.status === "ended" && (
                <button
                  onClick={() => setViewMode("lobby-choice")}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
                >
                  Host Another Assessment
                </button>
              )}
            </div>
          </div>

          {/* If Waiting in Lobby: Live Student Roster & Live Lobby Chat */}
          {activeRoom.status === "lobby" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Participants Panel, Lobby Status, Room PIN, Start Quiz Button */}
              <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Lobby Open
                    </div>
                    <span className="text-xs text-neutral-400">
                      Subject: <strong className="text-white">{activeRoom.subject}</strong>
                    </span>
                  </div>

                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                      <Users className="w-6 h-6 text-indigo-400" />
                      Connected Students: {participantsList.length}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Share the 6-character room code with students to join this assessment session.
                    </p>
                  </div>

                  {/* High Visibility Room Code Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/80 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                        Live Assessment Room PIN
                      </div>
                      <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white mt-0.5">
                        {activeRoom.roomCode}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeRoom.roomCode);
                        alert(`Copied room code ${activeRoom.roomCode} to clipboard!`);
                      }}
                      className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy PIN
                    </button>
                  </div>
                </div>

                {/* Participants List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                    <span className="uppercase tracking-wider">Student Roster ({participantsList.length})</span>
                    <span className="text-[11px] text-neutral-500">Auto-updating in real-time</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-2.5 max-h-56 overflow-y-auto p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800/80 min-h-[90px]">
                    {participantsList.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-200 border border-neutral-700/80 shadow-sm flex items-center justify-between gap-3 hover:border-neutral-600 transition-colors"
                      >
                        <div className="flex flex-col min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate font-semibold">{p.displayName}</span>
                          </div>
                          {(p.rollNumber || p.branch) && (
                            <div className="text-[10px] text-neutral-400 font-mono pl-3 truncate max-w-[180px]">
                              {p.rollNumber ? `${p.rollNumber} • ` : ""}{p.branch || ""}{p.section ? ` (${p.section})` : ""}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(p.id, p.displayName)}
                          className="px-2 py-0.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          title={`Remove ${p.displayName}`}
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Remove
                        </button>
                      </div>
                    ))}
                    {participantsList.length === 0 && (
                      <p className="text-xs text-neutral-500 italic py-4 w-full text-center">
                        Waiting for students to enter room code <strong className="text-indigo-400 font-mono">{activeRoom.roomCode}</strong>...
                      </p>
                    )}
                  </div>
                </div>

                {/* Primary Start Quiz Button */}
                <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-neutral-400">
                    {participantsList.length === 0
                      ? "Waiting for at least 1 student to start"
                      : "Ready to launch! All students will receive Question 1 simultaneously."}
                  </span>
                  <button
                    onClick={() => handleHostControl("start")}
                    disabled={participantsList.length === 0}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-white" /> Start Quiz Assessment
                  </button>
                </div>
              </div>

              {/* Right Col: Live Lobby Chat Panel */}
              <div className="lg:col-span-1">
                <LiveQuizLobbyChat
                  roomCode={activeRoom.roomCode}
                  quizId={activeRoom.quizId || activeRoom.id}
                  isHost={true}
                  currentUserDisplayName={activeRoom.hostName || userProfile?.name || "Host"}
                  currentUserId={userProfile?.id}
                  ws={wsConnection}
                  chatDisabled={activeRoom.chatDisabled}
                  onToggleChat={handleToggleChat}
                />
              </div>
            </div>
          )}

          {/* If In Progress: Host Live Proctor Monitor */}
          {activeRoom.status === "in_progress" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Question Preview & Host Real-Time Answer Monitor */}
              <div className="md:col-span-2 p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      QUESTION {activeRoom.currentQuestionIndex + 1} OF {activeRoom.questions.length}
                    </span>
                    {(currentQ as any)?.marks && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        +{(currentQ as any).marks} marks
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Dedicated classroom digital board projector safe toggle */}
                    <button
                      type="button"
                      onClick={() => setHideAnswersOnHost(!hideAnswersOnHost)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        hideAnswersOnHost
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
                      }`}
                      title="Hide correct answers on digital boards or projector displays"
                    >
                      {hideAnswersOnHost ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>Answers Hidden</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Hide Answers</span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-2 font-mono text-sm font-bold text-amber-400 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">
                      <Clock className="w-4 h-4" /> {activeRoom.timeRemaining ?? activeRoom.timePerQuestion}s
                    </div>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white">
                  {currentQ?.question}
                </h3>

                {/* Answer Options & Key Display (Masked when Hide Answers is active for projector mode) */}
                {currentQ?.questionType === "fill_blank" ? (
                  hideAnswersOnHost ? (
                    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-300 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-indigo-300">
                        <Edit3 className="w-4 h-4 text-indigo-400" />
                        <span>Fill in the Blank Question — Text Response Expected</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                        Answer Key Hidden for Projector
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs space-y-1.5">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Expected Answer: &quot;{(currentQ as any).blanksExpected?.[0] || "—"}&quot;
                      </div>
                      {(currentQ as any).acceptedAlternatives?.length > 0 && (
                        <div className="text-[11px] text-neutral-300">
                          Accepted Alternatives: {(currentQ as any).acceptedAlternatives.join(", ")}
                        </div>
                      )}
                    </div>
                  )
                ) : currentQ?.questionType === "short_answer" ? (
                  hideAnswersOnHost ? (
                    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs text-neutral-300 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-purple-300">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span>Short Answer Question ({currentQ.shortAnswerGrading === "manual" ? "Manual Host Grading" : "Automatic Keyword Matching"})</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                        Rubric Hidden for Projector
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-500/10 text-xs space-y-1.5">
                      <div className="font-bold text-purple-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-400" />
                        Model Answer &amp; Rubric ({currentQ.shortAnswerGrading === "manual" ? "Manual Host Evaluation" : "Auto Keyword Match"}):
                      </div>
                      <p className="text-neutral-300 text-xs leading-relaxed">
                        {currentQ.sampleAnswer || (currentQ.keywords && `Keywords: ${currentQ.keywords.join(", ")}`) || "Subjective evaluation"}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQ?.options.map((opt, optIdx) => {
                      const isCorrect = (currentQ as any).correctIndices
                        ? (currentQ as any).correctIndices.includes(optIdx)
                        : optIdx === currentQ.correctIndex;
                      const showHighlight = isCorrect && !hideAnswersOnHost;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                            showHighlight
                              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold"
                              : "bg-neutral-950/40 border-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span className="font-mono text-neutral-500">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                          {showHighlight && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* FEATURE 2: REAL-TIME HOST ANSWER MONITOR */}
                <div className="pt-2">
                  <LiveQuizAnswerMonitor
                    currentQuestionIndex={activeRoom.currentQuestionIndex}
                    totalQuestions={activeRoom.questions.length}
                    hideAnswers={hideAnswersOnHost}
                    participants={participantsList}
                    answerMonitorData={(activeRoom as any).answerMonitor}
                    onRemoveStudent={handleRemoveStudent}
                    onGradeAnswer={handleGradeStudentAnswer}
                  />
                </div>

                <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleHostControl("next_question")}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      Next Question <ChevronRight className="w-4 h-4" />
                    </button>
                    <span>
                      Total Submissions:{" "}
                      <strong className="text-white">
                        {participantsList.filter((p) => p.answeredCurrentQuestion || p.hasAnswered).length}
                      </strong>{" "}
                      / {participantsList.length}
                    </span>
                  </div>
                  {!hideAnswersOnHost && currentQ?.explanation && (
                    <span className="text-[11px] text-neutral-400 truncate max-w-xs">
                      Explanation: {currentQ.explanation}
                    </span>
                  )}
                </div>
              </div>

              {/* Live Leaderboard */}
              <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Live Scoreboard
                  </h4>
                  <span className="text-[10px] text-neutral-400">{leaderboard.length} ranked</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {leaderboard.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            p.rank === 1
                              ? "bg-amber-500/20 text-amber-400"
                              : p.rank === 2
                              ? "bg-neutral-400/20 text-neutral-300"
                              : p.rank === 3
                              ? "bg-amber-700/20 text-amber-600"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {p.rank}
                        </span>
                        <span className="font-semibold text-white truncate max-w-[110px]">
                          {p.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-neutral-400 text-[11px]">{p.correctCount ?? 0} cor</span>
                        <span className="font-bold text-indigo-400">{p.score ?? 0}m</span>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-xs text-neutral-500 italic text-center py-4">No participants joined yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* If Concluded: Final Results, Comprehensive Reports & Analysis */}
          {activeRoom.status === "ended" && (
            <div className="space-y-6">
              {/* Host Navigation Tabs: Class Reports vs Live Scoreboard */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHostReportTab("reports")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      hostReportTab === "reports"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Class Reports & PDF
                  </button>
                  <button
                    onClick={() => setHostReportTab("scoreboard")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      hostReportTab === "scoreboard"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    <Award className="w-4 h-4" /> Scoreboard Ranking
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadCompleteQuizReportPDF(activeRoom)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Download Complete Quiz Report PDF
                  </button>
                </div>
              </div>

              {/* Tab 1: Comprehensive Reports Section */}
              {hostReportTab === "reports" && (
                <LiveQuizHostReports room={activeRoom} />
              )}

              {/* Tab 2: Merit Leaderboard Ranking */}
              {hostReportTab === "scoreboard" && (
                <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
                  <div className="text-center py-4 border-b border-neutral-800">
                    <Award className="w-14 h-14 text-amber-400 mx-auto mb-2" />
                    <h3 className="text-2xl font-black text-white">Assessment Complete!</h3>
                    <p className="text-xs text-neutral-400 mt-1">Official Authoritative Scorecard & Merit Rankings</p>
                  </div>

                  <div className="space-y-3 max-w-2xl mx-auto">
                    {leaderboard.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-neutral-950/50 border border-neutral-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                              p.rank === 1
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : p.rank === 2
                                ? "bg-neutral-300/20 text-neutral-200"
                                : p.rank === 3
                                ? "bg-amber-700/20 text-amber-500"
                                : "bg-neutral-800 text-neutral-300"
                            }`}
                          >
                            #{p.rank}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-white">{p.displayName}</div>
                            <div className="text-xs text-neutral-400">
                              Score: {p.score ?? 0} marks • Correct: {p.correctCount ?? 0} / {activeRoom.questions.length}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-base font-black text-indigo-400">{p.score ?? 0} marks</div>
                          <div className="text-[10px] text-neutral-500">
                            Accuracy: {activeRoom.questions.length > 0 ? Math.round(((p.correctCount ?? 0) / activeRoom.questions.length) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* 5. STUDENT LIVE GAME VIEW */}
      {/* ======================================================= */}
      {viewMode === "student-game" && activeRoom && (
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Check if student was removed by host */}
          {(isRemovedByHost || (activeRoom as any)?.isRemoved || activeRoom.status === "removed") ? (
            <div className="max-w-md mx-auto p-8 sm:p-10 rounded-3xl bg-neutral-900/90 border border-rose-500/40 text-center space-y-5 shadow-2xl my-12">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  You were removed by the host.
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                  Your access to this live assessment session has been revoked by the instructor. You cannot continue answering questions in this session.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveRoom(null);
                  setIsRemovedByHost(false);
                  setViewMode("lobby-choice");
                }}
                className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
              >
                Return to Lobby Choice
              </button>
            </div>
          ) : (
            <>
              {/* Waiting in Lobby: Status, Room PIN, & Live Lobby Chat */}
              {activeRoom.status === "lobby" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Student Waiting Room Status & Connected Students */}
                  <div className="lg:col-span-2 p-8 sm:p-10 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
                        <Users className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Room PIN: {activeRoom.roomCode}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3">
                          You are in the Quiz Lobby
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-md mx-auto">
                          Waiting for faculty host <strong className="text-white">{activeRoom.hostName}</strong> to start the assessment...
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/80 inline-block text-xs text-neutral-300 font-medium">
                        {participantsList.length} students connected in lobby
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg mx-auto max-h-40 overflow-y-auto p-2">
                        {participantsList.map((p) => (
                          <span
                            key={p.id}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                              p.id === myParticipantId
                                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40 font-semibold"
                                : "bg-neutral-800/70 text-neutral-400 border-neutral-700/60"
                            }`}
                          >
                            {p.displayName} {p.id === myParticipantId ? "(You)" : ""}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800/60 text-xs text-neutral-400 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Connected! As soon as the host starts, your screen will switch to Question 1 automatically.
                    </div>
                  </div>

                  {/* Right Col: Live Lobby Chat */}
                  <div className="lg:col-span-1">
                    <LiveQuizLobbyChat
                      roomCode={activeRoom.roomCode}
                      quizId={activeRoom.quizId || activeRoom.id}
                      isHost={false}
                      currentUserDisplayName={userProfile?.name || "Student"}
                      currentUserId={userProfile?.id}
                      ws={wsConnection}
                      chatDisabled={activeRoom.chatDisabled}
                    />
                  </div>
                </div>
              )}

          {/* In-Game Student View */}
          {activeRoom.status === "in_progress" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/70 border border-neutral-800 space-y-6 shadow-2xl">
              {/* Question Header & Timer */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      QUESTION {activeRoom.currentQuestionIndex + 1} OF {activeRoom.questions.length}
                    </span>
                    {(currentQ as any)?.marks && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        +{(currentQ as any).marks} Marks
                      </span>
                    )}
                    {(currentQ as any)?.negativeMarks > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                        -{(currentQ as any).negativeMarks}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {activeRoom.subject} {activeRoom.unit ? `• Unit ${activeRoom.unit}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowStudentScoreboard(!showStudentScoreboard)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      showStudentScoreboard || activeRoom.showLeaderboard
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Scoreboard</span>
                  </button>
                  <div className="flex items-center gap-2 font-mono text-base sm:text-lg font-black text-amber-400 bg-neutral-950 px-3.5 py-1.5 rounded-xl border border-neutral-800">
                    <Clock className="w-4 h-4" /> {activeRoom.timeRemaining ?? activeRoom.timePerQuestion}s
                  </div>
                </div>
              </div>

              {/* Student Realtime Stats Bar */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-neutral-400">Rank: </span>
                    <strong className="text-indigo-400 font-bold">#{myStats.rank}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Score: </span>
                    <strong className="text-emerald-400 font-bold">{myStats.score} Marks</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Correct: </span>
                    <strong className="text-white font-bold">{myStats.correctCount}</strong>
                  </div>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Total: {myStats.totalMarks} Marks
                </div>
              </div>

              {/* Live Scoreboard Card (when toggled or enabled by host) */}
              {(showStudentScoreboard || activeRoom.showLeaderboard) && (
                <div className="p-4 rounded-2xl bg-neutral-950/90 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" /> Live Standings
                    </h4>
                    <span className="text-[10px] text-neutral-400">Real-time college rankings</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {leaderboard.map((p) => {
                      const isMe = p.id === myParticipantId;
                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isMe
                              ? "bg-indigo-600/20 border-indigo-500/50 text-white font-bold"
                              : "bg-neutral-900/60 border-neutral-800 text-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                p.rank === 1
                                  ? "bg-amber-500/20 text-amber-400"
                                  : p.rank === 2
                                  ? "bg-neutral-300/20 text-neutral-200"
                                  : p.rank === 3
                                  ? "bg-amber-700/20 text-amber-500"
                                  : "bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              {p.rank}
                            </span>
                            <span className="truncate max-w-[130px]">{p.displayName}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-neutral-400 text-[10px]">{p.correctCount ?? 0} cor</span>
                            <span className="font-bold text-indigo-400">{p.score ?? 0} pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQ?.question}
              </h3>

              {isCurrentMultiSelect && (
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Multiple Choice: Select all options that apply, then click Submit Answer.</span>
                </div>
              )}

              {/* Question Answering Section: Fill in Blank, Short Answer, or Options */}
              {currentQ?.questionType === "fill_blank" ? (
                /* Fill in the Blank Student Input */
                <div className="space-y-4 p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>Type your answer for the blank below:</span>
                  </div>
                  <input
                    type="text"
                    disabled={answerSubmitted}
                    value={studentTextAnswer}
                    onChange={(e) => setStudentTextAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !answerSubmitted && studentTextAnswer.trim()) {
                        handleSubmitTextAnswer();
                      }
                    }}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono tracking-wide"
                  />
                  {!answerSubmitted && (
                    <button
                      onClick={handleSubmitTextAnswer}
                      disabled={!studentTextAnswer.trim()}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer"
                    >
                      Submit Answer
                    </button>
                  )}
                </div>
              ) : currentQ?.questionType === "short_answer" ? (
                /* Short Answer Student Textarea */
                <div className="space-y-4 p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span>Type your explanatory response:</span>
                    </div>
                    {currentQ?.shortAnswerGrading === "manual" && (
                      <span className="text-[10px] text-amber-400 font-normal">
                        Subjective response • Evaluated by host
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    disabled={answerSubmitted}
                    value={studentTextAnswer}
                    onChange={(e) => setStudentTextAnswer(e.target.value)}
                    placeholder="Enter your explanation or answer in detail..."
                    className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 font-sans leading-relaxed"
                  />
                  {!answerSubmitted && (
                    <button
                      onClick={handleSubmitTextAnswer}
                      disabled={!studentTextAnswer.trim()}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-lg shadow-purple-600/25 cursor-pointer"
                    >
                      Submit Response
                    </button>
                  )}
                </div>
              ) : (
                /* Multiple Choice & True/False Options */
                <div className="space-y-3">
                  {currentQ?.options.map((opt, optIdx) => {
                    const isSelected = isCurrentMultiSelect
                      ? selectedMultiOptions.includes(optIdx)
                      : selectedOption === optIdx;

                    return (
                      <button
                        key={optIdx}
                        disabled={answerSubmitted}
                        onClick={() =>
                          isCurrentMultiSelect
                            ? toggleMultiOption(optIdx)
                            : handleSubmitSingleAnswer(optIdx)
                        }
                        className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/30 border-indigo-500 text-white font-bold ring-2 ring-indigo-500/50"
                            : answerSubmitted
                            ? "bg-neutral-950/30 border-neutral-850 text-neutral-500 opacity-60"
                            : "bg-neutral-950/50 border-neutral-800 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900"
                        }`}
                      >
                        <span className="w-7 h-7 rounded-xl bg-neutral-800 flex items-center justify-center font-mono text-xs font-bold text-neutral-400 shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple Select Submit Button */}
              {isCurrentMultiSelect && !answerSubmitted && (
                <button
                  onClick={handleSubmitMultipleAnswer}
                  disabled={selectedMultiOptions.length === 0}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  Submit Selected Answers
                </button>
              )}

              {/* Submission Feedback */}
              {answerSubmitted && (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-center gap-2 ${
                    currentQ?.questionType === "short_answer" && currentQ?.shortAnswerGrading === "manual"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : submissionFeedback?.isCorrect === true
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : submissionFeedback?.isCorrect === false
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                  }`}>
                    {currentQ?.questionType === "short_answer" && currentQ?.shortAnswerGrading === "manual" ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold">Response recorded! Marked as Pending Review by Host.</span>
                      </>
                    ) : submissionFeedback?.isCorrect === true ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">Correct Answer! +{submissionFeedback.marksAwarded ?? 1} Marks</span>
                      </>
                    ) : submissionFeedback?.isCorrect === false ? (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="font-semibold">Answer recorded. Waiting for timer or next question...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Answer recorded. Waiting for timer or next question...</span>
                      </>
                    )}
                  </div>

                  {submissionFeedback?.explanation && (
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1.5">
                      <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Concept Explanation
                      </div>
                      <p className="text-neutral-300 leading-relaxed">
                        {submissionFeedback.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Concluded Student View */}
          {activeRoom.status === "ended" && (
            <div className="p-6 sm:p-10 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
              <div className="text-center space-y-2">
                <Award className="w-14 h-14 text-amber-400 mx-auto" />
                <h2 className="text-2xl sm:text-3xl font-black text-white">Assessment Concluded!</h2>
                <p className="text-xs text-neutral-400">Official Authoritative Performance Report</p>
              </div>

              {/* Key Metric Scorecards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-[11px] text-neutral-400">College Rank</div>
                  <div className="text-3xl font-black text-indigo-400 mt-1">#{myStats.rank}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">out of {leaderboard.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-[11px] text-neutral-400">Marks Earned</div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">{myStats.score}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Total: {myStats.totalMarks}</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-neutral-400">Percentage</div>
                  <div className="text-3xl font-black text-amber-400 mt-1">{myStats.percentage}%</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Accuracy</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 max-w-lg mx-auto grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-emerald-400 font-black text-base">{myStats.correctCount}</div>
                  <div className="text-[10px] text-neutral-400">Correct Answers</div>
                </div>
                <div>
                  <div className="text-rose-400 font-black text-base">{myStats.incorrectCount}</div>
                  <div className="text-[10px] text-neutral-400">Incorrect</div>
                </div>
                <div>
                  <div className="text-neutral-400 font-black text-base">{myStats.unansweredCount}</div>
                  <div className="text-[10px] text-neutral-400">Unanswered</div>
                </div>
              </div>

              {/* Authoritative Question-by-Question Evaluation Breakdown */}
              {(() => {
                const me = participantsList.find((p) => p.id === myParticipantId);
                const report = me ? buildStudentCompleteReportData(activeRoom, me) : null;
                if (!report || !report.answers || report.answers.length === 0) return null;

                return (
                  <div className="max-w-lg mx-auto p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Answer Evaluation</h3>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {report.answers.length} Questions
                      </span>
                    </div>

                    <div className="space-y-3">
                      {report.answers.map((ans, idx) => {
                        const isCorrect = ans.status === "Correct";
                        const isWrong = ans.status === "Wrong";
                        const isUnanswered = ans.status === "Not Answered";

                        return (
                          <div
                            key={ans.questionId || idx}
                            className={`p-3.5 rounded-xl border transition-all text-xs ${
                              isCorrect
                                ? "bg-emerald-950/20 border-emerald-500/30"
                                : isWrong
                                ? "bg-rose-950/20 border-rose-500/30"
                                : "bg-neutral-900/60 border-neutral-800"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-semibold text-white">
                                <span className="text-indigo-400 font-mono mr-1.5">Q{idx + 1}.</span>
                                {ans.questionText}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                  isCorrect
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : isWrong
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                                }`}
                              >
                                {ans.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/60 text-[11px]">
                              <div>
                                <span className="text-neutral-400 block text-[10px]">Student Answer:</span>
                                <span
                                  className={`font-semibold ${
                                    isCorrect
                                      ? "text-emerald-400"
                                      : isWrong
                                      ? "text-rose-400"
                                      : "text-neutral-400"
                                  }`}
                                >
                                  {ans.selectedOption === "—" ? "Not Answered" : ans.selectedOption}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[10px]">Correct Answer:</span>
                                <span className="font-semibold text-emerald-400">
                                  {ans.correctOption}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/40 text-[11px]">
                              <span className="text-neutral-400">Marks:</span>
                              <span
                                className={`font-mono font-bold ${
                                  isCorrect
                                    ? "text-emerald-400"
                                    : isWrong && ans.marksAwarded < 0
                                    ? "text-rose-400"
                                    : "text-neutral-300"
                                }`}
                              >
                                {ans.marksAwarded > 0 ? `+${ans.marksAwarded}` : ans.marksAwarded}
                              </span>
                            </div>

                            {ans.explanation && (
                              <div className="mt-2 p-2 rounded-lg bg-neutral-900/90 border border-neutral-800/70 text-[11px] text-neutral-300">
                                <span className="font-semibold text-indigo-300 block mb-0.5">Explanation:</span>
                                {ans.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Final Complete Scoreboard */}
              <div className="max-w-lg mx-auto p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> College Leaderboard
                  </span>
                  <span className="text-[10px] text-neutral-400">{leaderboard.length} Participants</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {leaderboard.map((p) => {
                    const isMe = p.id === myParticipantId;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isMe
                            ? "bg-indigo-600/20 border-indigo-500 text-white font-bold"
                            : "bg-neutral-900/60 border-neutral-850 text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                              p.rank === 1
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : p.rank === 2
                                ? "bg-neutral-300/20 text-neutral-200"
                                : p.rank === 3
                                ? "bg-amber-700/20 text-amber-500"
                                : "bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            #{p.rank}
                          </span>
                          <div>
                            <span className="text-white">{p.displayName}</span>
                            {isMe && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/30 text-indigo-300">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-indigo-400">{p.score ?? 0} marks</div>
                          <div className="text-[10px] text-neutral-500">{p.correctCount ?? 0} correct</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-xs mx-auto flex flex-col gap-2">
                <button
                  onClick={() => {
                    const me = participantsList.find((p) => p.id === myParticipantId);
                    if (me) {
                      downloadStudentReportPDF(activeRoom, me);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Download My Report PDF
                </button>
                <button
                  onClick={() => setViewMode("lobby-choice")}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Return to Quiz Lobby
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
