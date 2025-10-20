
-- Drop the existing lesson_review_dashboard view
DROP VIEW IF EXISTS public.lesson_review_dashboard;

-- Recreate the view with SECURITY INVOKER to use querying user's permissions
-- This ensures RLS policies are properly enforced
CREATE VIEW public.lesson_review_dashboard 
WITH (security_invoker = true)
AS
SELECT 
  l.id AS lesson_id,
  l.title,
  l.subject,
  l.grade_level,
  l.created_at AS lesson_created_at,
  lr.id AS review_id,
  lr.status AS review_status,
  lr.overall_score,
  lr.reviewer_id,
  p.full_name AS reviewer_name,
  lr.assigned_at,
  lr.started_at,
  lr.completed_at,
  lr.strengths,
  lr.weaknesses,
  lr.suggestions,
  CASE
    WHEN lr.status = 'pending' THEN 'Pending Review'
    WHEN lr.status = 'in_review' THEN 'In Progress'
    WHEN lr.status = 'approved' THEN 'Approved'
    WHEN lr.status = 'rejected' THEN 'Rejected'
    WHEN lr.status = 'needs_revision' THEN 'Needs Revision'
  END AS status_label
FROM lessons l
LEFT JOIN lesson_reviews lr ON l.id = lr.lesson_id
LEFT JOIN profiles p ON lr.reviewer_id = p.id
WHERE l.is_active = true;

-- Add comment explaining the security model
COMMENT ON VIEW public.lesson_review_dashboard IS 
'Dashboard view for lesson reviews. Uses SECURITY INVOKER to enforce RLS policies of the querying user (admin-only access enforced by lesson_reviews RLS policies).';
