import { db } from "./db";

export interface SearchResultItem {
  id: string;
  type: "chat" | "note" | "resume" | "file" | "memory";
  title: string;
  snippet: string;
  timestamp: number;
  data?: any;
}

export async function searchLocalDatabase(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  const q = query.toLowerCase().trim();
  const results: SearchResultItem[] = [];

  try {
    // 1. Search Chat Sessions & Messages
    const sessions = await db.sessions.toArray();
    for (const session of sessions) {
      if (session.title.toLowerCase().includes(q)) {
        results.push({
          id: session.id,
          type: "chat",
          title: session.title,
          snippet: `Chat thread with ${session.messages?.length || 0} messages`,
          timestamp: session.lastUpdated,
          data: session,
        });
      } else {
        // Search inside messages
        const matchingMsg = session.messages?.find((m) => m.text?.toLowerCase().includes(q));
        if (matchingMsg) {
          results.push({
            id: session.id,
            type: "chat",
            title: session.title,
            snippet: `Matching message: "${matchingMsg.text.slice(0, 100)}..."`,
            timestamp: session.lastUpdated,
            data: session,
          });
        }
      }
    }

    // 2. Search Local Notes
    const notes = await db.notes.toArray();
    for (const note of notes) {
      if (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) {
        results.push({
          id: note.id,
          type: "note",
          title: note.title || "Untitled Note",
          snippet: note.content.slice(0, 120),
          timestamp: note.updatedAt || note.createdAt,
          data: note,
        });
      }
    }

    // 3. Search Resumes
    const resumes = await db.resumes.toArray();
    for (const resume of resumes) {
      if (
        resume.title.toLowerCase().includes(q) ||
        resume.personalInfo?.fullName?.toLowerCase().includes(q) ||
        resume.personalInfo?.jobTitle?.toLowerCase().includes(q)
      ) {
        results.push({
          id: resume.id,
          type: "resume",
          title: resume.title || "Resume",
          snippet: `${resume.personalInfo?.fullName || "User"} - ${resume.personalInfo?.jobTitle || "Resume Profile"}`,
          timestamp: resume.lastUpdated,
          data: resume,
        });
      }
    }

    // 4. Search Workspace Files
    const files = await db.workspaceFiles.toArray();
    for (const file of files) {
      if (file.name.toLowerCase().includes(q) || file.textContent?.toLowerCase().includes(q)) {
        results.push({
          id: file.id,
          type: "file",
          title: file.name,
          snippet: file.textContent ? file.textContent.slice(0, 100) : `${(file.size / 1024).toFixed(1)} KB file`,
          timestamp: file.createdAt,
          data: file,
        });
      }
    }

    // 5. Search AI Memories
    const memories = await db.aiMemory.toArray();
    for (const mem of memories) {
      if (mem.key.toLowerCase().includes(q) || mem.value.toLowerCase().includes(q)) {
        results.push({
          id: mem.id,
          type: "memory",
          title: `Memory: ${mem.key}`,
          snippet: mem.value,
          timestamp: mem.updatedAt,
          data: mem,
        });
      }
    }
  } catch (err) {
    console.error("Local search failed:", err);
  }

  // Sort by timestamp descending
  return results.sort((a, b) => b.timestamp - a.timestamp);
}
