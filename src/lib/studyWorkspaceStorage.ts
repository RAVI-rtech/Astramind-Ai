import { 
  StudyWorkspace, 
  StudyMaterial, 
  GuidedLesson, 
  Flashcard, 
  QuizQuestion, 
  QuizResult, 
  MockExam, 
  ImportantQuestion,
  BTechYear,
  BTechSemester,
  LearningGoal,
  DocumentProfile,
  LearningActivityRecord
} from "../types";

export type { StudyWorkspace };

const WORKSPACES_STORAGE_KEY = "astramind_study_workspaces_v1";
const ACTIVE_WORKSPACE_ID_KEY = "astramind_active_workspace_id_v1";
const LESSONS_STORAGE_KEY = "astramind_guided_lessons_v1";
const FLASHCARDS_STORAGE_KEY = "astramind_flashcards_v1";
const QUIZ_RESULTS_STORAGE_KEY = "astramind_quiz_results_v1";
const MOCK_EXAMS_STORAGE_KEY = "astramind_mock_exams_v1";

export const VITS_BRANCHES = [
  "Computer Science and Engineering (CSE)",
  "CSE (Artificial Intelligence & Machine Learning)",
  "CSE (Data Science)",
  "Information Technology (IT)",
  "Electronics and Communication Engineering (ECE)",
  "Electrical and Electronics Engineering (EEE)",
  "Mechanical Engineering (MECH)",
  "Civil Engineering (CIVIL)",
];

export const VITS_SUBJECTS: Record<string, string[]> = {
  "1st": [
    "Engineering Mathematics - I",
    "Applied Physics",
    "Programming for Problem Solving (C)",
    "Engineering Chemistry",
    "Basic Electrical Engineering",
    "Engineering Graphics & Design",
  ],
  "2nd": [
    "Engineering Mathematics - III",
    "Data Structures & Algorithms",
    "Digital Logic Design (DLD)",
    "Python Programming",
    "Object Oriented Programming through Java",
    "Discrete Mathematics",
    "Computer Organization & Architecture",
  ],
  "3rd": [
    "Database Management Systems (DBMS)",
    "Operating Systems (OS)",
    "Design and Analysis of Algorithms (DAA)",
    "Computer Networks (CN)",
    "Formal Languages & Automata Theory (FLAT)",
    "Software Engineering",
    "Web Technologies",
    "Microprocessors and Interfacing",
  ],
  "4th": [
    "Machine Learning & AI",
    "Cloud Computing & DevOps",
    "Information Security & Cryptography",
    "Data Mining & Data Warehousing",
    "Compiler Design",
    "Big Data Analytics",
    "VLSI Design",
  ],
};

export const LEARNING_GOALS: LearningGoal[] = [
  "Understand concepts",
  "Prepare for exam",
  "Practice MCQs",
  "Revise notes",
  "Complete syllabus",
  "Prepare for viva",
  "Prepare for placement",
];

