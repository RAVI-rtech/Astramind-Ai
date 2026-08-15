import { supabase, isSupabaseConfigured } from "./supabase";

export interface ImageStudioItem {
  id: string;
  user_id?: string;
  type: "generator" | "editor";
  prompt: string;
  imageUrl: string;
  originalImageUrl?: string;
  style?: string;
  aspectRatio?: string;
  providerId?: string;
  createdAt: string;
}

export interface ImageProvider {
  id: string;
  name: string;
  description: string;
  badge: string;
  supportsStyles: boolean;
  supportsEditing: boolean;
}

export const IMAGE_PROVIDERS: ImageProvider[] = [
  {
    id: "huggingface-inference",
    name: "Hugging Face Inference (FLUX.1)",
    description: "Primary open-weights generative engine via Hugging Face Inference API",
    badge: "PRIMARY HF",
    supportsStyles: true,
    supportsEditing: true,
  },
  {
    id: "astramind-vision-pro",
    name: "AstraMind Vision Pro (Imagen)",
    description: "High-fidelity multimodal generative neural engine",
    badge: "GOOGLE",
    supportsStyles: true,
    supportsEditing: true,
  },
  {
    id: "astramind-diffusion-v3",
    name: "AstraMind Gemini Flash",
    description: "Ultra-fast neural engine for visual concepts and edits",
    badge: "GEMINI",
    supportsStyles: true,
    supportsEditing: true,
  },
  {
    id: "astramind-vector-studio",
    name: "AstraMind Vector Studio",
    description: "Specialized engine for minimalist graphic art, logos, and vector illustrations",
    badge: "ART",
    supportsStyles: true,
    supportsEditing: false,
  },
];

const LOCAL_STORAGE_KEY = "astramind_image_studio_history";

// Fetch user image history from Supabase / localStorage
export async function fetchUserImageHistory(userId?: string | null): Promise<ImageStudioItem[]> {
  try {
    if (userId && isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("astramind_image_studio")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          type: item.type || "generator",
          prompt: item.prompt,
          imageUrl: item.image_url,
          originalImageUrl: item.original_image_url,
          style: item.style,
          aspectRatio: item.aspect_ratio,
          providerId: item.provider_id,
          createdAt: item.created_at,
        }));
      }
    }
  } catch (err) {
    console.warn("[Image Studio] Supabase fetch error, using local storage fallback:", err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const items: ImageStudioItem[] = JSON.parse(raw);
      if (userId) {
        return items.filter((item) => !item.user_id || item.user_id === userId);
      }
      return items;
    }
  } catch (err) {
    console.error("[Image Studio] localStorage parse error:", err);
  }

  return [];
}

