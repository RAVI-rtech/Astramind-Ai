-- Supabase Database Schema for AstraMind Persistent Chat History & Student Profiles
-- Run this script in the Supabase SQL Editor if table auto-creation is disabled.

-- 0. User Profiles Table (with Roll Number, Branch, Section for Students)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  name TEXT,
  roll_number TEXT,
  branch TEXT,
  section TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  current_plan TEXT DEFAULT 'free',
  member_since TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure roll_number, branch, section columns exist if profile table was already created
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS section TEXT;

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

-- ==============================================================================
-- 6. LIVE QUIZ MULTIPLAYER SYSTEM SCHEMA (WITH REALTIME & STRICT RLS)
-- ==============================================================================

-- A. Live Quizzes (Drafts and Academic Quiz Templates)
CREATE TABLE IF NOT EXISTS live_quizzes (
  id TEXT PRIMARY KEY DEFAULT ('quiz_' || gen_random_uuid()::text),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  college TEXT NOT NULL DEFAULT 'Vignan Institute of Technology and Science',
  program_type TEXT NOT NULL DEFAULT 'B.Tech',
  regulation VARCHAR(20) NOT NULL DEFAULT 'VR25',
  branch TEXT NOT NULL,
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT DEFAULT '',
  topic TEXT DEFAULT '',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',
  assessment_type VARCHAR(50) NOT NULL DEFAULT 'Class Assessment',
  question_count INT NOT NULL DEFAULT 0,
  total_marks NUMERIC NOT NULL DEFAULT 0,
  timer_type VARCHAR(20) NOT NULL DEFAULT 'per_question',
  duration_seconds INT DEFAULT 0,
  time_per_question INT NOT NULL DEFAULT 30,
  marks_per_correct NUMERIC NOT NULL DEFAULT 1,
  negative_marks NUMERIC NOT NULL DEFAULT 0,
  question_order VARCHAR(20) NOT NULL DEFAULT 'fixed',
  explanation_policy VARCHAR(20) NOT NULL DEFAULT 'after_quiz',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published', 'archived')),
  room_code VARCHAR(6),
  questions_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_quizzes_host_idx ON live_quizzes (host_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS live_quizzes_academic_idx ON live_quizzes (regulation, branch, year, semester, subject);

-- Ensure older installations gain the general program field without replacing existing records.
ALTER TABLE live_quizzes ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'B.Tech';
ALTER TABLE live_quizzes ALTER COLUMN college SET DEFAULT 'Vignan Institute of Technology and Science';

-- B. Live Quiz Questions (Normalized question records)
CREATE TABLE IF NOT EXISTS live_quiz_questions (
  id TEXT PRIMARY KEY DEFAULT ('lqq_' || gen_random_uuid()::text),
  quiz_id TEXT NOT NULL REFERENCES live_quizzes(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_type VARCHAR(20) NOT NULL DEFAULT 'single_mcq' CHECK (question_type IN ('single_mcq', 'multiple_mcq', 'true_false')),
  question_text TEXT NOT NULL,
  image_url TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  marks NUMERIC NOT NULL DEFAULT 1,
  negative_marks NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_quiz_questions_quiz_idx ON live_quiz_questions (quiz_id, question_number ASC);

-- C. Live Quiz Rooms Table (Active game sessions)
CREATE TABLE IF NOT EXISTS live_quiz_rooms (
  id TEXT PRIMARY KEY DEFAULT ('lq_' || gen_random_uuid()::text),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  quiz_id TEXT REFERENCES live_quizzes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  college TEXT NOT NULL DEFAULT 'Vignan Institute of Technology and Science',
  program_type TEXT NOT NULL DEFAULT 'B.Tech',
  regulation VARCHAR(20) NOT NULL DEFAULT '',
  branch TEXT,
  year TEXT,
  semester TEXT,
  unit TEXT,
  topic TEXT,
  assessment_type VARCHAR(50) DEFAULT 'Class Assessment',
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  time_per_question INT NOT NULL DEFAULT 30,
  timer_type VARCHAR(20) NOT NULL DEFAULT 'per_question',
  duration_seconds INT DEFAULT 0,
  marks_per_correct NUMERIC NOT NULL DEFAULT 1,
  negative_marks NUMERIC NOT NULL DEFAULT 0,
  question_order VARCHAR(20) NOT NULL DEFAULT 'fixed',
  explanation_policy VARCHAR(20) NOT NULL DEFAULT 'after_quiz',
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  mode TEXT NOT NULL DEFAULT 'Classic',
  status TEXT NOT NULL CHECK (status IN ('lobby', 'in_progress', 'paused', 'ended')) DEFAULT 'lobby',
  current_question_index INT NOT NULL DEFAULT -1,
  question_start_time TIMESTAMPTZ,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  show_leaderboard BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS live_quiz_rooms_code_idx ON live_quiz_rooms (room_code);
CREATE INDEX IF NOT EXISTS live_quiz_rooms_host_idx ON live_quiz_rooms (host_user_id);
CREATE INDEX IF NOT EXISTS live_quiz_rooms_status_idx ON live_quiz_rooms (status);

-- Keep active rooms compatible with non-VITS programs on existing deployments.
ALTER TABLE live_quiz_rooms ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'B.Tech';
ALTER TABLE live_quiz_rooms ALTER COLUMN college SET DEFAULT 'Vignan Institute of Technology and Science';
ALTER TABLE live_quiz_rooms ALTER COLUMN regulation SET DEFAULT '';

-- D. Live Quiz Participants Table
CREATE TABLE IF NOT EXISTS live_quiz_participants (
  id TEXT PRIMARY KEY DEFAULT ('p_' || gen_random_uuid()::text),
  room_id TEXT NOT NULL REFERENCES live_quiz_rooms(id) ON DELETE CASCADE,
  room_code VARCHAR(6) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score NUMERIC NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unanswered_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  CONSTRAINT uq_room_user UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS live_quiz_participants_room_idx ON live_quiz_participants (room_id);
CREATE INDEX IF NOT EXISTS live_quiz_participants_user_idx ON live_quiz_participants (user_id);

-- E. Live Quiz Answers Table
CREATE TABLE IF NOT EXISTS live_quiz_answers (
  id TEXT PRIMARY KEY DEFAULT ('ans_' || gen_random_uuid()::text),
  room_id TEXT NOT NULL REFERENCES live_quiz_rooms(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES live_quiz_participants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_index INT NOT NULL,
  selected_answer JSONB NOT NULL,
  time_taken_ms INT NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  marks_awarded NUMERIC NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_room_user_question UNIQUE (room_id, user_id, question_index)
);

CREATE INDEX IF NOT EXISTS live_quiz_answers_lookup_idx ON live_quiz_answers (room_id, question_index);

-- F. Live Quiz Events Table (for audit trail, state sync, and real-time broadcast)
CREATE TABLE IF NOT EXISTS live_quiz_events (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || gen_random_uuid()::text),
  room_id TEXT NOT NULL REFERENCES live_quiz_rooms(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_quiz_events_room_idx ON live_quiz_events (room_id, created_at ASC);

-- G. Enable Row Level Security (RLS) on All Live Quiz Tables
ALTER TABLE live_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_events ENABLE ROW LEVEL SECURITY;

-- H. RLS Policies for live_quizzes
DROP POLICY IF EXISTS "Hosts can manage their own quizzes" ON live_quizzes;
CREATE POLICY "Hosts can manage their own quizzes"
  ON live_quizzes
  FOR ALL
  TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- I. RLS Policies for live_quiz_questions
DROP POLICY IF EXISTS "Hosts can manage their quiz questions" ON live_quiz_questions;
CREATE POLICY "Hosts can manage their quiz questions"
  ON live_quiz_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM live_quizzes
      WHERE live_quizzes.id = live_quiz_questions.quiz_id
      AND live_quizzes.host_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM live_quizzes
      WHERE live_quizzes.id = live_quiz_questions.quiz_id
      AND live_quizzes.host_user_id = auth.uid()
    )
  );

-- J. RLS Policies for live_quiz_rooms
DROP POLICY IF EXISTS "Authenticated users can read live quiz rooms" ON live_quiz_rooms;
CREATE POLICY "Authenticated users can read live quiz rooms"
  ON live_quiz_rooms
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Hosts can insert live quiz rooms" ON live_quiz_rooms;
CREATE POLICY "Hosts can insert live quiz rooms"
  ON live_quiz_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Hosts can update their live quiz rooms" ON live_quiz_rooms;
CREATE POLICY "Hosts can update their live quiz rooms"
  ON live_quiz_rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Hosts can delete their live quiz rooms" ON live_quiz_rooms;
CREATE POLICY "Hosts can delete their live quiz rooms"
  ON live_quiz_rooms
  FOR DELETE
  TO authenticated
  USING (auth.uid() = host_user_id);

-- K. RLS Policies for live_quiz_participants
DROP POLICY IF EXISTS "Authenticated users can view room participants" ON live_quiz_participants;
CREATE POLICY "Authenticated users can view room participants"
  ON live_quiz_participants
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can join as participants" ON live_quiz_participants;
CREATE POLICY "Users can join as participants"
  ON live_quiz_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM live_quiz_rooms
      WHERE live_quiz_rooms.id = live_quiz_participants.room_id
      AND live_quiz_rooms.status != 'ended'
    )
  );

DROP POLICY IF EXISTS "Users and host can update participant state" ON live_quiz_participants;
CREATE POLICY "Users and host can update participant state"
  ON live_quiz_participants
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM live_quiz_rooms
      WHERE live_quiz_rooms.id = live_quiz_participants.room_id
      AND live_quiz_rooms.host_user_id = auth.uid()
    )
  );

-- L. RLS Policies for live_quiz_answers
DROP POLICY IF EXISTS "Read access for quiz answers" ON live_quiz_answers;
CREATE POLICY "Read access for quiz answers"
  ON live_quiz_answers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM live_quiz_rooms
      WHERE live_quiz_rooms.id = live_quiz_answers.room_id
      AND live_quiz_rooms.host_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own answers" ON live_quiz_answers;
CREATE POLICY "Users can insert their own answers"
  ON live_quiz_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM live_quiz_rooms
      WHERE live_quiz_rooms.id = live_quiz_answers.room_id
      AND live_quiz_rooms.status = 'in_progress'
    )
  );