// Initial starter workspace for students to have a rich experience immediately
export const DEFAULT_INITIAL_WORKSPACE: StudyWorkspace = {
  id: "ws-vits-dsa-1",
  name: "Data Structures & Algorithms Mastery",
  college: "Vignan Institute of Technology and Science",
  branch: "Computer Science and Engineering (CSE)",
  year: "2nd",
  semester: "I",
  subject: "Data Structures & Algorithms",
  learningGoal: "Prepare for exam",
  materials: [
    {
      id: "mat-dsa-unit1",
      name: "Unit_1_Linear_Data_Structures_Lecture_Notes.pdf",
      type: "pdf",
      size: "2.4 MB",
      uploadedAt: Date.now() - 86400000 * 3,
      content: "Unit 1: Stacks, Queues, Circular Queues, Linked Lists (Singly, Doubly, Circular). Infix to Postfix conversion using Stacks. Applications in Recursion and Memory Management.",
    },
    {
      id: "mat-dsa-unit2",
      name: "Unit_2_Non_Linear_Trees_Graphs_Syllabus.pptx",
      type: "ppt",
      size: "4.1 MB",
      uploadedAt: Date.now() - 86400000 * 2,
      content: "Unit 2: Binary Search Trees, AVL Trees, B-Trees, Graph Representations (Adjacency Matrix, Adjacency List), BFS, DFS, Dijkstra's Shortest Path.",
    }
  ],
  detectedTopics: [
    "Stack Operations & Applications",
    "Linked Lists & Double Linked Lists",
    "Binary Search Trees & Traversal",
    "AVL Trees & Balance Rotations",
    "Graph Traversal (BFS & DFS)",
    "Dijkstra's Algorithm",
  ],
  documentProfile: {
    fileName: "Unit_1_Linear_Data_Structures_Lecture_Notes.pdf",
    detectedDomain: "Computer Science",
    confidence: "High",
    title: "Linear & Non-Linear Data Structures",
    topics: [
      "Stack Operations & Applications",
      "Linked Lists & Double Linked Lists",
      "Binary Search Trees & Traversal",
      "AVL Trees & Balance Rotations",
      "Graph Traversal (BFS & DFS)",
      "Dijkstra's Algorithm",
    ],
    estimatedSections: 6,
    pages: 42,
    extractedTextLength: 15400,
    hasFormulas: false,
    hasCode: true,
    hasTables: true,
    keyTerminology: ["Stack", "Queue", "Linked List", "Binary Search Tree", "AVL Tree", "BFS", "DFS", "Dijkstra"],
    summary: "Foundational data structures curriculum covering linear structures (stacks, queues, lists) and non-linear representations (trees, graphs, and shortest path algorithms).",
    processingStatus: {
      contentExtracted: true,
      topicsIdentified: true,
      studyToolsReady: true,
    },
  },
  createdAt: Date.now() - 86400000 * 5,
  lastActive: Date.now() - 3600000,
  progressPercent: 42,
  stats: {
    lessonsCompleted: 3,
    quizzesAttempted: 2,
    quizAccuracy: 85,
    flashcardsReviewed: 14,
    materialsUploaded: 2,
    topicsCompleted: 2,
  },
  recommendedNextAction: "Study Unit 2 - Binary Search Trees & Tree Rotations",
};

export function getWorkspaces(): StudyWorkspace[] {
  try {
    const raw = localStorage.getItem(WORKSPACES_STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_INITIAL_WORKSPACE];
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [DEFAULT_INITIAL_WORKSPACE];
  } catch (e) {
    console.warn("Failed to load workspaces from storage:", e);
    return [DEFAULT_INITIAL_WORKSPACE];
  }
}

export const getStoredWorkspaces = getWorkspaces;
export const getAllWorkspaces = getWorkspaces;

export function saveWorkspaces(workspaces: StudyWorkspace[]): void {
  try {
    localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
  } catch (e) {
    console.error("Failed to save workspaces:", e);
  }
}

export function getActiveWorkspaceId(): string {
  try {
    const active = localStorage.getItem(ACTIVE_WORKSPACE_ID_KEY);
    if (active) return active;
    const list = getWorkspaces();
    if (list.length > 0) {
      setActiveWorkspaceId(list[0].id);
      return list[0].id;
    }
  } catch (e) {
    console.warn("Error getting active workspace ID:", e);
  }
  return DEFAULT_INITIAL_WORKSPACE.id;
}

export function setActiveWorkspaceId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, id);
  } catch (e) {
    console.warn("Error setting active workspace ID:", e);
  }
}

export function getActiveWorkspace(): StudyWorkspace {
  const workspaces = getWorkspaces();
  const activeId = getActiveWorkspaceId();
  const found = workspaces.find((w) => w.id === activeId);
  return found || workspaces[0] || DEFAULT_INITIAL_WORKSPACE;
}

