import { GoogleGenAI } from "@google/genai";
import { HuggingFaceImageProvider } from "./huggingFaceProvider";

export interface GenerateImageParams {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  size?: string;
  customModel?: string;
  providerId?: string;
}

export interface EditImageParams {
  prompt: string;
  image: string; // base64 or URL
  providerId?: string;
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

  /** Report configured provider availability without attempting an image request. */
  public async getProviderStatuses(): Promise<{ id: string; name: string; priority: number; available: boolean }[]> {
    return Promise.all(this.providers.map(async (provider) => ({
      id: provider.id,
      name: provider.name,
      priority: provider.priority,
      available: await provider.isAvailable().catch(() => false),
    })));
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

    // Order providers: if specific providerId requested, put it first
    let providersToTry = [...this.providers];
    if (params.providerId) {
      const targetProvider = providersToTry.find((p) => p.id === params.providerId);
      if (targetProvider) {
        providersToTry = [targetProvider, ...providersToTry.filter((p) => p.id !== params.providerId)];
      }
    }

    let attemptCount = 0;
    let lastError: Error | null = null;
    const failureMessages: string[] = [];

    for (const provider of providersToTry) {
      attemptCount++;

      if (attemptCount > 1) {
        notifyStatus(`Routing to alternate synthesis provider (${provider.name})...`);
      }

      console.log(`[ImageRouter] Attempting Provider ${attemptCount}/${providersToTry.length}: "${provider.name}" (${provider.id})`);

      try {
        const isAvail = await provider.isAvailable().catch(() => false);
        if (!isAvail) {
          const message = `${provider.name}: not configured or unavailable`;
          failureMessages.push(message);
          console.warn(`[ImageRouter Log] ${message}. Skipping.`);
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
        const rawMessage = String(err?.message || err || "Unknown provider error");
        const safeMessage = rawMessage.replace(/hf_[a-zA-Z0-9_-]+/g, "[REDACTED_TOKEN]").slice(0, 260);
        console.warn(`[ImageRouter Internal Log] Provider "${provider.name}" failed:`, safeMessage);
        failureMessages.push(`${provider.name}: ${safeMessage}`);
        lastError = err instanceof Error ? err : new Error(safeMessage);
        // Continue to fallback providers so generation can succeed with another configured provider.
      }
    }

    // If all providers failed or were unavailable
    console.error("[ImageRouter Error] All registered providers failed or were unavailable.");
    if (failureMessages.length > 0) {
      throw new Error(`All image providers failed. ${failureMessages.join(" | ").slice(0, 1200)}`);
    }
    if (lastError) throw lastError;
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

    let editProviders = this.providers.filter((p) => typeof p.editImage === "function");
    if (params.providerId) {
      const requestedProvider = editProviders.find((p) => p.id === params.providerId);
      if (requestedProvider) {
        editProviders = [requestedProvider, ...editProviders.filter((p) => p.id !== params.providerId)];
      }
    }

    if (editProviders.length === 0) {
      console.error("[ImageRouter Error] No editing-capable providers registered.");
      throw new Error("Image generation is currently unavailable. Please try again later.");
    }

    notifyStatus("Generating image...");

    let attemptCount = 0;
    let lastError: Error | null = null;

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
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    console.error("[ImageRouter Error] All editing providers failed.");
    if (lastError) throw lastError;
    throw new Error("No configured provider could edit this image. Check the Gemini image API settings and try again.");
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
  public name = "Google Imagen 3 Studio (legacy)";
  public priority = 99;

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
  public name = "Gemini Image Generation";
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

    const modelsToTry = ["gemini-nano-banana-2.1", "gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Generate a high quality image matching this description: ${finalPrompt}`,
          config: {
            responseModalities: ["IMAGE"],
          },
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

    throw new Error("Gemini image models failed to produce an image. Check the Gemini API key, model access, and image-generation quota.");

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

    const editModelsToTry = ["gemini-nano-banana-2.1", "gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"];

    for (const modelName of editModelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { text: `Edit this image according to these instructions: ${params.prompt}. Maintain high visual quality.` },
            { inlineData: { mimeType, data: base64Data } },
          ],
          config: {
            responseModalities: ["IMAGE"],
          },
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

    throw new Error("Gemini image models failed to edit the image. Check the Gemini API key, model access, and image-generation quota.");

  }
}

/**
 * Provider 3: Pollinations AI / Open Studio Secondary Fallback Provider
 */
export class PollinationsAIProvider implements ImageProvider {
  public id = "pollinations-ai";
  public name = "Pollinations Open Studio";
  public priority = 3;

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
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 sec timeout for deep diffusion

    try {
      const response = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Pollinations HTTP error ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("image/")) {
        const responseText = buffer.toString("utf8").slice(0, 160);
        throw new Error(`Pollinations returned a non-image response (${contentType || "unknown content type"}): ${responseText}`);
      }

      return {
        imageUrl: `data:${contentType};base64,${base64}`,
        modelUsed: "pollinations-flux-realism",
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const message = String(err?.message || "Pollinations fallback failed.");
      console.warn("[PollinationsAIProvider] Fetch failed:", message);
      throw new Error(message);
    }
  }

}

/**
 * Default Global Router Instance initialized with authentic AI providers
 */
export function createDefaultImageRouter(getGenAI: () => GoogleGenAI | null): ImageRouter {
  const router = new ImageRouter();

  // Prefer Hugging Face first, then current Gemini image models when a Gemini key is configured.
  // Imagen's Gemini API models were shut down in August 2026; do not route live traffic to them.
  router.registerProvider(new HuggingFaceImageProvider());
  router.registerProvider(new GoogleGeminiFlashProvider(getGenAI));
  router.registerProvider(new PollinationsAIProvider());

  return router;
}
