import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import { DocumentProfile, QuizQuestion, Flashcard, ImportantQuestion, SummaryNotesData, PracticeExercise, StudyContext } from "../src/types";

function getNvidiaKeys(): string[] {
  const keys = [
    process.env.NVIDIA_API_KEY,
    process.env.NVIDIA_KEY_1,
    process.env.NVIDIA_API_KEY_2,
    process.env.NVIDIA_API_KEY_3,
  ].filter(Boolean) as string[];
  return keys;
}

function extractJSON(text: string): any {
  if (!text) throw new Error("Empty AI response");
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // continue
      }
    }
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // continue
      }
    }
    throw new Error("Unable to parse structured JSON from AI response: " + cleaned.slice(0, 150));
  }
}

export type AIPart = 
  | { text: string } 
  | { inlineData: { mimeType: string; data: string } };

async function runPromptWithAI(
  systemInstruction: string,
  promptOrParts: string | AIPart[],
  temperature = 0.25
): Promise<string> {
  const errors: string[] = [];

  const parts: AIPart[] = typeof promptOrParts === "string" 
    ? [{ text: promptOrParts }] 
    : promptOrParts;

  // 1. Try Gemini Models with GEMINI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiModels = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    for (const model of geminiModels) {
      try {
        const resp = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: parts as any }],
          config: {
            systemInstruction,
            temperature,
          },
        });
        const text = resp.text || "";
        if (text.trim()) {
          return text;
        }
      } catch (err: any) {
        errors.push(`Gemini (${model}): ${err?.message || err}`);
      }
    }
  }

  // 2. Try NVIDIA NIM Failover (Text only)
  const nvidiaKeys = getNvidiaKeys();
  const nvidiaModels = [
    "meta/llama-3.3-70b-instruct",
    "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.1-8b-instruct",
  ];

  // Extract text representation from parts for failover
  const textPrompt = parts
    .map((p) => ("text" in p && p.text ? p.text : ""))
    .filter(Boolean)
    .join("\n\n");

  if (textPrompt) {
    for (const nKey of nvidiaKeys) {
      const client = new OpenAI({
        apiKey: nKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });

      for (const model of nvidiaModels) {
        try {
          const resp = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: textPrompt },
            ],
            temperature,
          });
          const text = resp.choices[0]?.message?.content || "";
          if (text.trim()) {
            return text;
          }
        } catch (err: any) {
          errors.push(`NVIDIA (${model}): ${err?.message || err}`);
        }
      }
    }
  }

  throw new Error(
    `All AI providers failed. Check GEMINI_API_KEY or NVIDIA_API_KEY. Details: ${errors.slice(-2).join("; ") || "No API key configured."}`
  );
}

// =========================================================================
// 1. DOCUMENT UNDERSTANDING & AUTOMATIC SUBJECT / DOMAIN DETECTION
// =========================================================================

