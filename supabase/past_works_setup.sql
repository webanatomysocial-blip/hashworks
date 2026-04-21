-- Create past_works table to showcase completed projects
CREATE TABLE IF NOT EXISTS public.past_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hirer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    payout NUMERIC NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional: unique constraint to prevent duplicate logging
    CONSTRAINT unique_past_work UNIQUE (job_id, worker_id)
);

-- Enable RLS
ALTER TABLE public.past_works ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read past works
CREATE POLICY "Allow public read-only access to past_works" 
ON public.past_works FOR SELECT 
TO authenticated 
USING (true);

-- Allow system to insert past works
CREATE POLICY "Allow authenticated users to insert past_works" 
ON public.past_works FOR INSERT 
TO authenticated 
WITH CHECK (true);
