-- Fix the children_safe view to use SECURITY INVOKER instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.children_safe;

CREATE VIEW public.children_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  parent_id,
  name,
  grade_level,
  avatar_config,
  total_points,
  created_at,
  challenge_mode_enabled,
  weekly_report_enabled,
  daily_quest_id,
  quest_completed_at,
  quest_bonus_points,
  daily_screen_time_limit_minutes,
  screen_time_enabled,
  -- Mask sensitive fields
  CASE WHEN pin_hash IS NOT NULL THEN '***PROTECTED***' ELSE NULL END as pin_status,
  deleted_at IS NOT NULL as is_deleted
  -- Note: pin_hash and deletion_reason are NOT exposed
FROM public.children;

-- Grant access to the safe view
GRANT SELECT ON public.children_safe TO authenticated;

COMMENT ON VIEW public.children_safe IS 
'Safe view of children table that masks sensitive fields (pin_hash, deletion_reason). Uses SECURITY INVOKER to respect RLS policies of the querying user.';