export async function analyzeUploadedDocument(params: {
  fileName: string;
  fileType: string;
  base64?: string;
  content?: string;
}): Promise<{ profile: DocumentProfile; extractedText: string }> {
  const { fileName, fileType, base64, content } = params;
  let extractedText = content || "";
  let pageCount = 1;

  // Handle PDF text extraction via PDFParse if base64 is present
  if (base64 && (fileType === "pdf" || fileName.toLowerCase().endsWith(".pdf"))) {
    try {
      const buffer = Buffer.from(base64, "base64");
      const parser: any = new (PDFParse as any)({ data: buffer });
      if (typeof parser.load === "function") {
        await parser.load();
      }
      const res: any = typeof parser.getText === "function" ? await parser.getText() : null;
      const text = typeof res === "string" ? res : res?.text || "";
      if (text && text.trim()) {
        extractedText = text.trim();
      }
      pageCount = parser.doc?.numPages || res?.total || res?.numpages || 1;
    } catch (err) {
      console.warn("PDFParse extraction had error, will use multimodal Gemini:", err);
    }
  }

  const systemInstruction = `You are AstraMind's Academic Document Understanding Engine.
Your critical mission is to read and understand the uploaded document and identify its REAL academic subject, domain, structure, and topics.

CRITICAL SOURCE-GROUNDING & ANTI-BIAS RULES:
1. DO NOT ASSUME MATHEMATICS! NEVER categorize a document as Mathematics unless the primary subject matter is explicitly mathematical (such as Calculus, Linear Algebra, Matrix Theory, Differential Equations).
2. If the document is about Database Management Systems (SQL, Relational algebra, Normalization, ACID transactions, ER diagrams), classify the domain as "DBMS" or "Database Management Systems".
3. If the document is about Operating Systems (Processes, Threads, Scheduling, Semaphores, Deadlocks, Virtual Memory, Paging), classify the domain as "Operating Systems".
4. If the document is about Computer Networks (OSI model, TCP/IP, Routing, Subnetting, Socket programming), classify as "Computer Networks".
5. If the document is about Programming / Software (Python, Java, C, Data Structures, OOP), classify as "Programming / <Language>" or "Computer Science".
6. If the document is about Physics (Thermodynamics, Electromagnetism, Quantum Mechanics, Optics), classify as "Physics".
7. If the document is about Electronics / Electrical (Circuits, Microprocessors, DLD, Signals), classify as "Electronics" or "Electrical Engineering".
8. If the document contains mixed topics across multiple fields, classify as "Mixed / Multi-topic".
9. If you cannot determine the subject with high confidence or the content is sparse/corrupted, set confidence to "Low" and detectedDomain to "General Academic" or "Unknown / General". Provide a clear, honest explanation in "confidenceNote" (e.g. "Some parts of this document could not be confidently classified.").
10. Extract 4 to 8 distinct, specific topic headings actually discussed in this document.
11. Detect if the document contains code, mathematical formulas, or structured tables.
12. Extract 8 to 15 key technical terms actually used in the document.
13. Write a clean, 2-3 sentence factual summary of what the document covers.

RETURN STRICT JSON ONLY MATCHING THIS SCHEMA:
{
  "detectedDomain": "Actual subject or domain",
  "confidence": "High" | "Medium" | "Low",
  "confidenceNote": "Explanation if confidence is Low or Medium",
  "title": "Clean document title",
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "estimatedSections": <integer count of sections/units>,
  "keyTerminology": ["term1", "term2", "term3", ...],
  "hasFormulas": <boolean>,
  "hasCode": <boolean>,
  "hasTables": <boolean>,
  "summary": "2-3 sentence factual summary"
}`;

  let aiPromptParts: AIPart[] = [];

  if (base64 && (fileType === "pdf" || fileName.toLowerCase().endsWith(".pdf")) && (!extractedText || extractedText.length < 300)) {
    // Pass inline PDF for vision/multimodal parsing
    aiPromptParts = [
      { inlineData: { mimeType: "application/pdf", data: base64 } },
      {
        text: `Analyze this uploaded PDF file: "${fileName}".
Inspect all pages, headings, definitions, equations, diagrams, and terminology to construct the authoritative document profile.`,
      },
    ];
  } else {
    const textSnippet = extractedText.slice(0, 20000);
    aiPromptParts = [
      {
        text: `Analyze this uploaded document: "${fileName}" (Type: ${fileType}, Pages: ${pageCount}).

DOCUMENT EXTRACTED CONTENT:
${textSnippet || "No text could be extracted directly from this document. Please inspect the filename and context."}

Construct the authoritative document profile following the strict source-grounding rules.`,
      },
    ];
  }

  try {
    const rawAiOutput = await runPromptWithAI(systemInstruction, aiPromptParts, 0.2);
    const parsed = extractJSON(rawAiOutput);

    const detectedDomain = parsed.detectedDomain || "General Academic";
    const confidence: "High" | "Medium" | "Low" = 
      parsed.confidence === "High" || parsed.confidence === "Medium" || parsed.confidence === "Low" 
        ? parsed.confidence 
        : "Medium";

    const topics: string[] = Array.isArray(parsed.topics) && parsed.topics.length > 0
      ? parsed.topics.map((t: any) => String(t).trim())
      : [`Introduction to ${detectedDomain}`, "Core Concepts & Principles", "Technical Methodologies", "Review & Applications"];

    const estimatedSections = Number(parsed.estimatedSections) || Math.max(1, Math.min(10, Math.ceil(pageCount / 4)));

    const profile: DocumentProfile = {
      fileName,
      detectedDomain,
      confidence,
      confidenceNote: parsed.confidenceNote || (confidence === "Low" ? "Some parts of this document could not be confidently classified." : undefined),
      title: parsed.title || fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      topics,
      estimatedSections,
      pages: pageCount,
      extractedTextLength: extractedText.length,
      hasFormulas: Boolean(parsed.hasFormulas),
      hasCode: Boolean(parsed.hasCode),
      hasTables: Boolean(parsed.hasTables),
      keyTerminology: Array.isArray(parsed.keyTerminology) ? parsed.keyTerminology : [],
      summary: parsed.summary || `Extracted study material covering ${detectedDomain} with ${topics.length} core topics.`,
      processingStatus: {
        contentExtracted: extractedText.length > 0 || Boolean(base64),
        topicsIdentified: topics.length > 0,
        studyToolsReady: true,
      },
    };

    return { profile, extractedText };
  } catch (err: any) {
    console.error("Error analyzing uploaded document:", err);

    // Fallback profile if AI fails completely
    const fallbackDomain = fileName.toLowerCase().includes("os") || fileName.toLowerCase().includes("operating") 
      ? "Operating Systems" 
      : fileName.toLowerCase().includes("dbms") || fileName.toLowerCase().includes("database")
      ? "Database Management Systems"
      : fileName.toLowerCase().includes("network")
      ? "Computer Networks"
      : fileName.toLowerCase().includes("python") || fileName.toLowerCase().includes("code")
      ? "Programming"
      : fileName.toLowerCase().includes("physics")
      ? "Physics"
      : fileName.toLowerCase().includes("math")
      ? "Mathematics"
      : "General Engineering";

    const profile: DocumentProfile = {
      fileName,
      detectedDomain: fallbackDomain,
      confidence: "Low",
      confidenceNote: "Some parts of this document could not be confidently classified.",
      title: fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      topics: [`Overview of ${fallbackDomain}`, "Key Definitions", "Analytical Concepts", "Exam Preparation"],
      estimatedSections: Math.max(1, pageCount),
      pages: pageCount,
      extractedTextLength: extractedText.length,
      hasFormulas: false,
      hasCode: false,
      hasTables: false,
      keyTerminology: [],
      summary: `Document uploaded: ${fileName}. Core topics extracted for targeted revision.`,
      processingStatus: {
        contentExtracted: extractedText.length > 0,
        topicsIdentified: true,
        studyToolsReady: true,
      },
    };

    return { profile, extractedText };
  }
}

