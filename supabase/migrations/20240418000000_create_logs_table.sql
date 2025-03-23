-- Create a new table for application logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS logs_user_id_idx ON logs(user_id);
CREATE INDEX IF NOT EXISTS logs_conversation_id_idx ON logs(conversation_id);
CREATE INDEX IF NOT EXISTS logs_timestamp_idx ON logs(timestamp);
CREATE INDEX IF NOT EXISTS logs_level_idx ON logs(level);
CREATE INDEX IF NOT EXISTS logs_category_idx ON logs(category);

-- Add RLS (Row Level Security) policies
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own logs
CREATE POLICY logs_select_policy ON logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow users to insert their own logs
CREATE POLICY logs_insert_policy ON logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own logs
CREATE POLICY logs_update_policy ON logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only allow users to delete their own logs
CREATE POLICY logs_delete_policy ON logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to access all logs
CREATE POLICY logs_service_policy ON logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_logs_updated_at
BEFORE UPDATE ON logs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); 