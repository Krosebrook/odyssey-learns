-- Phase 1: Critical Performance & Scalability Indexes

-- 1. Children queries (useValidatedChild, dashboard loads)
CREATE INDEX IF NOT EXISTS idx_children_parent_id_active 
ON public.children(parent_id, id) 
WHERE total_points >= 0;

-- 2. User progress queries (performance analytics, student tracking)
CREATE INDEX IF NOT EXISTS idx_user_progress_child_lesson_status 
ON public.user_progress(child_id, lesson_id, status, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_performance 
ON public.user_progress(lesson_id, status, score) 
WHERE status = 'completed';

-- 3. Screen time queries (screenTimeEnforcement.ts)
CREATE INDEX IF NOT EXISTS idx_screen_time_child_date 
ON public.screen_time_sessions(child_id, session_start DESC) 
WHERE session_end IS NOT NULL;

-- 4. Daily lesson quota (platform lesson limits)
CREATE INDEX IF NOT EXISTS idx_daily_quota_child_date 
ON public.daily_lesson_quota(child_id, quota_date DESC);

-- 5. Analytics events (engagement tracking)
CREATE INDEX IF NOT EXISTS idx_analytics_child_timestamp 
ON public.analytics_events(child_id, timestamp DESC);

-- 6. Collaboration requests (peer features)
CREATE INDEX IF NOT EXISTS idx_collab_recipient_status 
ON public.collaboration_requests(recipient_child_id, status, created_at DESC);

-- 7. Error logs cleanup queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_severity 
ON public.error_logs(created_at DESC, severity) 
WHERE severity IN ('critical', 'error');

-- 8. Rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint_window 
ON public.api_rate_limits(user_id, endpoint, window_start DESC);

-- 9. Lesson analytics events (creator rewards)
CREATE INDEX IF NOT EXISTS idx_lesson_analytics_events_lesson 
ON public.lesson_analytics_events(lesson_id, event_type, created_at DESC);

-- 10. Child generated lessons (community features)
CREATE INDEX IF NOT EXISTS idx_child_lessons_share_status 
ON public.child_generated_lessons(share_status, is_active, created_at DESC) 
WHERE share_status = 'public' AND is_active = true;

-- Add idempotency table for lesson generation deduplication
CREATE TABLE IF NOT EXISTS public.lesson_generation_dedup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  lesson_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_dedup_key_expires ON public.lesson_generation_dedup(idempotency_key, expires_at);

-- RLS policies for deduplication table
ALTER TABLE public.lesson_generation_dedup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own dedup records"
ON public.lesson_generation_dedup
FOR ALL
USING (
  child_id IN (
    SELECT id FROM public.children WHERE parent_id = auth.uid()
  )
);

-- Cleanup function for expired deduplication records
CREATE OR REPLACE FUNCTION cleanup_expired_dedup_records()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM lesson_generation_dedup 
  WHERE expires_at < NOW();
$$;

COMMENT ON TABLE public.lesson_generation_dedup IS 'Prevents duplicate lesson generation requests via idempotency keys';
COMMENT ON INDEX idx_children_parent_id_active IS 'Optimizes parent dashboard and child validation queries';
COMMENT ON INDEX idx_user_progress_child_lesson_status IS 'Optimizes student performance tracking';
COMMENT ON INDEX idx_screen_time_child_date IS 'Optimizes daily screen time calculations';
COMMENT ON INDEX idx_daily_quota_child_date IS 'Optimizes lesson quota checks';