// =========================================================================
// 2. GUIDED LESSON GENERATION (STRICTLY SOURCE-DRIVEN)
// =========================================================================

export async function generateGuidedLesson(params: {
  subject: string;
  topic: string;
  extractedContent?: string;
  materialSummary?: string;
  previousConcepts?: string[];
}) {
  const { subject, topic, extractedContent, materialSummary } = params;

  const systemInstruction = `You are a master academic educator and tutor.
Your lesson MUST BE AUTHORITATIVELY ROOTED in the provided source material.
DO NOT invent unrelated topics. If the document is about ${subject}, deliver an exceptional, intuitive explanation strictly on ${topic} using the document's original terminology, definitions, and examples.
DO NOT assume Mathematics unless the source material is explicitly about Mathematics.`;

  const prompt = `Generate a guided smart lesson for:
Subject / Domain: "${subject}"
Topic: "${topic}"

SOURCE MATERIAL CONTEXT:
${(extractedContent || materialSummary || "").slice(0, 14000)}

RETURN STRICT JSON ONLY:
{
  "conceptTitle": "Concise, engaging title of the concept",
  "conceptExplanation": "Clear, intuitive breakdown of the concept in 2-3 structured paragraphs. Explain how it works step-by-step using the source material's definitions and logic.",
  "example": "A concrete real-world engineering scenario, code snippet, formula derivation, or worked example directly relevant to this concept.",
  "checkQuestion": {
    "question": "A concept-check question testing real understanding of this exact point",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Clear explanation of why this answer is correct and what makes the other options incorrect."
  }
}
Do not wrap in markdown code fences. Return valid JSON only.`;

  try {
    const raw = await runPromptWithAI(systemInstruction, prompt);
    const parsed = extractJSON(raw);
    if (parsed && parsed.conceptTitle && parsed.conceptExplanation && parsed.checkQuestion) {
      return parsed;
    }
    throw new Error("Invalid lesson JSON structure received");
  } catch (e: any) {
    console.error("Lesson generation error:", e);
    throw new Error(`Unable to generate lesson for "${topic}": ${e.message}`);
  }
}

