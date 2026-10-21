import { jsPDF } from "jspdf";

export interface StudentQuizReportData {
  id: string;
  userId?: string;
  displayName: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  totalMarks: number;
  percentage: number;
  rank?: number;
  answers: Array<{
    questionId?: string;
    questionIndex?: number;
    questionText?: string;
    selectedOption?: string;
    correctOption?: string;
    status?: "Correct" | "Wrong" | "Not Answered";
    marksAwarded?: number;
    explanation?: string;
  }>;
}

export interface QuizRoomReportContext {
  title: string;
  roomCode: string;
  college?: string;
  branch?: string;
  year?: string;
  semester?: string;
  subject: string;
  unit?: string;
  topic?: string;
  hostName?: string;
  createdAt?: number;
  endedAt?: number;
  totalQuestions: number;
  totalMarks: number;
  participants: StudentQuizReportData[];
  questions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex?: number;
    correctAnswers?: number[];
    explanation?: string;
    marks?: number;
    negativeMarks?: number;
  }>;
}

/**
 * Format option label from question and indices
 */
function getQuestionCorrectOptionLabel(q: any): string {
  if (!q) return "—";
  if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
    return q.correctAnswers
      .map((idx: number) => (idx >= 0 && idx < 26 ? String.fromCharCode(65 + idx) : String(idx)))
      .join(", ");
  }
  if (typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex < 26) {
    return String.fromCharCode(65 + q.correctIndex);
  }
  return "A";
}

/**
 * Helper to prepare complete answer records for a student
 */
export function buildStudentCompleteReportData(
  room: any,
  student: any
): StudentQuizReportData {
  const totalQuestions = room.questions?.length || 0;
  const rawAnswers = student.answers || {};

  const totalMarks = room.questions
    ? room.questions.reduce((sum: number, q: any) => sum + (q.marks || room.marksPerCorrect || 1), 0)
    : (room.totalMarks || totalQuestions);

  let correctCount = 0;
  let incorrectCount = 0;
  let score = 0;

  const answersList = (room.questions || []).map((q: any, qIdx: number) => {
    const ans = rawAnswers[qIdx] || (Array.isArray(rawAnswers) ? rawAnswers[qIdx] : undefined) || rawAnswers[q.id];
    const correctOpt = getQuestionCorrectOptionLabel(q);

    // 1. If ans is missing OR ans.isAnswered === false OR status is "Not Answered"
    const isAnswered = !!(ans && ans.isAnswered !== false && ans.status !== "Not Answered" &&
      (ans.selectedIndex !== undefined || ans.selectedIndices !== undefined || ans.selectedAnswer !== undefined || (ans.selectedOption && ans.selectedOption !== "—")));

    if (!isAnswered) {
      return {
        questionId: q.id,
        questionIndex: qIdx,
        questionText: q.question,
        selectedOption: "—",
        correctOption: correctOpt,
        status: "Not Answered" as const,
        marksAwarded: 0,
        explanation: q.explanation || "",
      };
    }

    const selectedOpt = ans.selectedOption || (typeof ans.selectedIndex === "number" ? String.fromCharCode(65 + ans.selectedIndex) : "—");
    const isCorrect = ans.status === "Correct" || ans.isCorrect === true;
    const marks = ans.marksAwarded ?? ans.marks ?? (isCorrect ? (q.marks || room.marksPerCorrect || 1) : -(q.negativeMarks || room.negativeMarks || 0));

    if (isCorrect) {
      correctCount += 1;
      score += marks;
    } else {
      incorrectCount += 1;
      score = Math.max(0, score + marks);
    }

    return {
      questionId: q.id,
      questionIndex: qIdx,
      questionText: q.question,
      selectedOption: selectedOpt,
      correctOption: correctOpt,
      status: isCorrect ? ("Correct" as const) : ("Wrong" as const),
      marksAwarded: marks,
      explanation: q.explanation || "",
    };
  });

  const unansweredCount = Math.max(0, totalQuestions - (correctCount + incorrectCount));
  const finalScore = typeof student.score === "number" ? student.score : score;
  const finalCorrect = typeof student.correctCount === "number" ? student.correctCount : correctCount;
  const finalIncorrect = typeof student.incorrectCount === "number" ? student.incorrectCount : incorrectCount;
  const finalUnanswered = typeof student.unansweredCount === "number" ? student.unansweredCount : unansweredCount;
  const percentage = totalMarks > 0 ? Math.round((Math.max(0, finalScore) / totalMarks) * 100) : 0;

  // Find rank in room leaderboard
  let rank = 1;
  if (Array.isArray(room.leaderboard)) {
    const found = room.leaderboard.find((l: any) => l.id === student.id);
    if (found?.rank) rank = found.rank;
  } else if (student.rank) {
    rank = student.rank;
  }

  return {
    id: student.id,
    userId: student.userId,
    displayName: student.displayName,
    score: finalScore,
    correctCount: finalCorrect,
    incorrectCount: finalIncorrect,
    unansweredCount: finalUnanswered,
    totalQuestions,
    totalMarks,
    percentage,
    rank,
    answers: answersList,
  };
}

