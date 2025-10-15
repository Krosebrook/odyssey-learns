-- Migration for Phase 3: Emotional Intelligence

-- 1. Emotional Check-Ins Table
CREATE TABLE IF NOT EXISTS emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  emotion_type TEXT NOT NULL CHECK (emotion_type IN ('happy', 'excited', 'proud', 'calm', 'worried', 'sad', 'angry', 'frustrated', 'tired', 'confused')),
  intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
  trigger TEXT,
  coping_strategy TEXT,
  reflection_notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on emotion_logs
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's emotion logs
CREATE POLICY "Parents can view children emotion logs"
ON emotion_logs FOR SELECT
TO authenticated
USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

-- Parents can insert emotion logs for their children
CREATE POLICY "Parents can create children emotion logs"
ON emotion_logs FOR INSERT
TO authenticated
WITH CHECK (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

-- 2. Achievement Badges Table
CREATE TABLE IF NOT EXISTS achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'emotional', 'social', 'streak', 'mastery')),
  icon TEXT NOT NULL,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_reward INTEGER DEFAULT 0,
  unlock_criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on achievement_badges
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view badges
CREATE POLICY "Authenticated users can view badges"
ON achievement_badges FOR SELECT
TO authenticated
USING (is_active = true);

-- 3. User Badges (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES achievement_badges(badge_id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  progress INTEGER DEFAULT 100,
  UNIQUE(child_id, badge_id)
);

-- Enable RLS on user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's badges
CREATE POLICY "Parents can view children badges"
ON user_badges FOR SELECT
TO authenticated
USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

-- Parents can insert badges for their children
CREATE POLICY "Parents can award children badges"
ON user_badges FOR INSERT
TO authenticated
WITH CHECK (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_emotion_logs_child_id ON emotion_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_logged_at ON emotion_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_child_id ON user_badges(child_id);

-- Seed achievement badges
INSERT INTO achievement_badges (badge_id, name, description, category, icon, tier, points_reward, unlock_criteria) VALUES
('first_lesson', 'First Steps', 'Complete your first lesson', 'academic', '🎓', 'bronze', 10, '{"type": "lesson_count", "target": 1}'),
('five_lessons', 'Learning Streak', 'Complete 5 lessons', 'academic', '📚', 'silver', 25, '{"type": "lesson_count", "target": 5}'),
('ten_lessons', 'Knowledge Seeker', 'Complete 10 lessons', 'academic', '🏆', 'gold', 50, '{"type": "lesson_count", "target": 10}'),
('first_emotion', 'Self Aware', 'Log your first emotion check-in', 'emotional', '💭', 'bronze', 15, '{"type": "emotion_count", "target": 1}'),
('five_emotions', 'Emotional Explorer', 'Log 5 emotion check-ins', 'emotional', '🌈', 'silver', 30, '{"type": "emotion_count", "target": 5}'),
('week_streak', 'Consistent Learner', 'Maintain a 7-day learning streak', 'streak', '🔥', 'silver', 40, '{"type": "streak", "target": 7}'),
('month_streak', 'Dedication Master', 'Maintain a 30-day learning streak', 'streak', '⭐', 'gold', 100, '{"type": "streak", "target": 30}'),
('quest_master', 'Quest Champion', 'Complete 5 daily quests', 'mastery', '🎯', 'gold', 75, '{"type": "quest_count", "target": 5}'),
('all_subjects', 'Well Rounded', 'Complete lessons in all subjects', 'mastery', '🌟', 'platinum', 150, '{"type": "all_subjects", "target": 4}')
ON CONFLICT (badge_id) DO NOTHING;