// =========================================================================
// 3. MCQ & INTERACTIVE QUIZ GENERATION (STRICTLY SOURCE-DRIVEN)
// =========================================================================

export async function generateMCQQuiz(params: {
  subject: string;
  topic: string;
  count: number;
  difficulty: string;
  questionType?: string;
  extractedContent?: string;
  materialsContext?: string;
  hasCode?: boolean;
  hasFormulas?: boolean;
}): Promise<QuizQuestion[]> {
  const count = Math.min(25, Math.max(3, params.count || 5));
  const { subject, topic, difficulty, questionType, extractedContent, materialsContext } = params;

  const typeConstraint = questionType && questionType !== "All Types"
    ? `- Focus specifically on question format: "${questionType}".`
    : `- Support a realistic mix: conceptual MCQs, True/False, definition recall, and application scenarios.`;

  const systemInstruction = `You are an expert university examiner.
CRITICAL MANDATE:
Create high-quality exam questions STRICTLY DERIVED from the uploaded study material.
- If the material is about Operating Systems: questions must be about OS concepts (processes, threads, scheduling, deadlocks, memory, I/O).
- If the material is about DBMS: questions must be about databases (SQL, relational algebra, normal forms, transactions).
- If the material is about Programming / Python: questions must be about code, algorithms, data structures, and syntax.
- If the material contains formulas or numericals: include calculation/numerical questions.
- If the material does NOT contain Mathematics, DO NOT GENERATE MATHEMATICS QUESTIONS!
${typeConstraint}`;

  const prompt = `Generate ${count} interactive quiz questions for:
Domain / Subject: "${subject}"
Topic: "${topic}"
Difficulty Level: "${difficulty}"
Question Format Style: "${questionType || "Mixed (MCQs, True/False, Concepts, Applications)"}"

AUTHORITATIVE SOURCE MATERIAL:
${(extractedContent || materialsContext || "").slice(0, 16000)}

RETURN STRICT JSON ARRAY ONLY:
[
  {
    "id": "q1",
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Clear, educational explanation of the correct answer referencing the source material.",
    "topic": "${topic}",
    "questionType": "mcq" | "true_false" | "concept" | "definition" | "application" | "code" | "numerical"
  }
]
Do not wrap in markdown. Output valid JSON array only.`;

  try {
    const raw = await runPromptWithAI(systemInstruction, prompt);
    const parsed = extractJSON(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q: any, idx: number) => ({
        id: q.id || `q-${Date.now()}-${idx}`,
        question: q.question,
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["True", "False"],
        correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 ? q.correctIndex : 0,
        explanation: q.explanation || "Correct answer based on the uploaded material.",
        topic: q.topic || topic,
        questionType: q.questionType || "mcq",
      }));
    }
    throw new Error("Invalid MCQ JSON array received");
  } catch (e: any) {
    console.error("MCQ generation error:", e);
    throw new Error(`Unable to generate quiz questions for "${subject}": ${e.message}`);
  }
}

// =========================================================================
// 4. FLASHCARDS GENERATION (10, 20, 50, CUSTOM, STRICTLY SOURCE-DRIVEN)
// =========================================================================

export async function generateFlashcards(params: {
  subject: string;
  topic?: string;
  count?: number;
  difficulty?: string;
  extractedContent?: string;
  materialsContext?: string;
}): Promise<Flashcard[]> {
  const count = Math.min(50, Math.max(5, params.count || 10));
  const { subject, topic, difficulty = "Medium", extractedContent, materialsContext } = params;

  const systemInstruction = `You are a specialized active-recall flashcard creator.
CRITICAL MANDATE:
Generate flashcards FROM THE UPLOADED MATERIAL ONLY.
Example:
If document is "Operating Systems":
Front: "What is a Process Control Block (PCB)?"
Back: "A data structure maintained by the OS for every process containing PID, state, program counter, CPU registers, and scheduling info."
Preserve the document's original terminology, formulas, and definitions.
DO NOT invent unrelated general facts. DO NOT force Mathematics unless the document is Mathematics.`;

  const prompt = `Generate ${count} active recall flashcards for:
Subject / Domain: "${subject}"
Topic / Scope: "${topic || 'All Document Topics'}"
Difficulty: "${difficulty}"

AUTHORITATIVE SOURCE MATERIAL:
${(extractedContent || materialsContext || "").slice(0, 16000)}

RETURN STRICT JSON ARRAY ONLY:
[
  {
    "id": "fc1",
    "front": "Clear question, key term, theorem, or mechanism",
    "back": "Crisp, memorizable explanation, definition, or formula exactly as formulated in the study material",
    "topic": "${topic || subject}",
    "difficulty": "${difficulty}"
  }
]
Do not wrap in markdown. Output valid JSON array only.`;

  try {
    const raw = await runPromptWithAI(systemInstruction, prompt);
    const parsed = extractJSON(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any, idx: number) => ({
        id: item.id || `fc-${Date.now()}-${idx}`,
        workspaceId: "",
        front: item.front,
        back: item.back,
        topic: item.topic || topic || subject,
        status: "unreviewed",
        difficulty: item.difficulty || difficulty,
      }));
    }
    throw new Error("Invalid flashcard JSON array received");
  } catch (e: any) {
    console.error("Flashcards generation error:", e);
    throw new Error(`Unable to generate revision flashcards for "${subject}": ${e.message}`);
  }
}

// =========================================================================
// 5. IMPORTANT QUESTIONS GENERATION (STRICTLY SOURCE-DRIVEN)
// =========================================================================

export async function generateImportantQuestions(params: {
  subject: string;
  branch: string;
  extractedContent?: string;
  materialsContext?: string;
}): Promise<ImportantQuestion[]> {
  const { subject, branch, extractedContent, materialsContext } = params;

  const systemInstruction = `You are a senior university engineering professor who sets semester exam question banks.
Generate 6 to 8 crucial university examination questions across the sections/units present in the provided source material.
Ground every question strictly in the uploaded document's curriculum.`;

  const prompt = `Generate 6 essential university examination questions for:
Subject / Domain: "${subject}"
Branch / Specialization: "${branch}"

AUTHORITATIVE SOURCE MATERIAL:
${(extractedContent || materialsContext || "").slice(0, 16000)}

RETURN STRICT JSON ARRAY ONLY:
[
  {
    "id": "iq1",
    "unit": "Unit / Chapter from document",
    "topic": "Specific Topic",
    "question": "Full exam question text...",
    "difficulty": "Medium",
    "frequency": "Repeated",
    "answerSummary": "Structured 3-4 sentence key answer outline detailing essential points required to score full marks."
  }
]
Valid difficulty values: "Low", "Medium", "High".
Valid frequency values: "Repeated", "High Probability", "Conceptual Must-Know".
Do not wrap in markdown. Output valid JSON only.`;

  try {
    const raw = await runPromptWithAI(systemInstruction, prompt);
    const parsed = extractJSON(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q: any, idx: number) => ({
        id: q.id || `iq-${Date.now()}-${idx}`,
        workspaceId: "",
        unit: q.unit || `Unit ${idx + 1}`,
        topic: q.topic || subject,
        question: q.question,
        difficulty: q.difficulty || "Medium",
        frequency: q.frequency || "High Probability",
        answerSummary: q.answerSummary || "Key concept outline from the syllabus.",
      }));
    }
    throw new Error("Invalid questions JSON array received");
  } catch (e: any) {
    console.error("Important questions generation error:", e);
    throw new Error(`Unable to generate exam questions for "${subject}": ${e.message}`);
  }
}

// =========================================================================
// 6. SUMMARY & NOTES GENERATION (STRICTLY SOURCE-DRIVEN)
// =========================================================================

export async function generateSummaryNotes(params: {
  subject: string;
  extractedContent?: string;
}): Promise<SummaryNotesData> {
  const { subject, extractedContent } = params;

  const systemInstruction = `You are an academic synthesis expert.
Your job is to generate a comprehensive, structured study guide and summary notes directly from the uploaded material.
Preserve original terminology, core definitions, and formulas.`;

  const prompt = `Generate structured revision summary notes for:
Subject / Domain: "${subject}"

AUTHORITATIVE SOURCE MATERIAL:
${(extractedContent || "").slice(0, 18000)}

RETURN STRICT JSON ONLY:
{
  "title": "Comprehensive Study Summary & Notes",
  "domain": "${subject}",
  "overview": "3-4 paragraph thorough academic overview synthesizing the whole document.",
  "unitSummaries": [
    {
      "title": "Unit / Topic Heading",
      "keyPoints": [
        "Core point 1 with technical detail",
        "Core point 2 with technical detail",
        "Core point 3 with technical detail"
      ]
    }
  ],
  "keyTerminologyAndFormulas": [
    {
      "term": "Key Concept or Formula Name",
      "explanation": "Precise explanation or derivation",
      "detailOrCode": "Equation, snippet, or mechanism if applicable"
    }
  ],
  "examTakeaways": [
    "High-probability exam tip 1",
    "Crucial distinction or pitfall to avoid in the exam",
    "Key theorem or algorithm frequently asked"
  ]
}
Do not wrap in markdown. Output valid JSON only.`;

  try {
    const raw = await runPromptWithAI(systemInstruction, prompt);
    const parsed = extractJSON(raw);
    return {
      title: parsed.title || `${subject} Revision Notes`,
      domain: parsed.domain || subject,
      overview: parsed.overview || "Overview of uploaded material.",
      unitSummaries: Array.isArray(parsed.unitSummaries) ? parsed.unitSummaries : [],
      keyTerminologyAndFormulas: Array.isArray(parsed.keyTerminologyAndFormulas) ? parsed.keyTerminologyAndFormulas : [],
      examTakeaways: Array.isArray(parsed.examTakeaways) ? parsed.examTakeaways : [],
    };
  } catch (e: any) {
    console.error("Summary notes generation error:", e);
    throw new Error(`Unable to generate notes for "${subject}": ${e.message}`);
  }
}

// =========================================================================
// 7. INTERACTIVE PRACTICE EXERCISES (STRICTLY SOURCE-DRIVEN)
// =========================================================================

export async function generatePracticeExercises(params: {
  subject: string;
  topic?: string;
  difficulty?: string;
  extractedContent?: string;
}): Promise<PracticeExercise[]> {
  const { subject, topic, difficulty = "Medium", extractedContent } = params;

  const systemInstruction = `You are an engineering practical exam and lab coach.
Generate interactive practice challenges based on the uploaded document.
- If code is present: generate code tracing, debugging, or function implementation.
- If formulas/math are present: generate step-by-step numerical calculation exercises.
- If conceptual/systems: generate architectural design or scenario trade-off problem solving.`;

  const prompt = `Generate 4 interactive practice exercises for:
Domain / Subject: "${subject}"
Topic: "${topic || 'Core Document Modules'}"
Difficulty: "${difficulty}"

AUTHORITATIVE SOURCE MATERIAL:
${(extractedContent || "").slice(0, 16000)}

RETURN STRICT JSON ARRAY ONLY:
[
  {
    "id": "p1",
    "title": "Exercise Title",
    "topic": "${topic || subject}",
    "type": "code" | "problem" | "concept" | "scenario",
    "difficulty": "${difficulty}",
    "problemStatement": "Clear problem statement requiring active student problem solving...",
    "hint": "Constructive hint to get started without giving away the full answer",
    "solution": "Complete step-by-step solution / code / numerical calculation",
    "explanation": "Pedagogical breakdown of why this solution is optimal."
  }
]
Do not wrap in markdown. Output valid JSON only.`;

  try {
    const raw = await runPromptWithAI(systemInstruction, prompt);
    const parsed = extractJSON(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: any, idx: number) => ({
        id: p.id || `prac-${Date.now()}-${idx}`,
        title: p.title || `Exercise ${idx + 1}`,
        topic: p.topic || topic || subject,
        type: p.type || "problem",
        difficulty: p.difficulty || difficulty,
        problemStatement: p.problemStatement,
        hint: p.hint,
        solution: p.solution,
        explanation: p.explanation || "Step-by-step solution from the curriculum.",
      }));
    }
    throw new Error("Invalid practice exercises received");
  } catch (e: any) {
    console.error("Practice generation error:", e);
    throw new Error(`Unable to generate practice for "${subject}": ${e.message}`);
  }
}

