-- Add performance indexes for existing tables only
-- Note: Without CONCURRENTLY to work within transaction block

-- Index for children lookups by parent
CREATE INDEX IF NOT EXISTS idx_children_parent_id 
  ON children(parent_id) WHERE parent_id IS NOT NULL;

-- Index for user progress queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_progress_child_lesson_status 
  ON user_progress(child_id, lesson_id, status);

-- Index for lesson reviews by status and priority
CREATE INDEX IF NOT EXISTS idx_lesson_reviews_status_priority 
  ON lesson_reviews(status, priority, assigned_at) 
  WHERE status IN ('pending', 'in_review');

-- Partial index for active lessons only (most queries filter by is_active)
CREATE INDEX IF NOT EXISTS idx_lessons_active_grade_subject 
  ON lessons(grade_level, subject, created_at DESC) 
  WHERE is_active = true;

-- Index for public shared lessons (community features)
CREATE INDEX IF NOT EXISTS idx_child_generated_lessons_public 
  ON child_generated_lessons(share_status, grade_level, created_at DESC) 
  WHERE is_active = true AND share_status = 'public';

-- Index for parent notifications
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent_read 
  ON parent_notifications(parent_id, is_read, created_at DESC);

-- Index for collaboration requests
CREATE INDEX IF NOT EXISTS idx_collaboration_requests_recipient_status 
  ON collaboration_requests(recipient_child_id, status, created_at DESC);

-- Index for emotion logs by child and date
CREATE INDEX IF NOT EXISTS idx_emotion_logs_child_logged 
  ON emotion_logs(child_id, logged_at DESC);

-- Index for lesson analytics events
CREATE INDEX IF NOT EXISTS idx_lesson_analytics_events_lesson_child 
  ON lesson_analytics_events(lesson_id, child_id, created_at DESC);

-- Analyze tables to update query planner statistics
ANALYZE children;
ANALYZE user_progress;
ANALYZE lessons;
ANALYZE lesson_reviews;
ANALYZE child_generated_lessons;
ANALYZE parent_notifications;
ANALYZE collaboration_requests;
ANALYZE emotion_logs;
ANALYZE lesson_analytics_events;