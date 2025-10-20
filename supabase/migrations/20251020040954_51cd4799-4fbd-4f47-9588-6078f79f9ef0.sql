
-- Split the broad ALL policy into separate policies for better granularity and audit trail
-- This allows for more precise access control and clearer security posture

-- Drop the existing ALL policy
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.lesson_reviews;

-- Create separate policies for each operation
CREATE POLICY "Admins can create reviews"
  ON public.lesson_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reviews"
  ON public.lesson_reviews
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reviews"
  ON public.lesson_reviews
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for reviewers to update their assigned reviews
-- This allows future expansion where non-admin reviewers can update their own reviews
CREATE POLICY "Reviewers can update assigned reviews"
  ON public.lesson_reviews
  FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- Add comment explaining the security model
COMMENT ON TABLE public.lesson_reviews IS 
'Lesson review workflow table. RLS policies enforce: (1) Only admins can create/delete reviews, (2) Admins can update any review, (3) Assigned reviewers can update their own reviews. The create_review_for_new_lesson() trigger uses SECURITY DEFINER to bypass RLS for automated review creation.';
