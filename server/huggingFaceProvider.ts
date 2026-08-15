import { ImageProvider, GenerateImageParams, EditImageParams } from "./imageRouter";

export class HuggingFaceImageProvider implements ImageProvider {
  public id = "huggingface-inference";
  public name = "Hugging Face Inference Studio";
  public priority = 1; // Primary provider

  private getHfToken(): string | null {
    const token =
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_TOKEN ||
      process.env.HUGGING_FACE_TOKEN ||
      process.env.HF_API_KEY;
    
    if (
      token &&
      token.trim() &&
      !token.startsWith("MY_") &&
      !token.startsWith("YOUR_") &&
      token.trim().length > 5
    ) {
      return token.trim();
    }
    return null;
  }

  private getConfiguredModel(): string {
    const envModel =
      process.env.HF_IMAGE_MODEL ||
      process.env.HUGGINGFACE_IMAGE_MODEL ||
      process.env.HF_MODEL;
    
    if (envModel && envModel.trim()) {
      return envModel.trim();
    }
    return "black-forest-labs/FLUX.1-schnell";
  }

  public async isAvailable(): Promise<boolean> {
    const token = this.getHfToken();
    return !!token;
  }

  /**
   * Calculates width & height dimensions based on aspect ratio
   */
  private getDimensions(aspectRatio?: string): { width: number; height: number } {
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

  public async generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
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
      "runwayml/stable-diffusion-v1-5",
    ];

    // Remove duplicates while preserving order
    const modelsToTry = Array.from(new Set(fallbackModels));
    const finalPrompt = params.style && params.style !== "None" && !params.style.startsWith("None")
      ? `${params.prompt}, ${params.style} style`
      : params.prompt;

    const { width, height } = this.getDimensions(params.aspectRatio);

    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      console.log(`[HuggingFaceImageProvider] Attempting image generation with model "${modelName}"...`);

      // Try Method A: Direct Hugging Face Inference API endpoint
      try {
        const result = await this.tryDirectInferenceApi(token, modelName, finalPrompt, width, height);
        if (result) {
          return { imageUrl: result, modelUsed: modelName };
        }
      } catch (err: any) {
        console.warn(`[HuggingFaceImageProvider] Direct inference for "${modelName}" failed:`, err?.message || err);
        lastError = err;
      }

      // Try Method B: Hugging Face Router endpoint
      try {
        const result = await this.tryRouterApi(token, modelName, finalPrompt, width, height);
        if (result) {
          return { imageUrl: result, modelUsed: modelName };
        }
      } catch (err: any) {
        console.warn(`[HuggingFaceImageProvider] Router inference for "${modelName}" failed:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error("Hugging Face Inference API failed to generate image across all candidate models.");
  }

  /**
   * Standard Hugging Face Model Endpoint: https://api-inference.huggingface.co/models/{modelName}
   */
  private async tryDirectInferenceApi(
    token: string,
    modelName: string,
    prompt: string,
    width: number,
    height: number
  ): Promise<string | null> {
    const url = `https://api-inference.huggingface.co/models/${modelName}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-use-cache": "true",
    };

    const payload = {
      inputs: prompt,
      parameters: {
        width,
        height,
        guidance_scale: 7.5,
        num_inference_steps: 25,
      },
    };

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sec timeout for deep models

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get("content-type") || "";

        // Check for model loading (HTTP 503 or JSON error with estimated_time)
        if (response.status === 503) {
          const jsonErr = await response.json().catch(() => ({}));
          console.log(`[HuggingFaceImageProvider] Model "${modelName}" is currently loading (estimated time: ${jsonErr.estimated_time || "unknown"}s). Retrying (${retries + 1}/${maxRetries})...`);
          
          retries++;
          if (retries <= maxRetries) {
            const waitMs = Math.min((jsonErr.estimated_time || 5) * 1000, 8000);
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

        // Response is binary image data
        if (contentType.includes("image/") || contentType.includes("application/octet-stream")) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString("base64");
          const mime = contentType.includes("image/") ? contentType : "image/jpeg";
          return `data:${mime};base64,${base64}`;
        }

        // If returned as JSON unexpectedly
        const data = await response.json().catch(() => null);
        if (data) {
          if (Array.isArray(data) && data[0]?.generated_text) {
            // Text response instead of image
            throw new Error(`Model "${modelName}" did not return an image buffer.`);
          }
          if (data.error) {
            throw new Error(data.error);
          }
        }

        return null;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          throw new Error(`Hugging Face API request timed out for model "${modelName}".`);
        }
        if (retries < maxRetries && err.message?.includes("loading")) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 3000));
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
  private async tryRouterApi(
    token: string,
    modelName: string,
    prompt: string,
    width: number,
    height: number
  ): Promise<string | null> {
    const url = "https://router.huggingface.co/hf-inference/v1/images/generations";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const payload = {
      model: modelName,
      prompt,
      width,
      height,
      response_format: "b64_json",
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
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
    } catch (err: any) {
      clearTimeout(timeoutId);
      return null;
    }
  }

  public async editImage(params: EditImageParams): Promise<{ imageUrl: string; modelUsed: string }> {
    // Re-route edit image instructions to generate image with prompt description
    return this.generateImage({
      prompt: params.prompt,
    });
  }
}
