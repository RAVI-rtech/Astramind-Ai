-- Supabase Database Schema for AstraMind Persistent Chat History
-- Run this script in the Supabase SQL Editor if table auto-creation is disabled.

-- 1. Create Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Index for efficient user-based queries ordered by most recently updated
CREATE INDEX IF NOT EXISTS conversations_user_id_updated_at_idx 
  ON conversations (user_id, updated_at DESC);

-- 2. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_used TEXT
);

-- Index for efficient message loading ordered by creation time
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx 
  ON messages (conversation_id, created_at ASC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policy for Conversations
DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;
CREATE POLICY "Users can manage their own conversations" 
  ON conversations 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- 5. Create RLS Policy for Messages
DROP POLICY IF EXISTS "Users can manage their own messages" ON messages;
CREATE POLICY "Users can manage their own messages" 
  ON messages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );
