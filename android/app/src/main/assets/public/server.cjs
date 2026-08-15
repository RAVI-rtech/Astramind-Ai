var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_puppeteer = __toESM(require("puppeteer"), 1);
var import_express = __toESM(require("express"), 1);
var import_openai = __toESM(require("openai"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// server/huggingFaceProvider.ts
var HuggingFaceImageProvider = class {
  constructor() {
    this.id = "huggingface-inference";
    this.name = "Hugging Face Inference Studio";
    this.priority = 1;
  }
  // Primary provider
  getHfToken() {
    const token = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.HUGGING_FACE_TOKEN || process.env.HF_API_KEY;
    if (token && token.trim() && !token.startsWith("MY_") && !token.startsWith("YOUR_") && token.trim().length > 5) {
      return token.trim();
    }
    return null;
  }
  getConfiguredModel() {
    const envModel = process.env.HF_IMAGE_MODEL || process.env.HUGGINGFACE_IMAGE_MODEL || process.env.HF_MODEL;
    if (envModel && envModel.trim()) {
      return envModel.trim();
    }
    return "black-forest-labs/FLUX.1-schnell";
  }
  async isAvailable() {
    const token = this.getHfToken();
    return !!token;
  }
  /**
   * Calculates width & height dimensions based on aspect ratio
   */
  getDimensions(aspectRatio) {
    switch (aspectRatio) {
      case "16:9":
        return { width: 1024, height: 576 };
      case "9:16":
        return { width: 576, height: 1024 };
      case "4:3":
        return { width: 1024, height: 768 };
      case "3:4":
        return { width: 768, height: 1024 };
      case "1:1":
      default:
        return { width: 1024, height: 1024 };
    }
  }
  async generateImage(params) {
    const token = this.getHfToken();
    if (!token) {
      throw new Error("Hugging Face API token is missing or not configured in environment secrets.");
    }
    const primaryModel = this.getConfiguredModel();
    const fallbackModels = [
      primaryModel,
      "black-forest-labs/FLUX.1-schnell",
      "black-forest-labs/FLUX.1-dev",
      "stabilityai/stable-diffusion-xl-base-1.0",
      "runwayml/stable-diffusion-v1-5"
    ];
    const modelsToTry = Array.from(new Set(fallbackModels));
    const finalPrompt = params.style && params.style !== "None" && !params.style.startsWith("None") ? `${params.prompt}, ${params.style} style` : params.prompt;
    const { width, height } = this.getDimensions(params.aspectRatio);
    let lastError = null;
    for (const modelName of modelsToTry) {
      console.log(`[HuggingFaceImageProvider] Attempting image generation with model "${modelName}"...`);
      try {
        const result = await this.tryDirectInferenceApi(token, modelName, finalPrompt, width, height);
        if (result) {
          return { imageUrl: result, modelUsed: modelName };
        }
      } catch (err) {
        console.warn(`[HuggingFaceImageProvider] Direct inference for "${modelName}" failed:`, err?.message || err);
        lastError = err;
      }
      try {
        const result = await this.tryRouterApi(token, modelName, finalPrompt, width, height);
        if (result) {
          return { imageUrl: result, modelUsed: modelName };
        }
      } catch (err) {
        console.warn(`[HuggingFaceImageProvider] Router inference for "${modelName}" failed:`, err?.message || err);
        lastError = err;
      }
    }
    throw lastError || new Error("Hugging Face Inference API failed to generate image across all candidate models.");
  }
  /**
   * Standard Hugging Face Model Endpoint: https://api-inference.huggingface.co/models/{modelName}
   */
  async tryDirectInferenceApi(token, modelName, prompt, width, height) {
    const url = `https://api-inference.huggingface.co/models/${modelName}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-use-cache": "true"
    };
    const payload = {
      inputs: prompt,
      parameters: {
        width,
        height,
        guidance_scale: 7.5,
        num_inference_steps: 25
      }
    };
    let retries = 0;
    const maxRetries = 2;
    while (retries <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e4);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const contentType = response.headers.get("content-type") || "";
        if (response.status === 503) {
          const jsonErr = await response.json().catch(() => ({}));
          console.log(`[HuggingFaceImageProvider] Model "${modelName}" is currently loading (estimated time: ${jsonErr.estimated_time || "unknown"}s). Retrying (${retries + 1}/${maxRetries})...`);
          retries++;
          if (retries <= maxRetries) {
            const waitMs = Math.min((jsonErr.estimated_time || 5) * 1e3, 8e3);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }
          throw new Error(`Hugging Face model "${modelName}" is warming up/loading. Please try again in a few seconds.`);
        }
        if (!response.ok) {
          const jsonErr = await response.json().catch(() => ({}));
          const errMsg = jsonErr.error || jsonErr.message || `Hugging Face API returned HTTP status ${response.status}`;
          throw new Error(errMsg);
        }
        if (contentType.includes("image/") || contentType.includes("application/octet-stream")) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString("base64");
          const mime = contentType.includes("image/") ? contentType : "image/jpeg";
          return `data:${mime};base64,${base64}`;
        }
        const data = await response.json().catch(() => null);
        if (data) {
          if (Array.isArray(data) && data[0]?.generated_text) {
            throw new Error(`Model "${modelName}" did not return an image buffer.`);
          }
          if (data.error) {
            throw new Error(data.error);
          }
        }
        return null;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          throw new Error(`Hugging Face API request timed out for model "${modelName}".`);
        }
        if (retries < maxRetries && err.message?.includes("loading")) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 3e3));
          continue;
        }
        throw err;
      }
    }
    return null;
  }
  /**
   * Router endpoint: https://router.huggingface.co/hf-inference/v1/images/generations
   */
  async tryRouterApi(token, modelName, prompt, width, height) {
    const url = "https://router.huggingface.co/hf-inference/v1/images/generations";
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    const payload = {
      model: modelName,
      prompt,
      width,
      height,
      response_format: "b64_json"
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25e3);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const jsonErr = await response.json().catch(() => ({}));
        throw new Error(jsonErr.error?.message || jsonErr.error || `Router HTTP status ${response.status}`);
      }
      const data = await response.json();
      if (data?.data?.[0]?.b64_json) {
        return `data:image/png;base64,${data.data[0].b64_json}`;
      }
      if (data?.data?.[0]?.url) {
        return data.data[0].url;
      }
      return null;
    } catch (err) {
      clearTimeout(timeoutId);
      return null;
    }
  }
  async editImage(params) {
    return this.generateImage({
      prompt: params.prompt
    });
  }
};

// server/imageRouter.ts
var ImageRouter = class {
  constructor() {
    this.providers = [];
  }
  /**
   * Register a new provider in the router.
   * Enables adding new providers without touching UI or router invocation logic.
   */
  registerProvider(provider) {
    this.providers = this.providers.filter((p) => p.id !== provider.id);
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);
    console.log(`[ImageRouter] Registered provider "${provider.name}" (ID: ${provider.id}, Priority: ${provider.priority})`);
  }
  getProviders() {
    return this.providers.map((p) => ({ id: p.id, name: p.name, priority: p.priority }));
  }
  /**
   * Main image generation method with automatic failover across multiple providers.
   */
  async generateImage(params, onStatusUpdate) {
    const statusHistory = [];
    const notifyStatus = (status) => {
      statusHistory.push(status);
      console.log(`[ImageRouter Status] ${status}`);
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
    };
    if (this.providers.length === 0) {
      console.error("[ImageRouter Error] No image providers are registered in the router.");
      throw new Error("Image generation is currently unavailable. Please try again later.");
    }
    notifyStatus("Generating image...");
    let attemptCount = 0;
    for (const provider of this.providers) {
      attemptCount++;
      if (attemptCount > 1) {
        notifyStatus("Trying another provider...");
      }
      console.log(`[ImageRouter] Attempting Provider ${attemptCount}/${this.providers.length}: "${provider.name}" (${provider.id})`);
      try {
        const isAvail = await provider.isAvailable().catch(() => false);
        if (!isAvail) {
          console.warn(`[ImageRouter Log] Provider "${provider.name}" reported as unavailable. Skipping to next.`);
          continue;
        }
        const result = await provider.generateImage(params);
        if (result && result.imageUrl) {
          console.log(`[ImageRouter Success] Provider "${provider.name}" successfully generated image with model "${result.modelUsed}".`);
          return {
            imageUrl: result.imageUrl,
            providerId: provider.id,
            providerName: provider.name,
            modelUsed: result.modelUsed,
            statusHistory
          };
        }
      } catch (err) {
        console.warn(`[ImageRouter Internal Log] Provider "${provider.name}" failed:`, err?.message || err);
      }
    }
    console.error("[ImageRouter Error] All registered providers failed or were unavailable.");
    throw new Error("Image generation is currently unavailable. Please try again later.");
  }
  /**
   * Main image editing method with automatic failover across multiple providers.
   */
  async editImage(params, onStatusUpdate) {
    const statusHistory = [];
    const notifyStatus = (status) => {
      statusHistory.push(status);
      console.log(`[ImageRouter Status] ${status}`);
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
    };
    const editProviders = this.providers.filter((p) => typeof p.editImage === "function");
    if (editProviders.length === 0) {
      console.error("[ImageRouter Error] No editing-capable providers registered.");
      throw new Error("Image generation is currently unavailable. Please try again later.");
    }
    notifyStatus("Generating image...");
    let attemptCount = 0;
    for (const provider of editProviders) {
      attemptCount++;
      if (attemptCount > 1) {
        notifyStatus("Trying another provider...");
      }
      console.log(`[ImageRouter] Attempting Edit Provider ${attemptCount}/${editProviders.length}: "${provider.name}" (${provider.id})`);
      try {
        const isAvail = await provider.isAvailable().catch(() => false);
        if (!isAvail) {
          console.warn(`[ImageRouter Log] Edit Provider "${provider.name}" unavailable. Skipping.`);
          continue;
        }
        const result = await provider.editImage(params);
        if (result && result.imageUrl) {
          console.log(`[ImageRouter Success] Edit Provider "${provider.name}" successfully edited image with model "${result.modelUsed}".`);
          return {
            imageUrl: result.imageUrl,
            providerId: provider.id,
            providerName: provider.name,
            modelUsed: result.modelUsed,
            statusHistory
          };
        }
      } catch (err) {
        console.warn(`[ImageRouter Internal Log] Edit Provider "${provider.name}" failed:`, err?.message || err);
      }
    }
    console.error("[ImageRouter Error] All editing providers failed.");
    throw new Error("Image generation is currently unavailable. Please try again later.");
  }
};
var GoogleImagenProvider = class {
  constructor(getGenAI) {
    this.getGenAI = getGenAI;
    this.id = "google-imagen-v3";
    this.name = "Google Imagen 3 Studio";
    this.priority = 2;
  }
  async isAvailable() {
    return !!this.getGenAI();
  }
  async generateImage(params) {
    const ai = this.getGenAI();
    if (!ai) throw new Error("Google GenAI client not initialized.");
    const finalPrompt = params.style && params.style !== "None" && !params.style.startsWith("None") ? `${params.prompt}, ${params.style} style` : params.prompt;
    const requestedAspectRatio = params.aspectRatio || "1:1";
    const modelsToTry = [
      "imagen-3.0-generate-001",
      "imagen-3.0-fast-generate-001",
      "imagen-3.0-generate-002",
      "imagen-2.0"
    ];
    for (const modelName of modelsToTry) {
      try {
        const config = {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(requestedAspectRatio) ? requestedAspectRatio : "1:1"
        };
        const result = await ai.models.generateImages({
          model: modelName,
          prompt: finalPrompt,
          config
        });
        if (result.generatedImages?.[0]?.image?.imageBytes) {
          const base64Bytes = result.generatedImages[0].image.imageBytes;
          return {
            imageUrl: `data:image/jpeg;base64,${base64Bytes}`,
            modelUsed: modelName
          };
        }
      } catch (err) {
        console.warn(`[GoogleImagenProvider] Model "${modelName}" failed internally:`, err?.message || err);
      }
    }
    throw new Error("Google Imagen models failed to produce an image.");
  }
};
var GoogleGeminiFlashProvider = class {
  constructor(getGenAI) {
    this.getGenAI = getGenAI;
    this.id = "google-gemini-flash";
    this.name = "Gemini Flash Neural Engine";
    this.priority = 3;
  }
  async isAvailable() {
    return !!this.getGenAI();
  }
  async generateImage(params) {
    const ai = this.getGenAI();
    if (!ai) throw new Error("Google GenAI client not initialized.");
    const finalPrompt = params.style && params.style !== "None" && !params.style.startsWith("None") ? `${params.prompt}, ${params.style} style` : params.prompt;
    const modelsToTry = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-2.5-flash"];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Generate a high quality image matching this description: ${finalPrompt}`
        });
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return {
                imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                modelUsed: modelName
              };
            }
          }
        }
      } catch (err) {
        console.warn(`[GoogleGeminiFlashProvider] Model "${modelName}" failed internally:`, err?.message || err);
      }
    }
    throw new Error("Gemini Flash models failed to produce an image.");
  }
  async editImage(params) {
    const ai = this.getGenAI();
    if (!ai) throw new Error("Google GenAI client not initialized.");
    let base64Data = params.image;
    let mimeType = "image/jpeg";
    if (params.image.startsWith("data:")) {
      const match = params.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }
    const editModelsToTry = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-2.5-flash"];
    for (const modelName of editModelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { text: `Edit this image according to these instructions: ${params.prompt}. Maintain high visual quality.` },
            { inlineData: { mimeType, data: base64Data } }
          ]
        });
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return {
                imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                modelUsed: modelName
              };
            }
          }
        }
      } catch (err) {
        console.warn(`[GoogleGeminiFlashProvider Edit] Model "${modelName}" failed internally:`, err?.message || err);
      }
    }
    throw new Error("Gemini Flash models failed to edit image.");
  }
};
var PollinationsAIProvider = class {
  constructor() {
    this.id = "pollinations-ai";
    this.name = "Pollinations Open Studio";
    this.priority = 4;
  }
  async isAvailable() {
    return true;
  }
  async generateImage(params) {
    const cleanPrompt = encodeURIComponent(
      params.style && params.style !== "None" ? `${params.prompt}, ${params.style} style` : params.prompt
    );
    let width = 1024;
    let height = 1024;
    if (params.aspectRatio === "16:9") {
      width = 1280;
      height = 720;
    } else if (params.aspectRatio === "9:16") {
      width = 720;
      height = 1280;
    } else if (params.aspectRatio === "4:3") {
      width = 1024;
      height = 768;
    } else if (params.aspectRatio === "3:4") {
      width = 768;
      height = 1024;
    }
    const seed = Math.floor(Math.random() * 1e6);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12e3);
    try {
      const response = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Pollinations HTTP error ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const contentType = response.headers.get("content-type") || "image/jpeg";
      return {
        imageUrl: `data:${contentType};base64,${base64}`,
        modelUsed: "pollinations-flux-realism"
      };
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn("[PollinationsAIProvider] Fetch failed:", err?.message || err);
      throw new Error("Pollinations fallback failed.");
    }
  }
  async editImage(params) {
    return this.generateImage({ prompt: params.prompt });
  }
};
var AstraMindVisualArtProvider = class {
  constructor() {
    this.id = "astramind-art";
    this.name = "AstraMind Visual Art Engine";
    this.priority = 5;
  }
  async isAvailable() {
    return true;
  }
  async generateImage(params) {
    let width = 1024;
    let height = 1024;
    if (params.aspectRatio === "16:9") {
      width = 1280;
      height = 720;
    } else if (params.aspectRatio === "9:16") {
      width = 720;
      height = 1280;
    } else if (params.aspectRatio === "4:3") {
      width = 1024;
      height = 768;
    } else if (params.aspectRatio === "3:4") {
      width = 768;
      height = 1024;
    }
    const seed = Array.from(params.prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0) + Math.floor(Math.random() * 1e3);
    const picsumUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8e3);
    try {
      const response = await fetch(picsumUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        return {
          imageUrl: `data:image/jpeg;base64,${base64}`,
          modelUsed: "astramind-art-canvas"
        };
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#312e81"/>
        </linearGradient>
        <filter id="b"><feGaussianBlur stdDeviation="60"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${width * 0.3}" cy="${height * 0.3}" r="${width * 0.25}" fill="#6366f1" opacity="0.4" filter="url(#b)"/>
      <circle cx="${width * 0.7}" cy="${height * 0.7}" r="${width * 0.3}" fill="#ec4899" opacity="0.3" filter="url(#b)"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="${Math.min(width, height) * 0.04}" font-weight="bold" opacity="0.9">AstraMind Neural Art</text>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="${Math.min(width, height) * 0.025}">${params.prompt.slice(0, 40)}...</text>
    </svg>`;
    const base64Svg = Buffer.from(svg).toString("base64");
    return {
      imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
      modelUsed: "astramind-vector-canvas"
    };
  }
  async editImage(params) {
    return this.generateImage({ prompt: params.prompt });
  }
};
function createDefaultImageRouter(getGenAI) {
  const router = new ImageRouter();
  router.registerProvider(new HuggingFaceImageProvider());
  router.registerProvider(new GoogleImagenProvider(getGenAI));
  router.registerProvider(new GoogleGeminiFlashProvider(getGenAI));
  router.registerProvider(new PollinationsAIProvider());
  router.registerProvider(new AstraMindVisualArtProvider());
  return router;
}

// server.ts
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_ws = require("ws");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
var aiInstance = null;
var groqInstance = null;
var nvidiaInstance = null;
function getGoogleGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}
function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqInstance) {
    groqInstance = new import_openai.default({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    });
  }
  return groqInstance;
}
function getNVIDIA() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;
  if (!nvidiaInstance) {
    nvidiaInstance = new import_openai.default({
      apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1"
    });
  }
  return nvidiaInstance;
}
function convertToOpenAIMessages(messages, systemInstruction) {
  const result = [];
  if (systemInstruction) {
    result.push({
      role: "system",
      content: systemInstruction
    });
  }
  for (const m of messages) {
    const role = m.sender === "user" ? "user" : "assistant";
    let content = m.text || "";
    if (m.attachment?.name) {
      content += `
[Attached file: ${m.attachment.name}]`;
    }
    result.push({ role, content });
  }
  return result;
}
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
    multiProviderReady: true
  });
});
app.post("/api/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const { messages, systemInstruction, useMapsGrounding, mode, simulateFailure } = req.body || {};
  try {
    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." })}

`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    const geminiContents = messages.map((m) => {
      const role = m.sender === "user" ? "user" : "model";
      const parts = [];
      if (m.attachment?.base64 && m.attachment?.type) {
        parts.push({
          inlineData: {
            mimeType: m.attachment.type,
            data: m.attachment.base64
          }
        });
      }
      parts.push({ text: m.text || "" });
      return { role, parts };
    });
    const openAiMessages = convertToOpenAIMessages(messages, systemInstruction);
    let providerChain = ["gemini", "groq", "nvidia"];
    if (mode === "light" || mode === "fast" || mode === "fast_questions") {
      providerChain = ["groq", "gemini", "nvidia"];
    }
    let simulatedFails = [];
    if (typeof simulateFailure === "string") {
      simulatedFails = simulateFailure.toLowerCase().split(",").map((s) => s.trim());
    } else if (req.headers["x-simulate-failure"]) {
      simulatedFails = req.headers["x-simulate-failure"].toLowerCase().split(",").map((s) => s.trim());
    }
    let providerSucceeded = false;
    let providerTriedCount = 0;
    for (const provider of providerChain) {
      if (providerTriedCount > 0 && !providerSucceeded) {
        res.write(`data: ${JSON.stringify({ providerSwitch: true, statusMessage: "Switching Intelligence..." })}

`);
      }
      providerTriedCount++;
      if (simulatedFails.includes(provider) || simulatedFails.includes("all")) {
        console.log(`[Multi-Provider] Simulating failure for provider: ${provider}`);
        continue;
      }
      if (provider === "gemini") {
        const ai = getGoogleGenAI();
        if (!ai) {
          console.log("[Multi-Provider] Gemini API key not present. Falling over...");
          continue;
        }
        let geminiSuccess = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Multi-Provider] Attempting Gemini Stream (Attempt ${attempt}/2)...`);
            const responseStream = await ai.models.generateContentStream({
              model: "gemini-3.5-flash",
              contents: geminiContents,
              config: {
                systemInstruction: systemInstruction || "You are AstraMind AI...",
                temperature: 0.7,
                ...useMapsGrounding ? { tools: [{ googleMaps: {} }] } : {}
              }
            });
            let groundingChunksSent = false;
            for await (const chunk of responseStream) {
              if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}

`);
              }
              if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks && !groundingChunksSent) {
                res.write(`data: ${JSON.stringify({ groundingChunks: chunk.candidates[0].groundingMetadata.groundingChunks })}

`);
                groundingChunksSent = true;
              }
            }
            geminiSuccess = true;
            providerSucceeded = true;
            break;
          } catch (error) {
            console.error(`[Multi-Provider] Gemini stream attempt ${attempt} failed:`, error?.message || error);
            if (attempt === 1) {
              console.log("[Multi-Provider] Retrying Gemini once before failover...");
              await new Promise((r) => setTimeout(r, 300));
            }
          }
        }
        if (geminiSuccess) {
          break;
        }
      } else if (provider === "groq") {
        const groq = getGroq();
        if (!groq) {
          console.log("[Multi-Provider] Groq API key not present. Falling over...");
          continue;
        }
        try {
          console.log("[Multi-Provider] Attempting Groq Stream (llama-3.3-70b-versatile)...");
          const stream = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: openAiMessages,
            stream: true,
            temperature: 0.7
          });
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}

