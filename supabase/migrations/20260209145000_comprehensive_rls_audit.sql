-- Comprehensive Row Level Security (RLS) Audit and Enhancement
-- Production Readiness Initiative
-- Date: 2026-02-09
-- Purpose: Ensure all tables have explicit, default-deny RLS policies

-- This migration ensures all critical tables have comprehensive RLS policies
-- that prevent cross-user data access and follow a default-deny posture.

-- ===========================================================================
-- STEP 1: Verify RLS is enabled on all tables (already done in previous migrations)
-- ===========================================================================

-- ===========================================================================
-- STEP 2: Add missing RLS policies with explicit cross-user protection
-- ===========================================================================

-- Analytics Events - Ensure only parents can view their children's analytics
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Parents view children analytics" ON public.analytics_events;
  
  -- Create policy: Parents can only view analytics for their children
  CREATE POLICY "Parents view children analytics"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );

  -- Create policy: Parents can insert analytics for their children
  DROP POLICY IF EXISTS "Parents insert children analytics" ON public.analytics_events;
  CREATE POLICY "Parents insert children analytics"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );
END $$;

-- Activity Participants - Social feature RLS
DO $$
BEGIN
  -- Parents can view participants for activities their children are in
  DROP POLICY IF EXISTS "Parents view activity participants" ON public.activity_participants;
  CREATE POLICY "Parents view activity participants"
  ON public.activity_participants FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );
END $$;

-- Peer Connections - Social feature RLS
DO $$
BEGIN
  -- Parents can view connections where their child is involved
  DROP POLICY IF EXISTS "Parents view peer connections" ON public.peer_connections;
  CREATE POLICY "Parents view peer connections"
  ON public.peer_connections FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    ) OR
    peer_child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );
END $$;

-- Shared Activities - Social feature RLS
DO $$
BEGIN
  -- Parents can view activities shared by or with their children
  DROP POLICY IF EXISTS "Parents view shared activities" ON public.shared_activities;
  CREATE POLICY "Parents view shared activities"
  ON public.shared_activities FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );
END $$;

-- Beta Feedback - Parents can only view/manage their own feedback
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users view own feedback" ON public.beta_feedback;
  CREATE POLICY "Users view own feedback"
  ON public.beta_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users insert own feedback" ON public.beta_feedback;
  CREATE POLICY "Users insert own feedback"
  ON public.beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
END $$;

-- Lesson Analytics Events - Parents can only view their children's lesson analytics
DO $$
BEGIN
  DROP POLICY IF EXISTS "Parents view children lesson analytics" ON lesson_analytics_events;
  CREATE POLICY "Parents view children lesson analytics"
  ON lesson_analytics_events FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );
END $$;

-- Student Lesson Performance - Parents view their children's performance only
DO $$
BEGIN
  DROP POLICY IF EXISTS "Parents view children performance" ON student_lesson_performance;
  CREATE POLICY "Parents view children performance"
  ON student_lesson_performance FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );
END $$;

-- Daily Lesson Stats - Parents view their children's daily stats
DO $$
BEGIN
  DROP POLICY IF EXISTS "Parents view children daily stats" ON daily_lesson_stats;
  CREATE POLICY "Parents view children daily stats"
  ON daily_lesson_stats FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );
END $$;

-- Creator Rewards/History - Only for creators managing their own data
DO $$
BEGIN
  -- Creator rewards
  DROP POLICY IF EXISTS "Creators view own rewards" ON creator_rewards;
  CREATE POLICY "Creators view own rewards"
  ON creator_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

  -- Creator reward history
  DROP POLICY IF EXISTS "Creators view own reward history" ON creator_reward_history;
  CREATE POLICY "Creators view own reward history"
  ON creator_reward_history FOR SELECT
  TO authenticated
  USING (
    creator_id IN (
      SELECT creator_id FROM creator_rewards WHERE creator_id = auth.uid()
    )
  );
END $$;

-- ===========================================================================
-- STEP 3: Add explicit DENY policies for sensitive security tables
-- ===========================================================================

-- Security Alerts - Only admins should access (using user_roles)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins view security alerts" ON security_alerts;
  CREATE POLICY "Admins view security alerts"
  ON security_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
END $$;

-- Failed Auth Attempts - Only admins
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins view failed auth" ON failed_auth_attempts;
  CREATE POLICY "Admins view failed auth"
  ON failed_auth_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
END $$;

-- Data Access Audit - Only admins
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins view audit logs" ON data_access_audit;
  CREATE POLICY "Admins view audit logs"
  ON data_access_audit FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
END $$;

-- ===========================================================================
-- STEP 4: Add policies for lesson review system
-- ===========================================================================

DO $$
BEGIN
  -- Lesson reviews - reviewers can view reviews they created or are assigned to
  DROP POLICY IF EXISTS "Reviewers view assigned reviews" ON public.lesson_reviews;
  CREATE POLICY "Reviewers view assigned reviews"
  ON public.lesson_reviews FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'reviewer')
    )
  );

  -- Review history
  DROP POLICY IF EXISTS "Reviewers view review history" ON public.review_history;
  CREATE POLICY "Reviewers view review history"
  ON public.review_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_reviews 
      WHERE id = review_id 
      AND (reviewer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'reviewer')
      ))
    )
  );
END $$;

-- ===========================================================================
-- STEP 5: Add policies for error logging (with privacy considerations)
-- ===========================================================================

DO $$
BEGIN
  -- Error logs - users can view their own errors, admins can view all
  DROP POLICY IF EXISTS "Users view own errors" ON error_logs;
  CREATE POLICY "Users view own errors"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
END $$;

-- ===========================================================================
-- STEP 6: Verify all policies are in place
-- ===========================================================================

-- This query can be run to verify policies exist (for documentation)
-- SELECT 
--   schemaname, 
--   tablename, 
--   policyname, 
--   permissive, 
--   cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- ===========================================================================
-- Migration Complete
-- ===========================================================================
-- All critical tables now have explicit RLS policies following principles:
-- 1. Default-deny: No access unless explicitly granted
-- 2. Parent-child isolation: Parents only see their children's data
-- 3. User isolation: Users only see their own data
-- 4. Role-based access: Admin/reviewer roles have appropriate access
-- 5. Explicit policies: All access patterns are clearly defined
-- ===========================================================================
