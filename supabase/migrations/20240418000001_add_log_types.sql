-- Create enum types for log levels and categories
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warning', 'error');
CREATE TYPE log_category AS ENUM ('chat', 'auth', 'system', 'encryption', 'file');

-- Alter the logs table to use these enum types 
ALTER TABLE logs 
  ALTER COLUMN level TYPE log_level USING level::log_level,
  ALTER COLUMN category TYPE log_category USING category::log_category;

-- Create a function to get logs by user_id
CREATE OR REPLACE FUNCTION get_user_logs(
  user_id_param UUID,
  level_param log_level DEFAULT NULL,
  category_param log_category DEFAULT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  limit_param INTEGER DEFAULT 100,
  offset_param INTEGER DEFAULT 0
)
RETURNS SETOF logs
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM logs
  WHERE 
    user_id = user_id_param
    AND (level_param IS NULL OR level = level_param)
    AND (category_param IS NULL OR category = category_param)
    AND (start_date IS NULL OR timestamp >= start_date)
    AND (end_date IS NULL OR timestamp <= end_date)
  ORDER BY timestamp DESC
  LIMIT limit_param
  OFFSET offset_param;
$$;

-- Create a function to get logs by conversation_id
CREATE OR REPLACE FUNCTION get_conversation_logs(
  conversation_id_param UUID,
  level_param log_level DEFAULT NULL,
  category_param log_category DEFAULT NULL,
  limit_param INTEGER DEFAULT 100,
  offset_param INTEGER DEFAULT 0
)
RETURNS SETOF logs
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM logs
  WHERE 
    conversation_id = conversation_id_param
    AND (level_param IS NULL OR level = level_param)
    AND (category_param IS NULL OR category = category_param)
  ORDER BY timestamp DESC
  LIMIT limit_param
  OFFSET offset_param;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION get_user_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_logs TO authenticated; 