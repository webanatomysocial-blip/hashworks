-- Enforce Referential Integrity with Cascading Deletes
-- This ensures that deleting a job automatically handles associated data

-- 1. Handle Applications
ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_job_id_fkey,
ADD CONSTRAINT applications_job_id_fkey 
  FOREIGN KEY (job_id) 
  REFERENCES public.jobs(id) 
  ON DELETE CASCADE;

-- 2. Handle Job Skills
ALTER TABLE public.job_skills
DROP CONSTRAINT IF EXISTS job_skills_job_id_fkey,
ADD CONSTRAINT job_skills_job_id_fkey 
  FOREIGN KEY (job_id) 
  REFERENCES public.jobs(id) 
  ON DELETE CASCADE;

-- 3. Handle Job Tools
ALTER TABLE public.job_tools
DROP CONSTRAINT IF EXISTS job_tools_job_id_fkey,
ADD CONSTRAINT job_tools_job_id_fkey 
  FOREIGN KEY (job_id) 
  REFERENCES public.jobs(id) 
  ON DELETE CASCADE;

-- 4. Handle Contracts
-- (Optional: You might want to keep contracts for billing history, 
-- but cascades are cleaner for pure consistency if the job is truly gone)
ALTER TABLE public.contracts
DROP CONSTRAINT IF EXISTS contracts_job_id_fkey,
ADD CONSTRAINT contracts_job_id_fkey 
  FOREIGN KEY (job_id) 
  REFERENCES public.jobs(id) 
  ON DELETE CASCADE;
