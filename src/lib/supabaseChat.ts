import { supabase, isSupabaseConfigured } from "./supabase";
import { ChatSession, Message, Attachment } from "../types";

export interface UserStatistics {
  conversations: number;
  aiRequests: number;
  filesAnalysed: number;
  favouriteModel: string;
}

/**
 * Generate a conversation title from the first user message.
 */
export function generateTitleFromMessage(text: string): string {
  if (!text || !text.trim()) return "New Conversation";
  const clean = text.trim().replace(/\s+/g, " ");
  const words = clean.split(" ");
  if (words.length > 6) {
    const candidate = words.slice(0, 6).join(" ");
    return candidate.length > 45 ? candidate.slice(0, 42) + "..." : candidate;
  }
  return clean.length > 45 ? clean.slice(0, 42) + "..." : clean;
}

/**
 * Fetch all conversations and their messages belonging to the authenticated user from Supabase.
 * Ordered by updated_at descending.
 */
export async function fetchUserConversations(userId: string): Promise<ChatSession[]> {
  if (!isSupabaseConfigured() || !userId) {
    return [];
  }

  try {
    // 1. Fetch conversations belonging to user ordered by updated_at DESC
    const { data: convs, error: convsError } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (convsError) {
      console.warn("Notice: Could not load conversations from Supabase:", convsError.message);
      return [];
    }

    if (!convs || convs.length === 0) {
      return [];
    }

    const convIds = convs.map((c) => c.id);

    // 2. Fetch all messages for these conversations ordered by created_at ASC
    const { data: msgs, error: msgsError } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: true });

    if (msgsError) {
      console.warn("Notice: Could not load messages from Supabase:", msgsError.message);
    }

    const messagesByConv: Record<string, Message[]> = {};
    if (msgs) {
      for (const m of msgs) {
        if (!messagesByConv[m.conversation_id]) {
          messagesByConv[m.conversation_id] = [];
        }
        let parsedAttachment: Attachment | undefined = undefined;
        if (m.attachment) {
          try {
            parsedAttachment = typeof m.attachment === "string" ? JSON.parse(m.attachment) : m.attachment;
          } catch {
            parsedAttachment = undefined;
          }
        }
        messagesByConv[m.conversation_id].push({
          id: m.id,
          sender: m.role === "assistant" ? "assistant" : "user",
          text: m.content,
          timestamp: new Date(m.created_at).getTime(),
          attachment: parsedAttachment,
        });
      }
    }

    // 3. Map to ChatSession format
    const sessions: ChatSession[] = convs.map((c) => ({
      id: c.id,
      title: c.title,
      isPinned: !!c.is_pinned,
      isArchived: !!c.is_archived,
      lastUpdated: new Date(c.updated_at || c.created_at).getTime(),
      messages: messagesByConv[c.id] || [],
    }));

    return sessions;
  } catch (err) {
    console.error("Error in fetchUserConversations:", err);
    return [];
  }
}

/**
 * Create a new conversation in Supabase for the authenticated user.
 */
export async function createConversation(
  userId: string,
  title: string,
  isPinned = false,
  isArchived = false
): Promise<ChatSession | null> {
  if (!isSupabaseConfigured() || !userId) {
    return null;
  }

  try {
    const newConv = {
      user_id: userId,
      title: title || "New Conversation",
      is_pinned: isPinned,
      is_archived: isArchived,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("conversations")
      .insert([newConv])
      .select("*")
      .single();

    if (error) {
      console.warn("Failed to create conversation in Supabase:", error.message);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      isPinned: !!data.is_pinned,
      isArchived: !!data.is_archived,
      lastUpdated: new Date(data.updated_at).getTime(),
      messages: [],
    };
  } catch (err) {
    console.error("Error in createConversation:", err);
    return null;
  }
}

/**
 * Save a message (user or assistant) to Supabase and update conversation updated_at.
 */
export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  modelUsed: string = "Astra Mind 1.0",
  attachment?: Attachment
): Promise<Message | null> {
  if (!isSupabaseConfigured() || !conversationId) {
    return null;
  }

  try {
    const nowIso = new Date().toISOString();
    const newMsg: Record<string, any> = {
      conversation_id: conversationId,
      role: role,
      content: content || "",
      created_at: nowIso,
      model_used: modelUsed,
    };

    if (attachment) {
      newMsg.attachment = JSON.stringify(attachment);
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([newMsg])
      .select("*")
      .single();

    if (error) {
      if (attachment && error.message.includes("column")) {
        delete newMsg.attachment;
        const { data: retryData, error: retryError } = await supabase
          .from("messages")
          .insert([newMsg])
          .select("*")
          .single();
        if (retryError) {
          console.warn("Failed to save message in Supabase:", retryError.message);
          return null;
        }
        return {
          id: retryData.id,
          sender: role,
          text: retryData.content,
          timestamp: new Date(retryData.created_at).getTime(),
          attachment: attachment,
        };
      }
      console.warn("Failed to save message in Supabase:", error.message);
      return null;
    }

    let parsedAttachment: Attachment | undefined = attachment;
    if (data.attachment) {
      try {
        parsedAttachment = typeof data.attachment === "string" ? JSON.parse(data.attachment) : data.attachment;
      } catch {
        parsedAttachment = attachment;
      }
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: nowIso })
      .eq("id", conversationId);

    return {
      id: data.id,
      sender: role,
      text: data.content,
      timestamp: new Date(data.created_at).getTime(),
      attachment: parsedAttachment,
    };
  } catch (err) {
    console.error("Error in saveMessage:", err);
    return null;
  }
}

