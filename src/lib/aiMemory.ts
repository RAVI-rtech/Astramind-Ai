import { db, LocalAIMemory } from "./db";

export async function getLocalAIMemories(): Promise<LocalAIMemory[]> {
  try {
    return await db.aiMemory.toArray();
  } catch (e) {
    console.error("Failed loading AI memory:", e);
    return [];
  }
}

export async function addLocalAIMemory(
  key: string,
  value: string,
  category: LocalAIMemory["category"] = "personal"
): Promise<LocalAIMemory> {
  const newMemory: LocalAIMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    key,
    value,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.aiMemory.put(newMemory);
  return newMemory;
}

export async function removeLocalAIMemory(id: string): Promise<void> {
  await db.aiMemory.delete(id);
}

export async function clearAllLocalAIMemories(): Promise<void> {
  await db.aiMemory.clear();
}

/**
 * Format local AI memories into a system prompt segment for AI queries
 */
export async function getAIMemorySystemPrompt(): Promise<string> {
  const memories = await getLocalAIMemories();
  if (!memories.length) return "";

  const memoryList = memories
    .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
    .join("\n");

  return `\n[LOCAL USER MEMORY - Stored exclusively on user's device]\n${memoryList}\n`;
}
