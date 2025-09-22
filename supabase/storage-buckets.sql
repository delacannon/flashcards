-- Create storage buckets for the application

-- Create bucket for background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-images', 'background-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for background-images bucket
CREATE POLICY "Anyone can view background images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'background-images');

CREATE POLICY "Authenticated users can upload background images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'background-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own background images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'background-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own background images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'background-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Set up storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );