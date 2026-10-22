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

// No decks are pre-seeded. Flashcards appear only after a user generates them from an uploaded PDF.
export const INITIAL_VR25_DECKS: PDFFlashcardDeck[] = [];

// Helper to get all saved decks
export function getSavedDecks(): PDFFlashcardDeck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Remove previously shipped demonstration decks from older app versions.
    const realDecks = parsed.filter((deck: PDFFlashcardDeck) =>
      deck &&
      deck.documentId !== "doc_bee_drive" &&
      deck.documentId !== "doc_m1_drive" &&
      !String(deck.id || "").startsWith("deck_bee_master") &&
      !String(deck.id || "").startsWith("deck_m1_master")
    );
    if (realDecks.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(realDecks));
    }
    return realDecks;
  } catch {
    return [];
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
    const doc = JSON.parse(raw) as PDFStudyDocument;
    // Clear the hard-coded BEE demo document shipped in older builds.
    if (!doc || (doc.sourceType !== "uploaded" && doc.sourceType !== "workspace") || doc.id === "doc_bee_drive" || doc.fileName === "BEE COMPLETE NOTES.pdf") {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DOC);
      return null;
    }
    if (typeof doc.rawContent !== "string" || doc.rawContent.trim().length < 30) return null;
    return doc;
  } catch {
    return null;
  }
}

export function setActivePDFDocument(doc: PDFStudyDocument | null): void {
  try {
    if (doc) {
      // Blob URLs and full PDF base64 are session-only. Persist extracted text and metadata,
      // not the binary PDF, to avoid corrupt previews and exhausting localStorage quota.
      const persistedDoc: PDFStudyDocument = {
        ...doc,
        previewUrl: undefined,
        base64Data: undefined,
      };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC, JSON.stringify(persistedDoc));
      const savedDocs = getSavedPDFDocuments().filter((d) => d.id !== doc.id);
      localStorage.setItem(STORAGE_KEYS.SAVED_DOCS, JSON.stringify([persistedDoc, ...savedDocs].slice(0, 20)));
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
    if (!Array.isArray(parsed)) return [];
    const userDocuments = parsed.filter((doc: PDFStudyDocument) =>
      doc &&
      doc.id !== "doc_bee_drive" &&
      doc.fileName !== "BEE COMPLETE NOTES.pdf" &&
      doc.sourceType === "uploaded" &&
      typeof doc.rawContent === "string" &&
      doc.rawContent.trim().length >= 30
    );
    if (userDocuments.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.SAVED_DOCS, JSON.stringify(userDocuments));
    }
    return userDocuments;
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
