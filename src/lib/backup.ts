import { db } from "./db";
import { ChatSession, ResumeData, Settings, UserProfile } from "../types";

export interface CompleteWorkspaceBackup {
  version: string;
  timestamp: number;
  appName: string;
  sessions: ChatSession[];
  notes: any[];
  folders: any[];
  workspaceFiles: any[];
  resumes: ResumeData[];
  aiMemory: any[];
  userProfile?: UserProfile;
  settings?: Settings;
}

export async function exportLocalWorkspaceJSON(): Promise<string> {
  const sessions = await db.sessions.toArray();
  const notes = await db.notes.toArray();
  const folders = await db.folders.toArray();
  const workspaceFiles = await db.workspaceFiles.toArray();
  const resumes = await db.resumes.toArray();
  const aiMemory = await db.aiMemory.toArray();
  
  const savedProfileStr = localStorage.getItem("astramind_user_profile");
  const savedSettingsStr = localStorage.getItem("astramind_settings");

  const backupData: CompleteWorkspaceBackup = {
    version: "2.0-local-first",
    timestamp: Date.now(),
    appName: "AstraMind OS",
    sessions,
    notes,
    folders,
    workspaceFiles: workspaceFiles.map((f) => ({ ...f, blobData: undefined })), // avoid heavy binary duplication in json
    resumes,
    aiMemory,
    userProfile: savedProfileStr ? JSON.parse(savedProfileStr) : undefined,
    settings: savedSettingsStr ? JSON.parse(savedSettingsStr) : undefined,
  };

  return JSON.stringify(backupData, null, 2);
}

export async function downloadLocalBackupFile(): Promise<void> {
  const jsonStr = await exportLocalWorkspaceJSON();
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `astramind-local-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importLocalWorkspaceJSON(jsonContent: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data: CompleteWorkspaceBackup = JSON.parse(jsonContent);
    let importedCount = 0;

    if (data.sessions && Array.isArray(data.sessions)) {
      for (const session of data.sessions) {
        await db.sessions.put(session);
        importedCount++;
      }
    }

    if (data.notes && Array.isArray(data.notes)) {
      for (const note of data.notes) {
        await db.notes.put(note);
        importedCount++;
      }
    }

    if (data.folders && Array.isArray(data.folders)) {
      for (const folder of data.folders) {
        await db.folders.put(folder);
        importedCount++;
      }
    }

    if (data.resumes && Array.isArray(data.resumes)) {
      for (const resume of data.resumes) {
        await db.resumes.put(resume);
        importedCount++;
      }
    }

    if (data.aiMemory && Array.isArray(data.aiMemory)) {
      for (const mem of data.aiMemory) {
        await db.aiMemory.put(mem);
        importedCount++;
      }
    }

    if (data.userProfile) {
      localStorage.setItem("astramind_user_profile", JSON.stringify(data.userProfile));
    }

    if (data.settings) {
      localStorage.setItem("astramind_settings", JSON.stringify(data.settings));
    }

    return { success: true, count: importedCount };
  } catch (err: any) {
    console.error("Error importing workspace backup:", err);
    return { success: false, count: 0, error: err.message || "Invalid JSON backup file" };
  }
}
