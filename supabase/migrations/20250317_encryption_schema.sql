-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a helper function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.column_exists(
  target_table text,
  target_column text
) RETURNS boolean AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = target_table
    AND column_name = target_column
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Create user_keys table for storing public keys
CREATE TABLE IF NOT EXISTS user_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  public_key text NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_keys
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for user_keys
CREATE POLICY "Users can read own keys"
  ON user_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read others' public keys"
  ON user_keys
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own keys"
  ON user_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keys"
  ON user_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own keys"
  ON user_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure conversations table has the required columns
DO $$
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Add public_key column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'public_key'
  ) THEN
    ALTER TABLE conversations ADD COLUMN public_key text;
  END IF;
END $$;

-- Add encryption-related columns to messages if they don't exist
DO $$
BEGIN
  -- Add is_encrypted column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'is_encrypted'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_encrypted boolean DEFAULT false;
  END IF;

  -- Add encrypted_content column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'encrypted_content'
  ) THEN
    ALTER TABLE messages ADD COLUMN encrypted_content text;
  END IF;

  -- Add nonce column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'nonce'
  ) THEN
    ALTER TABLE messages ADD COLUMN nonce text;
  END IF;

  -- Ensure timestamp column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE messages ADD COLUMN timestamp timestamptz DEFAULT now();
  END IF;
END $$;

-- Create a function to get column names of a table
CREATE OR REPLACE FUNCTION public.get_column_names(
  table_name text
) RETURNS text[] AS $$
DECLARE
  columns text[];
BEGIN
  SELECT array_agg(column_name)
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = $1
  INTO columns;
  
  RETURN columns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 