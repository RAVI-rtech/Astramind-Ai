import puppeteer from 'puppeteer';
import express from "express";
import OpenAI from "openai";
import path from "path";
import fs from "fs";
import https from "https";
import dotenv from "dotenv";
import { createDefaultImageRouter } from "./server/imageRouter";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, GenerateVideosOperation } from "@google/genai";
import { WebSocketServer } from "ws";
import { Server } from "http";
import { createClient } from "@supabase/supabase-js";
import { 
  createLiveQuizRoom, 
  joinLiveQuizRoom, 
  getFullRoomForHost, 
  getSanitizedRoom,
  submitLiveQuizAnswer, 
  handleRoomControl, 
  removeStudentFromQuizRoom,
  setupLiveQuizWebSocket, 
  generateAIQuestions,
  saveDraftQuiz,
  getDraftsForUser,
  getDraftById,
  deleteDraft,
  getUserQuizHistory,
  addRoomChatMessage,
  getRoomChatMessages,
  formatSelectedOptionLabel,
  duplicateQuizDraftOrRoom,
  saveQuestionsToUserBank,
  getUserQuestionBank,
  manualGradeStudentAnswer
} from "./server/liveQuizManager";
import {
  analyzeUploadedDocument,
  generateGuidedLesson,
  generateMCQQuiz,
  generateFlashcards,
  generateImportantQuestions,
  generateSummaryNotes,
  generatePracticeExercises,
  chatWithAITutor
} from "./server/workspaceAiManager";
import {
  getKnowledgeBaseStatus,
  syncGoogleDriveRepository,
  searchKnowledgeBase,
  getKnowledgeDocuments,
  getKnowledgeChunks
} from "./server/knowledgeBaseService";
import {
  chatWithPdf,
  summarizePdf,
  generatePdfNotes,
  generatePdfFlashcards,
  generatePdfQuestions,
  explainPdfTopic,
  findImportantPdfTopics
} from "./server/pdfStudyManager";
import { fetchCollegeAttendanceReport } from "./server/attendanceService";
import { discoverCollegeSyllabus, downloadOfficialSyllabusPdf } from "./server/collegeSyllabusService";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON parsing with large limits to support base64 image/file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiInstance: GoogleGenAI | null = null;
let nvidiaInstance: OpenAI | null = null;
let openaiInstance: OpenAI | null = null;

function getGoogleGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

interface NvidiaKeyEntry {
  name: string;
  key: string;
}

// Return all configured and deduplicated NVIDIA API keys in deterministic priority order
function getAvailableNvidiaKeys(): NvidiaKeyEntry[] {
  const keys: NvidiaKeyEntry[] = [];
  const seen = new Set<string>();

  // 1. Primary NVIDIA_API_KEY
  const k1 = process.env.NVIDIA_API_KEY?.trim();
  if (k1) {
    keys.push({ name: "NVIDIA_API_KEY", key: k1 });
    seen.add(k1);
  }

  // 2. Secondary NVIDIA_API_KEY_2
  const k2 = process.env.NVIDIA_API_KEY_2?.trim();
  if (k2 && !seen.has(k2)) {
    keys.push({ name: "NVIDIA_API_KEY_2", key: k2 });
    seen.add(k2);
  }

  // 3. Any additional keys matching NVIDIA_API_KEY_* (e.g. NVIDIA_API_KEY_3, NVIDIA_API_KEY_BACKUP)
  const extraKeys = Object.keys(process.env)
    .filter((k) => k.startsWith("NVIDIA_API_KEY") && k !== "NVIDIA_API_KEY" && k !== "NVIDIA_API_KEY_2")
    .sort();

  for (const k of extraKeys) {
    const val = process.env[k]?.trim();
    if (val && !seen.has(val)) {
      keys.push({ name: k, key: val });
      seen.add(val);
    }
  }

  return keys;
}

// Client cache to avoid repeatedly instantiating OpenAI clients per key
const nvidiaClientCache = new Map<string, OpenAI>();

function getNvidiaClientForKey(key: string): OpenAI {
  let client = nvidiaClientCache.get(key);
  if (!client) {
    client = new OpenAI({
      apiKey: key,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
    nvidiaClientCache.set(key, client);
  }
  return client;
}

function getNVIDIA(): OpenAI | null {
  const keys = getAvailableNvidiaKeys();
  if (keys.length === 0) return null;
  return getNvidiaClientForKey(keys[0].key);
}

function formatForGemini(rawMessages: any[]) {
  if (!Array.isArray(rawMessages)) {
    return [{ role: "user" as const, parts: [{ text: "Hello" }] }];
  }

  // 1. Filter out empty, placeholder, or previous error messages
  const filtered = rawMessages.filter((m: any) => {
    if (!m) return false;
    if (m.id === "welcome-msg") return false;
    const text = typeof m.text === "string" ? m.text.trim() : "";
    if (text.includes("All AI providers are temporarily unavailable") || text.includes("AI Service Notice") || text.includes("Connection Issue")) {
      return false;
    }
    return text.length > 0 || (m.attachment?.base64 && m.attachment?.type);
  });

  if (filtered.length === 0) {
    return [{ role: "user" as const, parts: [{ text: "Hello" }] }];
  }

  // 2. Strip leading model turns so the conversation always begins with a user turn
  let startIdx = 0;
  while (startIdx < filtered.length) {
    const role = (filtered[startIdx].sender === "user" || filtered[startIdx].role === "user") ? "user" : "model";
    if (role === "user") break;
    startIdx++;
  }

  const validSequence = startIdx < filtered.length ? filtered.slice(startIdx) : [filtered[filtered.length - 1]];

  // 3. Build strictly alternating turns
  const result: { role: "user" | "model"; parts: any[] }[] = [];

  for (const m of validSequence) {
    const role: "user" | "model" = (m.sender === "user" || m.role === "user") ? "user" : "model";
    const parts: any[] = [];

    if (m.attachment?.base64 && m.attachment?.type) {
      parts.push({
        inlineData: {
          mimeType: m.attachment.type,
          data: m.attachment.base64,
        },
      });
    }

    const text = typeof m.text === "string" ? m.text.trim() : "";
    if (text.length > 0) {
      parts.push({ text });
    } else if (parts.length === 0) {
      parts.push({ text: "..." });
    }

    if (result.length > 0 && result[result.length - 1].role === role) {
      // Merge consecutive same-role turns
      result[result.length - 1].parts.push(...parts);
    } else {
      result.push({ role, parts });
    }
  }

  // 4. Ensure first turn is user
  if (result.length === 0 || result[0].role !== "user") {
    result.unshift({ role: "user", parts: [{ text: "Hello" }] });
  }

  // 5. Ensure last turn is user (Gemini generates model turn next)
  if (result[result.length - 1].role !== "user") {
    result.push({ role: "user", parts: [{ text: "Please continue." }] });
  }

  return result;
}

function convertToOpenAIMessages(messages: any[], systemInstruction?: string) {
  const result: any[] = [];
  if (systemInstruction) {
    result.push({
      role: "system",
      content: systemInstruction,
    });
  }
  for (const m of messages) {
    if (!m) continue;
    if (m.id === "welcome-msg") continue;
    const text = typeof m.text === "string" ? m.text.trim() : "";
    if (text.includes("All AI providers are temporarily unavailable") || text.includes("AI Service Notice") || text.includes("Connection Issue")) {
      continue;
    }
    if (!text && !m.attachment) continue;

    const role = (m.sender === "user" || m.role === "user") ? "user" : "assistant";
    let content = text;
    if (m.attachment?.name) {
      content += `\n[Attached file: ${m.attachment.name}]`;
    }
    result.push({ role, content });
  }

  if (!result.some((msg) => msg.role === "user")) {
    result.push({ role: "user", content: "Hello" });
  }

  return result;
}

// 1. API: Check Setup & Multi-Provider status
app.get("/api/status", (req, res) => {
  const nvidiaKeys = getAvailableNvidiaKeys();
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasNvidiaKey: nvidiaKeys.length > 0,
    nvidiaKeyCount: nvidiaKeys.length,
    nvidiaConfiguredKeys: nvidiaKeys.map((k) => k.name),
    multiProviderReady: true,
  });
});

// 2. API: Stream Chat Completion with Resilient Multi-Provider Failover
app.post("/api/chat/stream", async (req, res) => {
  // Set headers for SSE streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const { messages, systemInstruction, useMapsGrounding, mode, simulateFailure } = req.body || {};

  try {
    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: "Invalid request payload: messages must be an array.", text: "⚠️ Invalid request format: messages must be an array." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // Format for Gemini using robust alternating validator
    const geminiContents = formatForGemini(messages);

    // Format for OpenAI-compatible providers (NVIDIA)
    const openAiMessages = convertToOpenAIMessages(messages, systemInstruction);

    // Determine Available Configured Providers
    const nvidiaKeys = getAvailableNvidiaKeys();
    const availableProviders: string[] = [];
    if (process.env.GEMINI_API_KEY) availableProviders.push("gemini");
    if (nvidiaKeys.length > 0) availableProviders.push("nvidia");

    if (availableProviders.length === 0) {
      const noKeyMsg = "⚠️ **Configuration Error**: No AI provider API key found (GEMINI_API_KEY or NVIDIA_API_KEY is not set). Please configure API credentials.";
      res.write(`data: ${JSON.stringify({ text: noKeyMsg, error: noKeyMsg })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // Determine Provider Priority Chain
    let providerChain = availableProviders.includes("gemini")
      ? ["gemini", ...availableProviders.filter((p) => p !== "gemini")]
      : availableProviders;

    if ((mode === "light" || mode === "fast" || mode === "fast_questions") && availableProviders.includes("nvidia")) {
      providerChain = ["nvidia", ...availableProviders.filter((p) => p !== "nvidia")];
    }

    // Check for simulated failure testing headers/params
    let simulatedFails: string[] = [];
    if (typeof simulateFailure === "string") {
      simulatedFails = simulateFailure.toLowerCase().split(",").map((s) => s.trim());
    } else if (req.headers["x-simulate-failure"]) {
      simulatedFails = (req.headers["x-simulate-failure"] as string).toLowerCase().split(",").map((s) => s.trim());
    }

    let providerSucceeded = false;
    let providerTriedCount = 0;
    const providerErrors: { provider: string; details: string }[] = [];

    for (const provider of providerChain) {
      if (providerTriedCount > 0 && !providerSucceeded) {
        // Emit "Switching Intelligence..." event for frontend
        res.write(`data: ${JSON.stringify({ providerSwitch: true, statusMessage: "Switching Intelligence..." })}\n\n`);
      }
      providerTriedCount++;

      // Handle simulated failure for testing
      if (simulatedFails.includes(provider) || simulatedFails.includes("all")) {
        console.log(`[Multi-Provider] Simulating failure for provider: ${provider}`);
        providerErrors.push({ provider, details: "Simulated test failure triggered" });
        continue;
      }

      // Priority: Gemini API
      if (provider === "gemini") {
        const ai = getGoogleGenAI();
        if (!ai) {
          providerErrors.push({ provider: "Gemini", details: "API client initialization failed (missing key)" });
          continue;
        }

        let geminiSuccess = false;
        const geminiModelsToTry = [
          "gemini-flash-latest",
          "gemini-3.1-flash-lite",
          "gemini-3.8-flash",
          "gemini-2.5-flash",
        ];

        let lastGeminiErr = "";

        for (const modelName of geminiModelsToTry) {
          try {
            console.log(`[Multi-Provider] Attempting Gemini Stream (${modelName})...`);
            const responseStream = await ai.models.generateContentStream({
              model: modelName,
              contents: geminiContents,
              config: {
                systemInstruction: systemInstruction || "You are AstraMind AI...",
                temperature: 0.7,
                ...(useMapsGrounding ? { tools: [{ googleMaps: {} }] } : {}),
              },
            });

            let groundingChunksSent = false;
            for await (const chunk of responseStream) {
              if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
              }
              if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks && !groundingChunksSent) {
                res.write(`data: ${JSON.stringify({ groundingChunks: chunk.candidates[0].groundingMetadata.groundingChunks })}\n\n`);
                groundingChunksSent = true;
              }
            }
            geminiSuccess = true;
            providerSucceeded = true;
            break;
          } catch (error: any) {
            const rawMsg = error?.message || String(error);
            console.error(`[Multi-Provider] Gemini stream model ${modelName} failed:`, rawMsg);
            // Summarize quota or auth message cleanly
            if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
              lastGeminiErr = `Rate limit / Quota exceeded on ${modelName} (429)`;
            } else if (rawMsg.includes("400") || rawMsg.includes("INVALID_ARGUMENT")) {
              lastGeminiErr = `Invalid request structure on ${modelName} (400)`;
            } else {
              lastGeminiErr = `${modelName}: ${rawMsg.slice(0, 120)}`;
            }
          }
        }

        if (geminiSuccess) {
          break; // Successfully fulfilled by Gemini
        } else {
          providerErrors.push({ provider: "Gemini", details: lastGeminiErr || "All Gemini models failed" });
        }
      }

      // Priority: NVIDIA API
      else if (provider === "nvidia") {
        const nvidiaKeys = getAvailableNvidiaKeys();
        if (nvidiaKeys.length === 0) {
          providerErrors.push({ provider: "NVIDIA", details: "No NVIDIA API key configured" });
          continue;
        }

        let nvidiaFulfilled = false;

        for (let i = 0; i < nvidiaKeys.length; i++) {
          const { name: keyName, key } = nvidiaKeys[i];

          // Check if failure is simulated for this specific key or all nvidia
          const keySimulated =
            simulatedFails.includes(keyName.toLowerCase()) ||
            simulatedFails.includes("nvidia_all") ||
            (keyName === "NVIDIA_API_KEY" && (simulatedFails.includes("nvidia_key_1") || simulatedFails.includes("nvidia_1")));

          if (keySimulated) {
            console.log(`[Multi-Provider] Simulating failure for NVIDIA key: ${keyName}`);
            providerErrors.push({ provider: `NVIDIA (${keyName})`, details: "Simulated test failure triggered" });
            if (i + 1 < nvidiaKeys.length) {
              console.log(`[Multi-Provider] Failing over from ${keyName} to ${nvidiaKeys[i + 1].name}...`);
              res.write(`data: ${JSON.stringify({ providerSwitch: true, statusMessage: `Failing over to ${nvidiaKeys[i + 1].name}...` })}\n\n`);
            }
            continue;
          }

          const nvidia = getNvidiaClientForKey(key);
          console.log(`[Multi-Provider] Attempting NVIDIA Stream with ${keyName} (model: meta/llama-3.2-11b-vision-instruct)...`);

          try {
            const stream = await nvidia.chat.completions.create({
              model: "meta/llama-3.2-11b-vision-instruct",
              messages: openAiMessages,
              stream: true,
              temperature: 0.7,
            });

            let streamedAny = false;
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) {
                streamedAny = true;
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            }

            if (streamedAny) {
              console.log(`[Multi-Provider] NVIDIA stream completed successfully using ${keyName}`);
              providerSucceeded = true;
              nvidiaFulfilled = true;
              break; // Key succeeded! Do not try subsequent keys.
            } else {
              throw new Error("NVIDIA returned an empty stream response.");
            }
          } catch (error: any) {
            const nvMsg = error?.message || String(error);
            const status = error?.status || error?.statusCode || (nvMsg.includes("401") ? "401" : nvMsg.includes("429") ? "429" : "");
            console.error(`[Multi-Provider] NVIDIA stream error on ${keyName} [status: ${status || "unknown"}]:`, nvMsg);
            providerErrors.push({
              provider: `NVIDIA (${keyName})`,
              details: `${status ? `HTTP ${status}: ` : ""}${nvMsg.slice(0, 120)}`,
            });

            // If there's another NVIDIA key available, inform client & failover
            if (i + 1 < nvidiaKeys.length) {
              console.log(`[Multi-Provider] Failing over from ${keyName} to ${nvidiaKeys[i + 1].name}...`);
              res.write(`data: ${JSON.stringify({ providerSwitch: true, statusMessage: `Failing over to ${nvidiaKeys[i + 1].name}...` })}\n\n`);
            }
          }
        }

        if (nvidiaFulfilled) {
          break; // Succeeded by NVIDIA, break outer provider loop
        }
      }
    }

    if (!providerSucceeded) {
      console.log("[Multi-Provider] Request failed across configured providers:", providerErrors);
      const detailLines = providerErrors.map((e) => `• **${e.provider}**: ${e.details}`).join("\n");
      const errResponse = `⚠️ **AI Service Error**\n\nThe AI Tutor request could not be completed by the configured provider(s).\n\n${detailLines}\n\nPlease click **Retry** or wait a few seconds before trying again.`;
      res.write(`data: ${JSON.stringify({ text: errResponse, error: errResponse })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("[Multi-Provider] Unexpected server error:", error);
    const fatalMsg = `⚠️ **AI Server Error**: ${error?.message || "Unexpected internal error"}. Please retry.`;
    res.write(`data: ${JSON.stringify({ text: fatalMsg, error: fatalMsg })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// 3. API: Standard (non-stream) Chat Completion with Multi-Provider Failover
app.post("/api/chat", async (req, res) => {
  const { messages, systemInstruction, useMapsGrounding, mode, simulateFailure } = req.body || {};

  try {
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid request: messages array required." });
      return;
    }

    const geminiContents = formatForGemini(messages);
    const openAiMessages = convertToOpenAIMessages(messages, systemInstruction);

    const nvidiaKeys = getAvailableNvidiaKeys();
    const availableProviders: string[] = [];
    if (process.env.GEMINI_API_KEY) availableProviders.push("gemini");
    if (nvidiaKeys.length > 0) availableProviders.push("nvidia");

    if (availableProviders.length === 0) {
      res.status(503).json({
        error: "Configuration Error: GEMINI_API_KEY or NVIDIA_API_KEY is not set.",
        text: "⚠️ **Configuration Error**: No AI provider API key found.",
      });
      return;
    }

    let providerChain = availableProviders.includes("gemini")
      ? ["gemini", ...availableProviders.filter((p) => p !== "gemini")]
      : availableProviders;

    if ((mode === "light" || mode === "fast" || mode === "fast_questions") && availableProviders.includes("nvidia")) {
      providerChain = ["nvidia", ...availableProviders.filter((p) => p !== "nvidia")];
    }

    let simulatedFails: string[] = [];
    if (typeof simulateFailure === "string") {
      simulatedFails = simulateFailure.toLowerCase().split(",").map((s) => s.trim());
    } else if (req.headers["x-simulate-failure"]) {
      simulatedFails = (req.headers["x-simulate-failure"] as string).toLowerCase().split(",").map((s) => s.trim());
    }

    const providerErrors: { provider: string; details: string }[] = [];

    for (const provider of providerChain) {
      if (simulatedFails.includes(provider) || simulatedFails.includes("all")) {
        providerErrors.push({ provider, details: "Simulated test failure triggered" });
        continue;
      }

      if (provider === "gemini") {
        const ai = getGoogleGenAI();
        if (!ai) {
          providerErrors.push({ provider: "Gemini", details: "Client not initialized" });
          continue;
        }

        const geminiModelsToTry = [
          "gemini-flash-latest",
          "gemini-3.1-flash-lite",
          "gemini-3.8-flash",
          "gemini-2.5-flash",
        ];

        let lastGeminiErr = "";
        let geminiSuccess = false;

        for (const modelName of geminiModelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: geminiContents,
              config: {
                systemInstruction: systemInstruction || "You are AstraMind AI...",
                temperature: 0.7,
                ...(useMapsGrounding ? { tools: [{ googleMaps: {} }] } : {}),
              },
            });

            if (response.text) {
              res.json({
                text: response.text,
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
              });
              return;
            }
          } catch (error: any) {
            const rawMsg = error?.message || String(error);
            console.error(`[Multi-Provider] Gemini standard model ${modelName} error:`, rawMsg);
            if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
              lastGeminiErr = `Rate limit / Quota exceeded on ${modelName} (429)`;
            } else {
              lastGeminiErr = `${modelName}: ${rawMsg.slice(0, 120)}`;
            }
          }
        }

        if (!geminiSuccess) {
          providerErrors.push({ provider: "Gemini", details: lastGeminiErr || "All Gemini models failed" });
        }
      } else if (provider === "nvidia") {
        const nvidiaKeys = getAvailableNvidiaKeys();
        if (nvidiaKeys.length === 0) {
          providerErrors.push({ provider: "NVIDIA", details: "No NVIDIA API key configured" });
          continue;
        }

        let nvidiaFulfilled = false;

        for (let i = 0; i < nvidiaKeys.length; i++) {
          const { name: keyName, key } = nvidiaKeys[i];

          const keySimulated =
            simulatedFails.includes(keyName.toLowerCase()) ||
            simulatedFails.includes("nvidia_all") ||
            (keyName === "NVIDIA_API_KEY" && (simulatedFails.includes("nvidia_key_1") || simulatedFails.includes("nvidia_1")));

          if (keySimulated) {
            console.log(`[Multi-Provider] Simulating failure for NVIDIA key: ${keyName}`);
            providerErrors.push({ provider: `NVIDIA (${keyName})`, details: "Simulated test failure triggered" });
            if (i + 1 < nvidiaKeys.length) {
              console.log(`[Multi-Provider] Failing over from ${keyName} to ${nvidiaKeys[i + 1].name}...`);
            }
            continue;
          }

          const nvidia = getNvidiaClientForKey(key);
          console.log(`[Multi-Provider] Attempting NVIDIA standard completion with ${keyName}...`);

          try {
            const response = await nvidia.chat.completions.create({
              model: "meta/llama-3.2-11b-vision-instruct",
              messages: openAiMessages,
              temperature: 0.7,
            });

            const text = response.choices[0]?.message?.content;
            if (text) {
              console.log(`[Multi-Provider] NVIDIA standard completion succeeded using ${keyName}`);
              res.json({
                text,
                groundingChunks: null,
                provider: `NVIDIA (${keyName})`,
              });
              return;
            } else {
              throw new Error("NVIDIA returned empty text content.");
            }
          } catch (error: any) {
            const nvMsg = error?.message || String(error);
            const status = error?.status || error?.statusCode || (nvMsg.includes("401") ? "401" : nvMsg.includes("429") ? "429" : "");
            console.error(`[Multi-Provider] NVIDIA standard error on ${keyName} [status: ${status || "unknown"}]:`, nvMsg);
            providerErrors.push({
              provider: `NVIDIA (${keyName})`,
              details: `${status ? `HTTP ${status}: ` : ""}${nvMsg.slice(0, 120)}`,
            });

            if (i + 1 < nvidiaKeys.length) {
              console.log(`[Multi-Provider] Failing over from ${keyName} to ${nvidiaKeys[i + 1].name}...`);
            }
          }
        }
      }
    }

    const detailLines = providerErrors.map((e) => `• **${e.provider}**: ${e.details}`).join("\n");
    res.status(503).json({
      error: "AI Provider Error",
      text: `⚠️ **AI Service Error**\n\n${detailLines}\n\nPlease click **Retry** to try again.`,
      details: providerErrors,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Internal Server Error",
      text: `⚠️ **Internal Server Error**: ${error?.message || "Unexpected error"}`,
    });
  }
});


// Helper to detect model capabilities for image generation
interface ModelCapabilities {
  method: "generateImages" | "generateContent";
  supportsAspectRatio: boolean;
  supportedAspectRatios: string[];
}

function getModelCapabilities(modelName: string): ModelCapabilities {
  const name = modelName.toLowerCase();
  if (name.includes("imagen")) {
    return {
      method: "generateImages",
      supportsAspectRatio: true,
      supportedAspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
    };
  }
  return {
    method: "generateContent",
    supportsAspectRatio: false,
    supportedAspectRatios: [],
  };
}

// Known valid modern Gemini & Imagen image generation models in priority order
const KNOWN_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "imagen-3.0-generate-002",
  "gemini-3-pro-image",
  "gemini-2.5-flash",
];

// Helper to discover available image models for the API key dynamically
async function getAvailableImageModels(ai: GoogleGenAI, requestedCustomModel?: string): Promise<string[]> {
  const candidates: string[] = [];

  if (requestedCustomModel && !requestedCustomModel.includes("fast-generate-001")) {
    candidates.push(requestedCustomModel);
  }

  try {
    const listResult = await ai.models.list();
    let modelsList: any[] = [];
    if (Array.isArray(listResult)) {
      modelsList = listResult;
    } else if ((listResult as any)?.models) {
      modelsList = (listResult as any).models;
    } else if (Symbol.asyncIterator in Object(listResult)) {
      for await (const m of listResult as any) {
        modelsList.push(m);
      }
    }

    const discoveredNames = modelsList.map((m: any) => {
      const rawName = typeof m === "string" ? m : m?.name || "";
      return rawName.replace(/^models\//, "");
    });

    console.log("[AstraMind Model Discovery] Discovered API models count:", discoveredNames.length);

    // Filter discovered models for image/vision models
    for (const name of discoveredNames) {
      if (KNOWN_IMAGE_MODELS.includes(name) || name.includes("image") || name.includes("imagen")) {
        // Exclude known deprecated/unsupported models
        if (!name.includes("fast-generate-001") && !candidates.includes(name)) {
          candidates.push(name);
        }
      }
    }
  } catch (err: any) {
    console.warn("[AstraMind Model Discovery] ai.models.list() call failed, using default candidate fallback list:", err?.message || err);
  }

  // Ensure standard valid fallback models are present if candidates is empty
  for (const fallbackModel of KNOWN_IMAGE_MODELS) {
    if (!candidates.includes(fallbackModel)) {
      candidates.push(fallbackModel);
    }
  }

  console.log("[AstraMind Model Discovery] Final ordered candidate image models:", candidates);
  return candidates;
}

// API: Check Image Models Availability Status
app.get("/api/image-models-status", async (req, res) => {
  try {
    const router = createDefaultImageRouter(getGoogleGenAI);
    const providers = await router.getProviderStatuses();
    const availableProviders = providers.filter((provider) => provider.available);
    res.json({
      available: availableProviders.length > 0,
      models: availableProviders.map((provider) => provider.name),
      providers,
      message: availableProviders.length > 0
        ? "Image providers are available; AstraMind will try configured providers and fall back automatically."
        : "No image provider is currently available. Check Hugging Face token access and Gemini API configuration."
    });
  } catch (err: any) {
    console.error("[AstraMind Status] Error checking router status:", err);
    res.json({
      available: false,
      message: "Image generation is currently unavailable. Please try again later.",
      models: []
    });
  }
});

// API: Generate Image via Modular ImageRouter
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, size, style, aspectRatio, providerId, model: customModel } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt text is required for image generation." });
    }

    const imageRouter = createDefaultImageRouter(getGoogleGenAI);
    const wantsStream = req.headers["x-stream-status"] === "true" || req.headers["accept"] === "text/event-stream";

    if (wantsStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        const result = await imageRouter.generateImage(
          { prompt: prompt.trim(), style, aspectRatio, size, customModel, providerId },
          (statusText) => {
            res.write(`data: ${JSON.stringify({ type: "status", message: statusText })}\n\n`);
          }
        );

        res.write(`data: ${JSON.stringify({ type: "result", imageUrl: result.imageUrl, provider: result.providerId, model: result.modelUsed })}\n\n`);
        return res.end();
      } catch (routerErr: any) {
        res.write(`data: ${JSON.stringify({ type: "error", error: routerErr?.message || "Image generation is currently unavailable. Please try again later." })}\n\n`);
        return res.end();
      }
    }

    try {
      const result = await imageRouter.generateImage({
        prompt: prompt.trim(),
        style,
        aspectRatio,
        size,
        customModel,
        providerId,
      });

      return res.json({
        imageUrl: result.imageUrl,
        provider: result.providerId,
        model: result.modelUsed,
        statusHistory: result.statusHistory,
      });
    } catch (routerErr: any) {
      return res.status(503).json({
        error: routerErr?.message || "Image generation is currently unavailable. Please try again later.",
      });
    }
  } catch (error: any) {
    console.error("[AstraMind Image Gen] Server error:", error);
    res.status(503).json({ error: error?.message || "Image generation is currently unavailable. Please try again later." });
  }
});

// API: Edit Image via Modular ImageRouter
app.post("/api/edit-image", async (req, res) => {
  try {
    const { prompt, image, providerId } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Edit prompt instructions are required." });
    }
    if (!image) {
      return res.status(400).json({ error: "Source image is required for image editing." });
    }

    const imageRouter = createDefaultImageRouter(getGoogleGenAI);
    const wantsStream = req.headers["x-stream-status"] === "true" || req.headers["accept"] === "text/event-stream";

    if (wantsStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        const result = await imageRouter.editImage(
          { prompt: prompt.trim(), image, providerId },
          (statusText) => {
            res.write(`data: ${JSON.stringify({ type: "status", message: statusText })}\n\n`);
          }
        );

        res.write(`data: ${JSON.stringify({ type: "result", imageUrl: result.imageUrl, provider: result.providerId, model: result.modelUsed })}\n\n`);
        return res.end();
      } catch (routerErr: any) {
        console.error("[AstraMind Image Edit] Streaming provider error:", routerErr?.message || routerErr);
        res.write(`data: ${JSON.stringify({ type: "error", error: routerErr?.message || "Image editing is currently unavailable. Please try again later." })}\n\n`);
        return res.end();
      }
    }

    try {
      const result = await imageRouter.editImage({
        prompt: prompt.trim(),
        image,
        providerId,
      });

      return res.json({
        imageUrl: result.imageUrl,
        provider: result.providerId,
        model: result.modelUsed,
        statusHistory: result.statusHistory,
      });
    } catch (routerErr: any) {
      console.error("[AstraMind Image Edit] Provider error:", routerErr?.message || routerErr);
      return res.status(503).json({
        error: routerErr?.message || "Image editing is currently unavailable. Please try again later.",
      });
    }
  } catch (error: any) {
    console.error("[AstraMind Image Edit] Server error:", error);
    res.status(503).json({ error: error?.message || "Image editing is currently unavailable. Please try again later." });
  }
});

// API: Generate Video Start
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const ai = getGoogleGenAI();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured or unavailable." });
    }
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio || '16:9'
      }
    });
    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Generate video error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// API: Generate Video Poll
app.get("/api/video-status", async (req, res) => {
  try {
    const operationName = req.query.operationName as string;
    if (!operationName) return res.status(400).json({ error: "operationName is required" });
    
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const ai = getGoogleGenAI();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured or unavailable." });
    }
    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({ done: updated.done });
  } catch (error: any) {
    console.error("Video status error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// API: Generate Video Download
app.get("/api/video-download", async (req, res) => {
  try {
    const operationName = req.query.operationName as string;
    if (!operationName) return res.status(400).json({ error: "operationName is required" });
    
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const ai = getGoogleGenAI();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key is not configured or unavailable." });
    }
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video not found or not ready" });
    }
    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
    });
    if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
    
    res.setHeader('Content-Type', 'video/mp4');
    // Using node's Readable format from fetch
    const nodeStream = (videoRes.body as any);
    if (nodeStream && typeof nodeStream.pipeTo === 'function') {
      await nodeStream.pipeTo(
        new WritableStream({
          write(chunk) { res.write(chunk); },
          close() { res.end(); },
        })
      );
    } else if (nodeStream && typeof nodeStream.pipe === 'function') {
      nodeStream.pipe(res);
    } else {
       // fallback for standard array buffer
       const buffer = await videoRes.arrayBuffer();
       res.end(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error("Video download error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// API: Resume Enhancement & Auto-Generator
app.post("/api/ai/enhance-resume", async (req, res) => {
  try {
    const { action, text, jobTitle } = req.body;
    const ai = getGoogleGenAI();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "enhance_summary") {
      systemPrompt = "You are an expert executive resume reviewer and ATS optimization specialist. Write a concise, 3-4 sentence high-impact professional summary based on the provided text and job title. Use active, persuasive professional language with measurable outcomes where applicable. Return ONLY the improved summary text without quotes or preamble.";
      userPrompt = `Job Title: ${jobTitle || "Professional"}\nCurrent Draft: ${text || ""}`;
    } else if (action === "enhance_bullet") {
      systemPrompt = "You are a senior career coach and ATS keyword expert. Rewrite the given bullet point into a strong, action-verb driven accomplishment statement (using the STAR method). Use active verbs like 'Architected', 'Spearheaded', 'Optimized', 'Engineered', 'Streamlined'. Include realistic quantifiable metrics if none are present. Return ONLY the improved single bullet point without quotes or prefixes.";
      userPrompt = `Job Role/Context: ${jobTitle || "Professional"}\nOriginal Bullet: ${text || ""}`;
    } else if (action === "suggest_skills") {
      systemPrompt = "You are an AI career strategist. Given a target job title or field, return a clean JSON object containing categorized skills: Technical, Frameworks & Libraries, Tools & Cloud, Soft Skills. Output MUST be valid JSON only with keys: 'Technical', 'Frameworks & Libraries', 'Tools & Cloud', 'Soft Skills' as arrays of strings.";
      userPrompt = `Target Job Title or Field: ${jobTitle || text || "Software Engineer"}`;
    } else if (action === "generate_full_resume") {
      systemPrompt = "You are an executive resume writer. Generate a comprehensive, realistic, ATS-optimized starter resume JSON for a given target job title. Return ONLY valid JSON with keys: personalInfo (fullName, jobTitle, summary, email, phone, location, linkedinUrl, githubUrl, portfolioUrl), education (array of items with degree, school, location, startDate, endDate, gpa, highlights), experience (array of items with jobTitle, company, location, startDate, endDate, isCurrent, bulletPoints), projects (array of items with title, role, techStack array, link, startDate, endDate, bulletPoints), certifications (array of items with name, issuer, date, credentialUrl), skills (array of items with category and skills array), achievements (array of items with title, organization, date, description), languages (array of items with name, proficiency).";
      userPrompt = `Target Career / Job Title / Profile: ${jobTitle || text}`;
    } else {
      systemPrompt = "You are an AI resume optimizer. Polish and elevate the provided resume text for clarity, conciseness, and ATS impact. Return ONLY the enhanced result.";
      userPrompt = text || "";
    }

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
          },
        });
        const output = response.text?.trim() || "";
        if (action === "suggest_skills" || action === "generate_full_resume") {
          try {
            const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            return res.json({ result: parsed });
          } catch (e) {
            return res.json({ result: output, rawText: output });
          }
        }
        return res.json({ result: output });
      } catch (gemErr: any) {
        console.warn("[AstraMind Resume AI] Gemini primary failed, attempting fallback...", gemErr?.message);
      }
    }

    const nvidiaKeys = getAvailableNvidiaKeys();
    for (const { name: keyName, key } of nvidiaKeys) {
      try {
        const nvidia = getNvidiaClientForKey(key);
        const response = await nvidia.chat.completions.create({
          model: "meta/llama-3.2-11b-vision-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.4,
        });
        const output = response.choices[0]?.message?.content?.trim() || "";
        if (action === "suggest_skills" || action === "generate_full_resume") {
          try {
            const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            return res.json({ result: parsed });
          } catch (e) {
            return res.json({ result: output });
          }
        }
        return res.json({ result: output });
      } catch (nvidiaErr: any) {
        console.warn(`[AstraMind Resume AI] NVIDIA fallback with ${keyName} failed:`, nvidiaErr?.message);
      }
    }

    return res.status(503).json({ error: "AI resume enhancement service is temporarily busy. Please try again." });
  } catch (err: any) {
    console.error("[AstraMind Resume AI] Server error:", err);
    res.status(500).json({ error: "Internal server error enhancing resume." });
  }
});

// API: AI Resume Builder Assistance (Enhance bullets, generate summary, suggest skills, ATS audit)
app.post("/api/ai-resume-improve", async (req, res) => {
  try {
    const { action, text, jobTitle, context, resumeData } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: "Action is required for resume improvement." });
    }

    let prompt = "";
    if (action === "enhance_bullet") {
      prompt = `You are a world-class executive resume writer and career strategist.
Enhance the following resume bullet point to make it high-impact, ATS-optimized, action-oriented, and quantified using the STAR method (Action verb + Task + Result/Impact + Metrics).

Job Title Context: ${jobTitle || "Professional"}
Original Bullet Point / Raw Notes: "${text || ""}"

Requirements:
- Provide 3 distinct enhanced options ranging from Concise to Metric-focused to Executive.
- Keep tone polished, professional, and authentic.
- Return ONLY valid JSON in this exact structure:
{
  "options": [
    "Option 1 text...",
    "Option 2 text...",
    "Option 3 text..."
  ],
  "tip": "Short expert tip on why these changes increase recruiter impact"
}`;
    } else if (action === "generate_summary") {
      prompt = `You are an elite career consultant. Write a high-impact, professional 3-4 sentence resume summary statement for a candidate.

Target Job Title: ${jobTitle || "Software Engineer / Professional"}
Candidate Details / Notes: "${context || text || ""}"

Requirements:
- Strong opening highlighting expertise, key strengths, and track record.
- Highlight technical/core competencies and measurable value delivered.
- Professional, confident, active tone without fluff or overused buzzwords like "hardworking team player".
- Return ONLY valid JSON in this exact structure:
{
  "summary": "Generated summary text...",
  "keyHighlights": ["Highlight 1", "Highlight 2"]
}`;
    } else if (action === "suggest_skills") {
      prompt = `You are a tech recruiter & career counselor. Suggest the top 12-15 in-demand technical, tool, and soft skills for a candidate applying for: "${jobTitle || "Software Engineer"}".

Current listed skills (if any): "${text || ""}"

Requirements:
- Categorize into Technical Skills, Frameworks & Libraries, Tools & Platforms, and Soft Skills.
- Return ONLY valid JSON in this exact structure:
{
  "recommendedSkills": [
    { "category": "Technical", "skills": ["Skill 1", "Skill 2", "Skill 3"] },
    { "category": "Frameworks & Libraries", "skills": ["Skill 1", "Skill 2"] },
    { "category": "Tools & Cloud", "skills": ["Skill 1", "Skill 2"] },
    { "category": "Soft Skills", "skills": ["Skill 1", "Skill 2"] }
  ]
}`;
    } else if (action === "fix_grammar") {
      prompt = `Fix all spelling, punctuation, tense consistency, and tone issues in the following resume text:
"${text || ""}"

Return ONLY valid JSON in this structure:
{
  "improvedText": "Corrected text...",
  "changesMade": "Brief summary of grammar fixes"
}`;
    } else if (action === "analyze_ats") {
      prompt = `You are an ATS (Applicant Tracking System) parser and senior recruiter auditing a candidate's resume draft.

Resume Data:
${JSON.stringify(resumeData || {}, null, 2)}

Target Job Role: ${jobTitle || resumeData?.personalInfo?.jobTitle || "Professional Role"}

Analyze the resume for:
1. ATS Compatibility Score (0 - 100)
2. Critical strengths
3. Missing industry keywords or sections
4. Specific actionable improvement recommendations

Return ONLY valid JSON in this exact structure:
{
  "score": 88,
  "verdict": "Great ATS Readiness / Strong Foundation",
  "strengths": ["Strength 1", "Strength 2"],
  "keywordGaps": ["Keyword 1", "Keyword 2"],
  "recommendations": [
    { "section": "Experience", "issue": "Missing metrics", "fix": "Quantify outcomes with percentages or dollar values." }
  ]
}`;
    } else {
      return res.status(400).json({ error: "Unsupported resume action." });
    }

    let aiResponseText = "";
    const ai = getGoogleGenAI();

    if (ai) {
      const resumeModels = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"];
      for (const rModel of resumeModels) {
        try {
          const response = await ai.models.generateContent({
            model: rModel,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          aiResponseText = response.text || "";
          if (aiResponseText) break;
        } catch (gemErr: any) {
          console.warn(`[Resume AI] Gemini model ${rModel} failed:`, gemErr?.message);
        }
      }
    }

    if (!aiResponseText) {
      const nvidiaKeys = getAvailableNvidiaKeys();
      for (const { name: keyName, key } of nvidiaKeys) {
        try {
          const nvidia = getNvidiaClientForKey(key);
          const comp = await nvidia.chat.completions.create({
            model: "meta/llama-3.2-11b-vision-instruct",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          aiResponseText = comp.choices[0]?.message?.content || "";
          if (aiResponseText) break;
        } catch (nErr: any) {
          console.warn(`[Resume AI] NVIDIA fallback failed with ${keyName}:`, nErr?.message);
        }
      }
    }

    if (aiResponseText) {
      try {
        const parsed = JSON.parse(aiResponseText);
        return res.json({ success: true, data: parsed });
      } catch (pErr) {
        return res.json({ success: true, raw: aiResponseText });
      }
    }

    // Default fallback response if no AI keys available
    if (action === "enhance_bullet") {
      return res.json({
        success: true,
        data: {
          options: [
            `Engineered high-performance systems for ${jobTitle || "core projects"}, optimizing execution efficiency by 35% and streamlining workflow delivery.`,
            `Spearheaded development of scalable features for ${text || "key initiatives"}, collaborating across cross-functional teams to boost throughput by 40%.`,
            `Architected and deployed robust automated solutions for ${text || "project deliverables"}, reducing manual operational overhead by 25+ hours weekly.`
          ],
          tip: "Action-oriented verbs paired with quantified percentages maximize ATS keyword relevance and recruiter retention."
        }
      });
    } else if (action === "generate_summary") {
      return res.json({
        success: true,
        data: {
          summary: `Results-driven ${jobTitle || "Professional"} with proven expertise in building scalable, production-ready solutions and leading cross-functional projects. Adept at transforming complex technical requirements into high-value business outcomes with a focus on quality, performance, and modern best practices.`,
          keyHighlights: ["Production-ready engineering", "Cross-functional leadership", "Workflow optimization"]
        }
      });
    } else if (action === "suggest_skills") {
      return res.json({
        success: true,
        data: {
          recommendedSkills: [
            { category: "Technical", skills: ["TypeScript", "System Architecture", "REST & GraphQL APIs", "Algorithms"] },
            { category: "Frameworks & Libraries", skills: ["React 18", "Node.js", "Express", "Tailwind CSS"] },
            { category: "Tools & Cloud", skills: ["Git / GitHub", "Docker", "CI/CD Pipelines", "AWS / GCP"] },
            { category: "Soft Skills", skills: ["Cross-functional Collaboration", "Agile / Scrum", "Technical Writing", "Problem Solving"] }
          ]
        }
      });
    } else if (action === "analyze_ats") {
      return res.json({
        success: true,
        data: {
          score: 85,
          verdict: "Strong Professional Structure",
          strengths: ["Clear contact info layout", "Well-categorized skills section", "Structured experience chronology"],
          keywordGaps: ["CI/CD", "Performance Metrics", "Cross-functional Leadership"],
          recommendations: [
            { section: "Experience", issue: "Bullet point metrics", fix: "Add specific percentages or numbers to experience bullets." },
            { section: "Projects", issue: "Tech Stack visibility", fix: "List specific libraries & frameworks used in each project." }
          ]
        }
      });
    } else {
      return res.json({ success: true, data: { improvedText: text } });
    }

  } catch (error: any) {
    console.error("[AstraMind Resume AI] Error:", error);
    res.status(500).json({ error: "Failed to process resume AI request." });
  }
});

// Helper for Profile Enhancer Multi-Provider JSON AI Execution
async function executeProfileEnhancerAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // 1. Try Gemini primary chain
  const ai = getGoogleGenAI();
  if (ai) {
    const geminiModels = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"];
    for (const model of geminiModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });
        if (response.text) return response.text;
      } catch (gemErr: any) {
        console.warn(`[Profile Enhancer AI] Gemini ${model} failed:`, gemErr?.message);
      }
    }
  }

  // 2. Fallback to configured NVIDIA keys in order
  const nvidiaKeys = getAvailableNvidiaKeys();
  for (const { name: keyName, key } of nvidiaKeys) {
    try {
      const nvidia = getNvidiaClientForKey(key);
      const comp = await nvidia.chat.completions.create({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      const text = comp.choices[0]?.message?.content;
      if (text) return text;
    } catch (nvErr: any) {
      console.warn(`[Profile Enhancer AI] NVIDIA key ${keyName} failed:`, nvErr?.message);
    }
  }

  throw new Error("All AI providers (Gemini and NVIDIA) failed to respond.");
}

// API: Profile Enhancer Full Analysis
app.post("/api/profile-enhancer/analyze", async (req, res) => {
  try {
    const { profile, careerGoal } = req.body || {};
    if (!profile) {
      return res.status(400).json({ error: "Profile information is required." });
    }

    const goal = careerGoal || profile.careerGoal || "Software Developer";

    const systemPrompt = `You are a Senior Technical Recruiter, Executive Career Strategist, and LinkedIn Profile Expert specializing in B.Tech students, freshers, internship seekers, and tech professionals.
You must analyze the provided candidate profile strictly based on the user's REAL background and optimize it for the target career goal: "${goal}".

CRITICAL ETHICAL RULES:
1. NEVER invent or fabricate skills, metrics, companies, CGPA/marks, coursework, hackathon placements, awards, or work experience that the user did not provide.
2. If the user has no internships/work experience (e.g. experience is empty or none), do NOT invent any job. Set "hasExperience": false, and instead generate 4-5 high-impact, actionable suggestions (Projects, Open Source, Hackathons, Certifications, Campus Activities) that will genuinely strengthen their profile for "${goal}".
3. Keep project descriptions professional, structured, and LinkedIn-ready. If no measurable metrics are supplied, do NOT create fake numbers.
4. Categorize the user's actual skills cleanly (programming, aiMl, webDev, database, cloud, tools, softSkills, other). Suggest recommended skills ONLY when genuinely relevant to "${goal}". Clearly separate "yourSkills" from "recommendedSkillsToLearn".
5. Return 3-5 distinct, professional LinkedIn headline options (e.g., "Degree/Role | Core Skills | What They Build/Interest").
6. The rewritten About section must be natural, professional, human-sounding, concise, in first-person where appropriate, and avoid generic AI buzzwords or hyperbolic claims.
7. Return an overall profile score (0-100) and sub-scores for headline, about, skills, projects, experience, education, achievements, keywords.

You MUST respond strictly with valid JSON matching this exact structure:
{
  "overallScore": number (0-100),
  "subScores": {
    "headline": number (0-100),
    "about": number (0-100),
    "skills": number (0-100),
    "projects": number (0-100),
    "experience": number (0-100),
    "education": number (0-100),
    "achievements": number (0-100),
    "keywords": number (0-100)
  },
  "sectionFeedback": [
    {
      "section": string ("Headline" | "About" | "Skills" | "Projects" | "Experience" | "Education" | "Achievements" | "Keywords"),
      "score": number (0-100),
      "issue": string (brief explanation of issue/weakness),
      "improvement": string (specific actionable improvement)
    }
  ],
  "headlines": [
    string (Option 1),
    string (Option 2),
    string (Option 3),
    string (Option 4)
  ],
  "enhancedAbout": {
    "original": string,
    "enhanced": string
  },
  "enhancedProjects": [
    {
      "originalTitle": string,
      "title": string,
      "problem": string,
      "solution": string,
      "technology": string,
      "keyFeatures": [string],
      "impact": string,
      "learningOutcome": string,
      "fullDescription": string
    }
  ],
  "skillsAnalysis": {
    "yourSkills": {
      "programming": [string],
      "aiMl": [string],
      "webDev": [string],
      "database": [string],
      "cloud": [string],
      "tools": [string],
      "softSkills": [string],
      "other": [string]
    },
    "recommendedSkillsToLearn": [
      {
        "skill": string,
        "category": string,
        "reason": string
      }
    ]
  },
  "keywords": {
    "existing": [string],
    "missing": [string],
    "placementAdvice": [
      {
        "keyword": string,
        "whereToUse": string ("Headline" | "About" | "Projects" | "Skills"),
        "tip": string
      }
    ]
  },
  "enhancedExperience": {
    "hasExperience": boolean,
    "items": [
      {
        "role": string,
        "company": string,
        "bulletPoints": [string]
      }
    ],
    "suggestionsForNoExperience": [string]
  },
  "enhancedEducation": {
    "original": string,
    "enhanced": string
  },
  "enhancedAchievements": {
    "original": string,
    "enhancedList": [string]
  },
  "checklist": [
    {
      "id": string ("photo" | "headline" | "about" | "skills" | "projects" | "experience" | "education" | "certifications" | "featured" | "github" | "portfolio" | "contact" | "activity"),
      "label": string,
      "completed": boolean,
      "note": string
    }
  ],
  "top5Improvements": [
    string, string, string, string, string
  ],
  "missingInfoWarnings": [
    string
  ]
}`;

    const userPrompt = `Analyze and optimize this candidate's profile for the career goal: "${goal}".
Profile Data:
${JSON.stringify(profile, null, 2)}

Provide a thorough, realistic evaluation and produce the JSON analysis following all constraints.`;

    const aiResponseText = await executeProfileEnhancerAI(systemPrompt, userPrompt);
    
    // Parse JSON cleanly, stripping any surrounding markdown code fences
    const cleanJson = aiResponseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanJson);

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("[Profile Enhancer API] Error in /analyze:", error);
    return res.status(500).json({
      error: "Profile analysis failed",
      message: error?.message || "AI providers could not process the profile request. Please try again.",
    });
  }
});

// API: Profile Enhancer Regenerate Specific Section
app.post("/api/profile-enhancer/regenerate-section", async (req, res) => {
  try {
    const { section, profile, careerGoal, variation } = req.body || {};
    if (!section || !profile) {
      return res.status(400).json({ error: "Section and profile data are required." });
    }

    const goal = careerGoal || profile.careerGoal || "Software Developer";
    const variationCount = Number(variation || 1);

    const systemPrompt = `You are an elite LinkedIn profile optimizer for B.Tech students and tech professionals.
You must regenerate ONLY the "${section}" section for a candidate targeting "${goal}".
Variation seed: #${variationCount}. Produce a fresh, distinctive, and high-impact rewrite that is completely different in tone, structure, or emphasis from prior attempts while strictly preserving the candidate's real, factual background.
NEVER invent false claims, fake metrics, or unearned credentials.

Respond strictly with valid JSON.`;

    let userPrompt = "";
    if (section === "headlines") {
      userPrompt = `Generate 4 brand new, highly compelling LinkedIn headline variations based on:
Candidate Background:
Name: ${profile.fullName}
Degree: ${profile.branchDegree} at ${profile.collegeUniversity}
Role: ${profile.currentRole}
Goal: ${goal}
Skills: ${profile.skills}
Projects: ${JSON.stringify(profile.projects || [])}
Achievements: ${profile.achievements || ""}

Format response as JSON:
{ "headlines": ["Headline 1", "Headline 2", "Headline 3", "Headline 4"] }`;
    } else if (section === "about") {
      userPrompt = `Generate an alternative, human-sounding, professional LinkedIn About summary for:
Candidate: ${profile.fullName} (${profile.branchDegree}, ${profile.collegeUniversity})
Current About: ${profile.linkedinAbout || "None provided"}
Target Goal: ${goal}
Skills: ${profile.skills}
Projects: ${JSON.stringify(profile.projects || [])}
Achievements: ${profile.achievements || ""}

Format response as JSON:
{ "enhancedAbout": { "original": ${JSON.stringify(profile.linkedinAbout || "")}, "enhanced": "New enhanced text here" } }`;
    } else if (section === "projects") {
      userPrompt = `Rewrite the project descriptions into concise, recruiter-friendly LinkedIn project highlights without inventing fake metrics:
Projects: ${JSON.stringify(profile.projects || [])}
Target Goal: ${goal}

Format response as JSON:
{
  "enhancedProjects": [
    {
      "originalTitle": "title",
      "title": "Clean Project Title",
      "problem": "Problem solved",
      "solution": "Technical solution implemented",
      "technology": "Tech stack",
      "keyFeatures": ["Key feature 1", "Key feature 2"],
      "impact": "Realistic impact / usability outcome",
      "learningOutcome": "Core engineering takeaway",
      "fullDescription": "Complete LinkedIn-ready project writeup"
    }
  ]
}`;
    } else if (section === "experience") {
      userPrompt = `Rewrite the candidate's internship/work experience into high-impact bullet points (Action + Tech + Result). If no experience exists, provide 4 constructive alternative actions.
Experience: ${JSON.stringify(profile.experience || [])}
Target Goal: ${goal}

Format response as JSON:
{
  "enhancedExperience": {
    "hasExperience": ${(profile.experience && profile.experience.length > 0) ? "true" : "false"},
    "items": [
      {
        "role": "Role Title",
        "company": "Company Name",
        "bulletPoints": ["Bullet 1", "Bullet 2"]
      }
    ],
    "suggestionsForNoExperience": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
  }
}`;
    } else if (section === "education") {
      userPrompt = `Rewrite the education section concisely for LinkedIn without inventing CGPAs or ranks:
Education: ${profile.education || ""}
College: ${profile.collegeUniversity || ""}
Degree: ${profile.branchDegree || ""}

Format response as JSON:
{
  "enhancedEducation": {
    "original": ${JSON.stringify(profile.education || "")},
    "enhanced": "Enhanced education description"
  }
}`;
    } else if (section === "achievements") {
      userPrompt = `Rewrite the candidate's achievements and hackathons into crisp, impressive LinkedIn accomplishment bullets:
Achievements: ${profile.achievements || ""}
Hackathons: ${profile.hackathons || ""}

Format response as JSON:
{
  "enhancedAchievements": {
    "original": ${JSON.stringify(profile.achievements || "")},
    "enhancedList": ["Achievement bullet 1", "Achievement bullet 2"]
  }
}`;
    } else {
      userPrompt = `Analyze and provide fresh recommendations for ${section} given profile: ${JSON.stringify(profile)}`;
    }

    const aiResponseText = await executeProfileEnhancerAI(systemPrompt, userPrompt);
    const cleanJson = aiResponseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanJson);

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error(`[Profile Enhancer API] Error in /regenerate-section (${req.body?.section}):`, error);
    return res.status(500).json({
      error: "Section regeneration failed",
      message: error?.message || "Failed to regenerate section. Please retry.",
    });
  }
});

// Helper for Academic Quiz Multi-Provider AI Execution (Gemini -> NVIDIA failover)
async function executeAcademicQuizAI(systemPrompt: string, userPrompt: string, jsonMode: boolean = true): Promise<string> {
  // 1. Try Gemini primary chain
  const ai = getGoogleGenAI();
  if (ai) {
    const geminiModels = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"];
    for (const model of geminiModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        });
        if (response.text) return response.text;
      } catch (gemErr: any) {
        console.warn(`[Academic Quiz AI] Gemini ${model} failed:`, gemErr?.message);
      }
    }
  }

  // 2. Fallback to configured NVIDIA keys in order
  const nvidiaKeys = getAvailableNvidiaKeys();
  for (const { name: keyName, key } of nvidiaKeys) {
    try {
      const nvidia = getNvidiaClientForKey(key);
      const comp = await nvidia.chat.completions.create({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        temperature: 0.3,
      });
      const text = comp.choices[0]?.message?.content;
      if (text) return text;
    } catch (nvErr: any) {
      console.warn(`[Academic Quiz AI] NVIDIA key ${keyName} failed:`, nvErr?.message);
    }
  }

  throw new Error("All AI providers (Gemini and NVIDIA) failed to respond.");
}

// API: Generate Academic Quiz MCQs
app.post("/api/academic-quiz/generate", async (req, res) => {
  try {
    const {
      college = "Vignan Institute of Technology and Science",
      branch = "Computer Science and Engineering (CSE)",
      year = "2nd Year",
      semester = "Semester II",
      subject,
      difficulty = "Mixed",
      numQuestions = 10,
      weakAreas,
    } = req.body || {};

    if (!subject) {
      return res.status(400).json({ error: "Academic subject is required." });
    }

    const count = Math.min(Math.max(Number(numQuestions) || 10, 5), 20);

    const systemPrompt = `You are a distinguished Senior Academic Professor and Examination Board Member at ${college} (VITS).
Your role is to formulate high-standard, technically rigorous Multiple Choice Questions (MCQs) for B.Tech engineering assessments.

ACADEMIC CONTEXT:
- Institution: ${college}
- Branch: ${branch}
- Academic Level: ${year}, ${semester}
- Subject: ${subject}
- Target Difficulty: ${difficulty}
- Total Questions Required: ${count}

PEDAGOGICAL & SYLLABUS ACCURACY RULES:
1. Every question must be genuinely relevant to the undergraduate syllabus for "${subject}" at the ${year}, ${semester} level.
2. DO NOT ask questions belonging to different subjects or branches.
3. DO NOT ask advanced post-graduate or 4th-year topics for a 1st or 2nd-year foundational course.
4. Each question must have 4 distinct options labeled "A", "B", "C", "D".
5. Exactly ONE option must be undeniably correct.
6. The "explanation" must clearly explain why the correct option is right and the underlying principle or calculation.
7. Include a "topic" field for each question denoting the specific sub-topic (e.g. "Recursion", "Virtual Memory", "Deadlocks", "Eigenvalues", "K-Maps", etc.) so that student weak areas can be tracked adaptively.

OUTPUT FORMAT:
Return strictly a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": {
        "A": "Option text A",
        "B": "Option text B",
        "C": "Option text C",
        "D": "Option text D"
      },
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why A is correct and the reasoning.",
      "topic": "Specific subtopic name"
    }
  ]
}`;

    let userPrompt = `Generate exactly ${count} Multiple Choice Questions for:
Institution: ${college}
Branch: ${branch}
Year: ${year}
Semester: ${semester}
Subject: ${subject}
Difficulty: ${difficulty}`;

    if (Array.isArray(weakAreas) && weakAreas.length > 0) {
      userPrompt += `\n\nADAPTIVE WEAK-AREAS EMPHASIS:\nThe student performed poorly on these specific topics during previous practice: ${weakAreas.join(", ")}. Prioritize testing these exact weak areas to help them master the concepts!`;
    }

    const aiResponseText = await executeAcademicQuizAI(systemPrompt, userPrompt, true);
    const cleanJson = aiResponseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("Invalid question format received from AI.");
    }

    return res.json({
      success: true,
      college,
      branch,
      year,
      semester,
      subject,
      questions: parsed.questions,
    });
  } catch (error: any) {
    console.error("[Academic Quiz API] Generation error:", error);
    return res.status(500).json({
      error: "Unable to generate the quiz right now. Please try again.",
      message: error?.message || "AI service is temporarily unavailable.",
    });
  }
});

// API: Academic AI Tutor Question Explainer ("Why is this answer correct?")
app.post("/api/academic-quiz/explain", async (req, res) => {
  try {
    const {
      college = "Vignan Institute of Technology and Science",
      branch = "Computer Science and Engineering (CSE)",
      subject = "Engineering Subject",
      question,
      options,
      correctAnswer,
      studentAnswer,
      query = "Why is this answer correct?",
    } = req.body || {};

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: "Question and correct answer are required." });
    }

    const systemPrompt = `You are an encouraging, expert Engineering Professor and Personal AI Tutor at ${college} (VITS).
A B.Tech engineering student in ${branch} studying ${subject} is asking for guidance on an MCQ.
Explain clearly, pedagogically, and concisely:
1. Why Option ${correctAnswer} is the correct answer and the fundamental concept behind it.
2. If the student selected Option ${studentAnswer || "another option"}, explain why that choice is incorrect or a common misconception.
3. Provide a quick tip or mnemonic to remember this concept for VITS university exams.
Keep the tone supportive, academic, and direct without robotic greetings.`;

    const userPrompt = `Subject: ${subject}
Question: ${question}
Options:
A) ${options?.A || ""}
B) ${options?.B || ""}
C) ${options?.C || ""}
D) ${options?.D || ""}
Correct Answer: Option ${correctAnswer}
Student's Chosen Answer: ${studentAnswer ? `Option ${studentAnswer}` : "Not answered yet"}
Student's Question/Doubt: "${query}"

