import { 
  PDFStudyDocument, 
  PDFFlashcardDeck, 
  PDFStudyNote, 
  PDFStudySummary, 
  PDFQuestionSet 
} from "../types";

const STORAGE_KEYS = {
  ACTIVE_DOC: "astramind_pdf_active_doc",
  SAVED_DOCS: "astramind_pdf_saved_docs",
  DECKS: "astramind_pdf_flashcard_decks",
  NOTES: "astramind_pdf_saved_notes",
  SUMMARIES: "astramind_pdf_saved_summaries",
  QUESTION_SETS: "astramind_pdf_saved_questions",
};

// Initial pre-seeded authoritative VR25 flashcard decks from Google Drive Master materials
export const INITIAL_VR25_DECKS: PDFFlashcardDeck[] = [
  {
    id: "deck_bee_master",
    documentId: "doc_bee_drive",
    documentTitle: "BEE COMPLETE NOTES.pdf",
    title: "Basic Electrical Engineering - Core Laws & Theorems",
    scope: "entire",
    scopeDetail: "Unit 1 & 2: DC & AC Circuits",
    cardCount: 10,
    knownCardIds: [],
    reviewCardIds: [],
    createdAt: Date.now() - 3600000 * 24,
    lastStudiedAt: Date.now() - 3600000 * 2,
    cards: [
      {
        id: "bee_c1",
        front: "What is Kirchhoff's Current Law (KCL)?",
        back: "The algebraic sum of currents entering a junction (node) in an electrical network is zero (Σ I = 0). It is based on the principle of Conservation of Charge.",
        topic: "DC Circuits",
        pageNumber: 14,
        category: "Law/Principle",
      },
      {
        id: "bee_c2",
        front: "State Kirchhoff's Voltage Law (KVL).",
        back: "The algebraic sum of all voltages around any closed loop in an electrical network equals zero (Σ V = 0). It is based on the Conservation of Energy.",
        topic: "DC Circuits",
        pageNumber: 16,
        category: "Law/Principle",
      },
      {
        id: "bee_c3",
        front: "What is Thevenin's Theorem?",
        back: "Any linear two-terminal bilateral circuit can be replaced by an equivalent circuit containing a single independent voltage source (Vth) in series with a resistor (Rth).",
        topic: "Network Theorems",
        pageNumber: 20,
        category: "Law/Principle",
      },
      {
        id: "bee_c4",
        front: "What is Norton's Theorem?",
        back: "Any linear two-terminal circuit can be replaced by an equivalent circuit containing an independent current source (In) in parallel with a resistor (Rn), where Rn = Rth.",
        topic: "Network Theorems",
        pageNumber: 24,
        category: "Law/Principle",
      },
      {
        id: "bee_c5",
        front: "State Maximum Power Transfer Theorem for a DC circuit.",
        back: "Maximum power is transferred from a source to a load when the load resistance (RL) equals the Thevenin equivalent resistance of the source (RL = Rth). Maximum efficiency is 50%.",
        topic: "Network Theorems",
        pageNumber: 28,
        category: "Law/Principle",
      },
      {
        id: "bee_c6",
        front: "What is the Formula for RMS value of a pure sinusoidal waveform?",
        back: "Vrms = Vm / √2 ≈ 0.707 * Vm, where Vm is the peak/maximum voltage amplitude.",
        topic: "AC Fundamentals",
        pageNumber: 35,
        category: "Formula",
      },
      {
        id: "bee_c7",
        front: "What is Form Factor and Peak Factor for a sinusoidal AC wave?",
        back: "Form Factor = RMS Value / Average Value = (Vm/√2) / (2Vm/π) = 1.11. Peak Factor = Peak Value / RMS Value = Vm / (Vm/√2) = 1.414.",
        topic: "AC Fundamentals",
        pageNumber: 38,
        category: "Formula",
      },
      {
        id: "bee_c8",
        front: "What is Power Factor in an AC circuit?",
        back: "Power Factor = cos(θ) = Real Power (P, Watts) / Apparent Power (S, VA) = R / Z. It indicates the phase displacement between voltage and current.",
        topic: "AC Circuits",
        pageNumber: 42,
        category: "Definition",
      },
      {
        id: "bee_c9",
        front: "What is the relationship between line and phase values in a balanced Star (Y) connected 3-phase system?",
        back: "VL = √3 * Vph (Line voltage is √3 times phase voltage and leads by 30°), while IL = Iph (Line current equals phase current).",
        topic: "Three Phase Systems",
        pageNumber: 52,
        category: "Comparison",
      },
      {
        id: "bee_c10",
        front: "What is the core working principle of a Transformer?",
        back: "Faraday's Law of Electromagnetic Induction through mutual induction between primary and secondary windings linked by a common magnetic flux.",
        topic: "Electrical Machines",
        pageNumber: 65,
        category: "Core Concept",
      },
    ],
  },
  {
    id: "deck_m1_master",
    documentId: "doc_m1_drive",
    documentTitle: "Engineering Mathematics-I.pdf",
    title: "Matrices, Eigenvalues & Calculus Revision Deck",
    scope: "entire",
    scopeDetail: "Unit 1: Linear Algebra & Matrices",
    cardCount: 5,
    knownCardIds: [],
    reviewCardIds: [],
    createdAt: Date.now() - 3600000 * 12,
    lastStudiedAt: Date.now() - 3600000 * 1,
    cards: [
      {
        id: "m1_c1",
        front: "What is an Eigenvalue and Eigenvector?",
        back: "For a square matrix A, a non-zero vector v is an eigenvector and scalar λ is an eigenvalue if Av = λv, or equivalently (A - λI)v = 0.",
        topic: "Matrices & Eigenvalues",
        pageNumber: 8,
        category: "Definition",
      },
      {
        id: "m1_c2",
        front: "State the Cayley-Hamilton Theorem.",
        back: "Every square matrix satisfies its own characteristic equation: if |A - λI| = 0 gives P(λ) = 0, then P(A) = 0. It is used to compute A⁻¹ and higher powers Aⁿ.",
        topic: "Matrices",
        pageNumber: 15,
        category: "Law/Principle",
      },
      {
        id: "m1_c3",
        front: "What is the Rank of a Matrix?",
        back: "The maximum number of linearly independent rows or columns in the matrix, or the order of the highest non-zero minor.",
        topic: "Linear Algebra",
        pageNumber: 4,
        category: "Definition",
      },
      {
        id: "m1_c4",
        front: "What is the sum and product of Eigenvalues of a matrix A?",
        back: "Sum of eigenvalues = Trace of A (sum of main diagonal elements). Product of eigenvalues = Determinant of A (|A|).",
        topic: "Matrices",
        pageNumber: 11,
        category: "Formula",
      },
      {
        id: "m1_c5",
        front: "State Rolle's Theorem conditions.",
        back: "If f(x) is continuous on [a, b], differentiable on (a, b), and f(a) = f(b), then there exists at least one c ∈ (a, b) such that f'(c) = 0.",
        topic: "Differential Calculus",
        pageNumber: 45,
        category: "Law/Principle",
      },
    ],
  },
];