export function createWorkspace(data: {
  name: string;
  college?: string;
  branch: string;
  year: BTechYear;
  semester: BTechSemester;
  subject: string;
  learningGoal: LearningGoal;
  documentProfile?: DocumentProfile;
  initialMaterial?: {
    name: string;
    type: string;
    content?: string;
    base64?: string;
    size?: string;
    profile?: DocumentProfile;
  };
}): StudyWorkspace {
  const workspaces = getWorkspaces();
  const id = "ws-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);

  const docProfile = data.documentProfile || data.initialMaterial?.profile;
  const materials: StudyMaterial[] = [];
  if (data.initialMaterial && data.initialMaterial.name) {
    materials.push({
      id: "mat-" + Date.now().toString(36),
      name: data.initialMaterial.name,
      type: data.initialMaterial.type || "pdf",
      size: data.initialMaterial.size || "1.2 MB",
      content: data.initialMaterial.content,
      base64: data.initialMaterial.base64,
      uploadedAt: Date.now(),
      profile: docProfile,
    });
  }

  // Authoritatively use detected topics from the document if available
  const detectedTopics = docProfile?.topics && docProfile.topics.length > 0
    ? docProfile.topics
    : deriveTopicsForSubject(data.subject, data.initialMaterial?.content);

  const finalSubject = docProfile?.detectedDomain && docProfile.detectedDomain !== "General Academic"
    ? docProfile.detectedDomain
    : data.subject;

  const newWorkspace: StudyWorkspace = {
    id,
    name: data.name.trim() || `${finalSubject} Study Workspace`,
    college: data.college || "Vignan Institute of Technology and Science",
    branch: data.branch,
    year: data.year,
    semester: data.semester,
    subject: finalSubject,
    learningGoal: data.learningGoal,
    materials,
    detectedTopics,
    documentProfile: docProfile,
    createdAt: Date.now(),
    lastActive: Date.now(),
    progressPercent: 0,
    stats: {
      lessonsCompleted: 0,
      quizzesAttempted: 0,
      quizAccuracy: 0,
      flashcardsReviewed: 0,
      materialsUploaded: materials.length,
      topicsCompleted: 0,
    },
    recommendedNextAction: detectedTopics.length > 0 
      ? `Study ${detectedTopics[0]}` 
      : `Upload study material to generate your revision plan`,
  };

  const updated = [newWorkspace, ...workspaces];
  saveWorkspaces(updated);
  setActiveWorkspaceId(id);
  return newWorkspace;
}

export function updateWorkspace(id: string, updates: Partial<StudyWorkspace>): StudyWorkspace | null {
  const workspaces = getWorkspaces();
  const idx = workspaces.findIndex((w) => w.id === id);
  if (idx === -1) return null;

  const updatedWorkspace: StudyWorkspace = {
    ...workspaces[idx],
    ...updates,
    lastActive: Date.now(),
  };

  workspaces[idx] = updatedWorkspace;
  saveWorkspaces(workspaces);
  return updatedWorkspace;
}

export function deleteWorkspace(id: string): void {
  const workspaces = getWorkspaces().filter((w) => w.id !== id);
  saveWorkspaces(workspaces);
  if (getActiveWorkspaceId() === id && workspaces.length > 0) {
    setActiveWorkspaceId(workspaces[0].id);
  }
}

export function addMaterialToWorkspace(workspaceId: string, material: Omit<StudyMaterial, "id" | "uploadedAt">): StudyMaterial {
  const workspaces = getWorkspaces();
  const ws = workspaces.find((w) => w.id === workspaceId);
  const newMaterial: StudyMaterial = {
    ...material,
    id: "mat-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 5),
    uploadedAt: Date.now(),
  };

  if (ws) {
    ws.materials = [newMaterial, ...ws.materials];
    ws.stats.materialsUploaded = ws.materials.length;
    ws.lastActive = Date.now();

    if (material.profile) {
      ws.documentProfile = material.profile;
      if (material.profile.topics && material.profile.topics.length > 0) {
        ws.detectedTopics = Array.from(new Set([...material.profile.topics, ...ws.detectedTopics]));
      }
      if (material.profile.detectedDomain && (!ws.subject || ws.subject === "Custom Subject" || ws.subject === "Engineering Core")) {
        ws.subject = material.profile.detectedDomain;
      }
    } else {
      // Re-detect topics if more material is added
      const extraTopics = deriveTopicsForSubject(ws.subject, material.content || material.name);
      ws.detectedTopics = Array.from(new Set([...ws.detectedTopics, ...extraTopics]));
    }
    saveWorkspaces(workspaces);
  }

  return newMaterial;
}

export function removeMaterialFromWorkspace(workspaceId: string, materialId: string): void {
  const workspaces = getWorkspaces();
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (ws) {
    ws.materials = ws.materials.filter((m) => m.id !== materialId);
    ws.stats.materialsUploaded = ws.materials.length;
    saveWorkspaces(workspaces);
  }
}

export function renameMaterial(workspaceId: string, materialId: string, newName: string): void {
  const workspaces = getWorkspaces();
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (ws) {
    const mat = ws.materials.find((m) => m.id === materialId);
    if (mat) {
      mat.name = newName.trim();
      saveWorkspaces(workspaces);
    }
  }
}