Explain this clearly to help the student understand.`;

    const explanation = await executeAcademicQuizAI(systemPrompt, userPrompt, false);
    return res.json({ success: true, explanation: explanation.trim() });
  } catch (error: any) {
    console.error("[Academic Quiz API] Explain error:", error);
    return res.status(500).json({
      error: "Failed to generate explanation. Please retry.",
      message: error?.message || "AI tutor is temporarily busy.",
    });
  }
});


// PDF Generation Endpoint using Puppeteer


app.post('/api/export-pdf', async (req, res) => {
  try {
    const { html, filename } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'Missing html content' });
    }

    const browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true
    });
    
    const page = await browser.newPage();
    
    // Set viewport to roughly A4 size at standard DPI
    await page.setViewport({ width: 794, height: 1123 });
    
    // Set content and wait for network/fonts
    await page.setContent(html, { waitUntil: 'load' });
    
    // Apply print-specific styling internally for safety
    await page.addStyleTag({
      content: `
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'Resume.pdf'}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("PDF Export error:", err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ==========================================
// WORKSPACE AI ENDPOINTS (FULLY SOURCE-DRIVEN)
// ==========================================

function hasReadableStudySource(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 30;
}

const MISSING_STUDY_SOURCE_MESSAGE = "Upload a readable PDF, TXT, or Markdown document first. AI study tools require extracted text from user-provided material.";

// Public official-college syllabus discovery. The service blocks private hosts and cross-site redirects.
app.post("/api/college-syllabus/discover", async (req, res) => {
  try {
    const { college, officialWebsiteUrl, programType, branch, year, semester } = req.body || {};
    if (typeof college !== "string" || !college.trim()) {
      res.status(400).json({ error: "Enter the college or institution name." });
      return;
    }
    if (typeof officialWebsiteUrl !== "string" || !officialWebsiteUrl.trim()) {
      res.status(400).json({ error: "Enter the official HTTPS college website or syllabus page." });
      return;
    }
    const discovery = await discoverCollegeSyllabus({
      college,
      officialWebsiteUrl,
      programType,
      branch,
      year,
      semester,
    });
    res.json(discovery);
  } catch (err: any) {
    console.error("Official college syllabus discovery failed:", err);
    res.status(400).json({ error: err?.message || "Could not inspect that official college website." });
  }
});

app.post("/api/college-syllabus/import", async (req, res) => {
  try {
    const { college, officialWebsiteUrl, syllabusUrl, programType, branch, year, semester } = req.body || {};
    if (typeof college !== "string" || !college.trim() ||
        typeof officialWebsiteUrl !== "string" || !officialWebsiteUrl.trim() ||
        typeof syllabusUrl !== "string" || !syllabusUrl.trim()) {
      res.status(400).json({ error: "College name, official website, and a discovered syllabus PDF are required." });
      return;
    }

    const downloaded = await downloadOfficialSyllabusPdf({
      college,
      officialWebsiteUrl,
      syllabusUrl,
      programType,
      branch,
      year,
      semester,
    });
    const analyzed = await analyzeUploadedDocument({
      fileName: downloaded.fileName,
      fileType: "pdf",
      base64: downloaded.buffer.toString("base64"),
    });
    if (!hasReadableStudySource(analyzed.extractedText)) {
      res.status(422).json({
        error: "The official PDF was downloaded, but readable text could not be extracted. Open the official source, download the PDF, and upload a text-readable copy. Scanned/image-only PDFs are not yet supported for syllabus import.",
      });
      return;
    }
    res.json({
      success: true,
      college,
      officialWebsiteUrl,
      syllabusUrl: downloaded.url,
      fileName: downloaded.fileName,
      extractedText: analyzed.extractedText,
      profile: analyzed.profile,
    });
  } catch (err: any) {
    console.error("Official college syllabus import failed:", err);
    res.status(400).json({ error: err?.message || "Could not import the official syllabus PDF." });
  }
});

app.post("/api/workspace/analyze-document", async (req, res) => {
  try {
    const { fileName, fileType, base64, content } = req.body || {};
    if (!fileName && !content && !base64) {
      res.status(400).json({ error: "fileName or content is required" });
      return;
    }
    const result = await analyzeUploadedDocument({
      fileName: fileName || "Uploaded Document",
      fileType: fileType || "pdf",
      base64,
      content,
    });
    res.json(result);
  } catch (err: any) {
    console.error("Analyze document route error:", err);
    res.status(500).json({ error: err?.message || "Failed to analyze document" });
  }
});

app.post("/api/workspace/generate-lesson", async (req, res) => {
  try {
    const { subject, topic, extractedContent, materialSummary } = req.body || {};
    if (!subject) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!hasReadableStudySource(extractedContent)) {
      res.status(400).json({ error: MISSING_STUDY_SOURCE_MESSAGE });
      return;
    }
    const lesson = await generateGuidedLesson({
      subject,
      topic: topic || "Core Principles",
      extractedContent,
      materialSummary,
    });
    res.json(lesson);
  } catch (err: any) {
    console.error("Generate lesson route error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate lesson" });
  }
});