// Helper to get all saved decks
export function getSavedDecks(): PDFFlashcardDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(INITIAL_VR25_DECKS));
      return INITIAL_VR25_DECKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_VR25_DECKS;
  } catch {
    return INITIAL_VR25_DECKS;
  }
}

export function saveDeck(deck: PDFFlashcardDeck): void {
  try {
    const current = getSavedDecks();
    const existingIndex = current.findIndex((d) => d.id === deck.id);
    let updated: PDFFlashcardDeck[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...deck, lastStudiedAt: Date.now() };
    } else {
      updated = [deck, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to persist deck:", err);
  }
}

export function deleteDeck(deckId: string): void {
  try {
    const current = getSavedDecks();
    const filtered = current.filter((d) => d.id !== deckId);
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to delete deck:", err);
  }
}

// Active Document Management
export function getActivePDFDocument(): PDFStudyDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DOC);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActivePDFDocument(doc: PDFStudyDocument | null): void {
  try {
    if (doc) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC, JSON.stringify(doc));
      // Also add to saved docs history
      const savedDocs = getSavedPDFDocuments();
      if (!savedDocs.some((d) => d.id === doc.id)) {
        localStorage.setItem(STORAGE_KEYS.SAVED_DOCS, JSON.stringify([doc, ...savedDocs.slice(0, 19)]));
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DOC);
    }
  } catch (err) {
    console.warn("Failed to set active PDF doc:", err);
  }
}

export function getSavedPDFDocuments(): PDFStudyDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_DOCS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Saved Notes Management
export function getSavedNotes(): PDFStudyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNote(note: PDFStudyNote): void {
  try {
    const current = getSavedNotes();
    const existingIdx = current.findIndex((n) => n.id === note.id);
    let updated: PDFStudyNote[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = note;
    } else {
      updated = [note, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save note:", err);
  }
}

export function deleteNote(noteId: string): void {
  try {
    const current = getSavedNotes();
    const filtered = current.filter((n) => n.id !== noteId);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to delete note:", err);
  }
}

// Saved Summaries Management
export function getSavedSummaries(): PDFStudySummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSummary(summary: PDFStudySummary): void {
  try {
    const current = getSavedSummaries();
    const filtered = current.filter((s) => s.id !== summary.id);
    localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify([summary, ...filtered]));
  } catch (err) {
    console.warn("Failed to save summary:", err);
  }
}

// Saved Question Sets Management
export function getSavedQuestionSets(): PDFQuestionSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTION_SETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQuestionSet(set: PDFQuestionSet): void {
  try {
    const current = getSavedQuestionSets();
    const filtered = current.filter((q) => q.id !== set.id);
    localStorage.setItem(STORAGE_KEYS.QUESTION_SETS, JSON.stringify([set, ...filtered]));
  } catch (err) {
    console.warn("Failed to save question set:", err);
  }
}