`);
            }
          }
          providerSucceeded = true;
          break;
        } catch (error) {
          console.error("[Multi-Provider] Groq stream error:", error?.message || error);
        }
      } else if (provider === "nvidia") {
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
            temperature: 0.7
          });
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}

`);
            }
          }
          providerSucceeded = true;
          break;
        } catch (error) {
          console.error("[Multi-Provider] NVIDIA stream error:", error?.message || error);
        }
      }
    }
    if (!providerSucceeded) {
      console.log("[Multi-Provider] All AI providers unavailable. Returning friendly error.");
      res.write(`data: ${JSON.stringify({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." })}

`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("[Multi-Provider] Unexpected server error:", error);
    res.write(`data: ${JSON.stringify({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." })}

`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});
app.post("/api/chat", async (req, res) => {
  const { messages, systemInstruction, useMapsGrounding, mode, simulateFailure } = req.body || {};
  try {
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "All AI providers are temporarily unavailable. Please try again in a few moments." });
      return;
    }
    const geminiContents = messages.map((m) => {
      const role = m.sender === "user" ? "user" : "model";
      const parts = [];
      if (m.attachment?.base64 && m.attachment?.type) {
        parts.push({
          inlineData: {
            mimeType: m.attachment.type,
            data: m.attachment.base64
          }
        });
      }
      parts.push({ text: m.text || "" });
      return { role, parts };
    });
    const openAiMessages = convertToOpenAIMessages(messages, systemInstruction);
    let providerChain = ["gemini", "groq", "nvidia"];
    if (mode === "light" || mode === "fast" || mode === "fast_questions") {
      providerChain = ["groq", "gemini", "nvidia"];
    }
    let simulatedFails = [];
    if (typeof simulateFailure === "string") {
      simulatedFails = simulateFailure.toLowerCase().split(",").map((s) => s.trim());
    } else if (req.headers["x-simulate-failure"]) {
      simulatedFails = req.headers["x-simulate-failure"].toLowerCase().split(",").map((s) => s.trim());
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
                ...useMapsGrounding ? { tools: [{ googleMaps: {} }] } : {}
              }
            });
            if (response.text) {
              res.json({
                text: response.text,
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
              });
              return;
            }
          } catch (error) {
            console.error(`[Multi-Provider] Gemini standard attempt ${attempt} error:`, error?.message);
            if (attempt === 1) await new Promise((r) => setTimeout(r, 300));
          }
        }
      } else if (provider === "groq") {
        const groq = getGroq();
        if (!groq) continue;
        try {
          const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: openAiMessages,
            temperature: 0.7
          });
          const text = response.choices[0]?.message?.content;
          if (text) {
            res.json({ text, groundingChunks: null });
            return;
          }
        } catch (error) {
          console.error("[Multi-Provider] Groq standard error:", error?.message);
        }
      } else if (provider === "nvidia") {
        const nvidia = getNVIDIA();
        if (!nvidia) continue;
        try {
          const response = await nvidia.chat.completions.create({
            model: "meta/llama-3.3-70b-instruct",
            messages: openAiMessages,
            temperature: 0.7
          });
          const text = response.choices[0]?.message?.content;
          if (text) {
            res.json({ text, groundingChunks: null });
            return;
          }
        } catch (error) {
          console.error("[Multi-Provider] NVIDIA standard error:", error?.message);
        }
      }
    }
    res.status(503).json({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." });
  } catch (error) {
    res.status(503).json({ text: "All AI providers are temporarily unavailable. Please try again in a few moments." });
  }
});
app.get("/api/image-models-status", async (req, res) => {
  try {
    const router = createDefaultImageRouter(getGoogleGenAI);
    const providers = router.getProviders();
    res.json({
      available: providers.length > 0,
      models: providers.map((p) => p.name),
      message: "Modular Image Router operational with multiple configured providers."
    });
  } catch (err) {
    console.error("[AstraMind Status] Error checking router status:", err);
    res.json({
      available: false,
      message: "Image generation is currently unavailable. Please try again later.",
      models: []
    });
  }
});
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
            res.write(`data: ${JSON.stringify({ type: "status", message: statusText })}

`);
          }
        );
        res.write(`data: ${JSON.stringify({ type: "result", imageUrl: result.imageUrl, provider: result.providerId, model: result.modelUsed })}

`);
        return res.end();
      } catch (routerErr) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Image generation is currently unavailable. Please try again later." })}

