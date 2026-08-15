import Dexie, { Table } from "dexie";
import { ChatSession, Message, ResumeData, UserProfile } from "../types";

export interface LocalFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: number;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  folderId?: string;
  createdAt: number;
  opfsPath?: string;
  blobData?: ArrayBuffer | Blob;
  textContent?: string;
}

export interface LocalAIMemory {
  id: string;
  key: string;
  value: string;
  category: "personal" | "goal" | "coding_level" | "preference" | "context";
  createdAt: number;
  updatedAt: number;
}

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tags: string[];
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export class AstraMindDatabase extends Dexie {
  sessions!: Table<ChatSession, string>;
  folders!: Table<LocalFolder, string>;
  workspaceFiles!: Table<WorkspaceFile, string>;
  notes!: Table<LocalNote, string>;
  resumes!: Table<ResumeData, string>;
  aiMemory!: Table<LocalAIMemory, string>;
  userProfile!: Table<UserProfile & { id: string }, string>;

  constructor() {
    super("AstraMindLocalDB");
    this.version(1).stores({
      sessions: "id, title, lastUpdated, isPinned, isArchived",
      folders: "id, name, createdAt",
      workspaceFiles: "id, name, type, folderId, createdAt",
      notes: "id, title, folderId, isPinned, updatedAt",
      resumes: "id, title, lastUpdated",
      aiMemory: "id, key, category, updatedAt",
      userProfile: "id",
    });
  }
}

export const db = new AstraMindDatabase();