// =========================================================================
// 8. AI TUTOR CHAT (GROUNDED IN UPLOADED MATERIAL)
// =========================================================================

import { searchKnowledgeBase } from "./knowledgeBaseService";

export async function chatWithAITutor(params: {
  messages: Array<{ sender: "user" | "ai" | "assistant"; text: string }>;
  subject: string;
  extractedContent?: string;
  college?: string;
  branch?: string;
  learningGoal?: string;
  studyContext?: StudyContext;
}) {
  const { messages, subject, extractedContent, college, branch, learningGoal, studyContext } = params;

  // Extract latest user message for scoped RAG retrieval
  const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user")?.text || "";
  
  let retrievedChunksContext = "";
  const citations: Array<{
    documentName: string;
    pageNumber: number;
    subject: string;
    unit: string;
    sourceUrl?: string;
  }> = [];

  try {
    if (lastUserMsg) {
      const ragResults = await searchKnowledgeBase(lastUserMsg, studyContext, { topK: 3 });
      if (ragResults.chunks.length > 0) {
        retrievedChunksContext = ragResults.chunks
          .map((item, idx) => {
            const c = item.chunk;
            citations.push({
              documentName: c.documentName,
              pageNumber: c.pageNumber,
              subject: c.subject,
              unit: c.unit,
              sourceUrl: c.sourceUrl,
            });
            return `--- [SOURCE EXCERPT ${idx + 1}] Document: "${c.documentName}" (Page ${c.pageNumber}) | Subject: ${c.subject} (${c.unit} - ${c.topic}) ---\n${c.content}`;
          })
          .join("\n\n");
      }
    }
  } catch (err) {
    console.warn("Knowledge base retrieval failed during tutor chat:", err);
  }

  const systemInstruction = `You are AstraMind AI Tutor, a master university tutor for a student studying "${subject}" (${branch || 'Engineering'}) at ${college || 'University'}.
The student's learning goal is: "${learningGoal || 'Master the subject'}".

AUTHORITATIVE SOURCE-GROUNDING MANDATE:
1. You have direct access to authoritative study material from the student's VR25 curriculum and uploaded notes.
2. Ground your explanations, formulas, definitions, and code primarily on the retrieved source material.
3. Explicitly cite your sources when explaining concepts (e.g. "According to your ${citations[0]?.documentName || 'study notes'} (Page ${citations[0]?.pageNumber || '1'})...").
4. If a concept is not mentioned in the source excerpts, provide a helpful pedagogical explanation while clearly stating: "Note: This extension is general engineering knowledge and goes beyond your current notes excerpt."
5. Format your responses with clean Markdown, clear headings, bullet points, and code/math blocks.
6. Never assume Mathematics unless the topic is genuinely Mathematics.`;

  const combinedReference = [
    retrievedChunksContext ? `VERIFIED VR25 STUDY MATERIAL (HIGH PRIORITY):\n${retrievedChunksContext}` : "",
    extractedContent ? `WORKSPACE UPLOADED NOTES:\n${extractedContent.slice(0, 10000)}` : "",
  ].filter(Boolean).join("\n\n") || "General university curriculum";

  const conversationHistory = messages
    .map((m) => `${m.sender === "user" ? "Student" : "AstraMind Tutor"}: ${m.text}`)
    .join("\n\n");

  const prompt = `SOURCE MATERIAL REFERENCE:
${combinedReference}

CONVERSATION HISTORY:
${conversationHistory}

Provide the next pedagogical tutor response to the student's latest question.`;

  try {
    const response = await runPromptWithAI(systemInstruction, prompt, 0.4);
    return { 
      text: response, 
      citations: Array.from(new Set(citations.map(c => JSON.stringify(c)))).map(s => JSON.parse(s)) 
    };
  } catch (e: any) {
    console.error("Tutor chat error:", e);
    return { 
      text: "I encountered an error connecting to the AI service. Please try asking again.",
      citations: []
    };
  }
}
