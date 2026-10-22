import { InferenceClient } from "@huggingface/inference";
import { ImageProvider, GenerateImageParams } from "./imageRouter";

export class HuggingFaceImageProvider implements ImageProvider {
  public id = "huggingface-inference";
  public name = "Hugging Face Inference Studio";
  public priority = 1; // Primary provider

  private creditExhausted: boolean = false;
  private lastVerificationTime: number = 0;
  private verificationCacheTtlMs: number = 5 * 60 * 1000; // 5 minutes cache
  private lastCheckedToken: string | null = null;

  public getHfToken(): string | null {
    const rawToken =
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_TOKEN ||
      process.env.HUGGING_FACE_TOKEN ||
      process.env.HF_API_KEY;

    if (!rawToken || typeof rawToken !== "string") {
      return null;
    }

    const token = rawToken.trim();

    // Check for common placeholders
    const lower = token.toLowerCase();
    if (
      lower.startsWith("my_") ||
      lower.startsWith("your_") ||
      lower === "placeholder" ||
      lower === "undefined" ||
      lower === "null" ||
      lower === "none" ||
      lower === "your_api_key" ||
      token.length < 8
    ) {
      return null;
    }

    return token;
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

  /**
   * Verifies if the account has PRO membership or billing configured.
   * Hugging Face requires pre-paid credits or PRO subscription for Serverless Inference Providers.
   * Prevents false-healthy reporting when an API key exists but credits are exhausted.
   */
  public async checkAccountCreditStatus(token: string): Promise<boolean> {
    const now = Date.now();
    if (this.lastCheckedToken === token && now - this.lastVerificationTime < this.verificationCacheTtlMs) {
      return !this.creditExhausted;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch("https://huggingface.co/api/whoami-v2", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          this.creditExhausted = true;
          this.lastVerificationTime = now;
          this.lastCheckedToken = token;
          return false;
        }
        return !this.creditExhausted;
      }

      const data = await resp.json().catch(() => ({}));
      const hasPro = data?.isPro === true;
      const hasCanPay = data?.canPay === true;
      const hasBilling = !!data?.billing;

      // Hugging Face requires PRO or active billing/canPay for serverless inference providers
      if (!hasPro && !hasCanPay && !hasBilling) {
        this.creditExhausted = true;
      } else {
        this.creditExhausted = false;
      }

      this.lastVerificationTime = now;
      this.lastCheckedToken = token;
      return !this.creditExhausted;
    } catch {
      // If verification network request times out, fallback to known status
      return !this.creditExhausted;
    }
  }

  public async isAvailable(): Promise<boolean> {
    const token = this.getHfToken();
    if (!token) {
      return false;
    }

    if (this.creditExhausted && this.lastCheckedToken === token && Date.now() - this.lastVerificationTime < this.verificationCacheTtlMs) {
      return false;
    }

    return await this.checkAccountCreditStatus(token);
  }

  /**
   * Manually record that credits are exhausted (e.g. after a 402 during generation)
   */
  public markCreditExhausted(): void {
    this.creditExhausted = true;
    this.lastVerificationTime = Date.now();
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
      throw new Error(
        "Hugging Face API token is missing or contains a placeholder. Please configure HUGGINGFACE_API_KEY or HF_TOKEN in server environment variables."
      );
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

        if (typeof imageBlob === "string") {
          return {
            imageUrl: imageBlob,
            modelUsed: primaryModel,
          };
        }

        if (imageBlob && typeof (imageBlob as any).arrayBuffer === "function") {
          const blob = imageBlob as Blob;
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString("base64");
          const mimeType = blob.type || "image/png";

          console.log(`[HuggingFaceImageProvider] Successfully generated image (${blob.size} bytes) with model "${primaryModel}"`);
          this.creditExhausted = false;
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
        const sanitizedErrMsg = rawErrMsg
          .replace(/hf_[a-zA-Z0-9_-]+/g, "[REDACTED_TOKEN]")
          .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]");

        // Handle cold start / warming up (HTTP 503) - TRANSIENT: Retry bounded
        if (
          status === 503 ||
          sanitizedErrMsg.toLowerCase().includes("loading") ||
          sanitizedErrMsg.toLowerCase().includes("warming up")
        ) {
          retries++;
          if (retries <= maxRetries) {
            console.log(
              `[HuggingFaceImageProvider] Model "${primaryModel}" is warming up (Attempt ${retries}/${maxRetries}). Waiting 5 seconds...`
            );
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
          throw new Error(
            `Hugging Face model "${primaryModel}" is currently warming up/loading. Please retry in a few moments.`
          );
        }

        // Handle credit exhaustion / billing requirement (HTTP 402) - NON-TRANSIENT
        if (
          status === 402 ||
          sanitizedErrMsg.includes("no remaining credits") ||
          sanitizedErrMsg.includes("pre-paid credits") ||
          sanitizedErrMsg.includes("insufficient credits") ||
          sanitizedErrMsg.includes("payment required")
        ) {
          this.markCreditExhausted();
          throw new Error(
            `Hugging Face Inference Error: Insufficient credits. Your Hugging Face user account requires pre-paid credits or a PRO subscription to use Inference Providers for model "${primaryModel}".`
          );
        }

        // Handle rate limiting (HTTP 429) - NON-TRANSIENT without backoff
        if (status === 429 || sanitizedErrMsg.toLowerCase().includes("rate limit")) {
          throw new Error(
            `Hugging Face rate limit reached for model "${primaryModel}". Please wait a moment before trying again.`
          );
        }

        // Handle authentication errors (HTTP 401 / 403) - NON-TRANSIENT
        if (
          status === 401 ||
          status === 403 ||
          sanitizedErrMsg.toLowerCase().includes("invalid token") ||
          sanitizedErrMsg.toLowerCase().includes("unauthorized") ||
          sanitizedErrMsg.toLowerCase().includes("forbidden")
        ) {
          throw new Error("Hugging Face authentication error: The configured API token is invalid or unauthorized.");
        }

        // Handle deprecated / unsupported provider models (HTTP 410 / 404 / 400) - NON-TRANSIENT
        if (
          status === 410 ||
          status === 404 ||
          sanitizedErrMsg.includes("deprecated and no longer supported") ||
          sanitizedErrMsg.includes("No Inference Provider available") ||
          sanitizedErrMsg.includes("not supported by provider")
        ) {
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
