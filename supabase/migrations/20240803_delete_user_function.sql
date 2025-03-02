-- Create a function to allow users to delete their own accounts
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the ID of the current user
  current_user_id := auth.uid();
  
  -- Delete user data in the right order
  -- First delete related data with foreign key constraints
  DELETE FROM public.messages WHERE user_id = current_user_id;
  DELETE FROM public.conversations WHERE user_id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;
  
  -- Delete the user from auth schema (requires proper permissions)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated; 