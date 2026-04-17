-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('Avatar', 'Avatar', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('Resume-CV', 'Resume-CV', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resume" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Set up RLS Policies for 'Avatar' bucket
-- Allow anyone to read public avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'Avatar' );

-- Allow authenticated users to upload/update their own avatar
-- This handles the naming convention: userId.extension
CREATE POLICY "Users can manage their own avatar"
ON storage.objects FOR ALL -- Covers INSERT, UPDATE, DELETE
TO authenticated
USING (
  bucket_id = 'Avatar' AND
  (storage.filename(name) LIKE (auth.uid()::text || '.%'))
)
WITH CHECK (
  bucket_id = 'Avatar' AND
  (storage.filename(name) LIKE (auth.uid()::text || '.%'))
);

-- 4. Set up RLS Policies for 'Resume-CV' bucket
-- Resumes are private; stored in folder: userId/resume.pdf
CREATE POLICY "Users can manage their own resume"
ON storage.objects FOR ALL
TO authenticated
USING ( 
  bucket_id = 'Resume-CV' AND 
  (storage.foldername(name))[1] = auth.uid()::text 
)
WITH CHECK (
  bucket_id = 'Resume-CV' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Set up Profile RLS
-- Ensure users can update their own profile record
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also allow users to read profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);
