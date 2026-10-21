import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  BookOpen
} from "lucide-react";
import {
  buildStudentCompleteReportData,
  downloadStudentReportPDF,
  downloadCompleteQuizReportPDF,
  StudentQuizReportData
} from "../../utils/quizPdfGenerator";

interface LiveQuizHostReportsProps {
  room: any;
  onClose?: () => void;
}

export const LiveQuizHostReports: React.FC<LiveQuizHostReportsProps> = ({ room, onClose }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingStudentId, setDownloadingStudentId] = useState<string | null>(null);

  // Prepare reports for all participants
  const allStudentsReportData = useMemo(() => {
    const rawList = Array.isArray(room.participants)
      ? room.participants
      : Array.from((room.participants?.values && room.participants.values()) || []);

    return rawList.map((p: any) => buildStudentCompleteReportData(room, p));
  }, [room]);

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return allStudentsReportData;
    const term = searchTerm.toLowerCase();
    return allStudentsReportData.filter((s) =>
      s.displayName.toLowerCase().includes(term)
    );
  }, [allStudentsReportData, searchTerm]);

  // Currently selected student for detailed view
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) {
      return allStudentsReportData[0] || null;
    }
    return allStudentsReportData.find((s) => s.id === selectedStudentId) || null;
  }, [allStudentsReportData, selectedStudentId]);

  const handleDownloadAllPDF = async () => {
    try {
      setIsDownloadingAll(true);
      downloadCompleteQuizReportPDF(room);
    } catch (e) {
      console.error("PDF generation error:", e);
      alert("Failed to generate class PDF report. Please try again.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDownloadSinglePDF = async (student: any) => {
    try {
      setDownloadingStudentId(student.id);
      downloadStudentReportPDF(room, student);
    } catch (e) {
      console.error("Student PDF error:", e);
      alert("Failed to generate student PDF report. Please try again.");
    } finally {
      setDownloadingStudentId(null);
    }
  };

  const totalQuestions = room.questions?.length || 0;
  const totalMarks = room.questions
    ? room.questions.reduce((sum: number, q: any) => sum + (q.marks || room.marksPerCorrect || 1), 0)
    : (room.totalMarks || totalQuestions);

  const avgScore = allStudentsReportData.length > 0
    ? Math.round(
        (allStudentsReportData.reduce((acc, s) => acc + s.score, 0) /
          allStudentsReportData.length) *
          10
      ) / 10
    : 0;

  const avgPercentage = totalMarks > 0 ? Math.round((avgScore / totalMarks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & PDF Actions */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              OFFICIAL FACULTY REPORT
            </span>
            <span className="text-xs text-neutral-400">PIN: {room.roomCode}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Class Assessment Reports & Evaluation
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {room.subject} {room.unit ? `• Unit ${room.unit}` : ""} • {allStudentsReportData.length} students evaluated
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadAllPDF}
            disabled={isDownloadingAll || allStudentsReportData.length === 0}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isDownloadingAll ? "Generating PDF..." : "Download Complete Quiz Report PDF"}
          </button>
        </div>
      </div>

      {/* Class Aggregate Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Total Students
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {allStudentsReportData.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Class Average
          </div>
          <div className="text-2xl font-black text-indigo-400 mt-1">
            {avgScore}m <span className="text-xs font-normal text-neutral-400">({avgPercentage}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Total Questions
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {totalQuestions}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Max Marks
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {totalMarks}m
          </div>
        </div>
      </div>

      {/* Main Reports Layout: Student List & Detailed Question Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Student Roster Summary Table */}
        <div className="lg:col-span-5 rounded-3xl bg-neutral-900/70 border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Student Roster ({allStudentsReportData.length})
              </h3>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-36"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-neutral-800/60">
            {filteredStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                No students found matching your search.
              </div>
            ) : (
              filteredStudents.map((s, idx) => {
                const isSelected = selectedStudent?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`p-3.5 transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-indigo-600/15 border-l-4 border-indigo-500"
                        : "hover:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-neutral-800 text-[10px] font-bold text-neutral-400 flex items-center justify-center shrink-0">
                          #{s.rank || idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-semibold text-xs text-white truncate block">
                            {s.displayName}
                          </span>
                          {(s.rollNumber || s.branch || s.section) && (
                            <span className="text-[10px] text-neutral-400 font-mono truncate block">
                              {[s.rollNumber, s.branch, s.section ? `Sec ${s.section}` : null].filter(Boolean).join(" • ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          {s.score} / {s.totalMarks}m
                        </span>
                        <span className="text-[10px] text-neutral-400 ml-1.5">
                          ({s.percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Chips */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-medium">✓ {s.correctCount}</span>
                        <span className="text-rose-400 font-medium">✗ {s.incorrectCount}</span>
                        <span className="text-neutral-500 font-medium">— {s.unansweredCount}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSinglePDF(s);
                        }}
                        disabled={downloadingStudentId === s.id}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        title="Download Individual PDF"
                      >
                        <Download className="w-2.5 h-2.5" /> PDF
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Cols: Individual Student Detailed Question-by-Question Breakdown */}
        <div className="lg:col-span-7 rounded-3xl bg-neutral-900/70 border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
          {selectedStudent ? (
            <div>
              {/* Selected Student Header Card */}
              <div className="p-5 border-b border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">
                      {selectedStudent.displayName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Rank #{selectedStudent.rank || 1}
                    </span>
                  </div>
                  {(selectedStudent.rollNumber || selectedStudent.branch || selectedStudent.section) && (
                    <div className="text-xs text-indigo-300 font-mono flex items-center gap-2 mt-0.5">
                      {selectedStudent.rollNumber && <span className="font-semibold text-white">{selectedStudent.rollNumber}</span>}
                      {selectedStudent.branch && <span>• {selectedStudent.branch}</span>}
                      {selectedStudent.section && <span>• Section {selectedStudent.section}</span>}
                    </div>
                  )}
                  <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>
                      Score: <strong className="text-white">{selectedStudent.score}</strong> / {selectedStudent.totalMarks} marks
                    </span>
                    <span>•</span>
                    <span>
                      Percentage: <strong className="text-emerald-400">{selectedStudent.percentage}%</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Correct: <strong className="text-emerald-400">{selectedStudent.correctCount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Wrong: <strong className="text-rose-400">{selectedStudent.incorrectCount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Unanswered: <strong className="text-neutral-400">{selectedStudent.unansweredCount}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadSinglePDF(selectedStudent)}
                  disabled={downloadingStudentId === selectedStudent.id}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Student Report PDF</span>
                </button>
              </div>

              {/* List of Every Question for this Student */}
              <div className="p-4 overflow-y-auto max-h-[540px] space-y-3">
                {selectedStudent.answers.map((ans, qIdx) => {
                  const isCorrect = ans.status === "Correct";
                  const isWrong = ans.status === "Wrong";
                  const isUnanswered = ans.status === "Not Answered";

                  return (
                    <div
                      key={qIdx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCorrect
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : isWrong
                          ? "bg-rose-500/5 border-rose-500/20"
                          : "bg-neutral-950/40 border-neutral-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-neutral-400">
                              Q{qIdx + 1}
                            </span>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Correct (+{ans.marksAwarded}m)
                              </span>
                            )}
                            {isWrong && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Wrong ({ans.marksAwarded ?? 0}m)
                              </span>
                            )}
                            {isUnanswered && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Not Answered (0m)
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-white mt-1 leading-relaxed">
                            {ans.questionText || `Question ${qIdx + 1}`}
                          </p>
                        </div>
                      </div>

                      {/* Options Comparison Row */}
                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-neutral-400 font-medium">
                            Student Choice:
                          </span>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded ${
                              isCorrect
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isWrong
                                ? "bg-rose-500/20 text-rose-400"
                                : "text-neutral-500"
                            }`}
                          >
                            {ans.selectedOption || "—"}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-neutral-400 font-medium">
                            Correct Answer:
                          </span>
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {ans.correctOption || "—"}
                          </span>
                        </div>
                      </div>

                      {ans.explanation && (
                        <div className="mt-2 text-[11px] text-neutral-400 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800/60 leading-relaxed">
                          <strong className="text-neutral-300">Explanation:</strong> {ans.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 text-neutral-600 mb-2" />
              Select a student from the roster to inspect their complete question-by-question report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
