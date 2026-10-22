import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  User,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  ChevronRight,
  Sparkles,
  Building2,
  Layers,
  Hash,
  ShieldCheck,
  ShieldAlert,
  Info
} from "lucide-react";
import { UserProfile } from "../types";

interface AttendancePageProps {
  userProfile?: UserProfile | null;
  isAuthenticated: boolean;
  accentColorClass?: string;
  onOpenSignIn?: () => void;
  onOpenSettings?: () => void;
}

interface SubjectAttendance {
  name: string;
  conducted: number;
  attended: number;
  absent: number;
  percentage: number;
}

interface AttendanceReport {
  success: boolean;
  student: {
    name: string;
    rollNumber: string;
    branch: string;
    section: string;
    year: string;
  };
  period: {
    from: string;
    to: string;
  };
  summary: {
    workingDays: number;
    present: number;
    absent: number;
    overallPercentage: number;
  };
  subjects: SubjectAttendance[];
  error?: string;
}

const BRANCH_OPTIONS = [
  { value: "CSM", label: "CSE (AI&ML) / CSM" },
  { value: "CSE", label: "Computer Science (CSE)" },
  { value: "CSD", label: "CSE (Data Science)" },
  { value: "IT", label: "Information Technology" },
  { value: "AIML", label: "Artificial Intelligence & ML" },
  { value: "AIDS", label: "AI & Data Science" },
  { value: "ECE", label: "Electronics & Communication (ECE)" },
  { value: "EEE", label: "Electrical & Electronics (EEE)" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "CE", label: "Civil Engineering" },
  { value: "EIE", label: "Electronics & Instrumentation" },
  { value: "BSH", label: "1st Year General (BSH)" }
];

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year (BSH)" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" }
];

const SECTION_OPTIONS = [
  { value: "A", label: "Section A" },
  { value: "B", label: "Section B" },
  { value: "C", label: "Section C" },
  { value: "D", label: "Section D" },
  { value: "E", label: "Section E" },
  { value: "CSM_A", label: "CSM_A (AI&ML Sec A)" },
  { value: "CSM_B", label: "CSM_B (AI&ML Sec B)" },
  { value: "CSD_A", label: "CSD_A (Data Science Sec A)" },
  { value: "CSE_A", label: "CSE_A" },
  { value: "CSE_B", label: "CSE_B" },
  { value: "CSE_C", label: "CSE_C" },
  { value: "CSE_D", label: "CSE_D" }
];

