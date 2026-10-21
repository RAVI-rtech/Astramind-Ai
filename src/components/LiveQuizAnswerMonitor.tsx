import React, { useState } from "react";
import { CheckCircle2, Clock, Users, Eye, EyeOff, Trash2, XCircle, AlertCircle, Award } from "lucide-react";

export interface AnswerMonitorParticipant {
  id: string;
  displayName: string;
  rollNumber?: string;
  branch?: string;
  section?: string;
  status: "Active" | "Disconnected" | "Submitted" | "Answered" | "Not Answered" | string;
  connectionStatus?: "Active" | "Disconnected" | "Submitted";
  selectedOption: string;
  correctOption?: string;
  isCorrect?: boolean;
  marks?: number;
  submittedAt?: number;
  textAnswer?: string;
  manualGraded?: boolean;
  evaluationStatus?: "graded" | "pending_manual_review";
}

interface LiveQuizAnswerMonitorProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  hideAnswers?: boolean;
  participants: Array<{
    id: string;
    displayName: string;
    rollNumber?: string;
    branch?: string;
    section?: string;
    status?: string;
    connectionStatus?: "Active" | "Disconnected" | "Submitted";
    selectedOption?: string;
    correctOption?: string;
    isCorrect?: boolean;
    marks?: number;
    hasAnswered?: boolean;
    answeredCurrentQuestion?: boolean;
    currentAnswer?: {
      selectedIndex?: number;
      selectedOptionIndex?: number;
      selectedIndices?: number[];
      selectedAnswer?: any;
      selectedOption?: string;
      correctOption?: string;
      isCorrect?: boolean;
      marks?: number;
      submittedAt?: number;
      textAnswer?: string;
      manualGraded?: boolean;
      evaluationStatus?: "graded" | "pending_manual_review";
    } | null;
  }>;
  answerMonitorData?: {
    total: number;
    answered: number;
    waiting?: number;
    notAnswered?: number;
    active?: number;
    disconnected?: number;
    submitted?: number;
    correctOption?: string;
    list: AnswerMonitorParticipant[];
  };
  onRemoveStudent?: (participantId: string, displayName: string) => void;
  onGradeAnswer?: (participantId: string, questionIndex: number, marks: number) => void;
}

