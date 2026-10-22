import { InferenceClient } from "@huggingface/inference";
import { ImageProvider, GenerateImageParams } from "./imageRouter";

export class HuggingFaceImageProvider implements ImageProvider {
  public id = "huggingface-inference";
  public name = "Hugging Face Inference Studio";
  public priority = 1; // Primary provider

  public getHfToken(): string | null {
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

  public getConfiguredModel(): string {
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
  public getDimensions(aspectRatio?: string): { width: number; height: number } {
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

    const primaryModel = params.customModel || this.getConfiguredModel();
    const finalPrompt =
      params.style && params.style !== "None" && !params.style.startsWith("None")
        ? `${params.prompt}, ${params.style} style`
        : params.prompt;

    const { width, height } = this.getDimensions(params.aspectRatio);

    console.log(`[HuggingFaceImageProvider] Calling Hugging Face Inference for model: "${primaryModel}"`);

    // InferenceClient routes through the current Hugging Face Inference Providers API.
    const hf = new InferenceClient(token);

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const imageBlob = await hf.textToImage({
          provider: "auto",
          model: primaryModel,
          inputs: finalPrompt,
          parameters: {
            width,
            height,
          },
        });

        if (imageBlob && imageBlob.size > 0) {
          const arrayBuffer = await imageBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString("base64");
          const mimeType = imageBlob.type || "image/png";

          console.log(`[HuggingFaceImageProvider] Successfully generated image (${imageBlob.size} bytes) with model "${primaryModel}"`);
          return {
            imageUrl: `data:${mimeType};base64,${base64}`,
            modelUsed: primaryModel,
          };
        }

        throw new Error(`Model "${primaryModel}" did not return valid image data.`);
      } catch (err: any) {
        const rawErrMsg: string = err?.message || String(err);
        const status = err?.httpResponse?.status || err?.response?.status || err?.statusCode || err?.status;

        // Clean any sensitive token strings from error message
        const sanitizedErrMsg = rawErrMsg.replace(/hf_[a-zA-Z0-9_-]+/g, "[REDACTED_TOKEN]");

        // Handle cold start / warming up (HTTP 503)
        if (status === 503 || sanitizedErrMsg.toLowerCase().includes("loading") || sanitizedErrMsg.toLowerCase().includes("warming up")) {
          retries++;
          if (retries <= maxRetries) {
            console.log(`[HuggingFaceImageProvider] Model "${primaryModel}" is warming up (Attempt ${retries}/${maxRetries}). Waiting 5 seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
          throw new Error(`Hugging Face model "${primaryModel}" is currently warming up/loading. Please retry in a few moments.`);
        }

        // Handle credit exhaustion / billing requirement (HTTP 402)
        if (status === 402 || sanitizedErrMsg.includes("no remaining credits") || sanitizedErrMsg.includes("pre-paid credits")) {
          throw new Error(
            `Hugging Face Inference Error: Insufficient credits. Your Hugging Face user account requires pre-paid credits or a PRO subscription to use Inference Providers for model "${primaryModel}".`
          );
        }

        // Handle rate limiting (HTTP 429)
        if (status === 429 || sanitizedErrMsg.includes("Rate limit")) {
          throw new Error(`Hugging Face rate limit reached for model "${primaryModel}". Please wait a moment before trying again.`);
        }

        // Handle authentication errors (HTTP 401 / 403)
        if (status === 401 || status === 403 || sanitizedErrMsg.toLowerCase().includes("invalid token") || sanitizedErrMsg.toLowerCase().includes("unauthorized")) {
          throw new Error("Hugging Face authentication error: The configured API token is invalid or unauthorized.");
        }

        // Handle deprecated / unsupported provider models (HTTP 410 / 400)
        if (status === 410 || sanitizedErrMsg.includes("deprecated and no longer supported") || sanitizedErrMsg.includes("No Inference Provider available")) {
          throw new Error(
            `Hugging Face model "${primaryModel}" is no longer served by serverless inference. Recommended compatible models: "black-forest-labs/FLUX.1-schnell" or "black-forest-labs/FLUX.1-dev" via Hugging Face Inference Providers.`
          );
        }

        throw new Error(`Hugging Face Inference failed: ${sanitizedErrMsg}`);
      }
    }

    throw new Error(`Failed to generate image with Hugging Face model "${primaryModel}".`);
  }

}
