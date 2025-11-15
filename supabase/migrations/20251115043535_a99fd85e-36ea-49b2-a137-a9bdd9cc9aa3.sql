-- ========================================
-- FEATURE 2: ENHANCED REVIEW SYSTEM
-- ========================================

-- Add reviewer assignment and priority to lesson_reviews
ALTER TABLE lesson_reviews 
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS auto_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- Add quality trends tracking
CREATE TABLE IF NOT EXISTS lesson_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  review_id UUID REFERENCES lesson_reviews(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  overall_score NUMERIC,
  category_scores JSONB,
  reviewer_id UUID
);

-- Add review performance tracking
CREATE TABLE IF NOT EXISTS reviewer_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL,
  total_reviews INTEGER DEFAULT 0,
  avg_review_time_minutes NUMERIC DEFAULT 0,
  avg_score_given NUMERIC DEFAULT 0,
  reviews_this_week INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id)
);

-- Indexes for review performance
CREATE INDEX IF NOT EXISTS idx_reviews_priority ON lesson_reviews(priority, status);
CREATE INDEX IF NOT EXISTS idx_quality_scores_lesson ON lesson_quality_scores(lesson_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_performance ON reviewer_performance(reviewer_id);

-- ========================================
-- FEATURE 3: PERFORMANCE ANALYTICS
-- ========================================

-- Create comprehensive performance tracking
CREATE TABLE IF NOT EXISTS lesson_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  
  -- Completion & Engagement
  total_attempts INTEGER DEFAULT 0,
  completed_attempts INTEGER DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  avg_time_spent_seconds INTEGER DEFAULT 0,
  
  -- Assessment Performance
  total_quiz_submissions INTEGER DEFAULT 0,
  avg_quiz_score NUMERIC DEFAULT 0,
  quiz_score_distribution JSONB DEFAULT '{}',
  
  -- Difficulty Analysis
  difficulty_rating NUMERIC DEFAULT 0,
  struggle_indicators INTEGER DEFAULT 0,
  help_requests INTEGER DEFAULT 0,
  
  -- Learning Outcomes
  first_attempt_success_rate NUMERIC DEFAULT 0,
  improvement_rate NUMERIC DEFAULT 0,
  
  -- Metadata
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  sample_size INTEGER DEFAULT 0
);

-- Track individual student performance patterns
CREATE TABLE IF NOT EXISTS student_lesson_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  attempts INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  
  completed BOOLEAN DEFAULT FALSE,
  struggled BOOLEAN DEFAULT FALSE,
  mastered BOOLEAN DEFAULT FALSE,
  
  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  
  UNIQUE(child_id, lesson_id)
);

-- Aggregate daily performance
CREATE TABLE IF NOT EXISTS daily_lesson_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  
  students_attempted INTEGER DEFAULT 0,
  students_completed INTEGER DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  avg_time_minutes NUMERIC DEFAULT 0,
  
  UNIQUE(lesson_id, stat_date)
);

-- Indexes for performance analytics
CREATE INDEX IF NOT EXISTS idx_performance_lesson ON lesson_performance_metrics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_perf_child ON student_lesson_performance(child_id);
CREATE INDEX IF NOT EXISTS idx_student_perf_lesson ON student_lesson_performance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_lesson_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_lesson ON daily_lesson_stats(lesson_id);

-- Function to update performance metrics
CREATE OR REPLACE FUNCTION update_lesson_performance_metrics(p_lesson_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO lesson_performance_metrics (
    lesson_id, 
    total_attempts, 
    completed_attempts, 
    completion_rate, 
    avg_quiz_score, 
    avg_time_spent_seconds,
    sample_size, 
    last_calculated_at
  )
  SELECT 
    p_lesson_id,
    COUNT(*),
    COUNT(*) FILTER (WHERE up.status = 'completed'),
    ROUND(COUNT(*) FILTER (WHERE up.status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2),
    ROUND(AVG(up.score), 2),
    ROUND(AVG(up.time_spent_seconds)),
    COUNT(DISTINCT up.child_id),
    NOW()
  FROM user_progress up
  WHERE up.lesson_id = p_lesson_id
  ON CONFLICT (lesson_id) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    completed_attempts = EXCLUDED.completed_attempts,
    completion_rate = EXCLUDED.completion_rate,
    avg_quiz_score = EXCLUDED.avg_quiz_score,
    avg_time_spent_seconds = EXCLUDED.avg_time_spent_seconds,
    sample_size = EXCLUDED.sample_size,
    last_calculated_at = NOW();
END;
$$;

-- RPC functions for performance analytics
CREATE OR REPLACE FUNCTION get_lesson_performance_overview(p_lesson_id UUID)
RETURNS TABLE(
  total_attempts BIGINT,
  completion_rate NUMERIC,
  avg_score NUMERIC,
  avg_time_minutes NUMERIC,
  difficulty_rating NUMERIC,
  sample_size BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_attempts,
    ROUND(COUNT(*) FILTER (WHERE up.status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as completion_rate,
    ROUND(AVG(up.score), 2) as avg_score,
    ROUND(AVG(up.time_spent_seconds) / 60.0, 1) as avg_time_minutes,
    CASE 
      WHEN AVG(up.score) >= 90 THEN 1.0
      WHEN AVG(up.score) >= 75 THEN 2.0
      WHEN AVG(up.score) >= 60 THEN 3.0
      WHEN AVG(up.score) >= 45 THEN 4.0
      ELSE 5.0
    END as difficulty_rating,
    COUNT(DISTINCT up.child_id) as sample_size
  FROM user_progress up
  WHERE up.lesson_id = p_lesson_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_struggling_students(p_lesson_id UUID)
RETURNS TABLE(
  child_id UUID,
  child_name TEXT,
  attempts INTEGER,
  avg_score NUMERIC,
  last_attempt TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    COUNT(up.*)::INTEGER as attempts,
    ROUND(AVG(up.score), 2) as avg_score,
    MAX(up.created_at) as last_attempt
  FROM children c
  JOIN user_progress up ON c.id = up.child_id
  WHERE up.lesson_id = p_lesson_id
    AND (up.score < 60 OR up.status = 'in_progress')
  GROUP BY c.id, c.name
  ORDER BY avg_score ASC;
END;
$$;

-- RLS Policies for new tables
ALTER TABLE lesson_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lesson_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_lesson_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quality scores" ON lesson_quality_scores
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view reviewer performance" ON reviewer_performance
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view performance metrics" ON lesson_performance_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Parents can view children performance" ON student_lesson_performance
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view daily stats" ON daily_lesson_stats
  FOR SELECT USING (auth.uid() IS NOT NULL);