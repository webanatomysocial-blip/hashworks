-- Update Dashboard Stats RPC to include Portfolio/Past Works counts

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'worker', jsonb_build_object(
      'active_gigs', (SELECT count(*)::int FROM public.contracts WHERE worker_id = p_user_id AND status = 'active'),
      'total_applications', (
         SELECT count(*)::int 
         FROM public.applications a
         JOIN public.jobs j ON a.job_id = j.id
         WHERE a.worker_id = p_user_id AND j.status = 'active'
      ),
      'past_works_count', (SELECT count(*)::int FROM public.past_works WHERE worker_id = p_user_id),
      'active_contracts', (SELECT count(*)::int FROM public.contracts WHERE worker_id = p_user_id AND status = 'active')
    ),
    'hirer', jsonb_build_object(
      'total_postings', (SELECT count(*)::int FROM public.jobs WHERE hirer_id = p_user_id),
      'active_jobs', (SELECT count(*)::int FROM public.jobs WHERE hirer_id = p_user_id AND status = 'active'),
      'past_works_count', (SELECT count(*)::int FROM public.past_works WHERE hirer_id = p_user_id),
      'pending_applications', (
         SELECT count(*)::int 
         FROM public.applications a 
         JOIN public.jobs j ON a.job_id = j.id 
         WHERE j.hirer_id = p_user_id AND a.status = 'pending' AND j.status = 'active'
      ),
      'active_contracts', (SELECT count(*)::int FROM public.contracts WHERE hirer_id = p_user_id AND status = 'active')
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