-- M. RLS Policies for live_quiz_events
DROP POLICY IF EXISTS "Authenticated users can view events for their room" ON live_quiz_events;
CREATE POLICY "Authenticated users can view events for their room"
  ON live_quiz_events
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Hosts can insert events" ON live_quiz_events;
CREATE POLICY "Hosts can insert events"
  ON live_quiz_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM live_quiz_rooms
      WHERE live_quiz_rooms.id = live_quiz_events.room_id
      AND live_quiz_rooms.host_user_id = auth.uid()
    )
  );

-- N. Enable Realtime Publications for Live Quiz
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_quiz_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_quiz_rooms;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_quiz_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_quiz_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_quiz_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_quiz_events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_quiz_answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_quiz_answers;
  END IF;
END $$;

-- ==============================================================================
-- O. Live Quiz Lobby Chat Table & Security Policies
-- ==============================================================================
CREATE TABLE IF NOT EXISTS live_quiz_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id TEXT NOT NULL,
  room_code VARCHAR(6) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_quiz_chat_quiz_idx ON live_quiz_chat_messages (quiz_id);
CREATE INDEX IF NOT EXISTS live_quiz_chat_room_code_idx ON live_quiz_chat_messages (room_code);
CREATE INDEX IF NOT EXISTS live_quiz_chat_created_idx ON live_quiz_chat_messages (created_at ASC);

ALTER TABLE live_quiz_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read live quiz chat messages" ON live_quiz_chat_messages;
CREATE POLICY "Authenticated users can read live quiz chat messages"
  ON live_quiz_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM live_quiz_rooms
      WHERE (live_quiz_rooms.id = live_quiz_chat_messages.quiz_id OR live_quiz_rooms.room_code = live_quiz_chat_messages.room_code)
      AND (
        live_quiz_rooms.host_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM live_quiz_participants
          WHERE live_quiz_participants.room_id = live_quiz_rooms.id
          AND live_quiz_participants.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Participants and hosts can insert chat messages" ON live_quiz_chat_messages;
CREATE POLICY "Participants and hosts can insert chat messages"
  ON live_quiz_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    char_length(trim(message)) > 0 AND
    char_length(message) <= 500 AND
    EXISTS (
      SELECT 1 FROM live_quiz_rooms
      WHERE (live_quiz_rooms.id = live_quiz_chat_messages.quiz_id OR live_quiz_rooms.room_code = live_quiz_chat_messages.room_code)
      AND (
        live_quiz_rooms.host_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM live_quiz_participants
          WHERE live_quiz_participants.room_id = live_quiz_rooms.id
          AND live_quiz_participants.user_id = auth.uid()
        )
      )
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_quiz_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_quiz_chat_messages;
  END IF;
END $$;


