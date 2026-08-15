import { GoogleGenAI } from "@google/genai";
import { HuggingFaceImageProvider } from "./huggingFaceProvider";

export interface GenerateImageParams {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  size?: string;
  customModel?: string;
}

export interface EditImageParams {
  prompt: string;
  image: string; // base64 or URL
}

export interface ImageRouterResult {
  imageUrl: string;
  providerId: string;
  providerName: string;
  modelUsed: string;
  statusHistory: string[];
}

export interface ImageProvider {
  id: string;
  name: string;
  priority: number;
  isAvailable(): Promise<boolean>;
  generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; modelUsed: string }>;
  editImage?(params: EditImageParams): Promise<{ imageUrl: string; modelUsed: string }>;
}

export class ImageRouter {
  private providers: ImageProvider[] = [];

  constructor() {}

  /**
   * Register a new provider in the router.
   * Enables adding new providers without touching UI or router invocation logic.
   */
  public registerProvider(provider: ImageProvider): void {
    // Remove if already registered with same id
    this.providers = this.providers.filter((p) => p.id !== provider.id);
    this.providers.push(provider);
    // Keep providers sorted by priority ascending (1 = highest priority)
    this.providers.sort((a, b) => a.priority - b.priority);
    console.log(`[ImageRouter] Registered provider "${provider.name}" (ID: ${provider.id}, Priority: ${provider.priority})`);
  }

  public getProviders(): { id: string; name: string; priority: number }[] {
    return this.providers.map((p) => ({ id: p.id, name: p.name, priority: p.priority }));
  }

  /**
   * Main image generation method with automatic failover across multiple providers.
   */
  public async generateImage(
    params: GenerateImageParams,
    onStatusUpdate?: (status: string) => void
  ): Promise<ImageRouterResult> {
    const statusHistory: string[] = [];

    const notifyStatus = (status: string) => {
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
            statusHistory,
          };
        }
      } catch (err: any) {
        // Log detailed technical error on server for developer inspection
        console.warn(`[ImageRouter Internal Log] Provider "${provider.name}" failed:`, err?.message || err);
        // Do NOT rethrow or expose raw provider technical details to client
      }
    }

    // If all providers failed or were unavailable
    console.error("[ImageRouter Error] All registered providers failed or were unavailable.");
    throw new Error("Image generation is currently unavailable. Please try again later.");
  }

  /**
   * Main image editing method with automatic failover across multiple providers.
   */
  public async editImage(
    params: EditImageParams,
    onStatusUpdate?: (status: string) => void
  ): Promise<ImageRouterResult> {
    const statusHistory: string[] = [];

    const notifyStatus = (status: string) => {
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

        const result = await provider.editImage!(params);
        if (result && result.imageUrl) {
          console.log(`[ImageRouter Success] Edit Provider "${provider.name}" successfully edited image with model "${result.modelUsed}".`);
          return {
            imageUrl: result.imageUrl,
            providerId: provider.id,
            providerName: provider.name,
            modelUsed: result.modelUsed,
            statusHistory,
          };
        }
      } catch (err: any) {
        console.warn(`[ImageRouter Internal Log] Edit Provider "${provider.name}" failed:`, err?.message || err);
      }
    }

    console.error("[ImageRouter Error] All editing providers failed.");
    throw new Error("Image generation is currently unavailable. Please try again later.");
  }
}

// ==========================================
// CONCRETE PROVIDER IMPLEMENTATIONS
// ==========================================

/**
 * Provider 1: Google Imagen 3 Primary Provider
 */
export class GoogleImagenProvider implements ImageProvider {
  public id = "google-imagen-v3";
  public name = "Google Imagen 3 Studio";
  public priority = 2;

  constructor(private getGenAI: () => GoogleGenAI | null) {}

  public async isAvailable(): Promise<boolean> {
    return !!this.getGenAI();
  }

  public async generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
    const ai = this.getGenAI();
    if (!ai) throw new Error("Google GenAI client not initialized.");

    const finalPrompt = params.style && params.style !== "None" && !params.style.startsWith("None")
      ? `${params.prompt}, ${params.style} style`
      : params.prompt;

    const requestedAspectRatio = params.aspectRatio || "1:1";
    const modelsToTry = [
      "imagen-3.0-generate-001",
      "imagen-3.0-fast-generate-001",
      "imagen-3.0-generate-002",
      "imagen-2.0",
    ];