export const LiveQuizAnswerMonitor: React.FC<LiveQuizAnswerMonitorProps> = ({
  currentQuestionIndex,
  totalQuestions,
  hideAnswers = false,
  participants,
  answerMonitorData,
  onRemoveStudent,
  onGradeAnswer,
}) => {
  const [gradingParticipantId, setGradingParticipantId] = useState<string | null>(null);

  // If structured answerMonitorData is provided by getFullRoomForHost, use it;
  // otherwise fallback cleanly to mapping the participants list.
  const monitorList: AnswerMonitorParticipant[] =
    answerMonitorData?.list && answerMonitorData.list.length > 0
      ? answerMonitorData.list
      : participants.map((p) => {
          const hasAns = !!(
            p.answeredCurrentQuestion ||
            p.hasAnswered ||
            p.currentAnswer ||
            p.status === "Answered" ||
            p.status === "Submitted"
          );
          const rawConn = p.connectionStatus || (hasAns ? "Submitted" : (p.status === "Disconnected" ? "Disconnected" : "Active"));
          return {
            id: p.id,
            displayName: p.displayName,
            rollNumber: p.rollNumber,
            branch: p.branch,
            section: p.section,
            status: rawConn,
            connectionStatus: rawConn as any,
            selectedOption: p.selectedOption || p.currentAnswer?.selectedOption || (hasAns ? "Submitted" : "—"),
            correctOption: p.correctOption || p.currentAnswer?.correctOption || answerMonitorData?.correctOption,
            isCorrect: p.isCorrect ?? p.currentAnswer?.isCorrect,
            marks: p.marks ?? p.currentAnswer?.marks,
            submittedAt: p.currentAnswer?.submittedAt,
            textAnswer: p.currentAnswer?.textAnswer,
            manualGraded: p.currentAnswer?.manualGraded,
            evaluationStatus: p.currentAnswer?.evaluationStatus,
          };
        });

  const total = answerMonitorData?.total ?? monitorList.length;
  const activeCount = answerMonitorData?.active ?? monitorList.filter((m) => m.status === "Active").length;
  const submittedCount =
    answerMonitorData?.submitted ??
    answerMonitorData?.answered ??
    monitorList.filter((m) => m.status === "Submitted" || m.status === "Answered").length;
  const disconnectedCount =
    answerMonitorData?.disconnected ??
    monitorList.filter((m) => m.status === "Disconnected").length;

  return (
    <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-lg overflow-hidden">
      {/* Header with Title and Live Counters */}
      <div className="px-4 py-3 bg-neutral-950/60 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            {hideAnswers ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-indigo-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Live Proctor Monitor
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              {hideAnswers && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Projector Safe Mode
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active: {activeCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Submitted: {submittedCount} / {total}
          </span>
          {disconnectedCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Disconnected: {disconnectedCount}
            </span>
          )}
        </div>
      </div>

      {/* Roster Table / List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-neutral-800/50 scrollbar-thin scrollbar-thumb-neutral-700">
        {monitorList.length === 0 ? (
          <div className="p-5 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-neutral-600" />
            No students registered in this room.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/30 border-b border-neutral-800/60">
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-2.5">Live Status</th>
                <th className="py-2.5 px-2 text-center">Response</th>
                {!hideAnswers && <th className="py-2.5 px-2 text-center">Correct Key</th>}
                <th className="py-2.5 px-3 text-right">Host Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {monitorList.map((p) => {
                const isSubmitted = p.status === "Submitted" || p.status === "Answered";
                const isDisconnected = p.status === "Disconnected";
                const hasPendingManual = p.evaluationStatus === "pending_manual_review";

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isSubmitted
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : isDisconnected
                        ? "bg-rose-500/5 hover:bg-rose-500/10"
                        : "hover:bg-neutral-800/30"
                    }`}
                  >
                    {/* Student Name & Academic Details */}
                    <td className="py-2 px-3 font-medium text-neutral-200 max-w-[190px]">
                      <div className="font-semibold text-white truncate text-xs flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isDisconnected
                              ? "bg-rose-500"
                              : isSubmitted
                              ? "bg-indigo-400"
                              : "bg-emerald-400 animate-pulse"
                          }`}
                        />
                        <span className="truncate">{p.displayName}</span>
                      </div>
                      {(p.rollNumber || p.branch || p.section) && (
                        <div className="text-[10px] text-neutral-400 font-mono truncate flex items-center gap-1 mt-0.5 pl-3">
                          {p.rollNumber && <span className="font-medium text-slate-300">{p.rollNumber}</span>}
                          {p.branch && <span>• {p.branch}</span>}
                          {p.section && <span>• {p.section}</span>}
                        </div>
                      )}
                    </td>

                    {/* Live Status Badge */}
                    <td className="py-2 px-2.5">
                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                          Submitted
                        </span>
                      ) : isDisconnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          Disconnected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Selected Option or Typed Answer */}
                    <td className="py-2 px-2 text-center">
                      {isSubmitted && p.selectedOption && p.selectedOption !== "—" ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs max-w-[130px] truncate ${
                              hideAnswers
                                ? "bg-neutral-800 text-neutral-200 border border-neutral-700"
                                : p.isCorrect
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : p.isCorrect === false && !hasPendingManual
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            }`}
                            title={p.textAnswer || p.selectedOption}
                          >
                            {p.textAnswer ? `"${p.textAnswer}"` : p.selectedOption}
                          </span>
                          {hasPendingManual && (
                            <span className="text-[9px] text-amber-400 font-semibold mt-0.5">
                              Pending Evaluation
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-500 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Correct Option (Hidden on classroom digital boards/projectors) */}
                    {!hideAnswers && (
                      <td className="py-2 px-2 text-center">
                        <span className="font-mono text-xs font-semibold text-indigo-300 max-w-[120px] truncate inline-block">
                          {p.correctOption || answerMonitorData?.correctOption || "—"}
                        </span>
                      </td>
                    )}

                    {/* Actions: Manual Grading & Student Removal */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasPendingManual && onGradeAnswer && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onGradeAnswer(p.id, currentQuestionIndex, 1)}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all cursor-pointer"
                              title="Award Marks"
                            >
                              Award Marks
                            </button>
                            <button
                              onClick={() => onGradeAnswer(p.id, currentQuestionIndex, 0)}
                              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                              title="0 Marks"
                            >
                              0m
                            </button>
                          </div>
                        )}

                        {onRemoveStudent && (
                          <button
                            onClick={() => onRemoveStudent(p.id, p.displayName)}
                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title={`Remove ${p.displayName} from this exam`}
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
