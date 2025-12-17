-- Remove overly permissive public leaderboard policy
DROP POLICY IF EXISTS "Public leaderboard access" ON creator_rewards;

-- Create anonymized leaderboard view for public access (no child_id exposed)
CREATE OR REPLACE VIEW public.creator_leaderboard AS
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

-- Grant read access to authenticated users only (not anonymous)
GRANT SELECT ON public.creator_leaderboard TO authenticated;

-- Add comment explaining the security rationale
COMMENT ON VIEW public.creator_leaderboard IS 
'Anonymized leaderboard view - does not expose child_id or any PII. Safe for display to authenticated users.';

-- Run ANALYZE on affected table
ANALYZE creator_rewards;