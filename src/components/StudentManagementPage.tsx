import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  GraduationCap,
  Hash,
  Layers,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  X,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  UserCheck,
  Building,
  Mail,
  Award,
  ChevronRight,
  KeyRound
} from "lucide-react";
import { UserProfile } from "../types";
import { supabase } from "../lib/supabase";
import { AUTHORIZED_ADMIN_EMAIL } from "../lib/adminAuth";

export interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  roll_number: string;
  branch: string;
  section: string;
  hall_ticket_number: string;
  avatar_url?: string;
  status: "Active" | "Pending" | "Graduated" | "Suspended";
  attendance_percentage: number | null;
  cgpa: string;
  year?: string;
  created_at: string;
}

interface StudentManagementPageProps {
  userProfile?: UserProfile | null;
  onNavigateBack: () => void;
  accentColorClass?: string;
}

export default function StudentManagementPage({
  userProfile,
  onNavigateBack,
}: StudentManagementPageProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<StudentRecord | null>(null);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    roll_number: "",
    branch: "",
    section: "",
    hall_ticket_number: "",
    status: "Active" as StudentRecord["status"],
    attendance_percentage: null,
    cgpa: "",
    year: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const branchesList = ["ALL", "CSE", "ECE", "IT", "EEE", "MECH", "CIVIL", "AI & DS"];
  const sectionsList = ["ALL", "A", "B", "C", "D"];
  const statusList = ["ALL", "Active", "Pending", "Graduated", "Suspended"];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    setIsUnauthorized(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setIsUnauthorized(true);
        setError("Authentication session not found. Please log in.");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/admin/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        setIsUnauthorized(true);
        setError("Exclusive Administrator Access Required. Only ravicharan.7878@gmail.com is authorized to view this page.");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const result = await res.json();
      if (result.success && Array.isArray(result.students)) {
        setStudents(result.students);
      } else {
        setStudents([]);
      }
    } catch (err: any) {
      console.error("Failed to load students:", err);
      setError(err?.message || "Failed to load student records from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q) ||
        s.hall_ticket_number.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q);

      // Branch filter
      const matchesBranch = selectedBranch === "ALL" || s.branch.toUpperCase() === selectedBranch.toUpperCase();

      // Section filter
      const matchesSection = selectedSection === "ALL" || s.section.toUpperCase() === selectedSection.toUpperCase();

      // Status filter
      const matchesStatus = selectedStatus === "ALL" || s.status === selectedStatus;

      return matchesSearch && matchesBranch && matchesSection && matchesStatus;
    });
  }, [students, searchQuery, selectedBranch, selectedSection, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === "Active").length;
    const knownAttendance = students
      .map((student) => student.attendance_percentage)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const avgAttendance = knownAttendance.length > 0
      ? Math.round(knownAttendance.reduce((sum, value) => sum + value, 0) / knownAttendance.length)
      : null;
    const branchCount = new Set(students.map((s) => s.branch).filter(Boolean)).size;
    return { total, active, avgAttendance, branchCount };
  }, [students]);

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData({
      full_name: "",
      email: "",
      roll_number: "",
      branch: "",
      section: "",
      hall_ticket_number: "",
      status: "Active",
      attendance_percentage: null,
      cgpa: "",
      year: "",
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (student: StudentRecord) => {
    setActiveStudent(student);
    setFormData({
      full_name: student.full_name,
      email: student.email,
      roll_number: student.roll_number,
      branch: student.branch,
      section: student.section,
      hall_ticket_number: student.hall_ticket_number,
      status: student.status,
      attendance_percentage: student.attendance_percentage,
      cgpa: student.cgpa,
      year: student.year || "",
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open View modal
  const handleOpenView = (student: StudentRecord) => {
    setActiveStudent(student);
    setIsViewModalOpen(true);
  };

  // Open Delete modal
  const handleOpenDelete = (student: StudentRecord) => {
    setActiveStudent(student);
    setIsDeleteModalOpen(true);
  };

  // Save new student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.roll_number.trim() || !formData.email.trim()) {
      setFormError("Full Name, Email, and Roll Number are required.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create student record.");
      }

      setStudents((prev) => [result.student, ...prev]);
      setIsAddModalOpen(false);
      showToast(`Student ${formData.full_name} enrolled successfully.`);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save student.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update existing student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    if (!formData.full_name.trim() || !formData.roll_number.trim() || !formData.email.trim()) {
      setFormError("Full Name, Email, and Roll Number are required.");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/admin/students/${activeStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update student record.");
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === activeStudent.id ? result.student : s))
      );
      setIsEditModalOpen(false);
      showToast(`Student record for ${formData.full_name} updated.`);
    } catch (err: any) {
      setFormError(err?.message || "Failed to update student.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete student
  const handleDeleteConfirm = async () => {
    if (!activeStudent) return;

    setFormSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/admin/students/${activeStudent.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to delete student record.");
      }

      setStudents((prev) => prev.filter((s) => s.id !== activeStudent.id));
      setIsDeleteModalOpen(false);
      showToast(`Student ${activeStudent.full_name} removed.`);
    } catch (err: any) {
      setFormError(err?.message || "Failed to delete student.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      showToast("No student records to export.");
      return;
    }

    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Roll Number",
      "Branch",
      "Section",
      "Hall Ticket Number",
      "Status",
      "Attendance %",
      "CGPA",
      "Year",
      "Enrolled Date"
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.id}"`,
      `"${s.full_name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.roll_number}"`,
      `"${s.branch}"`,
      `"${s.section}"`,
      `"${s.hall_ticket_number}"`,
      `"${s.status}"`,
      `"${typeof s.attendance_percentage === "number" ? `${s.attendance_percentage}%` : ""}"`,
      `"${s.cgpa}"`,
      `"${s.year || ''}"`,
      `"${formatDate(s.created_at)}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `astramind_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV roster downloaded successfully.");
  };

  // If unauthorized state
  if (isUnauthorized) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 text-center bg-[#0d0d0e]">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Exclusive Administrator Access</h2>
        <p className="text-sm text-white/50 max-w-md mb-6 leading-relaxed">
          Access to Student Management is strictly restricted to the verified AstraMind administrator (
          <span className="text-[#a78bfa] font-mono font-medium">{AUTHORIZED_ADMIN_EMAIL}</span>).
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
          <button
            onClick={fetchStudents}
            className="px-5 py-2.5 rounded-xl bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 text-[#a78bfa] border border-[#a78bfa]/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-check Authorization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1c1c1f] border border-[#a78bfa]/40 text-white shadow-2xl shadow-purple-950/50 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-[#a78bfa]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#a78bfa] to-[#818cf8] flex items-center justify-center text-slate-950 font-bold shadow-md shadow-purple-900/30">
                <ShieldCheck className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Student Management
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                    Admin Portal
                  </span>
                </div>
                <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                  <KeyRound className="w-3 h-3 text-[#a78bfa]" />
                  <span>Authorized Administrator:</span>
                  <span className="text-[#a78bfa] font-mono font-medium">{AUTHORIZED_ADMIN_EMAIL}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={fetchStudents}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh student roster"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#818cf8] hover:from-[#906ffa] hover:to-[#707ef5] text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#151517] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Enrolled</span>
              <Users className="w-4 h-4 text-[#a78bfa]" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
            <p className="text-[10px] text-white/40">Verified academic profiles</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#151517] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Students</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{stats.active}</p>
            <p className="text-[10px] text-white/40">Regularly attending & testing</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#151517] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Departments</span>
              <Building className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-400 font-mono">{stats.branchCount}</p>
            <p className="text-[10px] text-white/40">Engineering disciplines</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#151517] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-white/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Attendance</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400 font-mono">{stats.avgAttendance === null ? "—" : `${stats.avgAttendance}%`}</p>
            <p className="text-[10px] text-white/40">Institution-wide aggregate</p>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-4 rounded-2xl bg-[#151517] border border-white/[0.06] space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll number, email, or hall ticket..."
                className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#a78bfa] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Branch */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white/70">
                <span className="text-white/40 text-[10px] uppercase font-semibold">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer"
                >
                  {branchesList.map((b) => (
                    <option key={b} value={b} className="bg-[#1c1c1f] text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white/70">
                <span className="text-white/40 text-[10px] uppercase font-semibold">Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer"
                >
                  {sectionsList.map((sec) => (
                    <option key={sec} value={sec} className="bg-[#1c1c1f] text-white">
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white/70">
                <span className="text-white/40 text-[10px] uppercase font-semibold">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer"
                >
                  {statusList.map((st) => (
                    <option key={st} value={st} className="bg-[#1c1c1f] text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedBranch !== "ALL" || selectedSection !== "ALL" || selectedStatus !== "ALL" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedBranch("ALL");
                    setSelectedSection("ALL");
                    setSelectedStatus("ALL");
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white text-xs transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchStudents}
              className="underline hover:text-white font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* STUDENTS TABLE */}
        <div className="rounded-2xl bg-[#151517] border border-white/[0.06] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-white/40 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Branch & Section</th>
                  <th className="py-3 px-4">Hall Ticket No.</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#a78bfa]" />
                        <span>Verifying admin token & loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-white/20" />
                        <span className="text-sm font-medium text-white/60">No student records found</span>
                        <span className="text-xs text-white/40">Try adjusting your search or filters, or enroll a new student.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const initials = student.full_name
                      ? student.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                      : "ST";

                    return (
                      <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Student Name & Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#a78bfa]/15 border border-[#a78bfa]/30 flex items-center justify-center text-xs font-bold text-[#a78bfa] shrink-0">
                              {student.avatar_url ? (
                                <img src={student.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white group-hover:text-[#a78bfa] transition-colors truncate">
                                {student.full_name || "Name unavailable"}
                              </p>
                              <p className="text-[11px] text-white/40 truncate">{student.email || "Email unavailable"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Roll Number */}
                        <td className="py-3 px-4 font-mono text-white/80 uppercase font-semibold">
                          {student.roll_number || <span className="text-white/20 italic">Not set</span>}
                        </td>

                        {/* Branch & Section */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/80 font-medium">
                              {student.branch || "—"}
                            </span>
                            <span className="text-white/40">Sec {student.section || "—"}</span>
                          </div>
                        </td>

                        {/* Hall Ticket Number */}
                        <td className="py-3 px-4 font-mono text-white/70 uppercase">
                          {student.hall_ticket_number || <span className="text-white/20 italic">—</span>}
                        </td>

                        {/* Attendance & CGPA */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold ${
                                typeof student.attendance_percentage !== "number" ? "text-white/60" : student.attendance_percentage >= 75 ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                {typeof student.attendance_percentage === "number" ? `${student.attendance_percentage}%` : "—"}
                              </span>
                              <span className="text-[10px] text-white/30">• CGPA {student.cgpa || "—"}</span>
                            </div>
                            <div className="w-20 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  typeof student.attendance_percentage !== "number" ? "bg-transparent" : student.attendance_percentage >= 75 ? "bg-emerald-400" : "bg-rose-400"
                                }`}
                                style={{ width: `${typeof student.attendance_percentage === "number" ? Math.max(0, Math.min(100, student.attendance_percentage)) : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            student.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : student.status === "Pending"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-white/[0.06] text-white/50 border border-white/[0.08]"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {student.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenView(student)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                              title="View full profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-colors cursor-pointer"
                              title="Edit academic record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(student)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remove record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-white/[0.01] border-t border-white/[0.04] flex items-center justify-between text-[11px] text-white/40">
            <span>Showing {filteredStudents.length} of {students.length} students</span>
            <span>Protected by AstraMind Server Authentication</span>
          </div>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#151517] border border-white/[0.08] shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-base font-bold text-white">Enroll New Student</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-white/60">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-white/60">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul.sharma@vits.ac.in"
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value.toUpperCase() })}
                    placeholder="21A91A0501"
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Hall Ticket Number</label>
                  <input
                    type="text"
                    value={formData.hall_ticket_number}
                    onChange={(e) => setFormData({ ...formData, hall_ticket_number: e.target.value.toUpperCase() })}
                    placeholder="HT21A0501"
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full h-9 bg-[#1c1c1f] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  >
                    <option value="">Select branch</option>
                    {branchesList.filter((b) => b !== "ALL").map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full h-9 bg-[#1c1c1f] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  >
                    <option value="">Select section</option>
                    {sectionsList.filter((s) => s !== "ALL").map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Attendance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.attendance_percentage ?? ""}
                    onChange={(e) => setFormData({ ...formData, attendance_percentage: e.target.value === "" ? null : Number(e.target.value) })}
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">CGPA</label>
                  <input
                    type="text"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    placeholder="Enter if known"
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-slate-950 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {isEditModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#151517] border border-white/[0.08] shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-base font-bold text-white">Edit Student Record</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-white/60">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-white/60">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value.toUpperCase() })}
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Hall Ticket Number</label>
                  <input
                    type="text"
                    value={formData.hall_ticket_number}
                    onChange={(e) => setFormData({ ...formData, hall_ticket_number: e.target.value.toUpperCase() })}
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Branch</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full h-9 bg-[#1c1c1f] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  >
                    <option value="">Select branch</option>
                    {branchesList.filter((b) => b !== "ALL").map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full h-9 bg-[#1c1c1f] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  >
                    <option value="">Select section</option>
                    {sectionsList.filter((s) => s !== "ALL").map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentRecord["status"] })}
                    className="w-full h-9 bg-[#1c1c1f] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  >
                    {statusList.filter((s) => s !== "ALL").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/60">Attendance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.attendance_percentage ?? ""}
                    onChange={(e) => setFormData({ ...formData, attendance_percentage: e.target.value === "" ? null : Number(e.target.value) })}
                    className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-slate-950 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENT DETAILS MODAL */}
      {isViewModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#151517] border border-white/[0.08] shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-base font-bold text-white">Student Academic Dossier</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="w-12 h-12 rounded-2xl bg-[#a78bfa]/20 border border-[#a78bfa]/30 flex items-center justify-center text-sm font-bold text-[#a78bfa]">
                  {activeStudent.full_name
                    ? activeStudent.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                    : "ST"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{activeStudent.full_name}</h4>
                  <p className="text-xs text-white/50">{activeStudent.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                    {activeStudent.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] uppercase font-semibold text-white/40">Roll Number</p>
                  <p className="font-mono font-bold text-white mt-0.5">{activeStudent.roll_number}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] uppercase font-semibold text-white/40">Hall Ticket</p>
                  <p className="font-mono font-bold text-white mt-0.5">{activeStudent.hall_ticket_number || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] uppercase font-semibold text-white/40">Branch & Section</p>
                  <p className="font-semibold text-white mt-0.5">{activeStudent.branch || "—"} • Sec {activeStudent.section || "—"}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] uppercase font-semibold text-white/40">Current CGPA</p>
                  <p className="font-bold text-amber-400 mt-0.5">{activeStudent.cgpa ? `${activeStudent.cgpa} / 10.0` : "—"}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Attendance Ratio</span>
                  <span className="font-bold text-emerald-400">{typeof activeStudent.attendance_percentage === "number" ? `${activeStudent.attendance_percentage}%` : "—"}</span>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${typeof activeStudent.attendance_percentage === "number" ? Math.max(0, Math.min(100, activeStudent.attendance_percentage)) : 0}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-white/40 flex items-center justify-between pt-2">
                <span>Record Created: {formatDate(activeStudent.created_at)}</span>
                <span>ID: {activeStudent.id.substring(0, 8)}...</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#151517] border border-rose-500/30 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Remove Student Record?</h3>
              <p className="text-xs text-white/50">
                Are you sure you want to remove <span className="text-white font-semibold">{activeStudent.full_name}</span> ({activeStudent.roll_number})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={formSubmitting}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {formSubmitting ? "Removing..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
