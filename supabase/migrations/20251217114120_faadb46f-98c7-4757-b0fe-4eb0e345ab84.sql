-- Drop and recreate view with SECURITY INVOKER (safer - uses caller's permissions)
DROP VIEW IF EXISTS public.creator_leaderboard;

CREATE VIEW public.creator_leaderboard 
WITH (security_invoker = true) AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
  'Creator #' || ROW_NUMBER() OVER (ORDER BY created_at ASC) as display_name,
  total_points,
  level,
  array_length(badges, 1) as badge_count
FROM creator_rewards
WHERE total_points > 0
ORDER BY total_points DESC
LIMIT 100;

-- Grant read access to authenticated users only
GRANT SELECT ON public.creator_leaderboard TO authenticated;

-- Add RLS policy for parents to view their children's actual rewards
DROP POLICY IF EXISTS "Parents can view their children's rewards" ON creator_rewards;
CREATE POLICY "Parents can view their children's rewards"
ON creator_rewards FOR SELECT
USING (child_id IN (
  SELECT id FROM children WHERE parent_id = auth.uid()
));

-- Add admin policy
DROP POLICY IF EXISTS "Admins can view all creator rewards" ON creator_rewards;
CREATE POLICY "Admins can view all creator rewards"
ON creator_rewards FOR SELECT
USING (has_role(auth.uid(), 'admin'));