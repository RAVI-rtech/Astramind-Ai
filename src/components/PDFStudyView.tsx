import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  BookOpen,
  Sparkles,
  MessageSquare,
  RotateCw,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Copy,
  Check,
  Search,
  Bookmark,
  Layers,
  Award,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Send,
  Trash2,
  Maximize2,
  Minimize2,
  FolderKanban,
  Flame,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sliders,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  PDFStudyDocument,
  PDFStudyAction,
  PDFChatMessage,
  PDFStudySummary,
  PDFStudyNote,
  PDFFlashcardItem,
  PDFFlashcardDeck,
  PDFStudyQuestion,
  PDFQuestionSet,
  PDFTopicExplanation,
  PDFImportantTopic,
  StudyWorkspace
} from "../types";
import {
  getActivePDFDocument,
  setActivePDFDocument,
  getSavedDecks,
  saveDeck,
  deleteDeck,
  getSavedNotes,
  saveNote,
  deleteNote,
  getSavedSummaries,
  saveSummary,
  getSavedQuestionSets,
  saveQuestionSet,
  getSavedPDFDocuments
} from "../lib/pdfStudyStorage";

interface PDFStudyViewProps {
  workspace?: StudyWorkspace | null;
  onOpenWorkspace?: () => void;
  accentColorClass?: string;
  initialDocument?: PDFStudyDocument | null;
}

