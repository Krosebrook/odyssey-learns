-- Fix 1: Add is_admin function (required by AdminDashboard)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Fix 2: Seed avatar items data (required by AvatarCustomizer)
INSERT INTO public.avatar_items (item_type, item_name, item_svg_data, points_cost, is_default) VALUES
-- Hair options
('hair', 'Short Hair', '<path d="M50,20 Q30,10 10,20 L10,40 L90,40 L90,20 Q70,10 50,20" fill="currentColor"/>', 0, true),
('hair', 'Long Hair', '<path d="M20,15 Q50,5 80,15 L80,60 Q50,70 20,60 Z" fill="currentColor"/>', 50, false),
('hair', 'Curly Hair', '<circle cx="30" cy="25" r="8" fill="currentColor"/><circle cx="50" cy="20" r="10" fill="currentColor"/><circle cx="70" cy="25" r="8" fill="currentColor"/>', 100, false),
('hair', 'Spiky Hair', '<polygon points="30,10 35,30 40,10 45,30 50,5 55,30 60,10 65,30 70,10" fill="currentColor"/>', 150, false),

-- Accessories
('accessory', 'None', '', 0, true),
('accessory', 'Cool Glasses', '<rect x="20" y="40" width="25" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="55" y="40" width="25" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><line x1="45" y1="47" x2="55" y2="47" stroke="currentColor" stroke-width="2"/>', 75, false),
('accessory', 'Baseball Cap', '<ellipse cx="50" cy="25" rx="35" ry="12" fill="currentColor"/><rect x="15" y="20" width="70" height="8" rx="4" fill="currentColor"/>', 100, false),
('accessory', 'Crown', '<polygon points="50,10 45,25 35,22 30,35 50,30 70,35 65,22 55,25" fill="gold" stroke="currentColor"/>', 200, false),
('accessory', 'Star Headband', '<rect x="20" y="28" width="60" height="4" rx="2" fill="currentColor"/><polygon points="50,15 52,22 59,22 53,27 55,34 50,29 45,34 47,27 41,22 48,22" fill="gold"/>', 150, false),

-- Face colors (skin tones)
('color', 'Light', '#FFE0BD', 0, true),
('color', 'Medium', '#D4A574', 0, false),
('color', 'Tan', '#C68642', 0, false),
('color', 'Dark', '#8D5524', 0, false),
('color', 'Blue (Fun)', '#87CEEB', 50, false),
('color', 'Pink (Fun)', '#FFB6C1', 50, false),
('color', 'Green (Fun)', '#90EE90', 50, false);

-- Fix 3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_child_id ON public.user_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_child_id ON public.emotion_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_child_id ON public.analytics_events(child_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_child_id ON public.user_badges(child_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_child_date ON public.screen_time_sessions(child_id, session_start);

-- Fix 4: Create streak calculation function (performance optimization)
CREATE OR REPLACE FUNCTION public.calculate_streak(p_child_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_streak integer := 0;
  v_dates date[];
  v_today date := CURRENT_DATE;
  v_expected_date date;
BEGIN
  -- Get distinct completion dates
  SELECT ARRAY_AGG(DISTINCT DATE(completed_at) ORDER BY DATE(completed_at) DESC)
  INTO v_dates
  FROM user_progress
  WHERE child_id = p_child_id 
    AND status = 'completed'
    AND completed_at >= v_today - INTERVAL '90 days';
  
  IF v_dates IS NULL OR array_length(v_dates, 1) = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate consecutive days
  FOR i IN 1..array_length(v_dates, 1) LOOP
    v_expected_date := v_today - (i - 1);
    IF v_dates[i] = v_expected_date THEN
      v_streak := v_streak + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$;