// Helpers for topic extraction
export function deriveTopicsForSubject(subject: string, contentHint?: string): string[] {
  const s = subject.toLowerCase();
  const content = (contentHint || "").toLowerCase();

  if (s.includes("data structure") || s.includes("dsa") || content.includes("tree") || content.includes("stack")) {
    return [
      "Unit 1: Stacks, Queues, and Linked Lists",
      "Unit 2: Binary Search Trees & AVL Balance",
      "Unit 3: Priority Queues & Heap Sort",
      "Unit 4: Graph Representations & Traversals",
      "Unit 5: Hash Tables & Collision Resolution",
    ];
  }

  if (s.includes("operating system") || s.includes("os") || content.includes("process") || content.includes("deadlock")) {
    return [
      "Unit 1: OS Architecture & System Calls",
      "Unit 2: Process Synchronization & Semaphores",
      "Unit 3: CPU Scheduling & Deadlocks",
      "Unit 4: Virtual Memory & Page Replacement",
      "Unit 5: File Systems & Disk Scheduling",
    ];
  }

  if (s.includes("database") || s.includes("dbms") || content.includes("sql") || content.includes("relational") || content.includes("normalization")) {
    return [
      "Unit 1: Entity-Relationship (ER) Modeling",
      "Unit 2: Relational Algebra & SQL Queries",
      "Unit 3: Normalization (1NF, 2NF, 3NF, BCNF)",
      "Unit 4: Transaction Processing & ACID Properties",
      "Unit 5: Concurrency Control & Indexing",
    ];
  }

  if (s.includes("network") || s.includes("cn") || content.includes("tcp") || content.includes("ip") || content.includes("osi")) {
    return [
      "Unit 1: OSI Reference Model & Physical Layer",
      "Unit 2: Data Link Layer & Sliding Window Protocols",
      "Unit 3: Network Layer, IP Addressing, Routing",
      "Unit 4: Transport Layer (TCP vs UDP, Flow Control)",
      "Unit 5: Application Layer (DNS, HTTP, SMTP)",
    ];
  }

  if (s.includes("python") || s.includes("programming") || content.includes("python") || content.includes("def ") || content.includes("class ")) {
    return [
      "Unit 1: Python Syntax, Control Flow & Data Types",
      "Unit 2: Functions, Scopes & Modular Programming",
      "Unit 3: Object-Oriented Programming (Classes & Inheritance)",
      "Unit 4: File Handling & Exception Management",
      "Unit 5: Standard Libraries & Practical Applications",
    ];
  }

  if (s.includes("physics") || content.includes("quantum") || content.includes("wave optics") || content.includes("semiconductor")) {
    return [
      "Unit 1: Wave Optics & Laser Technology",
      "Unit 2: Quantum Mechanics & De Broglie Waves",
      "Unit 3: Semiconductor Physics & Band Theory",
      "Unit 4: Magnetic & Dielectric Properties",
      "Unit 5: Fiber Optics & Sensor Applications",
    ];
  }

  if ((s.includes("math") && !s.includes("discrete")) || s.includes("calculus") || s.includes("linear algebra") || (content.includes("eigenvalues") && content.includes("differential equation"))) {
    return [
      "Unit 1: Matrices, Rank, and Eigenvalues",
      "Unit 2: Partial Derivatives & Maxima-Minima",
      "Unit 3: Multiple Integrals & Beta-Gamma Functions",
      "Unit 4: Vector Calculus & Green's Theorem",
      "Unit 5: First & Second Order Differential Equations",
    ];
  }

  return [
    `Unit 1: Core Fundamentals of ${subject}`,
    `Unit 2: Analytical Methods and Mechanisms`,
    `Unit 3: Advanced Concepts & System Design`,
    `Unit 4: Problem Solving and Implementation`,
    `Unit 5: Real-World Applications and Exam Trends`,
  ];
}