app.post("/api/workspace/generate-mcq", async (req, res) => {
  try {
    const { subject, topic, count, difficulty, questionType, extractedContent, materialsContext, hasCode, hasFormulas } = req.body || {};
    if (!subject) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!hasReadableStudySource(extractedContent)) {
      res.status(400).json({ error: MISSING_STUDY_SOURCE_MESSAGE });
      return;
    }
    const questions = await generateMCQQuiz({
      subject,
      topic: topic || "General Units",
      count: count || 5,
      difficulty: difficulty || "Medium",
      questionType,
      extractedContent,
      materialsContext,
      hasCode,
      hasFormulas,
    });
    res.json({ questions });
  } catch (err: any) {
    console.error("Generate MCQ route error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate MCQs" });
  }
});

app.post("/api/workspace/generate-flashcards", async (req, res) => {
  try {
    const { subject, topic, count, difficulty, extractedContent, materialsContext } = req.body || {};
    if (!subject) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!hasReadableStudySource(extractedContent)) {
      res.status(400).json({ error: MISSING_STUDY_SOURCE_MESSAGE });
      return;
    }
    const flashcards = await generateFlashcards({
      subject,
      topic,
      count: count || 10,
      difficulty: difficulty || "Medium",
      extractedContent,
      materialsContext,
    });
    res.json({ flashcards });
  } catch (err: any) {
    console.error("Generate flashcards route error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate flashcards" });
  }
});

app.post("/api/workspace/generate-important-questions", async (req, res) => {
  try {
    const { subject, branch, extractedContent, materialsContext } = req.body || {};
    if (!subject) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!hasReadableStudySource(extractedContent)) {
      res.status(400).json({ error: MISSING_STUDY_SOURCE_MESSAGE });
      return;
    }
    const questions = await generateImportantQuestions({
      subject,
      branch: branch || "Computer Science and Engineering (CSE)",
      extractedContent,
      materialsContext,
    });
    res.json({ questions });
  } catch (err: any) {
    console.error("Generate important questions route error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate questions" });
  }
});

app.post("/api/workspace/generate-summary-notes", async (req, res) => {
  try {
    const { subject, extractedContent } = req.body || {};
    if (!subject) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!hasReadableStudySource(extractedContent)) {
      res.status(400).json({ error: MISSING_STUDY_SOURCE_MESSAGE });
      return;
    }
    const notes = await generateSummaryNotes({
      subject,
      extractedContent,
    });
    res.json({ notes });
  } catch (err: any) {
    console.error("Generate summary notes route error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate summary notes" });
  }
});

app.post("/api/workspace/generate-practice", async (req, res) => {
  try {
    const { subject, topic, difficulty, extractedContent } = req.body || {};
    if (!subject) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!hasReadableStudySource(extractedContent)) {
      res.status(400).json({ error: MISSING_STUDY_SOURCE_MESSAGE });
      return;
    }
    const exercises = await generatePracticeExercises({
      subject,
      topic,
      difficulty: difficulty || "Medium",
      extractedContent,
    });
    res.json({ exercises });
  } catch (err: any) {
    console.error("Generate practice route error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate practice exercises" });
  }
});

app.post("/api/workspace/ai-tutor-chat", async (req, res) => {
  try {
    const { messages, subject, extractedContent, college, branch, learningGoal, studyContext } = req.body || {};
    if (!subject) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    if (!hasReadableStudySource(extractedContent)) {
      res.status(400).json({ error: MISSING_STUDY_SOURCE_MESSAGE });
      return;
    }
    const response = await chatWithAITutor({
      messages: messages || [],
      subject,
      extractedContent,
      college,
      branch,
      learningGoal,
      studyContext,
    });
    res.json(response);
  } catch (err: any) {
    console.error("AI Tutor chat route error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate AI tutor response" });
  }
});

// ==========================================
// VR25 KNOWLEDGE BASE RAG ENDPOINTS
// ==========================================

app.get("/api/knowledge-base/status", (req, res) => {
  try {
    const status = getKnowledgeBaseStatus();
    res.json(status);
  } catch (err: any) {
    console.error("Knowledge base status error:", err);
    res.status(500).json({ error: err.message || "Failed to get KB status" });
  }
});

app.get("/api/knowledge-base/documents", (req, res) => {
  try {
    const docs = getKnowledgeDocuments();
    res.json({ documents: docs });
  } catch (err: any) {
    console.error("Knowledge base documents error:", err);
    res.status(500).json({ error: err.message || "Failed to get KB documents" });
  }
});

app.get("/api/knowledge-base/chunks", (req, res) => {
  try {
    const subject = req.query.subject as string | undefined;
    const chunks = getKnowledgeChunks(subject);
    res.json({ chunks: chunks.slice(0, 100) });
  } catch (err: any) {
    console.error("Knowledge base chunks error:", err);
    res.status(500).json({ error: err.message || "Failed to get KB chunks" });
  }
});

app.post("/api/knowledge-base/sync", async (req, res) => {
  try {
    const status = await syncGoogleDriveRepository();
    res.json({ success: true, status });
  } catch (err: any) {
    console.error("Knowledge base sync error:", err);
    res.status(500).json({ error: err.message || "Failed to sync Google Drive repository" });
  }
});

app.post("/api/knowledge-base/query", async (req, res) => {
  try {
    const { query, studyContext, topK } = req.body || {};
    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }
    const results = await searchKnowledgeBase(query, studyContext, { topK });
    res.json(results);
  } catch (err: any) {
    console.error("Knowledge base query error:", err);
    res.status(500).json({ error: err.message || "Failed to search knowledge base" });
  }
});

// ==========================================
// ASTRAMIND PDF STUDY SUITE ENDPOINTS
// ==========================================

// Stream PDF directly from Google Drive backend without user redirect
app.get("/api/pdf-study/document-stream/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  if (!fileId || fileId.length < 5) {
    res.status(400).json({ error: "Invalid document ID" });
    return;
  }

  const driveUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;

  const makeRequest = (url: string, depth = 0) => {
    if (depth > 5) {
      res.status(502).json({ error: "Unable to load this PDF. Please check your document access or try again." });
      return;
    }

    https.get(url, (driveRes) => {
      if (driveRes.statusCode && driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
        makeRequest(driveRes.headers.location, depth + 1);
        return;
      }

      if (driveRes.statusCode && driveRes.statusCode >= 400) {
        res.status(502).json({ error: "Unable to load this PDF. Please check your document access or try again." });
        return;
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="document.pdf"');
      res.setHeader("Cache-Control", "public, max-age=86400");
      driveRes.pipe(res);
    }).on("error", (err) => {
      console.error("PDF stream error:", err);
      res.status(502).json({ error: "Unable to load this PDF. Please check your document access or try again." });
    });
  };

  makeRequest(driveUrl);
});

app.post("/api/pdf-study/chat", async (req, res) => {
  try {
    const { pdfTitle, pdfContent, messages, chapterOrScope, pageRange } = req.body || {};
    if (!pdfTitle || typeof pdfContent !== "string" || pdfContent.trim().length < 30) {
      res.status(400).json({ error: "Upload a readable PDF first. PDF Study tools require at least 30 characters of text extracted from the uploaded document." });
      return;
    }
    const response = await chatWithPdf({
      pdfTitle,
      pdfContent,
      messages: messages || [],
      chapterOrScope,
      pageRange,
    });
    res.json(response);
  } catch (err: any) {
    console.error("PDF Study chat error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate PDF response" });
  }
});

app.post("/api/pdf-study/summarize", async (req, res) => {
  try {
    const { pdfTitle, pdfContent, summaryType, chapterOrScope } = req.body || {};
    if (!pdfTitle || typeof pdfContent !== "string" || pdfContent.trim().length < 30) {
      res.status(400).json({ error: "Upload a readable PDF first. PDF Study tools require at least 30 characters of text extracted from the uploaded document." });
      return;
    }
    const summary = await summarizePdf({
      pdfTitle,
      pdfContent,
      summaryType: summaryType || "entire",
      chapterOrScope,
    });
    res.json(summary);
  } catch (err: any) {
    console.error("PDF Study summarize error:", err);
    res.status(500).json({ error: err?.message || "Failed to summarize PDF" });
  }
});

app.post("/api/pdf-study/generate-notes", async (req, res) => {
  try {
    const { pdfTitle, pdfContent, topic, chapter } = req.body || {};
    if (!pdfTitle || typeof pdfContent !== "string" || pdfContent.trim().length < 30) {
      res.status(400).json({ error: "Upload a readable PDF first. PDF Study tools require at least 30 characters of text extracted from the uploaded document." });
      return;
    }
    const notes = await generatePdfNotes({
      pdfTitle,
      pdfContent,
      topic,
      chapter,
    });
    res.json(notes);
  } catch (err: any) {
    console.error("PDF Study generate notes error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate notes" });
  }
});

app.post("/api/pdf-study/generate-flashcards", async (req, res) => {
  try {
    const { pdfTitle, pdfContent, count, scope, scopeDetail, difficulty } = req.body || {};
    if (!pdfTitle || typeof pdfContent !== "string" || pdfContent.trim().length < 30) {
      res.status(400).json({ error: "Upload a readable PDF first. PDF Study tools require at least 30 characters of text extracted from the uploaded document." });
      return;
    }
    const validCount = [5, 10, 20, 30, 50].includes(Number(count)) ? Number(count) : 10;
    const cards = await generatePdfFlashcards({
      pdfTitle,
      pdfContent,
      count: validCount,
      scope,
      scopeDetail,
      difficulty,
    });
    res.json({ cards });
  } catch (err: any) {
    console.error("PDF Study generate flashcards error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate flashcards" });
  }
});

app.post("/api/pdf-study/generate-questions", async (req, res) => {
  try {
    const { pdfTitle, pdfContent, questionTypes, count, difficulty, topic } = req.body || {};
    if (!pdfTitle || typeof pdfContent !== "string" || pdfContent.trim().length < 30) {
      res.status(400).json({ error: "Upload a readable PDF first. PDF Study tools require at least 30 characters of text extracted from the uploaded document." });
      return;
    }
    const types = Array.isArray(questionTypes) && questionTypes.length > 0 
      ? questionTypes 
      : ["mcq", "short", "long", "fill-blanks", "true-false"];
    const validCount = Number(count) || 5;
    const questions = await generatePdfQuestions({
      pdfTitle,
      pdfContent,
      questionTypes: types,
      count: validCount,
      difficulty: difficulty || "Medium",
      topic,
    });
    res.json({ questions });
  } catch (err: any) {
    console.error("PDF Study generate questions error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate questions" });
  }
});