/**
 * 1. Download Individual Student Report PDF
 */
export function downloadStudentReportPDF(room: any, student: any) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const data = buildStudentCompleteReportData(room, student);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 16;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(room.college || "Vignan Institute of Technology and Science", 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(199, 210, 254);
  doc.text("LIVE QUIZ ASSESSMENT • INDIVIDUAL STUDENT PERFORMANCE REPORT", 14, 18);
  doc.text(`Room PIN: ${room.roomCode}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 24);

  y = 36;

  // Quiz Meta Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Title:`, 18, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${room.title || "Live Assessment"}`, 32, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Subject:`, 18, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${room.subject || "Subject"} ${room.unit ? `• Unit ${room.unit}` : ""}`, 34, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Branch / Sem:`, 18, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${room.branch || "CSE"} • ${room.semester || "Semester I"}`, 42, y + 20);

  // Right Column Meta
  const rightColX = 125;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Faculty / Host:`, rightColX, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${room.hostName || "Faculty Host"}`, rightColX + 26, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Student Name:`, rightColX, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241);
  doc.text(`${data.displayName}`, rightColX + 26, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Class Rank:`, rightColX, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(217, 119, 6);
  doc.text(`#${data.rank || 1}`, rightColX + 26, y + 20);

  y += 32;

  // Key Metrics Summary Cards (Row of 5 metrics)
  const cardWidth = (pageWidth - 28 - 16) / 5;
  const metrics = [
    { label: "Total Marks", value: `${data.score} / ${data.totalMarks}`, color: [79, 70, 229] },
    { label: "Percentage", value: `${data.percentage}%`, color: [16, 185, 129] },
    { label: "Correct", value: `${data.correctCount} / ${data.totalQuestions}`, color: [22, 163, 74] },
    { label: "Wrong", value: `${data.incorrectCount}`, color: [225, 29, 72] },
    { label: "Unanswered", value: `${data.unansweredCount}`, color: [100, 116, 139] },
  ];

  metrics.forEach((m, idx) => {
    const cardX = 14 + idx * (cardWidth + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardWidth, 18, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cardX + cardWidth / 2, y + 5.5, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, cardX + cardWidth / 2, y + 13.5, { align: "center" });
  });

  y += 24;

  // Questions Detailed Breakdown Table Header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("ITEMIZED QUESTION ANALYSIS", 14, y);

  y += 4;

  // Table header bar
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Q#", 16, y + 5.5);
  doc.text("QUESTION TEXT", 24, y + 5.5);
  doc.text("STUDENT CHOICE", 120, y + 5.5);
  doc.text("CORRECT", 148, y + 5.5);
  doc.text("STATUS", 168, y + 5.5);
  doc.text("MARKS", 188, y + 5.5);

  y += 10;

  // Table Rows
  data.answers.forEach((ans, i) => {
    // Check if new page needed
    if (y > pageHeight - 22) {
      doc.addPage();
      y = 16;

      // Repeat small header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 8, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Q#", 16, y + 5.5);
      doc.text("QUESTION TEXT", 24, y + 5.5);
      doc.text("STUDENT CHOICE", 120, y + 5.5);
      doc.text("CORRECT", 148, y + 5.5);
      doc.text("STATUS", 168, y + 5.5);
      doc.text("MARKS", 188, y + 5.5);
      y += 10;
    }

    const rowHeight = 9;
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 2, pageWidth - 28, rowHeight, "F");
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Q${i + 1}`, 16, y + 3.5);

    // Truncate question text cleanly
    const truncatedText = (ans.questionText || `Question ${i + 1}`).length > 55
      ? (ans.questionText || `Question ${i + 1}`).substring(0, 52) + "..."
      : ans.questionText || `Question ${i + 1}`;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(truncatedText, 24, y + 3.5);

    // Student selected option
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(ans.selectedOption || "—", 124, y + 3.5);

    // Correct option
    doc.setTextColor(71, 85, 105);
    doc.text(ans.correctOption || "—", 152, y + 3.5);

    // Status
    if (ans.status === "Correct") {
      doc.setTextColor(22, 163, 74);
      doc.text("✓ Correct", 168, y + 3.5);
    } else if (ans.status === "Wrong") {
      doc.setTextColor(225, 29, 72);
      doc.text("✗ Wrong", 168, y + 3.5);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text("— Unanswered", 168, y + 3.5);
    }

    // Marks
    doc.setTextColor(ans.marksAwarded && ans.marksAwarded > 0 ? 22 : 100, ans.marksAwarded && ans.marksAwarded > 0 ? 163 : 116, ans.marksAwarded && ans.marksAwarded > 0 ? 74 : 139);
    doc.text(`${ans.marksAwarded ?? 0}m`, 190, y + 3.5);

    y += rowHeight;
  });

  // Footer on current page
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Vignan Institute of Technology & Science • Official Evaluation System • Page ${doc.getNumberOfPages()}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  const safeStudentName = data.displayName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${room.roomCode}_StudentReport_${safeStudentName}.pdf`);
}

/**
 * 2. Download Complete Quiz Report PDF for Entire Class
 */
export function downloadCompleteQuizReportPDF(room: any) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(room.college || "Vignan Institute of Technology and Science", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(165, 180, 252);
  doc.text("COMPLETE CLASS ASSESSMENT REPORT • ALL PARTICIPANTS SUMMARY", 14, 19);
  doc.text(`Room PIN: ${room.roomCode}  |  Subject: ${room.subject}  |  Date: ${new Date().toLocaleDateString()}`, 14, 25);

  y = 38;

  // Build complete student reports
  const rawList = Array.isArray(room.participants)
    ? room.participants
    : Array.from((room.participants?.values && room.participants.values()) || []);

  const studentsData: StudentQuizReportData[] = rawList.map((p: any) =>
    buildStudentCompleteReportData(room, p)
  );

  // Sort by Rank / Score descending
  studentsData.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.displayName.localeCompare(b.displayName);
  });

  // Calculate Class Aggregate Stats
  const totalStudents = studentsData.length;
  const totalMarks = room.questions
    ? room.questions.reduce((sum: number, q: any) => sum + (q.marks || room.marksPerCorrect || 1), 0)
    : (room.totalMarks || (room.questions?.length || 1));

  const highestScore = studentsData.length > 0 ? Math.max(...studentsData.map((s) => s.score)) : 0;
  const lowestScore = studentsData.length > 0 ? Math.min(...studentsData.map((s) => s.score)) : 0;
  const avgScore = studentsData.length > 0
    ? Math.round((studentsData.reduce((acc, s) => acc + s.score, 0) / studentsData.length) * 10) / 10
    : 0;
  const avgPercentage = totalMarks > 0 ? Math.round((avgScore / totalMarks) * 100) : 0;
  const passCount = studentsData.filter((s) => s.percentage >= 40).length;

  // Class Summary Cards
  const cardWidth = (pageWidth - 28 - 12) / 4;
  const summaryMetrics = [
    { label: "Total Students", value: `${totalStudents}`, color: [79, 70, 229] },
    { label: "Class Average", value: `${avgScore}m (${avgPercentage}%)`, color: [16, 185, 129] },
    { label: "Highest / Lowest", value: `${highestScore}m / ${lowestScore}m`, color: [217, 119, 6] },
    { label: "Passed (>=40%)", value: `${passCount} / ${totalStudents}`, color: [22, 163, 74] },
  ];

  summaryMetrics.forEach((m, idx) => {
    const cardX = 14 + idx * (cardWidth + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardWidth, 18, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cardX + cardWidth / 2, y + 5.5, { align: "center" });

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, cardX + cardWidth / 2, y + 13.5, { align: "center" });
  });

  y += 26;

  // Table of All Students
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CONSOLIDATED STUDENT SCOREBOARD", 14, y);

  y += 4;

  // Table header bar
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("RANK", 16, y + 5.5);
  doc.text("STUDENT NAME", 30, y + 5.5);
  doc.text("TOTAL Qs", 96, y + 5.5);
  doc.text("CORRECT", 116, y + 5.5);
  doc.text("WRONG", 136, y + 5.5);
  doc.text("UNANSWERED", 154, y + 5.5);
  doc.text("MARKS", 176, y + 5.5);
  doc.text("PERCENT", 192, y + 5.5);

  y += 10;

  studentsData.forEach((s, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 16;

      // Repeat small header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 8, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("RANK", 16, y + 5.5);
      doc.text("STUDENT NAME", 30, y + 5.5);
      doc.text("TOTAL Qs", 96, y + 5.5);
      doc.text("CORRECT", 116, y + 5.5);
      doc.text("WRONG", 136, y + 5.5);
      doc.text("UNANSWERED", 154, y + 5.5);
      doc.text("MARKS", 176, y + 5.5);
      doc.text("PERCENT", 192, y + 5.5);
      y += 10;
    }

    const rowHeight = 8;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 2, pageWidth - 28, rowHeight, "F");
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(idx === 0 ? 217 : 71, idx === 0 ? 119 : 85, idx === 0 ? 6 : 105);
    doc.text(`#${idx + 1}`, 17, y + 3.5);

    doc.setTextColor(15, 23, 42);
    const truncatedName = s.displayName.length > 28 ? s.displayName.substring(0, 26) + "..." : s.displayName;
    doc.text(truncatedName, 30, y + 3.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`${s.totalQuestions}`, 100, y + 3.5);

    doc.setTextColor(22, 163, 74);
    doc.text(`${s.correctCount}`, 120, y + 3.5);

    doc.setTextColor(225, 29, 72);
    doc.text(`${s.incorrectCount}`, 140, y + 3.5);

    doc.setTextColor(148, 163, 184);
    doc.text(`${s.unansweredCount}`, 160, y + 3.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`${s.score}m`, 176, y + 3.5);

    doc.setTextColor(s.percentage >= 40 ? 22 : 225, s.percentage >= 40 ? 163 : 29, s.percentage >= 40 ? 74 : 72);
    doc.text(`${s.percentage}%`, 192, y + 3.5);

    y += rowHeight;
  });

  // Footer on current page
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Vignan Institute of Technology & Science • Class Assessment Summary • Total Students: ${totalStudents} • Page ${doc.getNumberOfPages()}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  doc.save(`${room.roomCode}_ClassReport_Complete.pdf`);
}
