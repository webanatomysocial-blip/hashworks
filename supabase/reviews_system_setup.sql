-- Update reviews table and add rating calculation logic

-- 1. Add reviewer_role column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='reviewer_role') THEN
        ALTER TABLE public.reviews ADD COLUMN reviewer_role TEXT;
    END IF;
END $$;

-- 2. Add unique constraint to prevent double reviews for the same contract by the same user
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS unique_contract_reviewer;
ALTER TABLE public.reviews ADD CONSTRAINT unique_contract_reviewer UNIQUE (contract_id, reviewer_id);

-- 3. Function to update average_rating in profiles
CREATE OR REPLACE FUNCTION public.update_profile_rating() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM public.reviews
        WHERE reviewee_id = NEW.reviewee_id
    )
    WHERE id = NEW.reviewee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to call the function after a new review is inserted
DROP TRIGGER IF EXISTS tr_update_rating ON public.reviews;
CREATE TRIGGER tr_update_rating
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- 5. RLS Policies (Check and Update)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-only access to reviews" ON public.reviews;
CREATE POLICY "Allow public read-only access to reviews" 
ON public.reviews FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow users to insert reviews for their contracts" ON public.reviews;
CREATE POLICY "Allow users to insert reviews for their contracts" 
ON public.reviews FOR INSERT 
TO authenticated 
WITH CHECK (
    reviewer_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.contracts 
        WHERE id = contract_id AND (hirer_id = auth.uid() OR worker_id = auth.uid())
    )
);