app.post("/api/pdf-study/explain-topic", async (req, res) => {
  try {
    const { pdfTitle, pdfContent, topic, depth } = req.body || {};
    if (!pdfTitle || typeof pdfContent !== "string" || pdfContent.trim().length < 30 || !topic) {
      res.status(400).json({ error: "Upload a readable PDF first, and provide a topic to explain." });
      return;
    }
    const explanation = await explainPdfTopic({
      pdfTitle,
      pdfContent,
      topic,
      depth,
    });
    res.json(explanation);
  } catch (err: any) {
    console.error("PDF Study explain topic error:", err);
    res.status(500).json({ error: err?.message || "Failed to explain topic" });
  }
});

app.post("/api/pdf-study/important-topics", async (req, res) => {
  try {
    const { pdfTitle, pdfContent, subject } = req.body || {};
    if (!pdfTitle || typeof pdfContent !== "string" || pdfContent.trim().length < 30) {
      res.status(400).json({ error: "Upload a readable PDF first. PDF Study tools require at least 30 characters of text extracted from the uploaded document." });
      return;
    }
    const topics = await findImportantPdfTopics({
      pdfTitle,
      pdfContent,
      subject,
    });
    res.json({ topics });
  } catch (err: any) {
    console.error("PDF Study important topics error:", err);
    res.status(500).json({ error: err?.message || "Failed to find important topics" });
  }
});

// ==========================================
// LIVE QUIZ REST API ENDPOINTS
// ==========================================

let serverSupabaseClient: any = null;
function getServerSupabase() {
  if (!serverSupabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      serverSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return serverSupabaseClient;
}

async function getAuthenticatedUserFromReq(req: express.Request): Promise<{ id: string; email?: string; name?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  try {
    const client = getServerSupabase();
    if (!client) return null;
    const { data, error } = await client.auth.getUser(token);
    if (data?.user && !error) {
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Student",
      };
    }
  } catch (err) {
    console.error("Error verifying Supabase user token:", err);
  }
  return null;
}

// =========================================================================
// EXCLUSIVE ADMINISTRATOR AUTHORIZATION & STUDENT MANAGEMENT
// Strict access control: ONLY ravicharan.7878@gmail.com is authorized.
// Validates callers using Supabase's trusted getUser(token) verification.
// =========================================================================

const AUTHORIZED_ADMIN_EMAIL = "ravicharan.7878@gmail.com".toLowerCase();

function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL;
}

async function verifyAdminRequest(
  req: express.Request,
  res: express.Response
): Promise<{ id: string; email: string; name?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in as administrator.",
    });
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: "Authentication token missing.",
    });
    return null;
  }

  const client = getServerSupabase();
  if (!client) {
    res.status(500).json({
      success: false,
      error: "Authentication service not configured on server.",
    });
    return null;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired session. Please sign in again.",
    });
    return null;
  }

  const verifiedEmail = data.user.email || "";
  if (!isAuthorizedAdminEmail(verifiedEmail)) {
    res.status(403).json({
      success: false,
      error: "Access denied. Only ravicharan.7878@gmail.com is authorized as administrator.",
    });
    return null;
  }

  return {
    id: data.user.id,
    email: verifiedEmail,
    name:
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      verifiedEmail.split("@")[0] ||
      "Administrator",
  };
}

const STUDENTS_FILE_PATH = path.join(process.cwd(), "data", "admin_students.json");

function getStoredStudents(): any[] {
  try {
    if (fs.existsSync(STUDENTS_FILE_PATH)) {
      const content = fs.readFileSync(STUDENTS_FILE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading admin_students.json:", err);
  }
  return [];
}

function saveStoredStudents(students: any[]) {
  try {
    const dir = path.dirname(STUDENTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STUDENTS_FILE_PATH, JSON.stringify(students, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving admin_students.json:", err);
  }
}

// 1. Verify caller admin status
app.get("/api/admin/check", async (req, res) => {
  const admin = await verifyAdminRequest(req, res);
  if (!admin) return;
  res.json({
    success: true,
    isAdmin: true,
    email: admin.email,
    adminName: admin.name,
  });
});

// 2. Get students roster with filtering and statistics (Protected)
app.get("/api/admin/students", async (req, res) => {
  const admin = await verifyAdminRequest(req, res);
  if (!admin) return;

  try {
    let students = getStoredStudents();

    // Query Profiles from Supabase and integrate any new profiles
    try {
      const client = getServerSupabase();
      if (client) {
        const { data: dbProfiles } = await client.from("Profiles").select("*");
        if (dbProfiles && Array.isArray(dbProfiles) && dbProfiles.length > 0) {
          for (const p of dbProfiles) {
            const exists = students.some((s) => s.id === p.id || s.roll_number === p.roll_number);
            if (!exists) {
              students.unshift({
                id: p.id,
                full_name: p.full_name || "",
                email: p.email || "",
                roll_number: p.roll_number || "",
                branch: p.branch || "",
                section: p.section || "",
                hall_ticket_number: p.hall_ticket_number || "",
                avatar_url: p.avatar_url || "",
                status: p.status || "Active",
                attendance_percentage: typeof p.attendance_percentage === "number" && Number.isFinite(p.attendance_percentage)
                  ? p.attendance_percentage
                  : null,
                cgpa: p.cgpa === undefined || p.cgpa === null ? "" : String(p.cgpa),
                year: p.year || "",
                created_at: p.created_at || "",
              });
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn("Notice: could not query Profiles in admin/students:", dbErr);
    }

    // Optional query filtering
    const search = ((req.query.search as string) || "").toLowerCase().trim();
    const branch = ((req.query.branch as string) || "").toUpperCase().trim();
    const section = ((req.query.section as string) || "").toUpperCase().trim();
    const status = ((req.query.status as string) || "").trim();

    let filtered = students;
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.roll_number?.toLowerCase().includes(search) ||
          s.hall_ticket_number?.toLowerCase().includes(search)
      );
    }
    if (branch && branch !== "ALL") {
      filtered = filtered.filter((s) => s.branch?.toUpperCase() === branch);
    }
    if (section && section !== "ALL") {
      filtered = filtered.filter((s) => s.section?.toUpperCase() === section);
    }
    if (status && status !== "ALL") {
      filtered = filtered.filter((s) => s.status === status);
    }

    res.json({
      success: true,
      students: filtered,
      totalCount: students.length,
      filteredCount: filtered.length,
    });
  } catch (err: any) {
    console.error("Failed to retrieve students:", err);
    res.status(500).json({ success: false, error: "Failed to retrieve student records." });
  }
});

// 3. Add student record (Protected)
app.post("/api/admin/students", async (req, res) => {
  const admin = await verifyAdminRequest(req, res);
  if (!admin) return;

  try {
    const {
      full_name,
      email,
      roll_number,
      branch,
      section,
      hall_ticket_number,
      status,
      attendance_percentage,
      cgpa,
      year,
    } = req.body;

    if (!full_name || !roll_number || !email) {
      res.status(400).json({
        success: false,
        error: "Full name, email, and roll number are required.",
      });
      return;
    }

    const students = getStoredStudents();
    const cleanRoll = roll_number.trim().toUpperCase();

    // Check for duplicate roll number
    const existing = students.find((s) => s.roll_number === cleanRoll);
    if (existing) {
      res.status(409).json({
        success: false,
        error: `A student with roll number ${cleanRoll} is already registered.`,
      });
      return;
    }

    const attendanceValue =
      attendance_percentage === "" || attendance_percentage === null || attendance_percentage === undefined
        ? null
        : Number(attendance_percentage);
    const newStudent = {
      id: "std-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 7),
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      roll_number: cleanRoll,
      branch: typeof branch === "string" ? branch.trim() : "",
      section: typeof section === "string" ? section.trim() : "",
      hall_ticket_number: (hall_ticket_number || "").trim().toUpperCase(),
      status: status || "Active",
      attendance_percentage: typeof attendanceValue === "number" && Number.isFinite(attendanceValue) && attendanceValue >= 0 && attendanceValue <= 100
        ? attendanceValue
        : null,
      cgpa: typeof cgpa === "string" ? cgpa.trim() : "",
      year: typeof year === "string" ? year.trim() : "",
      created_at: new Date().toISOString(),
    };

    students.unshift(newStudent);
    saveStoredStudents(students);

    res.status(201).json({
      success: true,
      student: newStudent,
    });
  } catch (err: any) {
    console.error("Failed to enroll student:", err);
    res.status(500).json({ success: false, error: "Failed to enroll student." });
  }
});

// 4. Update student record (Protected)
app.put("/api/admin/students/:id", async (req, res) => {
  const admin = await verifyAdminRequest(req, res);
  if (!admin) return;

  try {
    const studentId = req.params.id;
    const updates = req.body;
    const students = getStoredStudents();
    const index = students.findIndex((s) => s.id === studentId);

    if (index === -1) {
      res.status(404).json({ success: false, error: "Student record not found." });
      return;
    }

    const existing = students[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      created_at: existing.created_at,
      roll_number: updates.roll_number ? updates.roll_number.trim().toUpperCase() : existing.roll_number,
      hall_ticket_number: updates.hall_ticket_number !== undefined
        ? updates.hall_ticket_number.trim().toUpperCase()
        : existing.hall_ticket_number,
      updated_at: new Date().toISOString(),
    };

    students[index] = updated;
    saveStoredStudents(students);

    res.json({
      success: true,
      student: updated,
    });
  } catch (err: any) {
    console.error("Failed to update student:", err);
    res.status(500).json({ success: false, error: "Failed to update student record." });
  }
});

// 5. Delete student record (Protected)
app.delete("/api/admin/students/:id", async (req, res) => {
  const admin = await verifyAdminRequest(req, res);
  if (!admin) return;

  try {
    const studentId = req.params.id;
    const students = getStoredStudents();
    const index = students.findIndex((s) => s.id === studentId);

    if (index === -1) {
      res.status(404).json({ success: false, error: "Student record not found." });
      return;
    }

    students.splice(index, 1);
    saveStoredStudents(students);

    res.json({
      success: true,
      message: "Student record removed successfully.",
    });
  } catch (err: any) {
    console.error("Failed to delete student:", err);
    res.status(500).json({ success: false, error: "Failed to delete student record." });
  }
});

// 6. Admin Statistics Overview (Protected)
app.get("/api/admin/stats", async (req, res) => {
  const admin = await verifyAdminRequest(req, res);
  if (!admin) return;

  try {
    const students = getStoredStudents();
    const total = students.length;
    const active = students.filter((s) => s.status === "Active").length;
    const pending = students.filter((s) => s.status === "Pending").length;
    const branches: Record<string, number> = {};

    let totalAttendance = 0;
    for (const s of students) {
      branches[s.branch] = (branches[s.branch] || 0) + 1;
      totalAttendance += Number(s.attendance_percentage) || 0;
    }

    const avgAttendance = total > 0 ? Math.round(totalAttendance / total) : 0;

    res.json({
      success: true,
      stats: {
        total,
        active,
        pending,
        avgAttendance,
        branches,
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to load admin stats." });
  }
});

// Get user academic quiz history (created quizzes, participated quizzes, recent results)
app.get("/api/live-quiz/history", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to enter Live Quiz." });
      return;
    }
    const history = getUserQuizHistory(user.id);
    res.json({ success: true, ...history });
  } catch (err: any) {
    console.error("Get quiz history error:", err);
    res.status(500).json({ success: false, error: "Failed to load quiz history." });
  }
});

// Drafts: Save/Update Draft Quiz
app.post("/api/live-quiz/draft/save", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to save a quiz draft." });
      return;
    }
    const draftData = req.body || {};
    const saved = saveDraftQuiz(draftData, user.id);
    res.json({ success: true, draft: saved });
  } catch (err: any) {
    console.error("Save draft error:", err);
    res.status(500).json({ success: false, error: "Failed to save quiz draft." });
  }
});

// Drafts: List all drafts for authenticated host
app.get("/api/live-quiz/drafts", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to view quiz drafts." });
      return;
    }
    const drafts = getDraftsForUser(user.id);
    res.json({ success: true, drafts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to retrieve quiz drafts." });
  }
});

// Drafts: Get specific draft
app.get("/api/live-quiz/draft/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to view this draft." });
      return;
    }
    const draft = getDraftById(req.params.id, user.id);
    if (!draft) {
      res.status(404).json({ success: false, error: "Draft not found." });
      return;
    }
    res.json({ success: true, draft });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to retrieve draft." });
  }
});