/**
 * Fetch dynamic analytics and statistics for a given user from Supabase.
 */
export async function fetchUserStatistics(userId: string): Promise<UserStatistics> {
  const defaultStats: UserStatistics = {
    conversations: 0,
    aiRequests: 0,
    filesAnalysed: 0,
    favouriteModel: "No activity yet",
  };

  if (!isSupabaseConfigured() || !userId) {
    return defaultStats;
  }

  try {
    // 1. Fetch conversations owned by the user
    const { data: convs, error: convsError } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId);

    if (convsError || !convs) {
      console.warn("Notice: Could not query conversations for statistics:", convsError?.message);
      return defaultStats;
    }

    const conversationsCount = convs.length;
    if (conversationsCount === 0) {
      return defaultStats;
    }

    const convIds = convs.map((c) => c.id);

    // 2. Fetch messages in those conversations
    const { data: msgs, error: msgsError } = await supabase
      .from("messages")
      .select("id, role, model_used, attachment")
      .in("conversation_id", convIds);

    if (msgsError || !msgs) {
      return {
        conversations: conversationsCount,
        aiRequests: 0,
        filesAnalysed: 0,
        favouriteModel: "No activity yet",
      };
    }

    // AI Requests = total user prompts sent (role === 'user')
    const aiRequests = msgs.filter((m) => m.role === "user").length;

    // Files Analysed = total uploaded files owned by the user
    const filesAnalysed = msgs.filter((m) => {
      if (!m.attachment) return false;
      if (typeof m.attachment === "string") {
        const trimmed = m.attachment.trim();
        return trimmed !== "" && trimmed !== "{}" && trimmed !== "null" && trimmed !== "[]";
      }
      return true;
    }).length;

    // Favourite Model = AI model used most frequently
    const modelCounts: Record<string, number> = {};
    for (const m of msgs) {
      if (m.model_used && typeof m.model_used === "string") {
        const cleanModel = m.model_used.trim();
        if (cleanModel) {
          modelCounts[cleanModel] = (modelCounts[cleanModel] || 0) + 1;
        }
      }
    }

    let favouriteModel = "No activity yet";
    let maxCount = 0;
    for (const [model, count] of Object.entries(modelCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favouriteModel = model;
      }
    }

    return {
      conversations: conversationsCount,
      aiRequests: aiRequests,
      filesAnalysed: filesAnalysed,
      favouriteModel: favouriteModel,
    };
  } catch (err) {
    console.error("Error in fetchUserStatistics:", err);
    return defaultStats;
  }
}

/**
 * Update conversation title in Supabase.
 */
export async function updateConversationTitle(
  conversationId: string,
  newTitle: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !conversationId) return false;

  try {
    const { error } = await supabase
      .from("conversations")
      .update({
        title: newTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      console.warn("Failed to update conversation title in Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error in updateConversationTitle:", err);
    return false;
  }
}

/**
 * Toggle pinned status for a conversation in Supabase.
 */
export async function togglePinConversation(
  conversationId: string,
  isPinned: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured() || !conversationId) return false;

  try {
    const { error } = await supabase
      .from("conversations")
      .update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      console.warn("Failed to toggle pin in Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error in togglePinConversation:", err);
    return false;
  }
}

/**
 * Toggle archived status for a conversation in Supabase.
 */
export async function toggleArchiveConversation(
  conversationId: string,
  isArchived: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured() || !conversationId) return false;

  try {
    const { error } = await supabase
      .from("conversations")
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      console.warn("Failed to toggle archive in Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error in toggleArchiveConversation:", err);
    return false;
  }
}

/**
 * Delete a conversation and its messages from Supabase.
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !conversationId) return false;

  try {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.warn("Failed to delete conversation from Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error in deleteConversation:", err);
    return false;
  }
}

/**
 * Delete all conversations belonging to the authenticated user from Supabase.
 */
export async function deleteAllUserConversations(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return false;

  try {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.warn("Failed to delete all conversations from Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error in deleteAllUserConversations:", err);
    return false;
  }
}
