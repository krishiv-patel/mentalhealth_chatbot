-- Add new profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Update the handle_new_user function to initialize these fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name, gender, date_of_birth)
  VALUES (new.id, split_part(new.email, '@', 1), NULL, NULL, NULL, NULL);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 