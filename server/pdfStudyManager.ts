import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { 
  PDFStudySummary, 
  PDFFlashcardItem, 
  PDFStudyQuestion, 
  PDFTopicExplanation, 
  PDFImportantTopic,
  PDFChatMessage 
} from "../src/types";

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
    throw new Error("Unable to parse JSON from AI response: " + cleaned.slice(0, 150));
  }
}

async function callGeminiOrFallback(
  systemInstruction: string,
  userPrompt: string,
  temperature = 0.25,
  isJson = false
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Primary Gemini models - fast failover if one model experiences 503 spike
    const geminiModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
    for (const model of geminiModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature,
            responseMimeType: isJson ? "application/json" : undefined,
          },
        });

        if (response && response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err: any) {
        console.warn(`Gemini (${model}) warning in pdfStudyManager:`, err?.message || err);
      }
    }
  }

  // Fallback to NVIDIA NIM
  const nvidiaKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_KEY_1;
  if (nvidiaKey) {
    try {
      const client = new OpenAI({
        apiKey: nvidiaKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      const comp = await client.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
        temperature,
      });
      const text = comp.choices[0]?.message?.content;
      if (text && text.trim()) return text.trim();
    } catch (err: any) {
      console.warn("NVIDIA NIM failover warning:", err?.message || err);
    }
  }

  // Fallback to OpenAI if configured
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const openai = new OpenAI({ apiKey: openAiKey });
      const comp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
        temperature,
      });
      const text = comp.choices[0]?.message?.content;
      if (text && text.trim()) return text.trim();
    } catch (err: any) {
      console.warn("OpenAI fallback error in pdfStudyManager:", err?.message || err);
    }
  }

  throw new Error("AI service is currently unavailable. Please verify API configuration.");
}

// ==========================================
// 1. PDF CHAT / ASK AI (CONTEXT-AWARE & GROUNDED)
// ==========================================

export async function chatWithPdf(params: {
  pdfTitle: string;
  pdfContent: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  chapterOrScope?: string;
  pageRange?: string;
}): Promise<{
  text: string;
  citations: Array<{ pageNumber?: number; chapter?: string; topic?: string; excerpt?: string }>;
}> {
  const { pdfTitle, pdfContent, messages, chapterOrScope, pageRange } = params;

  const systemInstruction = `You are AstraMind PDF Copilot, an expert academic study assistant grounded strictly in the selected student document: "${pdfTitle}".
CRITICAL GROUNDING RULES:
1. Ground your response primarily and authoritatively in the provided document content.
2. DO NOT invent facts, formulas, or claims not supported by the document.
3. If the user asks about something outside the document, politely state that it is not covered in "${pdfTitle}", but provide the closest related concept from the text.
4. Always provide specific page numbers or section references where the concept appears in "${pdfTitle}".
5. Structure answers with clear headings, bullet points, and exact formulas.
6. When answering math/electrical/engineering questions, show step-by-step reasoning.
7. Return citations at the bottom or in citation fields.`;

  const conversationHistory = messages
    .slice(-8)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const prompt = `DOCUMENT CONTEXT:
Document Name: ${pdfTitle}
${chapterOrScope ? `Focus Scope: ${chapterOrScope}` : ""}
${pageRange ? `Page Range: ${pageRange}` : ""}

EXTRACTED TEXT FROM DOCUMENT:
"""
${pdfContent.slice(0, 36000)}
"""

CONVERSATION:
${conversationHistory}

Task: Respond to the student's latest message based on the supplied text. Provide clear, step-by-step explanations when useful.
The extracted text may not preserve PDF page boundaries. Do not invent page numbers, chapter names or section references. Return a citation only if its excerpt is an exact quote copied from the supplied document text. Omit pageNumber unless the supplied text explicitly marks the page.

If exact source excerpts are available, append:
CITATIONS_JSON: [{"pageNumber": null, "chapter": null, "topic": "topic wording found in source text", "excerpt": "an exact short quote from the supplied text"}]`;

  try {
    const responseText = await callGeminiOrFallback(systemInstruction, prompt, 0.2, false);

    let text = responseText;
    let citations: Array<{ pageNumber?: number; chapter?: string; topic?: string; excerpt?: string }> = [];

    const splitIdx = responseText.lastIndexOf("CITATIONS_JSON:");
    if (splitIdx !== -1) {
      text = responseText.slice(0, splitIdx).trim();
      const jsonPart = responseText.slice(splitIdx + "CITATIONS_JSON:".length).trim();
      try {
        citations = extractJSON(jsonPart);
      } catch {
        // Citation fallback
      }
    }

    // Keep only citations whose excerpts exactly occur in the uploaded text. Extracted text
    // generally loses page boundaries, so do not trust a page number supplied by the model.
    const sourceText = pdfContent.toLowerCase();
    citations = Array.isArray(citations)
      ? citations
          .filter((citation) =>
            citation &&
            typeof citation.excerpt === "string" &&
            citation.excerpt.trim().length >= 8 &&
            sourceText.includes(citation.excerpt.trim().toLowerCase())
          )
          .map((citation) => ({
            chapter: typeof citation.chapter === "string" && citation.chapter.trim() &&
              sourceText.includes(citation.chapter.trim().toLowerCase())
                ? citation.chapter.trim()
                : undefined,
            topic: typeof citation.topic === "string" && citation.topic.trim() &&
              sourceText.includes(citation.topic.trim().toLowerCase())
                ? citation.topic.trim()
                : undefined,
            excerpt: citation.excerpt.trim(),
          }))
      : [];

    return { text, citations };
  } catch (err: any) {
    throw new Error("PDF chat could not be generated from the uploaded PDF. Please retry or check your AI provider configuration.");
  }
}

// 2. PDF SUMMARIZATION (5 VARIANTS)
// ==========================================

export async function summarizePdf(params: {
  pdfTitle: string;
  pdfContent: string;
  summaryType: "entire" | "chapter" | "selected-page" | "short" | "detailed";
  chapterOrScope?: string;
}): Promise<PDFStudySummary> {
  const { pdfTitle, pdfContent, summaryType, chapterOrScope } = params;

  const systemInstruction = `You are a high-yield academic summarizer for college engineering students.
Your goal is to transform the provided PDF text into an organized, exam-focused study summary.
Strictly extract definitions, formulas, and examples directly from "${pdfTitle}".
Always output valid JSON only.`;

  const prompt = `Generate a "${summaryType}" summary for the document "${pdfTitle}".
${chapterOrScope ? `Target Scope / Chapter: ${chapterOrScope}` : ""}

DOCUMENT TEXT:
"""
${pdfContent.slice(0, 36000)}
"""

Return a JSON object:
{
  "overviewText": "A 2-3 paragraph crisp overview of the material.",
  "keyConcepts": ["Concept 1 with concise explanation", "Concept 2 with concise explanation"],
  "importantDefinitions": [
    {"term": "Term Name", "definition": "Exact definition according to notes", "page": 1}
  ],
  "formulas": [
    {"formula": "Mathematical / Electrical formula", "description": "What each variable represents", "page": 1}
  ],
  "examples": [
    {"title": "Example Problem / Scenario", "explanation": "Step-by-step solution from text", "page": 1}
  ],
  "importantPoints": ["Key takeaway point 1", "Key takeaway point 2"],
  "examFocusedPoints": ["High-yield exam tip 1", "Common university exam pitfall 2"]
}`;

  try {
    const rawJson = await callGeminiOrFallback(systemInstruction, prompt, 0.2, true);
    const data = extractJSON(rawJson);
    if (typeof data.overviewText !== "string" || data.overviewText.trim().length < 20) {
      throw new Error("The model returned an incomplete summary.");
    }

    return {
      id: `sum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      documentId: pdfTitle,
      documentTitle: pdfTitle,
      summaryType,
      chapterOrScope,
      overviewText: data.overviewText.trim(),
      keyConcepts: Array.isArray(data.keyConcepts) ? data.keyConcepts : [],
      importantDefinitions: Array.isArray(data.importantDefinitions) ? data.importantDefinitions : [],
      formulas: Array.isArray(data.formulas) ? data.formulas : [],
      examples: Array.isArray(data.examples) ? data.examples : [],
      importantPoints: Array.isArray(data.importantPoints) ? data.importantPoints : [],
      examFocusedPoints: Array.isArray(data.examFocusedPoints) ? data.examFocusedPoints : [],
      createdAt: Date.now(),
    };
  } catch (err) {
    throw new Error("Summary generation failed. No substitute or placeholder summary was created.");
  }
}

// 3. AI NOTES (STUDENT-FRIENDLY & STRUCTURED)
// ==========================================

export async function generatePdfNotes(params: {
  pdfTitle: string;
  pdfContent: string;
  topic?: string;
  chapter?: string;
}): Promise<{
  title: string;
  topic: string;
  markdownContent: string;
  definitions: Array<{ term: string; meaning: string }>;
  formulas: Array<{ name: string; formula: string }>;
  examples: Array<{ concept: string; example: string }>;
  examTips: string[];
}> {
  const { pdfTitle, pdfContent, topic, chapter } = params;

  const systemInstruction = `You are AstraMind's master academic notes author.
Create clean, student-friendly revision notes from the selected document: "${pdfTitle}".
RULES:
- Use clean Markdown with Headings (##, ###), Subheadings, and concise Bullet points.
- Do NOT produce unnecessarily huge, unreadable paragraphs.
- Highlight core definitions in bold or blockquotes.
- Display mathematical and engineering formulas clearly.
- Include real examples and exam tips.
- Output strictly a JSON object.`;

  const prompt = `Generate comprehensive revision notes from "${pdfTitle}".
${topic ? `Target Topic: ${topic}` : ""}
${chapter ? `Target Chapter: ${chapter}` : ""}

DOCUMENT CONTENT:
"""
${pdfContent.slice(0, 36000)}
"""

Return a JSON object:
{
  "title": "Clean Title for Notes",
  "topic": "${topic || "Core Principles"}",
  "markdownContent": "Full formatted markdown notes with headers, bullet points, tables where helpful, bold terms, and code/formulas.",
  "definitions": [
    {"term": "Term", "meaning": "Definition"}
  ],
  "formulas": [
    {"name": "Formula Name", "formula": "Formula Expression"}
  ],
  "examples": [
    {"concept": "Concept name", "example": "Real example or problem solution"}
  ],
  "examTips": ["Exam tip 1", "Exam tip 2"]
}`;

  try {
    const rawJson = await callGeminiOrFallback(systemInstruction, prompt, 0.2, true);
    const data = extractJSON(rawJson);
    if (typeof data.markdownContent !== "string" || data.markdownContent.trim().length < 30) {
      throw new Error("The model returned incomplete notes.");
    }

    return {
      title: typeof data.title === "string" && data.title.trim() ? data.title : `${pdfTitle} - Notes`,
      topic: data.topic || topic || pdfTitle,
      markdownContent: data.markdownContent.trim(),
      definitions: Array.isArray(data.definitions) ? data.definitions : [],
      formulas: Array.isArray(data.formulas) ? data.formulas : [],
      examples: Array.isArray(data.examples) ? data.examples : [],
      examTips: Array.isArray(data.examTips) ? data.examTips : [],
    };
  } catch (err) {
    throw new Error("Notes generation failed. No substitute or placeholder notes were created.");
  }
}

// 4. FLASHCARD INTELLIGENCE (5, 10, 20, 30, 50 CARDS)
// ==========================================

export async function generatePdfFlashcards(params: {
  pdfTitle: string;
  pdfContent: string;
  count: number;
  scope?: "entire" | "chapter" | "pages" | "topic";
  scopeDetail?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}): Promise<PDFFlashcardItem[]> {
  const { pdfTitle, pdfContent, count, scope, scopeDetail, difficulty } = params;

  const systemInstruction = `You are AstraMind's high-yield flashcard generator for university students.
FLASHCARD INTELLIGENCE PRIORITIES:
- Prioritize: Important definitions, mathematical/engineering formulas, key laws/principles, core diagrams/concepts, differences/comparisons, and high-yield university exam questions.
- AVOID low-value trivia, dates of publication, or obvious common knowledge.
- FRONT: A concise question, term, definition prompt, formula prompt, or comparison prompt.
- BACK: The exact, accurate, high-scoring answer or explanation derived from "${pdfTitle}".
- Output strictly JSON array.`;

  const prompt = `Generate exactly ${count} premium flashcards from "${pdfTitle}".
${scope ? `Scope: ${scope}` : ""}
${scopeDetail ? `Scope Detail: ${scopeDetail}` : ""}
${difficulty ? `Difficulty Level: ${difficulty}` : ""}

DOCUMENT TEXT:
"""
${pdfContent.slice(0, 36000)}
"""

Return a JSON array of objects using this schema. The field values are instructions, not content to copy:
[
  {
    "id": "unique identifier",
    "front": "Question based on a real concept in the uploaded document",
    "back": "Answer supported by the uploaded document",
    "topic": "Topic found in the uploaded document",
    "pageNumber": null,
    "category": "Definition"
  }
]
Do not copy facts from unrelated domains. If the source does not specify a page, use null. Categories may be "Definition", "Formula", "Law/Principle", "Comparison", "Core Concept", or "Exam Concept".`;

  try {
    const rawJson = await callGeminiOrFallback(systemInstruction, prompt, 0.25, true);
    const cards = extractJSON(rawJson);
    const validCards = Array.isArray(cards)
      ? cards.filter((card) => card && typeof card.front === "string" && card.front.trim() && typeof card.back === "string" && card.back.trim())
      : [];
    if (validCards.length === 0) throw new Error("The model returned no usable flashcards.");
    return validCards.map((card, idx) => ({
      id: typeof card.id === "string" && card.id.trim() ? card.id : `card_${Date.now()}_${idx}`,
      front: card.front.trim(),
      back: card.back.trim(),
      topic: typeof card.topic === "string" && card.topic.trim() ? card.topic : pdfTitle,
      pageNumber: typeof card.pageNumber === "number" && card.pageNumber > 0 ? card.pageNumber : undefined,
      category: ["Definition", "Formula", "Law/Principle", "Comparison", "Core Concept", "Exam Concept"].includes(card.category) ? card.category : "Core Concept",
    }));
  } catch (err) {
    throw new Error("Flashcard generation failed. No sample flashcards were created.");
  }
}

// 5. QUESTION GENERATOR
// ==========================================

export async function generatePdfQuestions(params: {
  pdfTitle: string;
  pdfContent: string;
  questionTypes: string[];
  count: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Exam Preparation";
  topic?: string;
}): Promise<PDFStudyQuestion[]> {
  const { pdfTitle, pdfContent, questionTypes, count, difficulty, topic } = params;

  const systemInstruction = `You are a university examination board professor creating test questions based strictly on the provided document: "${pdfTitle}".
RULES:
1. Cover the requested question types: ${questionTypes.join(", ")}.
2. Match the requested difficulty level: ${difficulty}.
3. Every question must have an accurate, complete answer / solution and explanation grounded in the text.
4. Include source page references wherever possible.
5. For MCQs, provide exactly 4 options ["A) ...", "B) ...", "C) ...", "D) ..."] and the correct option letter.
6. Return strictly a JSON array.`;

  const prompt = `Generate ${count} university questions from "${pdfTitle}".
${topic ? `Topic Focus: ${topic}` : ""}
Requested Types: ${questionTypes.join(", ")}
Difficulty: ${difficulty}

DOCUMENT CONTENT:
"""
${pdfContent.slice(0, 36000)}
"""

Return a JSON array of question objects using this schema. The field values are instructions, not example answers:
[
  {
    "id": "unique identifier",
    "type": "mcq, short, long, fill-blanks, true-false, or exam-style",
    "question": "Question answerable from the uploaded text",
    "options": null,
    "correctAnswer": "Answer grounded in the uploaded text",
    "explanation": "Explanation grounded in that text",
    "pageReference": null,
    "marks": null,
    "difficulty": "${difficulty}",
    "topic": "Topic from the uploaded text"
  }
]
For MCQs, use four plausible options and make the correct answer match one option exactly. Do not invent page numbers or marks; use null when unknown.`;

  try {
    const rawJson = await callGeminiOrFallback(systemInstruction, prompt, 0.25, true);
    const questions = extractJSON(rawJson);
    const validQuestions = Array.isArray(questions)
      ? questions.filter((question) => question && typeof question.question === "string" && question.question.trim() && typeof question.correctAnswer === "string" && question.correctAnswer.trim())
      : [];
    if (validQuestions.length === 0) throw new Error("The model returned no usable questions.");
    return validQuestions.map((question, idx) => ({
      id: typeof question.id === "string" && question.id.trim() ? question.id : `q_${Date.now()}_${idx}`,
      type: ["mcq", "short", "long", "fill-blanks", "true-false", "exam-style"].includes(question.type) ? question.type : "short",
      question: question.question.trim(),
      options: Array.isArray(question.options) ? question.options : undefined,
      correctAnswer: question.correctAnswer.trim(),
      explanation: typeof question.explanation === "string" ? question.explanation : "",
      pageReference: typeof question.pageReference === "number" && question.pageReference > 0 ? question.pageReference : undefined,
      marks: typeof question.marks === "number" && question.marks > 0 ? question.marks : undefined,
      difficulty: ["Easy", "Medium", "Hard", "Exam Preparation"].includes(question.difficulty) ? question.difficulty : difficulty,
      topic: typeof question.topic === "string" && question.topic.trim() ? question.topic : topic || pdfTitle,
    }));
  } catch (err) {
    throw new Error("Question generation failed. No sample questions were created.");
  }
}

// 6. TOPIC EXPLAINER
// ==========================================

export async function explainPdfTopic(params: {
  pdfTitle: string;
  pdfContent: string;
  topic: string;
  depth?: "simple" | "detailed" | "exam-focused";
}): Promise<PDFTopicExplanation> {
  const { pdfTitle, pdfContent, topic, depth = "detailed" } = params;

  const systemInstruction = `You are a world-class engineering educator.
Explain the topic "${topic}" based authoritatively on "${pdfTitle}".
Break down complex ideas into intuitive analogies, step-by-step principles, formulas, and high-yield exam takeaways.
Return strictly a JSON object.`;

  const prompt = `Explain "${topic}" from "${pdfTitle}" (Depth: ${depth}).

DOCUMENT TEXT:
"""
${pdfContent.slice(0, 36000)}
"""

Return JSON:
{
  "topic": "${topic}",
  "documentTitle": "${pdfTitle}",
  "analogy": "Relevant analogy grounded in the uploaded topic, or an empty string",
  "coreDefinition": "Definition grounded in uploaded document text",
  "stepByStepBreakdown": ["Steps grounded in the uploaded source"],
  "keyFormulas": [],
  "examTakeaways": [],
  "pageReference": null
}`;

  try {
    const rawJson = await callGeminiOrFallback(systemInstruction, prompt, 0.25, true);
    const data = extractJSON(rawJson);

    return {
      topic: data.topic || topic,
      documentTitle: pdfTitle,
      analogy: typeof data.analogy === "string" ? data.analogy : "",
      coreDefinition: typeof data.coreDefinition === "string" ? data.coreDefinition : "",
      stepByStepBreakdown: Array.isArray(data.stepByStepBreakdown) ? data.stepByStepBreakdown.filter((step: unknown) => typeof step === "string" && step.trim()) : [],
      keyFormulas: Array.isArray(data.keyFormulas) ? data.keyFormulas.filter((formula: unknown) => typeof formula === "string" && formula.trim()) : [],
      examTakeaways: Array.isArray(data.examTakeaways) ? data.examTakeaways.filter((takeaway: unknown) => typeof takeaway === "string" && takeaway.trim()) : [],
      pageReference: typeof data.pageReference === "number" && data.pageReference > 0 ? data.pageReference : undefined,
    };
  } catch (err) {
    throw new Error("Topic explanation failed. No unrelated explanation was substituted.");
  }
}

// 7. FIND IMPORTANT TOPICS
// ==========================================

export async function findImportantPdfTopics(params: {
  pdfTitle: string;
  pdfContent: string;
  subject?: string;
}): Promise<PDFImportantTopic[]> {
  const { pdfTitle, pdfContent, subject } = params;

  const systemInstruction = `You are an academic study assistant.
Identify important topics solely from the provided document. Use emphasis, repeated concepts, headings and stated learning objectives as evidence.
Do not invent external university exam frequencies, marks allocation, or statistical probabilities unless they are explicitly stated in the provided text.
Return strictly a JSON array.`;

  const prompt = `Scan "${pdfTitle}" (${subject || "Engineering Core"}) and extract the top high-yield exam topics.

DOCUMENT CONTENT:
"""
${pdfContent.slice(0, 36000)}
"""

Return a JSON array of objects:
[
  {
    "rank": 1,
    "topic": "Topic discussed in the uploaded document",
    "importance": "Medium",
    "examFrequency": "Not stated in the uploaded document",
    "keyConcepts": ["Concepts from the supplied text"],
    "expectedMarks": null,
    "pageReference": null,
    "whyImportant": "Explain importance from the document itself, not invented exam history."
  }
]`;

  try {
    const rawJson = await callGeminiOrFallback(systemInstruction, prompt, 0.2, true);
    const topics = extractJSON(rawJson);
    const validTopics = Array.isArray(topics)
      ? topics.filter((item) => item && typeof item.topic === "string" && item.topic.trim())
      : [];
    if (validTopics.length === 0) throw new Error("The model returned no usable topics.");
    return validTopics.map((item, idx) => ({
      rank: typeof item.rank === "number" && item.rank > 0 ? item.rank : idx + 1,
      topic: item.topic.trim(),
      importance: ["Critical", "High", "Medium"].includes(item.importance) ? item.importance : "Medium",
      examFrequency: typeof item.examFrequency === "string" && item.examFrequency.trim() ? item.examFrequency : "Not stated in the uploaded document.",
      keyConcepts: Array.isArray(item.keyConcepts) ? item.keyConcepts.filter((concept: unknown) => typeof concept === "string" && concept.trim()) : [],
      expectedMarks: typeof item.expectedMarks === "string" && item.expectedMarks.trim() ? item.expectedMarks : undefined,
      pageReference: typeof item.pageReference === "number" && item.pageReference > 0 ? item.pageReference : undefined,
      whyImportant: typeof item.whyImportant === "string" && item.whyImportant.trim() ? item.whyImportant : "No explanation of importance was returned.",
    }));
  } catch (err) {
    throw new Error("Important-topic analysis failed. No invented exam frequency or marks were returned.");
  }
}

