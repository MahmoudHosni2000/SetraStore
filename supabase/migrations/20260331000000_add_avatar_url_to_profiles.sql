-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for avatars (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop policies first (in case they already exist), then recreate
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to read avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