// Save image item to history
export async function saveImageToHistory(
  item: Omit<ImageStudioItem, "id" | "createdAt"> & { userId?: string | null }
): Promise<ImageStudioItem> {
  const newItem: ImageStudioItem = {
    id: "img_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    user_id: item.userId || undefined,
    type: item.type,
    prompt: item.prompt,
    imageUrl: item.imageUrl,
    originalImageUrl: item.originalImageUrl,
    style: item.style,
    aspectRatio: item.aspectRatio,
    providerId: item.providerId || "astramind-vision-pro",
    createdAt: new Date().toISOString(),
  };

  // Try saving to Supabase
  if (item.userId && isSupabaseConfigured()) {
    try {
      await supabase.from("astramind_image_studio").insert([
        {
          id: newItem.id,
          user_id: item.userId,
          type: newItem.type,
          prompt: newItem.prompt,
          image_url: newItem.imageUrl,
          original_image_url: newItem.originalImageUrl,
          style: newItem.style,
          aspect_ratio: newItem.aspectRatio,
          provider_id: newItem.providerId,
          created_at: newItem.createdAt,
        },
      ]);
    } catch (err) {
      console.warn("[Image Studio] Could not persist to Supabase table:", err);
    }
  }

  // Always update localStorage
  try {
    const existing = await fetchUserImageHistory(item.userId);
    const updated = [newItem, ...existing.filter((i) => i.id !== newItem.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (err) {
    console.error("[Image Studio] localStorage save error:", err);
  }

  return newItem;
}

// Helper to extract bucket and path from Supabase Storage URL
function extractSupabaseStoragePath(url: string): { bucket: string; path: string } | null {
  if (!url) return null;
  try {
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (match) {
      return { bucket: match[1], path: match[2].split("?")[0] };
    }
  } catch (e) {
    console.warn("[Image Studio] Storage URL parse error:", e);
  }
  return null;
}

// Delete image from history
export async function deleteImageFromHistory(id: string, userId?: string | null): Promise<void> {
  // 1. Check database & Supabase Storage if configured
  if (userId && isSupabaseConfigured()) {
    try {
      // Fetch record first to verify ownership and check for storage files
      const { data: record, error: selectError } = await supabase
        .from("astramind_image_studio")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (selectError) {
        console.warn("[Image Studio] Error selecting record before delete:", selectError.message);
      }

      if (record) {
        // Ownership check
        if (record.user_id && record.user_id !== userId) {
          throw new Error("Unauthorized: You can only delete your own images.");
        }

        // Delete from Supabase Storage if image URLs are stored in buckets
        const urlsToDelete = [record.image_url, record.original_image_url].filter(Boolean);
        for (const url of urlsToDelete) {
          const storageInfo = extractSupabaseStoragePath(url);
          if (storageInfo) {
            console.log(`[Image Studio] Removing object from Supabase Storage bucket "${storageInfo.bucket}": ${storageInfo.path}`);
            const { error: storageErr } = await supabase.storage
              .from(storageInfo.bucket)
              .remove([storageInfo.path]);
            if (storageErr) {
              console.warn("[Image Studio] Supabase storage delete warning:", storageErr.message);
            }
          }
        }

        // Delete record from database
        const { error: deleteError } = await supabase
          .from("astramind_image_studio")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (deleteError) {
          throw new Error(`Failed to delete database record: ${deleteError.message}`);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes("Unauthorized")) {
        throw err;
      }
      console.warn("[Image Studio] Supabase delete attempt error:", err);
    }
  }

  // 2. Remove from LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const items: ImageStudioItem[] = JSON.parse(raw);
      const target = items.find((item) => item.id === id);
      if (target && target.user_id && userId && target.user_id !== userId) {
        throw new Error("Unauthorized: You can only delete your own images.");
      }
      const filtered = items.filter((item) => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Unauthorized")) {
      throw err;
    }
    console.error("[Image Studio] localStorage delete error:", err);
  }
}

// Check status of available image models
export async function apiCheckImageModelsStatus(): Promise<{
  available: boolean;
  models: string[];
  message?: string;
}> {
  try {
    const response = await fetch("/api/image-models-status");
    if (!response.ok) {
      return { available: false, models: [], message: "Failed to connect to image models service." };
    }
    const data = await response.json();
    return {
      available: !!data.available,
      models: data.models || [],
      message: data.message
    };
  } catch (err: any) {
    console.warn("[Image Studio] Error checking model status:", err);
    return { available: false, models: [], message: err?.message || "Error reaching image service." };
  }
}

// Call backend API for generation with ImageRouter status streaming support
export async function apiGenerateImage(
  params: {
    prompt: string;
    style?: string;
    aspectRatio?: string;
    providerId?: string;
  },
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  console.log("[Client Image Studio] Sending generate-image request with prompt:", params.prompt);

  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Stream-Status": "true",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Image generation is currently unavailable. Please try again later.");
    }

    if (!response.body) {
      throw new Error("Image generation is currently unavailable. Please try again later.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalImageUrl = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.replace(/^data:\s*/, "");
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "status" && parsed.message) {
              if (onStatusUpdate) onStatusUpdate(parsed.message);
            } else if (parsed.type === "result" && parsed.imageUrl) {
              finalImageUrl = parsed.imageUrl;
            } else if (parsed.type === "error") {
              throw new Error(parsed.error || "Image generation is currently unavailable. Please try again later.");
            }
          } catch (pErr: any) {
            if (pErr.message && pErr.message.includes("unavailable")) throw pErr;
          }
        }
      }
    }

    if (finalImageUrl) {
      return finalImageUrl;
    }

    throw new Error("Image generation is currently unavailable. Please try again later.");
  } catch (err: any) {
    console.error("[Client Image Studio] Error generating image:", err);
    throw new Error(
      err?.message && err.message.length < 100 && !err.message.includes("Failed to fetch")
        ? err.message
        : "Image generation is currently unavailable. Please try again later."
    );
  }
}

// Call backend API for image editing with ImageRouter status streaming support
export async function apiEditImage(
  params: {
    prompt: string;
    image: string; // base64 or URL
    providerId?: string;
  },
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  console.log("[Client Image Studio] Sending edit-image request with prompt:", params.prompt);

  try {
    const response = await fetch("/api/edit-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Stream-Status": "true",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Image generation is currently unavailable. Please try again later.");
    }

    if (!response.body) {
      throw new Error("Image generation is currently unavailable. Please try again later.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalImageUrl = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.replace(/^data:\s*/, "");
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "status" && parsed.message) {
              if (onStatusUpdate) onStatusUpdate(parsed.message);
            } else if (parsed.type === "result" && parsed.imageUrl) {
              finalImageUrl = parsed.imageUrl;
            } else if (parsed.type === "error") {
              throw new Error(parsed.error || "Image generation is currently unavailable. Please try again later.");
            }
          } catch (pErr: any) {
            if (pErr.message && pErr.message.includes("unavailable")) throw pErr;
          }
        }
      }
    }

    if (finalImageUrl) {
      return finalImageUrl;
    }

    throw new Error("Image generation is currently unavailable. Please try again later.");
  } catch (err: any) {
    console.error("[Client Image Studio] Error editing image:", err);
    throw new Error(
      err?.message && err.message.length < 100 && !err.message.includes("Failed to fetch")
        ? err.message
        : "Image generation is currently unavailable. Please try again later."
    );
  }
}