export default function AttendancePage({
  userProfile,
  isAuthenticated,
  accentColorClass,
  onOpenSignIn,
  onOpenSettings,
}: AttendancePageProps) {
  // Input form state
  const [rollNumber, setRollNumber] = useState<string>(
    userProfile?.rollNumber || userProfile?.roll_number || ""
  );
  const [branch, setBranch] = useState<string>(() => {
    const raw = (userProfile?.branch || "").toUpperCase();
    if (raw.includes("AI") || raw.includes("ML") || raw.includes("CSM")) return "CSM";
    if (raw.includes("DATA") || raw.includes("CSD")) return "CSD";
    if (raw.includes("IT")) return "IT";
    if (raw.includes("ECE")) return "ECE";
    if (raw.includes("EEE")) return "EEE";
    if (raw.includes("MECH")) return "ME";
    if (raw.includes("CIVIL")) return "CE";
    if (raw.includes("CSE")) return "CSE";
    return "";
  });

  const [year, setYear] = useState<string>(() => {
    const value = String((userProfile as any)?.year || "").trim();
    const match = value.match(/\b([1-4])\b/);
    return match ? match[1] : "";
  });
  const [section, setSection] = useState<string>(() => {
    const value = (userProfile?.section || "").trim().toUpperCase();
    return SECTION_OPTIONS.some((option) => option.value === value) ? value : "";
  });

  // Require an explicit range or a named preset; no assumed semester start date.
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  // Query & Response state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Sync profile values if loaded after mount
  useEffect(() => {
    if (userProfile?.rollNumber || userProfile?.roll_number) {
      setRollNumber(userProfile.rollNumber || userProfile.roll_number || "");
    }
    if (userProfile?.branch) {
      const raw = userProfile.branch.toUpperCase();
      if (raw.includes("AI") || raw.includes("ML") || raw.includes("CSM")) setBranch("CSM");
      else if (raw.includes("DATA") || raw.includes("CSD")) setBranch("CSD");
      else if (raw.includes("IT")) setBranch("IT");
      else if (raw.includes("ECE")) setBranch("ECE");
      else if (raw.includes("EEE")) setBranch("EEE");
      else if (raw.includes("MECH")) setBranch("ME");
      else if (raw.includes("CIVIL")) setBranch("CE");
      else if (raw.includes("CSE")) setBranch("CSE");
      else setBranch("");
    }
    if (userProfile?.section) {
      const value = userProfile.section.trim().toUpperCase();
      setSection(SECTION_OPTIONS.some((option) => option.value === value) ? value : "");
    }
    if ((userProfile as any)?.year) {
      const value = String((userProfile as any).year).trim();
      const match = value.match(/\b([1-4])\b/);
      setYear(match ? match[1] : "");
    }
  }, [userProfile]);

  // Loading timer
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setLoadingSeconds(0);
      timer = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  // Handle report fetching
  const handleFetchAttendance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const trimmedRoll = rollNumber.trim().toUpperCase();
    if (!trimmedRoll) {
      setErrorMessage("Please enter your student Roll Number to fetch attendance.");
      return;
    }

    if (!fromDate || !toDate) {
      setErrorMessage("Please choose both From and To dates.");
      return;
    }

    if (!branch || !year || !section) {
      setErrorMessage("Please select your actual branch, academic year, and section before fetching attendance.");
      return;
    }

    if (!fromDate || !toDate) {
      setErrorMessage("Choose a date range or use one of the date-range presets before fetching attendance.");
      return;
    }

    if (fromDate > toDate) {
      setErrorMessage("From Date cannot be later than To Date.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/attendance/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rollNumber: trimmedRoll,
          studentName: userProfile?.name || "",
          branch,
          year,
          section,
          fromDate,
          toDate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error || "Unable to retrieve attendance report from the college portal. Please verify your details."
        );
        setIsLoading(false);
        return;
      }

      setReport(data);
      setLastFetchedAt(new Date());
    } catch (err: any) {
      console.error("Fetch attendance error:", err);
      setErrorMessage("Network error connecting to college attendance server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick preset helper
  const applyPreset = (preset: "semester" | "month" | "last30") => {
    const now = new Date();
    setToDate(now.toISOString().split("T")[0]);

    if (preset === "semester") {
      let semesterStart = new Date(now.getFullYear(), 7, 1);
      if (semesterStart > now) semesterStart = new Date(now.getFullYear() - 1, 7, 1);
      setFromDate(semesterStart.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(startOfMonth.toISOString().split("T")[0]);
    } else if (preset === "last30") {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      setFromDate(past30.toISOString().split("T")[0]);
    }
  };

  // Safe margin calculation
  const calculateMargin = (present: number, total: number) => {
    if (total === 0) return { type: "neutral", text: "No classes conducted yet" };
    const currentPct = (present / total) * 100;

    if (currentPct >= 75) {
      const canMiss = Math.floor(present / 0.75 - total);
      if (canMiss > 0) {
        return {
          type: "safe",
          text: `You can safely miss ${canMiss} more lecture${canMiss > 1 ? "s" : ""} while maintaining ≥75%.`,
          count: canMiss,
        };
      }
      return {
        type: "border",
        text: "You are exactly on the 75% threshold! Attend the next class to maintain eligibility.",
        count: 0,
      };
    } else {
      const needAttend = Math.ceil((0.75 * total - present) / 0.25);
      return {
        type: "danger",
        text: `You need to attend ${needAttend} consecutive lecture${needAttend > 1 ? "s" : ""} to reach 75%.`,
        count: needAttend,
      };
    }
  };

  return (
    <div className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-3">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Vignan College Portal Live</span>
            </div>

            <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
              Attendance
            </h1>
            <p className="text-sm text-white/50 mt-1 font-normal tracking-wide">
              View and analyze your college attendance directly through AstraMind.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {report && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] text-xs sm:text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            )}

            {!isAuthenticated && onOpenSignIn && (
              <button
                type="button"
                onClick={onOpenSignIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In to Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Profile & Query Form Card */}
        <div className="p-6 sm:p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#a78bfa]" />
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-[0.15em]">
                Student Academic Parameters
              </h3>
            </div>
            {userProfile?.rollNumber && (
              <div className="text-xs font-mono-studio text-white/40">
                Linked: <span className="text-white/80">{userProfile.rollNumber}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleFetchAttendance} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Roll Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                  <span>Roll Number</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 23XX1AXXXX"
                    className="w-full h-11 pl-10 pr-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-xs sm:text-sm font-mono-studio uppercase tracking-wider text-white placeholder-white/20 focus:outline-none focus:border-[#a78bfa] transition-all"
                  />
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                  <span>Branch</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-[#101012] border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all cursor-pointer"
                  >
                    <option value="">Select your branch</option>
                    {BRANCH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#101012] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                  <span>Academic Year</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-[#101012] border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all cursor-pointer"
                  >
                    <option value="">Select your year</option>
                    {YEAR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#101012] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center justify-between">
                  <span>Section</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-[#101012] border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all cursor-pointer"
                  >
                    <option value="">Select your section</option>
                    {SECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#101012] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Attendance Period</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/40">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset("semester")}
                    className="text-xs px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all cursor-pointer"
                  >
                    This Semester
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("month")}
                    className="text-xs px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all cursor-pointer"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("last30")}
                    className="text-xs px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-1">
                    From Date
                  </span>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-11 px-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all"
                  />
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-1">
                    To Date
                  </span>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-11 px-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p className="font-medium">{errorMessage}</p>
                  <p className="text-xs mt-1 text-rose-300/80">
                    Tip: If you are in 1st year, ensure Year is set to "1st Year (BSH)" and branch matches your allocated section.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>Reports are pulled directly from the college attendance portal.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 font-semibold text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-[#0d0d0e]" />
                    <span>Fetching Report... ({loadingSeconds}s)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#0d0d0e]" />
                    <span>Fetch Attendance Report</span>
                  </>
                )}
              </button>
            </div>

            {isLoading && (
              <div className="p-4 rounded-2xl bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-xs text-[#c4b5fd] flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 animate-spin text-[#a78bfa]" />
                <span>
                  The college portal compiles records across all subjects. This typically takes 30–60 seconds. Please keep this tab open.
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Results Section */}
        {report && report.success && report.summary && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overall Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Overall Percentage Card */}
              <div className="sm:col-span-2 p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">
                      Overall Aggregate Attendance
                    </span>
                    {report.summary.overallPercentage >= 75 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Exam Eligible (≥ 75%)
                      </span>
                    ) : report.summary.overallPercentage >= 65 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Condonation Zone (65–75%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Critical (&lt; 65%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-3 my-2">
                    <span
                      className={`font-serif-studio text-5xl sm:text-6xl font-medium tracking-tight ${
                        report.summary.overallPercentage >= 75
                          ? "text-emerald-400"
                          : report.summary.overallPercentage >= 65
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {report.summary.overallPercentage}%
                    </span>
                    <span className="text-xs sm:text-sm text-white/50 font-mono-studio">
                      ({report.summary.present} attended of {report.summary.workingDays} conducted)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden mt-4 mb-2">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${
                        report.summary.overallPercentage >= 75
                          ? "bg-emerald-400"
                          : report.summary.overallPercentage >= 65
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, report.summary.overallPercentage))}%` }}
                    />
                  </div>
                </div>

                {/* Margin Calculator Insight */}
                {(() => {
                  const margin = calculateMargin(report.summary.present, report.summary.workingDays);
                  return (
                    <div
                      className={`mt-4 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                        margin.type === "safe"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/25"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>{margin.text}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Present Hours */}
              <div className="p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-2">
                    Hours Attended
                  </div>
                  <div className="font-serif-studio text-4xl sm:text-5xl font-medium text-white">
                    {report.summary.present}
                    <span className="font-sans text-xs sm:text-sm text-white/40 ml-1.5">hrs</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/[0.06] text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Recorded present in portal</span>
                </div>
              </div>

              {/* Absent Hours */}
              <div className="p-7 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-xl flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold mb-2">
                    Hours Absent
                  </div>
                  <div className="font-serif-studio text-4xl sm:text-5xl font-medium text-rose-400">
                    {report.summary.absent}
                    <span className="font-sans text-xs sm:text-sm text-white/40 ml-1.5">hrs</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/[0.06] text-xs text-white/40 flex items-center gap-1.5 font-mono-studio">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Total conducted: {report.summary.workingDays} hrs</span>
                </div>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown Table */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="font-serif-studio text-2xl font-medium text-white">Subject-Wise Breakdown</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Detailed performance report for period {report.period?.from} to {report.period?.to}
                  </p>
                </div>

                {lastFetchedAt && (
                  <span className="text-xs font-mono-studio text-white/40">
                    Updated {lastFetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {report.subjects && report.subjects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase tracking-[0.15em]">
                        <th className="py-3 px-4">Subject Name</th>
                        <th className="py-3 px-4 text-center font-mono-studio">Conducted</th>
                        <th className="py-3 px-4 text-center font-mono-studio">Attended</th>
                        <th className="py-3 px-4 text-center font-mono-studio">Absent</th>
                        <th className="py-3 px-4 text-right font-mono-studio">Percentage</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {report.subjects.map((sub, index) => {
                        const isSafe = sub.percentage >= 75;
                        return (
                          <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-medium text-white">
                              {sub.name}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono-studio text-white/70">
                              {sub.conducted}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono-studio text-emerald-400 font-semibold">
                              {sub.attended}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono-studio text-rose-400">
                              {sub.absent}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono-studio font-semibold text-white">
                              {sub.percentage}%
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isSafe ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Safe
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                                  <AlertCircle className="w-3.5 h-3.5" /> Shortage
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-white/40">
                  No subject records found in portal for selected criteria.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
