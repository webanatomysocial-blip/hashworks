-- 1. Extend jobs table with location columns
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- 2. Add performance indexes for location columns
CREATE INDEX IF NOT EXISTS jobs_lat_lng_idx ON public.jobs (latitude, longitude);

-- 3. Create Nearby Jobs RPC Function (Haversine Formula)
CREATE OR REPLACE FUNCTION get_nearby_jobs(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  category_filter text DEFAULT 'all',
  mode_filter text DEFAULT 'all',
  urgency_filter text DEFAULT 'all',
  search_term text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  budget_min numeric,
  budget_max numeric,
  location_type text,
  city text,
  urgency text,
  created_at timestamptz,
  status text,
  hirer_id uuid,
  latitude double precision,
  longitude double precision,
  distance double precision,
  hirer_first_name text,
  hirer_last_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id, 
    j.title, 
    j.category, 
    j.budget_min, 
    j.budget_max, 
    j.location_type, 
    j.city, 
    j.urgency, 
    j.created_at, 
    j.status, 
    j.hirer_id,
    j.latitude,
    j.longitude,
    (6371 * acos(
      least(1, greatest(-1, 
        cos(radians(user_lat)) * cos(radians(j.latitude)) * 
        cos(radians(j.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(j.latitude))
      ))
    )) AS distance,
    p.first_name as hirer_first_name,
    p.last_name as hirer_last_name
  FROM jobs j
  JOIN profiles p ON j.hirer_id = p.id
  WHERE j.status = 'active'
    AND p.is_deleted = false
    AND (category_filter = 'all' OR j.category = category_filter)
    AND (mode_filter = 'all' OR j.location_type = mode_filter)
    AND (urgency_filter = 'all' OR j.urgency = urgency_filter)
    AND (search_term = '' OR j.title ILIKE '%' || search_term || '%')
    AND (
      radius_km <= 0 -- Show all if radius is 0 or less
      OR j.latitude IS NULL -- Include jobs without location if "All" is selected? (Actually better to exclude if radius set)
      OR (radius_km > 0 AND (6371 * acos(
        least(1, greatest(-1, 
          cos(radians(user_lat)) * cos(radians(j.latitude)) * 
          cos(radians(j.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(j.latitude))
        ))
      )) <= radius_km)
    )
  ORDER BY 
    CASE WHEN radius_km > 0 THEN (6371 * acos(
      least(1, greatest(-1, 
        cos(radians(user_lat)) * cos(radians(j.latitude)) * 
        cos(radians(j.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(j.latitude))
      ))
    )) ELSE NULL END ASC,
    j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