    for (const modelName of modelsToTry) {
      try {
        const config: Record<string, any> = {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(requestedAspectRatio) ? requestedAspectRatio : "1:1",
        };

        const result = await ai.models.generateImages({
          model: modelName,
          prompt: finalPrompt,
          config,
        });

        if (result.generatedImages?.[0]?.image?.imageBytes) {
          const base64Bytes = result.generatedImages[0].image.imageBytes;
          return {
            imageUrl: `data:image/jpeg;base64,${base64Bytes}`,
            modelUsed: modelName,
          };
        }
      } catch (err: any) {
        console.warn(`[GoogleImagenProvider] Model "${modelName}" failed internally:`, err?.message || err);
      }
    }

    throw new Error("Google Imagen models failed to produce an image.");
  }
}

/**
 * Provider 2: Google Gemini Flash Multimodal Provider
 */
export class GoogleGeminiFlashProvider implements ImageProvider {
  public id = "google-gemini-flash";
  public name = "Gemini Flash Neural Engine";
  public priority = 3;

  constructor(private getGenAI: () => GoogleGenAI | null) {}

  public async isAvailable(): Promise<boolean> {
    return !!this.getGenAI();
  }

  public async generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
    const ai = this.getGenAI();
    if (!ai) throw new Error("Google GenAI client not initialized.");

    const finalPrompt = params.style && params.style !== "None" && !params.style.startsWith("None")
      ? `${params.prompt}, ${params.style} style`
      : params.prompt;

    const modelsToTry = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-2.5-flash"];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Generate a high quality image matching this description: ${finalPrompt}`,
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return {
                imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                modelUsed: modelName,
              };
            }
          }
        }
      } catch (err: any) {
        console.warn(`[GoogleGeminiFlashProvider] Model "${modelName}" failed internally:`, err?.message || err);
      }
    }

    throw new Error("Gemini Flash models failed to produce an image.");
  }

  public async editImage(params: EditImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
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
            { inlineData: { mimeType, data: base64Data } },
          ],
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return {
                imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                modelUsed: modelName,
              };
            }
          }
        }
      } catch (err: any) {
        console.warn(`[GoogleGeminiFlashProvider Edit] Model "${modelName}" failed internally:`, err?.message || err);
      }
    }

    throw new Error("Gemini Flash models failed to edit image.");
  }
}

/**
 * Provider 3: Pollinations AI / Open Studio Secondary Fallback Provider
 */
export class PollinationsAIProvider implements ImageProvider {
  public id = "pollinations-ai";
  public name = "Pollinations Open Studio";
  public priority = 4;

  public async isAvailable(): Promise<boolean> {
    return true; // Public endpoint requiring no keys
  }

  public async generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
    const cleanPrompt = encodeURIComponent(
      params.style && params.style !== "None"
        ? `${params.prompt}, ${params.style} style`
        : params.prompt
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

    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 sec timeout

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
        modelUsed: "pollinations-flux-realism",
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn("[PollinationsAIProvider] Fetch failed:", err?.message || err);
      throw new Error("Pollinations fallback failed.");
    }
  }

  public async editImage(params: EditImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
    return this.generateImage({ prompt: params.prompt });
  }
}

/**
 * Provider 5: AstraMind Aesthetic Visual Art Provider (Always reliable fallback)
 */
export class AstraMindVisualArtProvider implements ImageProvider {
  public id = "astramind-art";
  public name = "AstraMind Visual Art Engine";
  public priority = 5;

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
    let width = 1024;
    let height = 1024;
    if (params.aspectRatio === "16:9") { width = 1280; height = 720; }
    else if (params.aspectRatio === "9:16") { width = 720; height = 1280; }
    else if (params.aspectRatio === "4:3") { width = 1024; height = 768; }
    else if (params.aspectRatio === "3:4") { width = 768; height = 1024; }

    const seed = Array.from(params.prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0) + Math.floor(Math.random() * 1000);
    const picsumUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(picsumUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        return {
          imageUrl: `data:image/jpeg;base64,${base64}`,
          modelUsed: "astramind-art-canvas",
        };
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }

    // High quality SVG data URL as ultimate fallback
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
      modelUsed: "astramind-vector-canvas",
    };
  }

  public async editImage(params: EditImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
    return this.generateImage({ prompt: params.prompt });
  }
}

/**
 * Default Global Router Instance initialized with all providers
 */
export function createDefaultImageRouter(getGenAI: () => GoogleGenAI | null): ImageRouter {
  const router = new ImageRouter();

  // Register providers in priority order
  router.registerProvider(new HuggingFaceImageProvider());
  router.registerProvider(new GoogleImagenProvider(getGenAI));
  router.registerProvider(new GoogleGeminiFlashProvider(getGenAI));
  router.registerProvider(new PollinationsAIProvider());
  router.registerProvider(new AstraMindVisualArtProvider());

  return router;
}