// -------------------------------------------------------------
// Guided Lessons Storage & Tracking
// -------------------------------------------------------------
export function getSavedLessons(workspaceId: string): GuidedLesson[] {
  try {
    const raw = localStorage.getItem(`${LESSONS_STORAGE_KEY}_${workspaceId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading lessons:", e);
  }
  return [];
}

export function saveGuidedLesson(workspaceId: string, lesson: GuidedLesson): void {
  try {
    const existing = getSavedLessons(workspaceId);
    const updated = [lesson, ...existing.filter((l) => l.id !== lesson.id)];
    localStorage.setItem(`${LESSONS_STORAGE_KEY}_${workspaceId}`, JSON.stringify(updated));

    // Update workspace stats
    const workspaces = getWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      ws.stats.lessonsCompleted = updated.filter((l) => l.completed).length;
      ws.progressPercent = Math.min(100, Math.round((ws.stats.lessonsCompleted * 15) + (ws.stats.quizzesAttempted * 10)));
      saveWorkspaces(workspaces);
    }
  } catch (e) {
    console.warn("Error saving lesson:", e);
  }
}

// -------------------------------------------------------------
// Flashcards Storage
// -------------------------------------------------------------
export function getSavedFlashcards(workspaceId: string): Flashcard[] {
  try {
    const raw = localStorage.getItem(`${FLASHCARDS_STORAGE_KEY}_${workspaceId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading flashcards:", e);
  }
  return [];
}

export function saveFlashcards(workspaceId: string, cards: Flashcard[]): void {
  try {
    localStorage.setItem(`${FLASHCARDS_STORAGE_KEY}_${workspaceId}`, JSON.stringify(cards));

    // Update workspace stats
    const workspaces = getWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      const reviewed = cards.filter((c) => c.status !== "unreviewed").length;
      ws.stats.flashcardsReviewed = reviewed;
      saveWorkspaces(workspaces);
    }
  } catch (e) {
    console.warn("Error saving flashcards:", e);
  }
}

// -------------------------------------------------------------
// Quiz Results Storage
// -------------------------------------------------------------
export function getSavedQuizResults(workspaceId: string): QuizResult[] {
  try {
    const raw = localStorage.getItem(`${QUIZ_RESULTS_STORAGE_KEY}_${workspaceId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading quiz results:", e);
  }
  return [];
}

export function saveQuizResult(workspaceId: string, result: QuizResult): void {
  try {
    const existing = getSavedQuizResults(workspaceId);
    const updated = [result, ...existing];
    localStorage.setItem(`${QUIZ_RESULTS_STORAGE_KEY}_${workspaceId}`, JSON.stringify(updated));

    // Recalculate stats
    const workspaces = getWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      ws.stats.quizzesAttempted = updated.length;
      const totalCorrect = updated.reduce((acc, r) => acc + r.correctCount, 0);
      const totalQuestions = updated.reduce((acc, r) => acc + r.totalQuestions, 0);
      ws.stats.quizAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      ws.progressPercent = Math.min(100, Math.round((ws.stats.lessonsCompleted * 15) + (ws.stats.quizzesAttempted * 10)));
      saveWorkspaces(workspaces);
    }
  } catch (e) {
    console.warn("Error saving quiz result:", e);
  }
}

// -------------------------------------------------------------
// Mock Exams Storage
// -------------------------------------------------------------
export function getSavedMockExams(workspaceId: string): MockExam[] {
  try {
    const raw = localStorage.getItem(`${MOCK_EXAMS_STORAGE_KEY}_${workspaceId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading mock exams:", e);
  }
  return [];
}

export function saveMockExam(workspaceId: string, exam: MockExam): void {
  try {
    const existing = getSavedMockExams(workspaceId);
    const updated = [exam, ...existing.filter((e) => e.id !== exam.id)];
    localStorage.setItem(`${MOCK_EXAMS_STORAGE_KEY}_${workspaceId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn("Error saving mock exam:", e);
  }
}

export function getAllSavedFlashcards(): Flashcard[] {
  const workspaces = getWorkspaces();
  return workspaces.flatMap((w) => getSavedFlashcards(w.id));
}

export function getAllSavedLessons(): GuidedLesson[] {
  const workspaces = getWorkspaces();
  return workspaces.flatMap((w) => getSavedLessons(w.id));
}

export function getAllSavedQuizResults(): QuizResult[] {
  const workspaces = getWorkspaces();
  return workspaces.flatMap((w) => getSavedQuizResults(w.id));
}

// -------------------------------------------------------------
// VR25 Knowledge Base Curriculum Metadata
// -------------------------------------------------------------
export interface VR25SubjectMetadata {
  name: string;
  code: string;
  units: string[];
  topics: Record<string, string[]>;
}

export const VR25_CURRICULUM: Record<string, Record<string, VR25SubjectMetadata[]>> = {
  "1st Year": {
    "1st Semester": [
      {
        name: "Programming for Problem Solving",
        code: "PPS",
        units: ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6"],
        topics: {
          "Unit 1": ["Computing Fundamentals", "Algorithms & Flowcharts", "Number Systems"],
          "Unit 2": ["C Data Types", "Operators & Expressions", "Input & Output"],
          "Unit 3": ["Decision Making & Branching", "Loops & Iterations", "Functions & Recursion"],
          "Unit 4": ["1D & 2D Arrays", "Strings & Character Handling", "Pointers & Pointer Arithmetic"],
          "Unit 5": ["Structures & Nested Structures", "Unions", "Preprocessor Directives"],
          "Unit 6": ["Dynamic Memory Allocation (malloc, calloc, free)", "File Handling in C"],
        },
      },
      {
        name: "Basic Electrical Engineering",
        code: "BEE",
        units: ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"],
        topics: {
          "Unit 1": ["Kirchhoff's Laws (KCL & KVL)", "Mesh & Nodal Analysis", "Thevenin & Norton Theorems"],
          "Unit 2": ["Single Phase AC Circuits", "Three Phase Star & Delta Circuits", "Power Factor"],
          "Unit 3": ["Magnetic Circuits", "Single Phase Transformers", "EMF Equation & Losses"],
          "Unit 4": ["DC Machines (Motors & Generators)", "Three Phase Induction Motors"],
          "Unit 5": ["Electrical Installations", "Switchgear & Circuit Breakers", "Earthing & Safety"],
        },
      },
      {
        name: "Mathematics-I",
        code: "M1",
        units: ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"],
        topics: {
          "Unit 1": ["Rank of a Matrix", "Echelon Form", "System of Linear Equations (AX = B)"],
          "Unit 2": ["Eigenvalues & Eigenvectors", "Cayley-Hamilton Theorem", "Diagonalization"],
          "Unit 3": ["Rolle's & Mean Value Theorems", "Taylor's & Maclaurin's Series"],
          "Unit 4": ["Partial Differentiation", "Jacobians", "Maxima & Minima of Two Variables"],
          "Unit 5": ["Multiple Integrals", "Double & Triple Integrals", "Applications to Areas & Volumes"],
        },
      },
      {
        name: "Engineering Drawing",
        code: "CAEG",
        units: ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"],
        topics: {
          "Unit 1": ["Principles of Engineering Graphics", "Scales (Plain & Diagonal)", "Conic Sections"],
          "Unit 2": ["Special Curves (Cycloids, Involutes)", "Engineering Lettering & Dimensioning"],
          "Unit 3": ["Orthographic Projections", "Projections of Points", "Projections of Straight Lines"],
          "Unit 4": ["Projections of Regular Planes", "Projections of Right Regular Solids"],
          "Unit 5": ["Isometric Projections", "Conversion of Isometric to Orthographic Views"],
        },
      },
      {
        name: "Communicative English",
        code: "ENG",
        units: ["Unit 1", "Unit 2"],
        topics: {
          "Unit 1": ["Reading Comprehension", "Human Resources - Rural BPOs (Kizhanur)", "Vocabulary & Synonyms"],
          "Unit 2": ["Non-Detailed Literature", "Technical Writing & Grammar", "Active & Passive Voice"],
        },
      },
    ],
  },
};

// -------------------------------------------------------------
// Real Learning Activity Tracking
// -------------------------------------------------------------
const LEARNING_ACTIVITY_KEY = "astramind_learning_activities_v1";

export function getLearningActivities(workspaceId?: string): LearningActivityRecord[] {
  try {
    const raw = localStorage.getItem(LEARNING_ACTIVITY_KEY);
    if (!raw) return [];
    const list: LearningActivityRecord[] = JSON.parse(raw);
    if (workspaceId) {
      return list.filter((a) => a.workspaceId === workspaceId);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveLearningActivity(activity: Omit<LearningActivityRecord, "id" | "createdAt">): LearningActivityRecord {
  const activities = getLearningActivities();
  const newActivity: LearningActivityRecord = {
    ...activity,
    id: "act-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
  };
  const updated = [newActivity, ...activities];
  localStorage.setItem(LEARNING_ACTIVITY_KEY, JSON.stringify(updated.slice(0, 500)));
  return newActivity;
}
