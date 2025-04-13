-- Create mentalhealth bucket for file uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentalhealth', 'mentalhealth', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets
SET public = true
WHERE id = 'mentalhealth';

-- Create storage policy for authenticated uploads
DROP POLICY IF EXISTS "Users can upload files to mentalhealth" ON storage.objects;
CREATE POLICY "Users can upload files to mentalhealth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mentalhealth'
);

-- Create storage policy for public downloads
DROP POLICY IF EXISTS "Public can download files from mentalhealth" ON storage.objects;
CREATE POLICY "Public can download files from mentalhealth"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mentalhealth'); 