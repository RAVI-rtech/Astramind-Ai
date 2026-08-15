import puppeteer from 'puppeteer';
import express from "express";
import OpenAI from "openai";
import path from "path";
import dotenv from "dotenv";
import { createDefaultImageRouter } from "./server/imageRouter";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, GenerateVideosOperation } from "@google/genai";
import { WebSocketServer } from "ws";
import { Server } from "http";

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

function getNVIDIA(): OpenAI | null {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;
  if (!nvidiaInstance) {
    nvidiaInstance = new OpenAI({
      apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  return nvidiaInstance;
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
    const role = m.sender === "user" ? "user" : "assistant";
    let content = m.text || "";
    if (m.attachment?.name) {
      content += `\n[Attached file: ${m.attachment.name}]`;
    }
    result.push({ role, content });
  }
  return result;
}

// 1. API: Check Setup & Multi-Provider status
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
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
      res.write(`data: ${JSON.stringify({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // Format for Gemini
    const geminiContents = messages.map((m: any) => {
      const role = m.sender === "user" ? "user" : "model";
      const parts: any[] = [];
      if (m.attachment?.base64 && m.attachment?.type) {
        parts.push({
          inlineData: {
            mimeType: m.attachment.type,
            data: m.attachment.base64,
          },
        });
      }
      parts.push({ text: m.text || "" });
      return { role, parts };
    });

    // Format for OpenAI-compatible providers (NVIDIA)
    const openAiMessages = convertToOpenAIMessages(messages, systemInstruction);

    // Determine Provider Priority Chain
    // Default / Auto / Deep / Coding / Reasoning -> Priority 1: Gemini -> Priority 2: NVIDIA
    // Fast Questions ('light' / 'fast') -> Priority 1: NVIDIA -> Priority 2: Gemini
    let providerChain = ["gemini", "nvidia"];
    if (mode === "light" || mode === "fast" || mode === "fast_questions") {
      providerChain = ["nvidia", "gemini"];
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

    for (const provider of providerChain) {
      if (providerTriedCount > 0 && !providerSucceeded) {
        // Emit "Switching Intelligence..." event for less than 1 second to frontend
        res.write(`data: ${JSON.stringify({ providerSwitch: true, statusMessage: "Switching Intelligence..." })}\n\n`);
      }
      providerTriedCount++;

      // Handle simulated failure for testing
      if (simulatedFails.includes(provider) || simulatedFails.includes("all")) {
        console.log(`[Multi-Provider] Simulating failure for provider: ${provider}`);
        continue;
      }

      // Priority 1: Gemini API
      if (provider === "gemini") {
        const ai = getGoogleGenAI();
        if (!ai) {
          console.log("[Multi-Provider] Gemini API key not present. Falling over...");
          continue;
        }

        let geminiSuccess = false;
        // Attempt Gemini, with 1 retry on failure
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Multi-Provider] Attempting Gemini Stream (Attempt ${attempt}/2)...`);
            const responseStream = await ai.models.generateContentStream({
              model: "gemini-3.5-flash",
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
            console.error(`[Multi-Provider] Gemini stream attempt ${attempt} failed:`, error?.message || error);
            if (attempt === 1) {
              console.log("[Multi-Provider] Retrying Gemini once before failover...");
              await new Promise((r) => setTimeout(r, 300));
            }
          }
        }

        if (geminiSuccess) {
          break; // Successfully fulfilled by Gemini
        }
      }

      // Priority 2: NVIDIA API
      else if (provider === "nvidia") {
        const nvidia = getNVIDIA();
        if (!nvidia) {
          console.log("[Multi-Provider] NVIDIA API key not present. Falling over...");
          continue;
        }

        try {
          console.log("[Multi-Provider] Attempting NVIDIA Stream (meta/llama-3.3-70b-instruct)...");
          const stream = await nvidia.chat.completions.create({
            model: "meta/llama-3.3-70b-instruct",
            messages: openAiMessages,
            stream: true,
            temperature: 0.7,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          }
          providerSucceeded = true;
          break; // Successfully fulfilled by NVIDIA
        } catch (error: any) {
          console.error("[Multi-Provider] NVIDIA stream error:", error?.message || error);
        }
      }
    }

    if (!providerSucceeded) {
      console.log("[Multi-Provider] All AI providers unavailable. Returning friendly error.");
      res.write(`data: ${JSON.stringify({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("[Multi-Provider] Unexpected server error:", error);
    res.write(`data: ${JSON.stringify({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// 3. API: Standard (non-stream) Chat Completion with Multi-Provider Failover
app.post("/api/chat", async (req, res) => {
  const { messages, systemInstruction, useMapsGrounding, mode, simulateFailure } = req.body || {};

  try {
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "All AI providers are temporarily unavailable. Please try again in a few moments." });
      return;
    }

    const geminiContents = messages.map((m: any) => {
      const role = m.sender === "user" ? "user" : "model";
      const parts: any[] = [];
      if (m.attachment?.base64 && m.attachment?.type) {
        parts.push({
          inlineData: {
            mimeType: m.attachment.type,
            data: m.attachment.base64,
          },
        });
      }
      parts.push({ text: m.text || "" });
      return { role, parts };
    });

    const openAiMessages = convertToOpenAIMessages(messages, systemInstruction);

    let providerChain = ["gemini", "nvidia"];
    if (mode === "light" || mode === "fast" || mode === "fast_questions") {
      providerChain = ["nvidia", "gemini"];
    }

    let simulatedFails: string[] = [];
    if (typeof simulateFailure === "string") {
      simulatedFails = simulateFailure.toLowerCase().split(",").map((s) => s.trim());
    } else if (req.headers["x-simulate-failure"]) {
      simulatedFails = (req.headers["x-simulate-failure"] as string).toLowerCase().split(",").map((s) => s.trim());
    }

    for (const provider of providerChain) {
      if (simulatedFails.includes(provider) || simulatedFails.includes("all")) {
        continue;
      }

      if (provider === "gemini") {
        const ai = getGoogleGenAI();
        if (!ai) continue;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
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
            console.error(`[Multi-Provider] Gemini standard attempt ${attempt} error:`, error?.message);
            if (attempt === 1) await new Promise((r) => setTimeout(r, 300));
          }
        }
      } else if (provider === "nvidia") {
        const nvidia = getNVIDIA();
        if (!nvidia) continue;

        try {
          const response = await nvidia.chat.completions.create({
            model: "meta/llama-3.3-70b-instruct",
            messages: openAiMessages,
            temperature: 0.7,
          });

          const text = response.choices[0]?.message?.content;
          if (text) {
            res.json({ text, groundingChunks: null });
            return;
          }
        } catch (error: any) {
          console.error("[Multi-Provider] NVIDIA standard error:", error?.message);
        }
      }
    }

    res.status(503).json({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." });
  } catch (error: any) {
    res.status(503).json({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." });
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
    const providers = router.getProviders();
    res.json({
      available: providers.length > 0,
      models: providers.map((p) => p.name),
      message: "Modular Image Router operational with multiple configured providers."
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
          { prompt: prompt.trim(), style, aspectRatio, size, customModel },
          (statusText) => {
            res.write(`data: ${JSON.stringify({ type: "status", message: statusText })}\n\n`);
          }
        );

        res.write(`data: ${JSON.stringify({ type: "result", imageUrl: result.imageUrl, provider: result.providerId, model: result.modelUsed })}\n\n`);
        return res.end();
      } catch (routerErr: any) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Image generation is currently unavailable. Please try again later." })}\n\n`);
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
      });

      return res.json({
        imageUrl: result.imageUrl,
        provider: result.providerId,
        model: result.modelUsed,
        statusHistory: result.statusHistory,
      });
    } catch (routerErr: any) {
      return res.status(503).json({
        error: "Image generation is currently unavailable. Please try again later.",
      });
    }
  } catch (error: any) {
    console.error("[AstraMind Image Gen] Server error:", error);
    res.status(503).json({ error: "Image generation is currently unavailable. Please try again later." });
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
          { prompt: prompt.trim(), image },
          (statusText) => {
            res.write(`data: ${JSON.stringify({ type: "status", message: statusText })}\n\n`);
          }
        );

        res.write(`data: ${JSON.stringify({ type: "result", imageUrl: result.imageUrl, provider: result.providerId, model: result.modelUsed })}\n\n`);
        return res.end();
      } catch (routerErr: any) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Image generation is currently unavailable. Please try again later." })}\n\n`);
        return res.end();
      }
    }

    try {
      const result = await imageRouter.editImage({
        prompt: prompt.trim(),
        image,
      });

      return res.json({
        imageUrl: result.imageUrl,
        provider: result.providerId,
        model: result.modelUsed,
        statusHistory: result.statusHistory,
      });
    } catch (routerErr: any) {
      return res.status(503).json({
        error: "Image generation is currently unavailable. Please try again later.",
      });
    }
  } catch (error: any) {
    console.error("[AstraMind Image Edit] Server error:", error);
    res.status(503).json({ error: "Image generation is currently unavailable. Please try again later." });
  }
});

// API: Generate Video Start
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const ai = getGoogleGenAI();
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

    const nvidia = getNVIDIA();
    if (nvidia) {
      try {
        const response = await nvidia.chat.completions.create({
          model: "meta/llama-3.3-70b-instruct",
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
        console.warn("[AstraMind Resume AI] NVIDIA fallback failed:", nvidiaErr?.message);
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
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        aiResponseText = response.text || "";
      } catch (gemErr: any) {
        console.warn("[Resume AI] Gemini call failed, trying NVIDIA fallback:", gemErr?.message);
      }
    }

    if (!aiResponseText) {
      const nvidia = getNVIDIA();
      if (nvidia) {
        try {
          const comp = await nvidia.chat.completions.create({
            model: "meta/llama-3.3-70b-instruct",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          aiResponseText = comp.choices[0]?.message?.content || "";
        } catch (nErr) {
          console.warn("[Resume AI] NVIDIA fallback failed:", nErr);
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

  // Setup WebSocket for Live API
  const wss = new WebSocketServer({ server, path: '/live' });
  wss.on("connection", async (clientWs) => {
    try {
      const ai = getGoogleGenAI();
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
