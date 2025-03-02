-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add conversation_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Add RLS policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id); 