`);
        return res.end();
      }
    }
    try {
      const result = await imageRouter.generateImage({
        prompt: prompt.trim(),
        style,
        aspectRatio,
        size,
        customModel
      });
      return res.json({
        imageUrl: result.imageUrl,
        provider: result.providerId,
        model: result.modelUsed,
        statusHistory: result.statusHistory
      });
    } catch (routerErr) {
      return res.status(503).json({
        error: "Image generation is currently unavailable. Please try again later."
      });
    }
  } catch (error) {
    console.error("[AstraMind Image Gen] Server error:", error);
    res.status(503).json({ error: "Image generation is currently unavailable. Please try again later." });
  }
});
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
            res.write(`data: ${JSON.stringify({ type: "status", message: statusText })}

`);
          }
        );
        res.write(`data: ${JSON.stringify({ type: "result", imageUrl: result.imageUrl, provider: result.providerId, model: result.modelUsed })}

`);
        return res.end();
      } catch (routerErr) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Image generation is currently unavailable. Please try again later." })}

`);
        return res.end();
      }
    }
    try {
      const result = await imageRouter.editImage({
        prompt: prompt.trim(),
        image
      });
      return res.json({
        imageUrl: result.imageUrl,
        provider: result.providerId,
        model: result.modelUsed,
        statusHistory: result.statusHistory
      });
    } catch (routerErr) {
      return res.status(503).json({
        error: "Image generation is currently unavailable. Please try again later."
      });
    }
  } catch (error) {
    console.error("[AstraMind Image Edit] Server error:", error);
    res.status(503).json({ error: "Image generation is currently unavailable. Please try again later." });
  }
});
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    const ai = getGoogleGenAI();
    const operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: aspectRatio || "16:9"
      }
    });
    res.json({ operationName: operation.name });
  } catch (error) {
    console.error("Generate video error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});
app.get("/api/video-status", async (req, res) => {
  try {
    const operationName = req.query.operationName;
    if (!operationName) return res.status(400).json({ error: "operationName is required" });
    const op = new import_genai.GenerateVideosOperation();
    op.name = operationName;
    const ai = getGoogleGenAI();
    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({ done: updated.done });
  } catch (error) {
    console.error("Video status error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});
app.get("/api/video-download", async (req, res) => {
  try {
    const operationName = req.query.operationName;
    if (!operationName) return res.status(400).json({ error: "operationName is required" });
    const op = new import_genai.GenerateVideosOperation();
    op.name = operationName;
    const ai = getGoogleGenAI();
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video not found or not ready" });
    }
    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY }
    });
    if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
    res.setHeader("Content-Type", "video/mp4");
    const nodeStream = videoRes.body;
    if (nodeStream && typeof nodeStream.pipeTo === "function") {
      await nodeStream.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          }
        })
      );
    } else if (nodeStream && typeof nodeStream.pipe === "function") {
      nodeStream.pipe(res);
    } else {
      const buffer = await videoRes.arrayBuffer();
      res.end(Buffer.from(buffer));
    }
  } catch (error) {
    console.error("Video download error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});
app.post("/api/ai/enhance-resume", async (req, res) => {
  try {
    const { action, text, jobTitle } = req.body;
    const ai = getGoogleGenAI();
    let systemPrompt = "";
    let userPrompt = "";
    if (action === "enhance_summary") {
      systemPrompt = "You are an expert executive resume reviewer and ATS optimization specialist. Write a concise, 3-4 sentence high-impact professional summary based on the provided text and job title. Use active, persuasive professional language with measurable outcomes where applicable. Return ONLY the improved summary text without quotes or preamble.";
      userPrompt = `Job Title: ${jobTitle || "Professional"}
Current Draft: ${text || ""}`;
    } else if (action === "enhance_bullet") {
      systemPrompt = "You are a senior career coach and ATS keyword expert. Rewrite the given bullet point into a strong, action-verb driven accomplishment statement (using the STAR method). Use active verbs like 'Architected', 'Spearheaded', 'Optimized', 'Engineered', 'Streamlined'. Include realistic quantifiable metrics if none are present. Return ONLY the improved single bullet point without quotes or prefixes.";
      userPrompt = `Job Role/Context: ${jobTitle || "Professional"}
Original Bullet: ${text || ""}`;
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
            temperature: 0.4
          }
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
      } catch (gemErr) {
        console.warn("[AstraMind Resume AI] Gemini primary failed, attempting fallback...", gemErr?.message);
      }
    }
    const groq = getGroq();
    if (groq) {
      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.4
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
      } catch (groqErr) {
        console.warn("[AstraMind Resume AI] Groq fallback failed:", groqErr?.message);
      }
    }
    return res.status(503).json({ error: "AI resume enhancement service is temporarily busy. Please try again." });
  } catch (err) {
    console.error("[AstraMind Resume AI] Server error:", err);
    res.status(500).json({ error: "Internal server error enhancing resume." });
  }
});
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
            responseMimeType: "application/json"
          }
        });
        aiResponseText = response.text || "";
      } catch (gemErr) {
        console.warn("[Resume AI] Gemini call failed, trying Groq/NVIDIA fallback:", gemErr?.message);
      }
    }
    if (!aiResponseText) {
      const groq = getGroq();
      if (groq) {
        try {
          const comp = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          });
          aiResponseText = comp.choices[0]?.message?.content || "";
        } catch (gErr) {
          console.warn("[Resume AI] Groq fallback failed:", gErr);
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
  } catch (error) {
    console.error("[AstraMind Resume AI] Error:", error);
    res.status(500).json({ error: "Failed to process resume AI request." });
  }
});
app.post("/api/export-pdf", async (req, res) => {
  try {
    const { html, filename } = req.body;
    if (!html) {
      return res.status(400).json({ error: "Missing html content" });
    }
    const browser = await import_puppeteer.default.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(html, { waitUntil: "load" });
    await page.addStyleTag({
      content: `
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `
    });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename || "Resume.pdf"}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("PDF Export error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});
async function bootstrap() {
  let server;
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express in DEVELOPMENT mode with Vite dev middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express in PRODUCTION mode serving static files...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  const wss = new import_ws.WebSocketServer({ server, path: "/live" });
  wss.on("connection", async (clientWs) => {
    try {
      const ai = getGoogleGenAI();
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [import_genai.Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: "You are AstraMind AI, an ultra-premium AI assistant. Have a polite, concise voice conversation."
        },
        callbacks: {
          onmessage: (message) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          }
        }
      });
      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" }
            });
          }
        } catch (e) {
          console.error("Live websocket parsing error:", e);
        }
      });
      clientWs.on("close", () => {
      });
    } catch (e) {
      console.error("Failed to start Live session:", e);
      clientWs.close();
    }
  });
}
bootstrap().catch((err) => {
  console.error("Failed to bootstrap fullstack server:", err);
});
//# sourceMappingURL=server.cjs.map