// Drafts: Delete draft
app.delete("/api/live-quiz/draft/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to delete this draft." });
      return;
    }
    const deleted = deleteDraft(req.params.id, user.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to delete draft." });
  }
});

// Duplicate quiz or draft
app.post("/api/live-quiz/quiz/:id/duplicate", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to duplicate assessments." });
      return;
    }
    const result = duplicateQuizDraftOrRoom(req.params.id, user.id);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to duplicate assessment." });
  }
});

// Question Bank: Get user's saved question bank
app.get("/api/live-quiz/question-bank", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to access your question bank." });
      return;
    }
    const questions = getUserQuestionBank(user.id);
    res.json({ success: true, questions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to load question bank." });
  }
});

// Question Bank: Save questions to user's question bank
app.post("/api/live-quiz/question-bank", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to save questions to your question bank." });
      return;
    }
    const { questions } = req.body || {};
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: "Questions array is required." });
      return;
    }
    const result = saveQuestionsToUserBank(user.id, questions);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to save questions to question bank." });
  }
});

// Manual Grading of Student Short Answer by Host
app.post("/api/live-quiz/grade-answer", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in as host to evaluate answers." });
      return;
    }
    const { roomCode, participantId, questionIndex, marksAwarded } = req.body || {};
    if (!roomCode || !participantId || typeof questionIndex !== "number") {
      res.status(400).json({ success: false, error: "roomCode, participantId, and questionIndex are required." });
      return;
    }
    const result = manualGradeStudentAnswer({
      roomCode,
      participantId,
      questionIndex,
      marksAwarded: Number(marksAwarded) || 0,
      hostUserId: user.id,
    });
    if (!result.success) {
      const status = result.error?.includes("Unauthorized") ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to grade student answer." });
  }
});

app.post("/api/live-quiz/create", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to enter Live Quiz." });
      return;
    }

    const {
      quizId,
      title,
      college,
      regulation,
      branch,
      year,
      semester,
      subject,
      unit,
      topic,
      assessmentType,
      hostName,
      timePerQuestion,
      timerType,
      durationSeconds,
      marksPerCorrect,
      negativeMarks,
      questionOrder,
      explanationPolicy,
      difficulty,
      mode,
      questions
    } = req.body || {};

    if (!subject) {
      res.status(400).json({ success: false, error: "Subject is required" });
      return;
    }
    const room = createLiveQuizRoom({
      quizId,
      title: title || `${subject} Live Assessment`,
      college: college || "Vignan Institute of Science and Technology",
      regulation: regulation || "VR25",
      branch: branch || "Computer Science and Engineering (CSE)",
      year: year || "1st Year",
      semester: semester || "Semester I",
      subject,
      unit: unit || "",
      topic: topic || "",
      assessmentType: assessmentType || "Class Assessment",
      hostUserId: user.id,
      hostName: hostName || user.name || "Faculty / Host",
      timePerQuestion: Number(timePerQuestion) || 30,
      timerType: timerType || "per_question",
      durationSeconds: Number(durationSeconds) || 0,
      marksPerCorrect: Number(marksPerCorrect) ?? 1,
      negativeMarks: Number(negativeMarks) ?? 0,
      questionOrder: questionOrder || "fixed",
      explanationPolicy: explanationPolicy || "after_quiz",
      difficulty: difficulty || "Medium",
      mode: mode || "Classic",
      questions: Array.isArray(questions) ? questions : [],
    });
    res.json({
      success: true,
      roomCode: room.roomCode,
      room: getFullRoomForHost(room.roomCode),
    });
  } catch (err: any) {
    console.error("Create live quiz error:", err);
    res.status(500).json({ success: false, error: "Unable to join this quiz right now. Please try again." });
  }
});

app.post("/api/live-quiz/join", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to join the quiz." });
      return;
    }

    const { roomCode, displayName, rollNumber, branch, section } = req.body || {};
    if (!roomCode) {
      res.status(400).json({ success: false, error: "Room not found. Check the 6-character code." });
      return;
    }

    const result = joinLiveQuizRoom({
      roomCode,
      displayName: displayName || user.name || "Student",
      authenticatedUserId: user.id,
      rollNumber: rollNumber || "",
      branch: branch || "",
      section: section || "",
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    console.error("Join live quiz error:", err);
    res.status(500).json({ success: false, error: "Unable to join this quiz right now. Please try again." });
  }
});

app.get("/api/live-quiz/room/:code", async (req, res) => {
  try {
    const code = (req.params.code || "").trim().toUpperCase();
    if (code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
      res.status(404).json({ error: "Room not found. Check the 6-character code." });
      return;
    }

    const isHost = req.query.isHost === "true";
    const participantId = typeof req.query.participantId === "string" ? req.query.participantId : undefined;
    const user = await getAuthenticatedUserFromReq(req);

    if (isHost) {
      const fullRoom = getFullRoomForHost(code);
      if (!fullRoom) {
        res.status(404).json({ error: "Room not found. Check the 6-character code." });
        return;
      }
      if (user && fullRoom.hostUserId && fullRoom.hostUserId !== user.id) {
        res.status(403).json({ error: "Unauthorized: Only the host can manage this quiz." });
        return;
      }
      res.json({ room: fullRoom });
    } else {
      const sanitized = getSanitizedRoom(code, participantId);
      if (!sanitized) {
        res.status(404).json({ error: "Room not found. Check the 6-character code." });
        return;
      }
      res.json({ room: sanitized });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Unable to join this quiz right now. Please try again." });
  }
});

const handleQuizSubmitRequest = async (req: express.Request, res: express.Response) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to join the quiz." });
      return;
    }

    const { roomCode, participantId, questionIndex, selectedIndex, selectedOptionIndex, selectedIndices, selectedAnswer, textAnswer } = req.body || {};
    if (!roomCode || !participantId || typeof questionIndex !== "number") {
      res.status(400).json({ success: false, error: "Missing submission parameters" });
      return;
    }
    const result = submitLiveQuizAnswer({
      roomCode,
      participantId,
      authenticatedUserId: user.id,
      questionIndex,
      selectedIndex,
      selectedOptionIndex,
      selectedIndices,
      selectedAnswer,
      textAnswer,
    });
    if (!result.success) {
      const status = result.error?.includes("Unauthorized") ? 403 : 400;
      res.status(status).json(result);
      return;
    }

    // Persist to Supabase live_quiz_answers if configured
    try {
      const sb = getServerSupabase();
      if (sb) {
        const optionLabel = formatSelectedOptionLabel(
          { selectedIndex, selectedOptionIndex, selectedIndices, selectedAnswer },
          undefined
        );
        sb.from("live_quiz_answers").upsert([
          {
            room_id: (roomCode || "").trim().toUpperCase(),
            participant_id: participantId,
            user_id: user.id,
            question_index: questionIndex,
            selected_answer: {
              selectedIndex: selectedIndex ?? selectedOptionIndex,
              selectedIndices,
              selectedAnswer: selectedAnswer ?? selectedIndex ?? selectedOptionIndex,
              optionLabel,
            },
            is_correct: result.isCorrect,
            marks_awarded: result.marksAwarded,
            submitted_at: new Date().toISOString(),
          }
        ], { onConflict: "room_id,user_id,question_index" }).then(() => {}).catch(() => {});
      }
    } catch {
      // Non-blocking Supabase sync
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Unable to join this quiz right now. Please try again." });
  }
};

app.post("/api/live-quiz/submit", handleQuizSubmitRequest);
app.post("/api/live-quiz/submit-answer", handleQuizSubmitRequest);

// Chat: Get messages for a room
app.get("/api/live-quiz/chat/:roomCode", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to view chat messages." });
      return;
    }
    const roomCode = (req.params.roomCode || "").trim().toUpperCase();
    const result = getRoomChatMessages(roomCode, user.id);
    if (!result.success) {
      const status = result.error?.includes("Unauthorized") ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to load chat messages." });
  }
});

// Chat: Send message to a room
app.post("/api/live-quiz/chat/send", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to send a message." });
      return;
    }
    const { roomCode, message, displayName, quizId } = req.body || {};
    if (!roomCode || !message) {
      res.status(400).json({ success: false, error: "roomCode and message are required." });
      return;
    }
    const result = addRoomChatMessage({
      roomCode,
      userId: user.id,
      displayName: displayName || user.name || "Participant",
      message,
      quizId,
    });
    if (!result.success) {
      const status = result.error?.includes("Unauthorized") ? 403 : 400;
      res.status(status).json(result);
      return;
    }

    // Persist to Supabase live_quiz_chat_messages if configured
    try {
      const sb = getServerSupabase();
      if (sb && result.message) {
        sb.from("live_quiz_chat_messages").insert([{
          id: result.message.id.startsWith("msg_") ? undefined : result.message.id,
          quiz_id: result.message.quiz_id,
          room_code: result.message.room_code,
          user_id: user.id,
          display_name: result.message.display_name,
          message: result.message.message,
          created_at: result.message.created_at,
        }]).then(() => {}).catch(() => {});
      }
    } catch {
      // Non-blocking Supabase sync
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to send message." });
  }
});

app.post("/api/live-quiz/control", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in to enter Live Quiz." });
      return;
    }

    const { roomCode, action, participantId } = req.body || {};
    if (!roomCode || !action) {
      res.status(400).json({ success: false, error: "roomCode and action required" });
      return;
    }
    const result = handleRoomControl({
      roomCode,
      action,
      hostUserId: user.id,
      participantId,
    });
    if (!result.success) {
      const status = result.error?.includes("Unauthorized") ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to control room" });
  }
});

app.post("/api/live-quiz/remove-student", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromReq(req);
    if (!user) {
      res.status(401).json({ success: false, error: "Please sign in as host to remove a student." });
      return;
    }
    const { roomCode, participantId } = req.body || {};
    if (!roomCode || !participantId) {
      res.status(400).json({ success: false, error: "roomCode and participantId are required." });
      return;
    }
    const result = removeStudentFromQuizRoom({
      roomCode,
      participantId,
      hostUserId: user.id,
    });
    if (!result.success) {
      const status = result.error?.includes("Unauthorized") ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to remove student." });
  }
});

app.post("/api/live-quiz/generate-questions", async (req, res) => {
  try {
    const { subject, branch, count, difficulty, topic } = req.body || {};
    const questions = await generateAIQuestions({
      subject: subject || "Engineering Core",
      branch: branch || "CSE",
      count: Number(count) || 5,
      difficulty: difficulty || "Medium",
      topic,
    });
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to generate questions" });
  }
});

// Attendance Report Proxy API (College Portal Integration)
app.post("/api/attendance/report", async (req, res) => {
  try {
    const authUser = await getAuthenticatedUserFromReq(req);
    const { rollNumber, studentName, branch, year, section, fromDate, toDate } = req.body || {};

    const targetRoll = (rollNumber || "").trim().toUpperCase();
    if (!targetRoll) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid Roll Number to retrieve attendance.",
      });
      return;
    }

    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        error: "Please select both From Date and To Date.",
      });
      return;
    }

    const result = await fetchCollegeAttendanceReport({
      rollNumber: targetRoll,
      studentName: studentName || authUser?.name || "Student",
      branch: branch || "CSM",
      year: year ? String(year) : "1",
      section: section || "A",
      fromDate,
      toDate,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    console.error("Attendance API error:", err);
    res.status(500).json({
      success: false,
      error: "Unable to retrieve attendance report from the college portal right now. Please try again.",
    });
  }
});

// 4. Vite middleware Integration for single-page applications
async function bootstrap() {
  let server: Server;
  
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express in DEVELOPMENT mode with Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express in PRODUCTION mode serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Setup WebSocket for Live API and Live Quiz
  setupLiveQuizWebSocket(server);

  // Setup WebSocket for Live API
  const wss = new WebSocketServer({ server, path: '/live' });
  wss.on("connection", async (clientWs) => {
    try {
      const ai = getGoogleGenAI();
      if (!ai) {
        clientWs.send(JSON.stringify({ error: "Gemini API key is not configured" }));
        clientWs.close();
        return;
      }
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are AstraMind AI, an ultra-premium AI assistant. Have a polite, concise voice conversation.",
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch(e) {
           console.error("Live websocket parsing error:", e);
        }
      });
      
      clientWs.on("close", () => {
        // Handle cleanup if possible
      });
    } catch (e: any) {
      console.error("Failed to start Live session:", e);
      clientWs.close();
    }
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap fullstack server:", err);
});