export default function PDFStudyView({
  workspace,
  onOpenWorkspace,
  accentColorClass = "text-blue-400",
  initialDocument
}: PDFStudyViewProps) {
  // Active Selected PDF Document State
  const [activeDoc, setActiveDoc] = useState<PDFStudyDocument | null>(() => {
    const candidate = initialDocument || getActivePDFDocument();
    return candidate && typeof candidate.rawContent === "string" && candidate.rawContent.trim().length >= 30
      ? candidate
      : null;
  });

  // Active Tool Action (null = viewer only, or specific tool open)
  const [activeAction, setActiveAction] = useState<PDFStudyAction | null>(() =>
    initialDocument || getActivePDFDocument() ? "chat" : null
  );
  const [isStudyToolsExpanded, setIsStudyToolsExpanded] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<"stacked" | "split">("stacked");

  // Selection Modal
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [selectTab, setSelectTab] = useState<"upload" | "saved">("upload");
  const [savedPdfDocs, setSavedPdfDocs] = useState<PDFStudyDocument[]>(() => getSavedPDFDocuments());
  const [searchDocQuery, setSearchDocQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved Library Drawer
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // ==========================================
  // EMBEDDED PDF VIEWER STATE
  // ==========================================
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInputVal, setPageInputVal] = useState<string>("1");
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 50% to 200%
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewerSearchQuery, setViewerSearchQuery] = useState<string>("");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"page" | "scroll">("page");
  const [pdfLoadError, setPdfLoadError] = useState<boolean>(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // 1. PDF Chat State
  const [chatMessages, setChatMessages] = useState<PDFChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [chatScope, setChatScope] = useState<"entire" | "chapter" | "page">("entire");
  const [chatScopeDetail, setChatScopeDetail] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 2. Summarize State
  const [summaryType, setSummaryType] = useState<"entire" | "chapter" | "selected-page" | "short" | "detailed">("detailed");
  const [summaryScopeInput, setSummaryScopeInput] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activeSummary, setActiveSummary] = useState<PDFStudySummary | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // 3. AI Notes State
  const [noteTopic, setNoteTopic] = useState("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [activeNote, setActiveNote] = useState<PDFStudyNote | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNoteContent, setEditedNoteContent] = useState("");
  const [copiedNotes, setCopiedNotes] = useState(false);

  // 4. Flashcards State
  const [flashcardCount, setFlashcardCount] = useState<number>(10);
  const [flashcardScope, setFlashcardScope] = useState<"entire" | "chapter" | "pages" | "topic">("entire");
  const [flashcardScopeDetail, setFlashcardScopeDetail] = useState("");
  const [flashcardDifficulty, setFlashcardDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [activeDeck, setActiveDeck] = useState<PDFFlashcardDeck>(() => getSavedDecks()[0] || ({
    id: "",
    documentId: "",
    documentTitle: "",
    title: "No flashcard deck yet",
    scope: "entire",
    scopeDetail: "",
    cardCount: 0,
    knownCardIds: [],
    reviewCardIds: [],
    createdAt: Date.now(),
    lastStudiedAt: Date.now(),
    cards: [],
  }));
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // 5. Question Generator State
  const [questionTypes, setQuestionTypes] = useState<string[]>(["mcq", "short", "long", "fill-blanks", "true-false"]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questionDifficulty, setQuestionDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Exam Preparation">("Exam Preparation");
  const [questionTopic, setQuestionTopic] = useState("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [activeQuestionSet, setActiveQuestionSet] = useState<PDFQuestionSet | null>(null);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [userSelectedOptions, setUserSelectedOptions] = useState<Record<string, string>>({});

  // 6. Topic Explainer State
  const [explainTopicInput, setExplainTopicInput] = useState(activeDoc?.topics?.[0] || "");
  const [explainDepth, setExplainDepth] = useState<"simple" | "detailed" | "exam-focused">("exam-focused");
  const [isExplainingTopic, setIsExplainingTopic] = useState(false);
  const [activeExplanation, setActiveExplanation] = useState<PDFTopicExplanation | null>(null);

  // 7. Important Topics State
  const [isFindingTopics, setIsFindingTopics] = useState(false);
  const [importantTopicsList, setImportantTopicsList] = useState<PDFImportantTopic[]>([]);

  // Saved Data Lists for Library
  const [savedDecksList, setSavedDecksList] = useState<PDFFlashcardDeck[]>(() => getSavedDecks());
  const [savedNotesList, setSavedNotesList] = useState<PDFStudyNote[]>(() => getSavedNotes());
  const [savedSummariesList, setSavedSummariesList] = useState<PDFStudySummary[]>(() => getSavedSummaries());
  const [savedQuestionsList, setSavedQuestionsList] = useState<PDFQuestionSet[]>(() => getSavedQuestionSets());

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync page input when page changes
  useEffect(() => {
    setPageInputVal(String(currentPage));
  }, [currentPage]);

  // Saved documents consist only of PDFs uploaded by this user/browser.
  useEffect(() => {
    if (isSelectModalOpen) setSavedPdfDocs(getSavedPDFDocuments());
  }, [isSelectModalOpen]);

  // Select document and open inside AstraMind viewer
  const handleSelectDocument = (doc: PDFStudyDocument) => {
    setActiveDoc(doc);
    setActivePDFDocument(doc);
    setCurrentPage(1);
    setPdfLoadError(false);
    setIsSelectModalOpen(false);

    // Begin a new conversation without inventing page citations or syllabus content.
    setChatMessages([{
      id: `msg_${Date.now()}`,
      sender: "ai",
      text: `Loaded your PDF **${doc.fileName}**. Ask about its extracted text, or generate study materials from this document.`,
      timestamp: Date.now(),
    }]);
    setActiveAction("chat");

    if (doc.topics && doc.topics.length > 0) {
      setExplainTopicInput(doc.topics[0]);
    }
    showToast(`Loaded "${doc.fileName}" inside AstraMind`);
  };

  // Upload and extract the user's actual PDF. Do not estimate pages or invent fallback content.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please select a PDF file.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      showToast("This PDF is larger than 30 MB. Please upload a smaller PDF.");
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      showToast("Could not read this PDF file. Please try again.");
    };
    reader.onload = async (ev) => {
      try {
        const arrayBuffer = ev.target?.result as ArrayBuffer;
        if (!arrayBuffer || arrayBuffer.byteLength < 5) {
          throw new Error("The selected file is empty or unreadable.");
        }
        const bytes = new Uint8Array(arrayBuffer);
        const header = String.fromCharCode(...bytes.subarray(0, 5));
        if (header !== "%PDF-") {
          throw new Error("The selected file does not appear to be a valid PDF.");
        }

        const chunks: string[] = [];
        const chunkSize = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          chunks.push(String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length))));
        }
        const base64 = btoa(chunks.join(""));
        showToast("Extracting text from your PDF...");
        const response = await fetch("/api/workspace/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileType: "pdf", base64 }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not process this PDF.");

        const extractedText = typeof result.extractedText === "string" ? result.extractedText.trim() : "";
        const profile = result.profile;
        if (extractedText.length < 30) {
          URL.revokeObjectURL(blobUrl);
          throw new Error("No readable text could be extracted from this PDF. Try a text-based PDF instead of an image-only scanned PDF.");
        }

        const newDoc: PDFStudyDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          title: profile?.title || file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          pageCount: Number(profile?.pages) || 1,
          sourceType: "uploaded",
          uploadedAt: Date.now(),
          previewUrl: blobUrl,
          subject: profile?.detectedDomain || workspace?.subject || "Uploaded PDF",
          unit: "",
          rawContent: extractedText,
          topics: Array.isArray(profile?.topics) ? profile.topics.filter((topic: unknown) => typeof topic === "string" && topic.trim()) : [],
        };
        handleSelectDocument(newDoc);
        setSavedPdfDocs(getSavedPDFDocuments());
        showToast(`Loaded ${file.name} for study.`);
      } catch (error: any) {
        URL.revokeObjectURL(blobUrl);
        showToast(error?.message || "Failed to read this PDF.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Page Jump Handler
  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInputVal, 10);
    const total = activeDoc?.pageCount || 100;
    if (!isNaN(p) && p >= 1 && p <= total) {
      setCurrentPage(p);
    } else {
      setPageInputVal(String(currentPage));
    }
  };

  // In-Document Text Search
  const handleDocSearch = (query: string) => {
    setViewerSearchQuery(query);
    if (!query.trim() || !activeDoc?.rawContent) {
      setSearchMatches([]);
      setCurrentMatchIdx(0);
      return;
    }
    const lower = activeDoc.rawContent.toLowerCase();
    const target = query.toLowerCase();
    const matches: number[] = [];
    let pos = lower.indexOf(target);
    while (pos !== -1 && matches.length < 50) {
      matches.push(pos);
      pos = lower.indexOf(target, pos + target.length);
    }
    setSearchMatches(matches);
    setCurrentMatchIdx(matches.length > 0 ? 1 : 0);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatThinking]);

  // ==========================================
  // ACTION HANDLERS (Ask AI, Summarize, Notes, Flashcards, Questions)
  // ==========================================

  // 1. Send Chat
  const handleSendChat = async (userPrompt?: string) => {
    const textToSend = userPrompt || chatInput;
    if (!textToSend.trim() || isChatThinking || !activeDoc) return;

    const userMsg: PDFChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!userPrompt) setChatInput("");
    setIsChatThinking(true);

    try {
      const messagesPayload = [...chatMessages, userMsg].map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const res = await fetch("/api/pdf-study/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTitle: activeDoc.title,
          pdfContent: activeDoc.rawContent || "",
          messages: messagesPayload,
          chapterOrScope: chatScope === "chapter" ? chatScopeDetail : undefined,
          pageRange: chatScope === "page" ? chatScopeDetail : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate answer");

      const aiMsg: PDFChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        text: data.text,
        timestamp: Date.now(),
        citations: data.citations || [
          {
            pageNumber: currentPage,
            chapter: "Verified Study Section",
            topic: activeDoc.subject || "Study Subject",
            excerpt: `Cited from ${activeDoc.fileName}`,
          },
        ],
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: "ai",
          text: `⚠️ **Could not generate response from PDF:** ${err?.message || "Please check network connection and try again."}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChatThinking(false);
    }
  };

  // 2. Generate Summary
  const handleGenerateSummary = async () => {
    if (!activeDoc || isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    try {
      const res = await fetch("/api/pdf-study/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTitle: activeDoc.title,
          pdfContent: activeDoc.rawContent || "",
          summaryType,
          chapterOrScope: summaryScopeInput.trim() || undefined,
        }),
      });
      const data: PDFStudySummary = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Failed to summarize PDF");

      setActiveSummary(data);
      saveSummary(data);
      setSavedSummariesList(getSavedSummaries());
      showToast("Summary generated & saved!");
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Failed to generate summary"}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 3. Generate Notes
  const handleGenerateNotes = async () => {
    if (!activeDoc || isGeneratingNotes) return;
    setIsGeneratingNotes(true);

    try {
      const res = await fetch("/api/pdf-study/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTitle: activeDoc.title,
          pdfContent: activeDoc.rawContent || "",
          topic: noteTopic.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate notes");

      const noteItem: PDFStudyNote = {
        id: `note_${Date.now()}`,
        documentId: activeDoc.id,
        documentTitle: activeDoc.title,
        topic: data.topic || noteTopic || "General Notes",
        title: data.title || `${activeDoc.title} Notes`,
        markdownContent: data.markdownContent,
        definitions: data.definitions || [],
        formulas: data.formulas || [],
        examples: data.examples || [],
        examTips: data.examTips || [],
        createdAt: Date.now(),
      };

      setActiveNote(noteItem);
      setEditedNoteContent(noteItem.markdownContent);
      saveNote(noteItem);
      setSavedNotesList(getSavedNotes());
      showToast("Notes generated & saved!");
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Failed to generate notes"}`);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // 4. Generate Flashcards
  const handleGenerateFlashcards = async () => {
    if (!activeDoc || isGeneratingFlashcards) return;
    setIsGeneratingFlashcards(true);

    try {
      const res = await fetch("/api/pdf-study/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTitle: activeDoc.title,
          pdfContent: activeDoc.rawContent || "",
          count: flashcardCount,
          scope: flashcardScope,
          scopeDetail: flashcardScopeDetail.trim() || undefined,
          difficulty: flashcardDifficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate flashcards");

      const cards: PDFFlashcardItem[] = data.cards || [];
      const newDeck: PDFFlashcardDeck = {
        id: `deck_${Date.now()}`,
        documentId: activeDoc.id,
        documentTitle: activeDoc.title,
        title: `${activeDoc.title} - ${flashcardScopeDetail || flashcardDifficulty} Deck`,
        scope: flashcardScope,
        scopeDetail: flashcardScopeDetail,
        cardCount: cards.length,
        cards,
        knownCardIds: [],
        reviewCardIds: [],
        createdAt: Date.now(),
        lastStudiedAt: Date.now(),
      };

      setActiveDeck(newDeck);
      setCurrentCardIdx(0);
      setIsCardFlipped(false);
      saveDeck(newDeck);
      setSavedDecksList(getSavedDecks());
      showToast(`Generated ${cards.length} high-yield flashcards!`);
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Failed to generate flashcards"}`);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // 5. Generate Questions
  const handleGenerateQuestions = async () => {
    if (!activeDoc || isGeneratingQuestions) return;
    setIsGeneratingQuestions(true);

    try {
      const res = await fetch("/api/pdf-study/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTitle: activeDoc.title,
          pdfContent: activeDoc.rawContent || "",
          questionTypes,
          count: questionCount,
          difficulty: questionDifficulty,
          topic: questionTopic.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");

      const questionSet: PDFQuestionSet = {
        id: `qset_${Date.now()}`,
        documentId: activeDoc.id,
        documentTitle: activeDoc.title,
        title: `${activeDoc.title} - ${questionDifficulty} Assessment`,
        difficulty: questionDifficulty,
        questionTypes: questionTypes as any,
        questions: data.questions || [],
        createdAt: Date.now(),
      };

      setActiveQuestionSet(questionSet);
      saveQuestionSet(questionSet);
      setSavedQuestionsList(getSavedQuestionSets());
      setRevealedSolutions({});
      setUserSelectedOptions({});
      showToast(`Generated ${questionSet.questions.length} questions!`);
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Failed to generate questions"}`);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // 6. Explain Topic
  const handleExplainTopic = async (overrideTopic?: string) => {
    const topicToUse = overrideTopic || explainTopicInput;
    if (!activeDoc || !topicToUse.trim() || isExplainingTopic) return;
    setIsExplainingTopic(true);

    try {
      const res = await fetch("/api/pdf-study/explain-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTitle: activeDoc.title,
          pdfContent: activeDoc.rawContent || "",
          topic: topicToUse.trim(),
          depth: explainDepth,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to explain topic");

      setActiveExplanation(data);
      showToast(`Explained "${topicToUse}" from ${activeDoc.fileName}!`);
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Failed to explain topic"}`);
    } finally {
      setIsExplainingTopic(false);
    }
  };

  // 7. Find Important Topics
  const handleFindImportantTopics = async () => {
    if (!activeDoc || isFindingTopics) return;
    setIsFindingTopics(true);

    try {
      const res = await fetch("/api/pdf-study/important-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfTitle: activeDoc.title,
          pdfContent: activeDoc.rawContent || "",
          subject: activeDoc.subject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to find topics");

      setImportantTopicsList(data.topics || []);
      showToast(`Identified ${data.topics?.length || 0} high-yield topics!`);
    } catch (err: any) {
      showToast(`Error: ${err?.message || "Failed to scan topics"}`);
    } finally {
      setIsFindingTopics(false);
    }
  };

  // Flashcard Mastery Actions
  const currentCard = activeDeck.cards[currentCardIdx] || activeDeck.cards[0];
  const isCurrentKnown = currentCard && activeDeck.knownCardIds.includes(currentCard.id);
  const isCurrentReview = currentCard && activeDeck.reviewCardIds.includes(currentCard.id);

  const markCardKnown = () => {
    if (!currentCard) return;
    const knownSet = new Set(activeDeck.knownCardIds);
    const reviewSet = new Set(activeDeck.reviewCardIds);
    knownSet.add(currentCard.id);
    reviewSet.delete(currentCard.id);

    const updated = {
      ...activeDeck,
      knownCardIds: Array.from(knownSet),
      reviewCardIds: Array.from(reviewSet),
    };
    setActiveDeck(updated);
    saveDeck(updated);

    if (currentCardIdx < activeDeck.cards.length - 1) {
      setCurrentCardIdx((idx) => idx + 1);
      setIsCardFlipped(false);
    }
  };

  const markCardReview = () => {
    if (!currentCard) return;
    const knownSet = new Set(activeDeck.knownCardIds);
    const reviewSet = new Set(activeDeck.reviewCardIds);
    reviewSet.add(currentCard.id);
    knownSet.delete(currentCard.id);

    const updated = {
      ...activeDeck,
      knownCardIds: Array.from(knownSet),
      reviewCardIds: Array.from(reviewSet),
    };
    setActiveDeck(updated);
    saveDeck(updated);

    if (currentCardIdx < activeDeck.cards.length - 1) {
      setCurrentCardIdx((idx) => idx + 1);
      setIsCardFlipped(false);
    }
  };

  const shuffleDeck = () => {
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    const updated = { ...activeDeck, cards: shuffled };
    setActiveDeck(updated);
    saveDeck(updated);
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
    showToast("Deck shuffled!");
  };

  const restartDeck = () => {
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
    showToast("Restarted from Card 1");
  };

  const masteryPercentage = activeDeck.cards.length > 0
    ? Math.round((activeDeck.knownCardIds.length / activeDeck.cards.length) * 100)
    : 0;

  const totalPages = activeDoc?.pageCount || 100;

  // The native PDF preview is available for the current uploaded file. Persisted saved entries retain extracted text only.
  const inAppPdfStreamUrl = activeDoc?.previewUrl || null;

  return (
    <div
      ref={viewerContainerRef}
      className={`flex-1 flex flex-col h-full bg-[#0d0d0e] text-[#fcfcfc] overflow-hidden relative font-sans ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-[#151517] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-[#a78bfa]/30 flex items-center space-x-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-[#a78bfa]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER - CLEAN IN-APP BRANDING (ZERO DRIVE REDIRECTS) */}
      {/* ========================================================================= */}
      <header className="px-5 py-3 bg-[#151517] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-[#a78bfa]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif-studio text-lg font-medium text-white tracking-tight flex items-center gap-2">
                <span>PDF Study</span>
                <span className="text-[10px] font-mono-studio font-semibold px-2 py-0.5 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/25">
                  In-App Viewer
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <strong className="text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-md">
                {activeDoc?.fileName || "Engineering Mathematics-I.pdf"}
              </strong>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[11px]">{totalPages} Pages</span>
              {activeDoc?.fileSize && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono text-[11px]">{activeDoc.fileSize}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Switch Document Button */}
          <button
            onClick={() => setIsSelectModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all active:scale-95 cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Select PDF</span>
          </button>

          {/* Saved Library */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all cursor-pointer"
            title="Saved Decks & Notes"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Library</span>
          </button>

          {/* Layout Toggle (Stacked vs Split) */}
          <button
            onClick={() => setLayoutMode(layoutMode === "stacked" ? "split" : "stacked")}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
            title={layoutMode === "stacked" ? "Switch to Side-by-Side Split View" : "Switch to Stacked View"}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[11px] capitalize">{layoutMode}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTAINER: IN-APP EMBEDDED PDF VIEWER + STUDY ACTIONS */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex ${
          layoutMode === "split" ? "flex-col md:flex-row" : "flex-col"
        } overflow-hidden`}
      >
        {/* ========================================================================= */}
        {/* LEFT / TOP: EMBEDDED PDF VIEWER (PRIMARY FOCUS) */}
        {/* ========================================================================= */}
        <section
          className={`flex flex-col bg-slate-950 border-r border-b border-slate-800/80 overflow-hidden ${
            layoutMode === "split"
              ? "flex-1 md:w-7/12 lg:w-3/5 h-full"
              : isStudyToolsExpanded && activeAction
              ? "h-[50vh] sm:h-[55vh]"
              : "flex-1 h-full"
          }`}
        >
          {/* PROFESSIONAL VIEWER TOOLBAR */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs z-10 shrink-0">
            {/* Page Navigation: Prev, Page X / Y, Next */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (currentPage > 1) setCurrentPage((p) => p - 1);
                }}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <form onSubmit={handlePageJump} className="flex items-center space-x-1.5">
                <span className="text-slate-400 font-medium">Page</span>
                <input
                  type="text"
                  value={pageInputVal}
                  onChange={(e) => setPageInputVal(e.target.value)}
                  onBlur={handlePageJump}
                  className="w-12 text-center bg-slate-950 border border-slate-700 rounded-md py-0.5 px-1 font-mono font-bold text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-400 font-mono">/ {totalPages}</span>
              </form>

              <button
                onClick={() => {
                  if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                }}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* In-Document Search */}
            <div className="flex items-center space-x-1.5">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search in PDF..."
                  value={viewerSearchQuery}
                  onChange={(e) => handleDocSearch(e.target.value)}
                  className="w-32 sm:w-44 bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {searchMatches.length > 0 && (
                <div className="flex items-center space-x-1 text-[11px] text-cyan-300 font-mono">
                  <span>
                    {currentMatchIdx}/{searchMatches.length}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentMatchIdx((idx) => (idx > 1 ? idx - 1 : searchMatches.length));
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => {
                      setCurrentMatchIdx((idx) => (idx < searchMatches.length ? idx + 1 : 1));
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>

            {/* Zoom Controls & Mode */}
            <div className="flex items-center space-x-1.5">
              {/* Zoom Out */}
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Fit / Reset */}
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] font-bold cursor-pointer"
                title="Fit to Screen (100%)"
              >
                {zoomLevel}%
              </button>

              {/* Zoom In */}
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors ml-1"
                title="Toggle Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* VIEWER DISPLAY CANVAS (NATIVE & STREAMED EMBED) */}
          <div className="flex-1 bg-slate-900/60 overflow-auto p-4 flex flex-col items-center justify-start relative">
            {!activeDoc ? (
              <div className="my-auto text-center p-8 max-w-lg space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Start with your own PDF</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Upload or share a readable PDF to open it here. AstraMind will extract the document text before generating answers, notes, flashcards, or quiz questions.</p>
                <button onClick={() => { setSelectTab("upload"); setIsSelectModalOpen(true); }} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer">
                  Upload PDF
                </button>
              </div>
            ) : pdfLoadError ? (
              /* Requirement 6: Specific Error Message (NO DRIVE REDIRECT) */
              <div className="my-auto text-center p-8 bg-slate-900/90 border border-slate-800 rounded-3xl max-w-md shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Document Access</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unable to load this PDF. Please check your document access or try again.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setPdfLoadError(false);
                      showToast("Retrying document stream...");
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow cursor-pointer transition-colors"
                  >
                    Retry Loading
                  </button>
                  <button
                    onClick={() => setIsSelectModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Choose Another PDF
                  </button>
                </div>
              </div>
            ) : inAppPdfStreamUrl ? (
              /* Native in-app PDF Embed (Streams through AstraMind backend without external redirects) */
              <div
                className="w-full h-full flex flex-col items-center transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <iframe
                  src={`${inAppPdfStreamUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
                  title={activeDoc?.title || "PDF Document"}
                  className="w-full h-full rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
                  onError={() => setPdfLoadError(true)}
                />
              </div>
            ) : (
              /* High-Resolution Document Reader View */
              <div
                className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{activeDoc?.title}</h3>
                    <p className="text-xs text-slate-400">
                      Page {currentPage} of {totalPages} • {activeDoc?.subject}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                    Extracted PDF Text
                  </span>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed font-sans">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    {activeDoc?.rawContent || "No extracted text is available for this PDF."}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT / BOTTOM: STUDY ACTIONS DOCK & PANELS (KEPT TOGETHER WITH VIEWER) */}
        {/* ========================================================================= */}
        <section
          className={`flex flex-col bg-slate-900/90 overflow-hidden ${
            layoutMode === "split"
              ? "flex-1 md:w-5/12 lg:w-2/5 h-full border-t md:border-t-0"
              : isStudyToolsExpanded && activeAction
              ? "flex-1 min-h-[45vh]"
              : "shrink-0"
          }`}
        >
          {/* STUDY ACTIONS TOOLBAR */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0 z-10">
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: "chat", label: "Ask AI", icon: MessageSquare },
                { id: "summarize", label: "Summarize", icon: FileCheck },
                { id: "notes", label: "Notes", icon: BookOpen },
                { id: "flashcards", label: "Flashcards", icon: RotateCw, badge: `${activeDeck.cards.length}` },
                { id: "questions", label: "Questions", icon: HelpCircle },
                { id: "explain-topic", label: "Explain Topic", icon: Lightbulb },
                { id: "important-topics", label: "Important Topics", icon: Flame },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeAction === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveAction(tab.id as PDFStudyAction);
                      setIsStudyToolsExpanded(true);
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="text-[10px] font-mono px-1.5 rounded-full bg-slate-700 text-slate-200">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collapse/Expand Toggle */}
            <button
              onClick={() => setIsStudyToolsExpanded(!isStudyToolsExpanded)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title={isStudyToolsExpanded ? "Collapse study tools" : "Expand study tools"}
            >
              {isStudyToolsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* ACTIVE TOOL CONTENT PANEL */}
          {isStudyToolsExpanded && activeAction && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* ------------------------------------------------------------- */}
              {/* ACTION 1: ASK AI (PDF CHAT GROUNDED IN CURRENT DOC) */}
              {/* ------------------------------------------------------------- */}
              {activeAction === "chat" && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Scope filter */}
                  <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-300 font-medium">Chat Source:</span>
                      <strong className="text-white truncate max-w-[140px] sm:max-w-xs">
                        {activeDoc?.fileName}
                      </strong>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Page-Citing Active
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-xl rounded-2xl p-3.5 sm:p-4 text-xs shadow-md ${
                            msg.sender === "user"
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
                              : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                          }`}
                        >
                          <div className="prose prose-invert prose-xs max-w-none leading-relaxed">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5 items-center">
                              {msg.citations.map((cite, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono"
                                >
                                  Ref: Page {cite.pageNumber || currentPage}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isChatThinking && (
                      <div className="flex items-center space-x-2 text-slate-400 text-xs py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 max-w-xs animate-pulse">
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>Searching {activeDoc?.fileName}...</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input bar */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder={`Ask anything about ${activeDoc?.fileName || "this document"}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      disabled={isChatThinking}
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSendChat()}
                      disabled={isChatThinking || !chatInput.trim()}
                      className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow cursor-pointer transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ACTION 2: SUMMARIZE */}
              {/* ------------------------------------------------------------- */}
              {activeAction === "summarize" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex space-x-1 overflow-x-auto scrollbar-none text-xs">
                      {(["detailed", "entire", "chapter", "short"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSummaryType(t as any)}
                          className={`px-2.5 py-1 rounded-lg font-semibold border capitalize cursor-pointer transition-all ${
                            summaryType === t
                              ? "bg-blue-600/20 border-blue-500 text-blue-300"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {isGeneratingSummary ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{isGeneratingSummary ? "Generating..." : "Summarize"}</span>
                    </button>
                  </div>

                  {activeSummary ? (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <h4 className="font-bold text-blue-400 uppercase tracking-wider mb-1.5">Overview</h4>
                        <p className="text-slate-300 leading-relaxed">{activeSummary.overviewText}</p>
                      </div>

                      {activeSummary.keyConcepts?.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <h4 className="font-bold text-indigo-400 uppercase tracking-wider">Key Concepts</h4>
                          {activeSummary.keyConcepts.map((c, i) => (
                            <div key={i} className="flex items-start space-x-2 text-slate-200">
                              <span className="text-indigo-400">•</span>
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSummary.formulas?.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <h4 className="font-bold text-amber-400 uppercase tracking-wider">Important Formulas</h4>
                          {activeSummary.formulas.map((f, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-slate-950 font-mono text-amber-300">
                              <div className="font-bold">{f.formula}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{f.description}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Click "Summarize" above to generate a high-yield summary from this PDF.
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ACTION 3: NOTES */}
              {/* ------------------------------------------------------------- */}
              {activeAction === "notes" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Focus topic (optional)..."
                      value={noteTopic}
                      onChange={(e) => setNoteTopic(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleGenerateNotes}
                      disabled={isGeneratingNotes}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {isGeneratingNotes ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isGeneratingNotes ? "Generating..." : "Generate Notes"}</span>
                    </button>
                  </div>

                  {activeNote ? (
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="font-bold text-sm text-white">{activeNote.title}</h4>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeNote.markdownContent);
                            setCopiedNotes(true);
                            setTimeout(() => setCopiedNotes(false), 2000);
                          }}
                          className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                        >
                          {copiedNotes ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedNotes ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed">
                        <ReactMarkdown>{activeNote.markdownContent}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Click "Generate Notes" to create student-friendly revision notes from this PDF.
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ACTION 4: FLASHCARDS (INTERACTIVE 3D FLIP) */}
              {/* ------------------------------------------------------------- */}
              {activeAction === "flashcards" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin flex flex-col items-center">
                  {/* Deck controls */}
                  <div className="w-full flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <span>Size:</span>
                      {[5, 10, 20].map((cnt) => (
                        <button
                          key={cnt}
                          onClick={() => setFlashcardCount(cnt)}
                          className={`px-2 py-0.5 rounded font-bold border cursor-pointer ${
                            flashcardCount === cnt
                              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={shuffleDeck}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Shuffle"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleGenerateFlashcards}
                        disabled={isGeneratingFlashcards}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg cursor-pointer"
                      >
                        {isGeneratingFlashcards ? "Generating..." : "Regenerate"}
                      </button>
                    </div>
                  </div>

                  {/* Flashcard Component */}
                  {currentCard ? (
                    <div className="w-full max-w-md flex flex-col items-center space-y-3">
                      {/* Counter & Progress */}
                      <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Card {currentCardIdx + 1} / {activeDeck.cards.length}</span>
                        <span className="text-cyan-400 font-bold">{masteryPercentage}% Mastered</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-300"
                          style={{ width: `${masteryPercentage}%` }}
                        />
                      </div>

                      {/* 3D Flip Card */}
                      <div
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="w-full h-64 rounded-2xl p-6 cursor-pointer select-none relative flex flex-col justify-between border shadow-xl transition-all"
                        style={{
                          backgroundColor: isCardFlipped ? "#0f172a" : "#1e293b",
                          borderColor: isCardFlipped ? "rgba(59, 130, 246, 0.4)" : "rgba(148, 163, 184, 0.2)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase font-mono">
                            {currentCard.category || "Concept"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {isCardFlipped ? "Answer" : "Question"}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center justify-center text-center px-2 my-2">
                          <p className={`leading-relaxed ${isCardFlipped ? "text-slate-100 text-sm" : "text-white text-base font-bold"}`}>
                            {isCardFlipped ? currentCard.back : currentCard.front}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
                          <span>Page {currentCard.pageNumber || 1}</span>
                          <span>Tap to flip ↻</span>
                        </div>
                      </div>

                      {/* Controls: Prev, Flip, Next */}
                      <div className="w-full flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (currentCardIdx > 0) {
                              setCurrentCardIdx(currentCardIdx - 1);
                              setIsCardFlipped(false);
                            }
                          }}
                          disabled={currentCardIdx === 0}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs border border-slate-700 cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setIsCardFlipped(!isCardFlipped)}
                          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow"
                        >
                          {isCardFlipped ? "Question" : "Flip"}
                        </button>
                        <button
                          onClick={() => {
                            if (currentCardIdx < activeDeck.cards.length - 1) {
                              setCurrentCardIdx(currentCardIdx + 1);
                              setIsCardFlipped(false);
                            }
                          }}
                          disabled={currentCardIdx === activeDeck.cards.length - 1}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-semibold text-xs border border-slate-700 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>

                      {/* Mastery: [✓ Known] [✕ Review] */}
                      <div className="w-full grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={markCardKnown}
                          className={`py-2 rounded-xl font-bold text-xs border cursor-pointer ${
                            isCurrentKnown
                              ? "bg-emerald-600 text-white border-emerald-500"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                          }`}
                        >
                          Known ✓
                        </button>
                        <button
                          onClick={markCardReview}
                          className={`py-2 rounded-xl font-bold text-xs border cursor-pointer ${
                            isCurrentReview
                              ? "bg-rose-600 text-white border-rose-500"
                              : "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                          }`}
                        >
                          Need Review ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No flashcards in deck. Click "Regenerate" above to create cards from this PDF.
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ACTION 5: QUESTIONS */}
              {/* ------------------------------------------------------------- */}
              {activeAction === "questions" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={questionDifficulty}
                      onChange={(e) => setQuestionDifficulty(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Exam Preparation">Exam Preparation</option>
                    </select>

                    <button
                      onClick={handleGenerateQuestions}
                      disabled={isGeneratingQuestions}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {isGeneratingQuestions ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isGeneratingQuestions ? "Generating..." : "Generate Questions"}</span>
                    </button>
                  </div>

                  {activeQuestionSet && activeQuestionSet.questions.length > 0 ? (
                    <div className="space-y-3">
                      {activeQuestionSet.questions.map((q, idx) => {
                        const isRevealed = !!revealedSolutions[q.id];
                        return (
                          <div key={q.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-bold text-amber-400">Q{idx + 1} ({q.type.toUpperCase()})</span>
                              {q.pageReference && <span>Page {q.pageReference}</span>}
                            </div>
                            <p className="font-semibold text-white">{q.question}</p>

                            {q.options && q.options.length > 0 && (
                              <div className="space-y-1 pt-1">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() =>
                                setRevealedSolutions((prev) => ({
                                  ...prev,
                                  [q.id]: !prev[q.id],
                                }))
                              }
                              className="text-[11px] font-bold text-blue-400 hover:underline pt-1 cursor-pointer"
                            >
                              {isRevealed ? "Hide Solution" : "Reveal Answer & Explanation"}
                            </button>

                            {isRevealed && (
                              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-slate-200">
                                <div><strong className="text-emerald-400">Answer:</strong> {q.correctAnswer}</div>
                                <div><strong className="text-slate-400">Explanation:</strong> {q.explanation}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Click "Generate Questions" above to practice exam questions based on this PDF.
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ACTION 6: EXPLAIN TOPIC */}
              {/* ------------------------------------------------------------- */}
              {activeAction === "explain-topic" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Topic to explain..."
                      value={explainTopicInput}
                      onChange={(e) => setExplainTopicInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      onClick={() => handleExplainTopic()}
                      disabled={isExplainingTopic}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer whitespace-nowrap"
                    >
                      {isExplainingTopic ? "Explaining..." : "Explain"}
                    </button>
                  </div>

                  {activeExplanation ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">Analogy</span>
                        <p className="text-slate-200 leading-relaxed font-medium">"{activeExplanation.analogy}"</p>
                      </div>
                      <div>
                        <span className="font-bold text-blue-400 uppercase tracking-wider block mb-1">Definition</span>
                        <p className="text-slate-300 leading-relaxed">{activeExplanation.coreDefinition}</p>
                      </div>
                      {activeExplanation.keyFormulas?.length > 0 && (
                        <div>
                          <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-1">Formulas</span>
                          {activeExplanation.keyFormulas.map((f, i) => (
                            <div key={i} className="font-mono text-emerald-300 bg-emerald-500/10 p-2 rounded">
                              {f}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Enter any topic above to get an intuitive, step-by-step breakdown.
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ACTION 7: IMPORTANT TOPICS */}
              {/* ------------------------------------------------------------- */}
              {activeAction === "important-topics" && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-thin">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">High-yield semester exam topics</span>
                    <button
                      onClick={handleFindImportantTopics}
                      disabled={isFindingTopics}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                    >
                      {isFindingTopics ? "Scanning..." : "Scan PDF Topics"}
                    </button>
                  </div>

                  {importantTopicsList.length > 0 ? (
                    importantTopicsList.map((t) => (
                      <div key={t.rank} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">#{t.rank} {t.topic}</span>
                          <span className="text-[10px] text-rose-400 font-semibold uppercase">{t.importance} Priority</span>
                        </div>
                        <p className="text-slate-400">{t.examFrequency}</p>
                        <p className="text-slate-300">{t.whyImportant}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Click "Scan PDF Topics" to see recurring university questions.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* PDF source picker: saved uploads or user-uploaded PDF only. */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-blue-400" />
                  <span>Select Study PDF</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Use a PDF you upload here. No sample or master-drive documents are loaded.</p>
              </div>
              <button onClick={() => setIsSelectModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
              <button
                onClick={() => setSelectTab("upload")}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer ${selectTab === "upload" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >Upload PDF</button>
              <button
                onClick={() => setSelectTab("saved")}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 cursor-pointer ${selectTab === "saved" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >My Uploaded PDFs</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin">
              {selectTab === "upload" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 flex flex-col items-center justify-center space-y-3"
                >
                  <Upload className="w-8 h-8 text-blue-400" />
                  <p className="text-sm font-bold text-white">Choose a PDF from your device</p>
                  <p className="text-xs text-slate-400">AstraMind extracts text before enabling study tools. Maximum size: 30 MB.</p>
                  <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileUpload} className="hidden" />
                </div>
              )}
              {selectTab === "saved" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search your uploaded PDFs..."
                    value={searchDocQuery}
                    onChange={(e) => setSearchDocQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 mb-3 focus:outline-none focus:border-blue-500"
                  />
                  {savedPdfDocs.filter((doc) =>
                    !searchDocQuery.trim() ||
                    doc.fileName.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
                    (doc.subject || "").toLowerCase().includes(searchDocQuery.toLowerCase())
                  ).map((doc) => {
                    const isCurrent = activeDoc?.id === doc.id;
                    return (
                      <div key={doc.id} className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${isCurrent ? "bg-blue-600/10 border-blue-500" : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800"}`}>
                        <div className="flex items-center space-x-3 min-w-0">
                          <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{doc.fileName}</h4>
                            <span className="text-[11px] text-slate-400">{doc.subject || "Uploaded PDF"} • {doc.pageCount} page(s)</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectDocument(doc)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${isCurrent ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                        >{isCurrent ? "Opened ✓" : "Open extracted text"}</button>
                      </div>
                    );
                  })}
                  {savedPdfDocs.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs">No uploaded PDFs yet. Upload a PDF first.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: SAVED LIBRARY */}
      {/* ========================================================================= */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Saved Decks & Summaries</span>
              </h3>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {savedDecksList.map((deck) => (
                <div
                  key={deck.id}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white truncate max-w-[200px]">{deck.title}</p>
                    <p className="text-[11px] text-slate-400">{deck.cards.length} cards</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveDeck(deck);
                      setActiveAction("flashcards");
                      setIsLibraryOpen(false);
                      showToast(`Loaded deck "${deck.title}"`);
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer"
                  >
                    Study
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
