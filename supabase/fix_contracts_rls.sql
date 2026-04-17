-- 1. Ensure contracts are visible to both worker and hirer
-- This table has worker_id and hirer_id columns
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.contracts;
CREATE POLICY "Users can view their own contracts"
ON public.contracts FOR SELECT
TO authenticated
USING (auth.uid() = worker_id OR auth.uid() = hirer_id);

-- 2. Ensure jobs are visible to the worker assigned to them
-- Plus the general 'active' jobs
DROP POLICY IF EXISTS "Jobs are viewable by assigned worker or if active" ON public.jobs;
CREATE POLICY "Jobs are viewable by assigned worker or if active"
ON public.jobs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contracts.job_id = jobs.id
    AND contracts.worker_id = auth.uid()
  )
  OR status = 'active'
  OR status = 'in_progress'
);

-- 3. Ensure profiles are publicly viewable for basic info
-- (Needed for the join to work)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 4. Application view permissions
DROP POLICY IF EXISTS "Workers can view their applications" ON public.applications;
CREATE POLICY "Workers can view their applications"
ON public.applications FOR SELECT
TO authenticated
USING (auth.uid() = worker_id);
