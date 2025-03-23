-- Create a table for storing user public keys
CREATE TABLE IF NOT EXISTS user_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own keys
CREATE POLICY "Users can read their own keys" ON user_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own keys
CREATE POLICY "Users can insert their own keys" ON user_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own keys
CREATE POLICY "Users can update their own keys" ON user_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add column to conversations table for conversation public key
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS public_key TEXT;

-- Add encryption fields to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
ADD COLUMN IF NOT EXISTS nonce TEXT; 