import fs from "fs";
import path from "path";
import https from "https";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import { 
  KnowledgeDocument, 
  KnowledgeChunk, 
  KnowledgeBaseStatus, 
  KnowledgeQueryResult,
  StudyContext
} from "../src/types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const KB_FILE_PATH = path.join(DATA_DIR, "vr25_knowledge_base.json");
const DRIVE_ROOT_FOLDER_ID = "1dwdJfBAsdyVnBcp8haPhTkl_2DMCPn-9";

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory knowledge state
interface KnowledgeBaseData {
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
  lastSync: number;
  ingestionJobs: Array<{
    id: string;
    status: "running" | "completed" | "failed";
    progress: number;
    startedAt: number;
    completedAt?: number;
    error?: string;
  }>;
}

let kbData: KnowledgeBaseData = {
  documents: [],
  chunks: [],
  lastSync: 0,
  ingestionJobs: [],
};

// =========================================================================
// 1. TEXT SIMILARITY & HYBRID SEARCH HELPERS
// =========================================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_#+\-\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Compute BM25-style keyword score
function computeKeywordScore(queryTokens: string[], docText: string): number {
  if (queryTokens.length === 0) return 0;
  const lowerDoc = docText.toLowerCase();
  let matches = 0;
  let exactBonus = 0;

  for (const token of queryTokens) {
    if (lowerDoc.includes(token)) {
      matches++;
      // Count frequency
      const freq = (lowerDoc.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      exactBonus += Math.min(3, freq) * 0.2;
    }
  }

  const coverage = matches / queryTokens.length;
  return coverage * 0.7 + exactBonus * 0.3;
}

// Generate simple bag-of-words pseudo-embedding for fast local cosine comparison
function generatePseudoEmbedding(text: string, dim: number = 64): number[] {
  const vec = new Array(dim).fill(0);
  const words = tokenize(text);
  for (const w of words) {
    let hash = 0;
    for (let i = 0; i < w.length; i++) {
      hash = (hash << 5) - hash + w.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// =========================================================================
// 2. QUERY ROUTING & SUBJECT CLASSIFIER
// =========================================================================

export function classifyQueryAcademicScope(query: string): {
  subject: string;
  subjectCode: string;
  unit?: string;
  topic?: string;
  confidence: "High" | "Medium" | "Low";
} {
  const q = query.toLowerCase();

  // Basic Electrical Engineering (BEE)
  if (
    q.includes("kirchhoff") ||
    q.includes("kcl") ||
    q.includes("kvl") ||
    q.includes("thevenin") ||
    q.includes("norton") ||
    q.includes("mesh analysis") ||
    q.includes("nodal analysis") ||
    q.includes("superposition") ||
    q.includes("maximum power") ||
    q.includes("transformer") ||
    q.includes("magnetic circuit") ||
    q.includes("dc motor") ||
    q.includes("dc generator") ||
    q.includes("three phase") ||
    q.includes("star delta") ||
    q.includes("single phase ac") ||
    q.includes("rms value") ||
    q.includes("form factor") ||
    q.includes("power factor") ||
    q.includes("inductance") ||
    q.includes("capacitance") ||
    q.includes("ohm's law") ||
    q.includes("electrical circuit") ||
    q.includes("bee")
  ) {
    let unit = "Unit 1";
    if (q.includes("ac ") || q.includes("three phase") || q.includes("single phase") || q.includes("star delta")) unit = "Unit 2";
    else if (q.includes("transformer") || q.includes("magnetic")) unit = "Unit 3";
    else if (q.includes("motor") || q.includes("generator") || q.includes("machine")) unit = "Unit 4";

    return {
      subject: "Basic Electrical Engineering",
      subjectCode: "BEE",
      unit,
      topic: "DC/AC Electrical Networks & Machines",
      confidence: "High",
    };
  }

  // Programming for Problem Solving / C Programming (PPS)
  if (
    q.includes("pointer") ||
    q.includes("malloc") ||
    q.includes("calloc") ||
    q.includes("free()") ||
    q.includes("dynamic memory") ||
    q.includes("array") ||
    q.includes("string in c") ||
    q.includes("recursion") ||
    q.includes("structure") ||
    q.includes("union") ||
    q.includes("file handling in c") ||
    q.includes("fopen") ||
    q.includes("fclose") ||
    q.includes("preprocessor") ||
    q.includes("printf") ||
    q.includes("scanf") ||
    q.includes("for loop") ||
    q.includes("while loop") ||
    q.includes("c language") ||
    q.includes("c program") ||
    q.includes("algorithm") ||
    q.includes("flowchart") ||
    q.includes("data types in c") ||
    q.includes("bitwise operator") ||
    q.includes("switch case")
  ) {
    let unit = "Unit 1";
    if (q.includes("operator") || q.includes("data type") || q.includes("expression")) unit = "Unit 2";
    else if (q.includes("loop") || q.includes("control") || q.includes("function") || q.includes("recursion")) unit = "Unit 3";
    else if (q.includes("pointer") || q.includes("array") || q.includes("string")) unit = "Unit 4";
    else if (q.includes("structure") || q.includes("union") || q.includes("preprocessor")) unit = "Unit 5";
    else if (q.includes("malloc") || q.includes("dynamic memory") || q.includes("file") || q.includes("fopen")) unit = "Unit 6";

    return {
      subject: "Programming for Problem Solving",
      subjectCode: "PPS",
      unit,
      topic: "C Syntax, Functions, Memory & File Management",
      confidence: "High",
    };
  }

  // Mathematics-I / Matrices & Calculus (M1)
  if (
    q.includes("eigenvalue") ||
    q.includes("eigenvector") ||
    q.includes("cayley-hamilton") ||
    q.includes("matrix") ||
    q.includes("matrices") ||
    q.includes("rank of matrix") ||
    q.includes("linear equations") ||
    q.includes("gauss elimination") ||
    q.includes("diagonalization") ||
    q.includes("mean value theorem") ||
    q.includes("rolle's theorem") ||
    q.includes("taylor's series") ||
    q.includes("maclaurin") ||
    q.includes("partial derivative") ||
    q.includes("maxima and minima") ||
    q.includes("jacobian") ||
    q.includes("multiple integral") ||
    q.includes("double integral") ||
    q.includes("triple integral") ||
    q.includes("m1") ||
    q.includes("calculus")
  ) {
    let unit = "Unit 1";
    if (q.includes("eigenvalue") || q.includes("eigenvector") || q.includes("cayley")) unit = "Unit 2";
    else if (q.includes("mean value") || q.includes("rolle") || q.includes("taylor")) unit = "Unit 3";
    else if (q.includes("partial derivative") || q.includes("jacobian") || q.includes("maxima")) unit = "Unit 4";
    else if (q.includes("integral") || q.includes("double integral") || q.includes("triple")) unit = "Unit 5";

    return {
      subject: "Mathematics-I",
      subjectCode: "M1",
      unit,
      topic: "Matrices, Eigenvalues & Advanced Calculus",
      confidence: "High",
    };
  }

  // Engineering Drawing / CAEG
  if (
    q.includes("orthographic") ||
    q.includes("isometric") ||
    q.includes("projection") ||
    q.includes("first angle") ||
    q.includes("third angle") ||
    q.includes("conic section") ||
    q.includes("ellipse") ||
    q.includes("parabola") ||
    q.includes("hyperbola") ||
    q.includes("cycloid") ||
    q.includes("scale") ||
    q.includes("representative fraction") ||
    q.includes("rf") ||
    q.includes("plane of projection") ||
    q.includes("vp") ||
    q.includes("hp") ||
    q.includes("trace of a line") ||
    q.includes("drawing sheet") ||
    q.includes("dimensioning") ||
    q.includes("caeg") ||
    q.includes("engineering graphics") ||
    q.includes("engineering drawing")
  ) {
    let unit = "Unit 1";
    if (q.includes("point") || q.includes("line")) unit = "Unit 3";
    else if (q.includes("plane") || q.includes("solid")) unit = "Unit 4";
    else if (q.includes("isometric") || q.includes("section")) unit = "Unit 5";

    return {
      subject: "Engineering Drawing",
      subjectCode: "CAEG",
      unit,
      topic: "Geometrical Projections & Isometric Views",
      confidence: "High",
    };
  }

  // Communicative English
  if (
    q.includes("comprehension") ||
    q.includes("human resources") ||
    q.includes("rural bpo") ||
    q.includes("kizhanur") ||
    q.includes("e-tool") ||
    q.includes("grammar") ||
    q.includes("vocabulary") ||
    q.includes("synonym") ||
    q.includes("antonym") ||
    q.includes("collocation") ||
    q.includes("idiom") ||
    q.includes("essay writing") ||
    q.includes("paragraph writing") ||
    q.includes("active voice") ||
    q.includes("passive voice") ||
    q.includes("english")
  ) {
    return {
      subject: "Communicative English",
      subjectCode: "ENG",
      unit: "Unit 1",
      topic: "Textual Analysis, Grammar & Professional Communication",
      confidence: "High",
    };
  }

  // Default to general academic if query doesn't match a specific vocabulary
  return {
    subject: "General Engineering",
    subjectCode: "CORE",
    confidence: "Low",
  };
}

// =========================================================================
// 3. HYBRID RETRIEVAL ENGINE
// =========================================================================

export async function searchKnowledgeBase(
  query: string,
  context?: StudyContext,
  options?: { topK?: number; minScore?: number }
): Promise<KnowledgeQueryResult> {
  const topK = options?.topK || 5;
  const minScore = options?.minScore || 0.15;

  // Step 1: Detect intent and academic scope
  const detected = classifyQueryAcademicScope(query);

  // If user explicitly provided a study context subject, prioritize user's choice (Mandatory constraint)
  const targetSubject = (context?.subject && context.subject !== "General Academic" && context.subject !== "General Engineering")
    ? context.subject
    : detected.subject;

  const targetUnit = context?.unit || detected.unit;
  const queryTokens = tokenize(query);
  const queryEmbedding = generatePseudoEmbedding(query);

  // Step 2: Filter chunks by subject first (metadata partitioning)
  let candidateChunks = kbData.chunks;

  if (targetSubject && targetSubject !== "General Engineering") {
    const subjectFiltered = candidateChunks.filter((c) => {
      const matchSubject = c.subject.toLowerCase().includes(targetSubject.toLowerCase()) ||
        targetSubject.toLowerCase().includes(c.subject.toLowerCase()) ||
        (c.subjectCode && detected.subjectCode && c.subjectCode === detected.subjectCode);
      return matchSubject;
    });

    if (subjectFiltered.length > 0) {
      candidateChunks = subjectFiltered;
    }
  }

  // If unit filter specified, prefer that unit while still allowing cross-unit fallback
  const scoredCandidates: Array<{ chunk: KnowledgeChunk; score: number; relevanceReason: string }> = [];

  for (const chunk of candidateChunks) {
    // Vector similarity score
    const vectorScore = chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
    // Keyword BM25 score
    const keywordScore = computeKeywordScore(queryTokens, chunk.content);

    // Unit match bonus
    let unitBonus = 0;
    if (targetUnit && chunk.unit && chunk.unit.toLowerCase().replace(/[^a-z0-9]/g, "") === targetUnit.toLowerCase().replace(/[^a-z0-9]/g, "")) {
      unitBonus = 0.25;
    }

    // Title / Topic match bonus
    let topicBonus = 0;
    for (const t of queryTokens) {
      if (chunk.topic.toLowerCase().includes(t)) topicBonus += 0.15;
    }

    // Hybrid combined score
    const finalScore = (keywordScore * 0.5) + (vectorScore * 0.25) + unitBonus + Math.min(0.25, topicBonus);

    if (finalScore >= minScore) {
      let reason = `Keyword match: ${(keywordScore * 100).toFixed(0)}%`;
      if (unitBonus > 0) reason += ` • Direct ${chunk.unit} match`;
      scoredCandidates.push({
        chunk,
        score: finalScore,
        relevanceReason: reason,
      });
    }
  }

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);
  const selected = scoredCandidates.slice(0, topK);

  return {
    chunks: selected,
    detectedSubject: targetSubject,
    detectedUnit: targetUnit,
    detectedTopic: detected.topic,
    retrievalScope: `${targetSubject}${targetUnit ? ` • ${targetUnit}` : ""}`,
  };
}

// =========================================================================
// 4. KNOWLEDGE BASE INITIALIZATION & SEED CHUNKS
// =========================================================================

// No documents or chunks are bundled as sample data. This index is populated only by a real ingestion process.
function generateAuthoritativeSeedKnowledge(): { documents: KnowledgeDocument[]; chunks: KnowledgeChunk[] } {
  return { documents: [], chunks: [] };
}

export function initializeKnowledgeBase() {
  try {
    if (fs.existsSync(KB_FILE_PATH)) {
      const raw = fs.readFileSync(KB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.documents) && Array.isArray(parsed.chunks)) {
        kbData = {
          documents: parsed.documents,
          chunks: parsed.chunks,
          lastSync: Number(parsed.lastSync) || 0,
          ingestionJobs: Array.isArray(parsed.ingestionJobs) ? parsed.ingestionJobs : [],
        };
        console.log(`[KB] Loaded indexed documents: ${kbData.documents.length} docs, ${kbData.chunks.length} chunks.`);
        return;
      }
    }
  } catch (err) {
    console.warn("[KB] Could not load existing knowledge base file; starting empty.", err);
  }

  // Starting empty is intentional: never invent documents, chunks, counts, or successful sync history.
  kbData = { documents: [], chunks: [], lastSync: 0, ingestionJobs: [] };
  saveKnowledgeBaseToDisk();
  console.log("[KB] Started with an empty index. Only real ingested content will be indexed.");
}

export function saveKnowledgeBaseToDisk() {
  try {
    fs.writeFileSync(KB_FILE_PATH, JSON.stringify(kbData, null, 2), "utf-8");
  } catch (err) {
    console.error("[KB] Failed to persist knowledge base to disk:", err);
  }
}

export function getKnowledgeBaseStatus(): KnowledgeBaseStatus {
  const subjects = Array.from(new Set(kbData.chunks.map((c) => c.subject)));
  const units: Record<string, string[]> = {};
  const topics: Record<string, string[]> = {};

  for (const c of kbData.chunks) {
    if (!units[c.subject]) units[c.subject] = [];
    if (c.unit && !units[c.subject].includes(c.unit)) {
      units[c.subject].push(c.unit);
    }

    if (!topics[c.subject]) topics[c.subject] = [];
    if (c.topic && !topics[c.subject].includes(c.topic)) {
      topics[c.subject].push(c.topic);
    }
  }

  return {
    totalDocuments: kbData.documents.length,
    indexedDocuments: kbData.documents.filter((d) => d.status === "indexed").length,
    failedDocuments: kbData.documents.filter((d) => d.status === "failed").length,
    totalChunks: kbData.chunks.length,
    subjects,
    units,
    topics,
    lastSync: kbData.lastSync,
    ingestionJobs: kbData.ingestionJobs,
  };
}

export function getKnowledgeDocuments(): KnowledgeDocument[] {
  return kbData.documents;
}

export function getKnowledgeChunks(subject?: string): KnowledgeChunk[] {
  if (subject && subject !== "All") {
    return kbData.chunks.filter((c) => c.subject.toLowerCase().includes(subject.toLowerCase()));
  }
  return kbData.chunks;
}

// Trigger Google Drive sync for VR25 repository
export async function syncGoogleDriveRepository(folderId: string = DRIVE_ROOT_FOLDER_ID): Promise<KnowledgeBaseStatus> {
  // This endpoint previously re-added a hard-coded demonstration corpus while reporting a successful sync.
  // Do not claim that Google Drive synced until a real Drive API ingestion is configured.
  const jobId = `job-sync-${Date.now()}`;
  kbData.ingestionJobs.unshift({
    id: jobId,
    status: "failed",
    progress: 0,
    startedAt: Date.now(),
    completedAt: Date.now(),
    error: "Google Drive ingestion is not configured for this deployment. No sample documents were inserted. Upload source files in Study Materials instead.",
  });
  saveKnowledgeBaseToDisk();
  throw new Error(kbData.ingestionJobs[0].error);

}

// Initialize on module load
initializeKnowledgeBase();
