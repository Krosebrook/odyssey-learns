-- Create daily_lesson_quota table for tracking usage limits
CREATE TABLE public.daily_lesson_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  quota_date DATE NOT NULL,
  platform_lessons_completed INTEGER DEFAULT 0,
  bonus_lessons_granted INTEGER DEFAULT 0,
  custom_lessons_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, quota_date)
);

-- Create lesson_tokens table for lesson unlock system
CREATE TABLE public.lesson_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  tokens_available INTEGER DEFAULT 3,
  tokens_used INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id)
);

-- Create child_generated_lessons table for custom lessons
CREATE TABLE public.child_generated_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  content_markdown TEXT NOT NULL,
  quiz_questions JSONB,
  points_value INTEGER DEFAULT 50,
  estimated_minutes INTEGER DEFAULT 15,
  generation_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.daily_lesson_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_generated_lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_lesson_quota
CREATE POLICY "Parents can manage children quota"
ON public.daily_lesson_quota
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.children
    WHERE children.id = daily_lesson_quota.child_id
    AND children.parent_id = auth.uid()
  )
);

-- RLS Policies for lesson_tokens
CREATE POLICY "Parents can manage children tokens"
ON public.lesson_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.children
    WHERE children.id = lesson_tokens.child_id
    AND children.parent_id = auth.uid()
  )
);

-- RLS Policies for child_generated_lessons
CREATE POLICY "Parents can view their children's generated lessons"
ON public.child_generated_lessons
FOR SELECT
USING (parent_id = auth.uid() OR is_active = true);

CREATE POLICY "Parents can create lessons for their children"
ON public.child_generated_lessons
FOR INSERT
WITH CHECK (
  parent_id = auth.uid() AND
  child_id IN (
    SELECT id FROM public.children WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "Parents can update their children's lessons"
ON public.child_generated_lessons
FOR UPDATE
USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete their children's lessons"
ON public.child_generated_lessons
FOR DELETE
USING (parent_id = auth.uid());

-- Create function to check platform lesson quota
CREATE OR REPLACE FUNCTION public.check_platform_lesson_quota(p_child_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child RECORD;
  v_quota RECORD;
  v_today DATE := CURRENT_DATE;
  v_base_limit INTEGER := 5;
  v_result JSONB;
BEGIN
  -- Get child settings
  SELECT * INTO v_child FROM children WHERE id = p_child_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Child not found');
  END IF;

  -- Get or create today's quota
  INSERT INTO daily_lesson_quota (child_id, quota_date)
  VALUES (p_child_id, v_today)
  ON CONFLICT (child_id, quota_date) DO NOTHING;

  SELECT * INTO v_quota FROM daily_lesson_quota
  WHERE child_id = p_child_id AND quota_date = v_today;

  -- Calculate availability
  v_result := jsonb_build_object(
    'completed', COALESCE(v_quota.platform_lessons_completed, 0),
    'baseLimit', v_base_limit,
    'bonusGranted', COALESCE(v_quota.bonus_lessons_granted, 0),
    'tokensAvailable', 0, -- Will be populated by tokens table
    'totalAvailable', v_base_limit + COALESCE(v_quota.bonus_lessons_granted, 0),
    'remaining', GREATEST(0, v_base_limit + COALESCE(v_quota.bonus_lessons_granted, 0) - COALESCE(v_quota.platform_lessons_completed, 0)),
    'allowed', (v_base_limit + COALESCE(v_quota.bonus_lessons_granted, 0)) > COALESCE(v_quota.platform_lessons_completed, 0)
  );

  RETURN v_result;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_daily_lesson_quota_child_date ON public.daily_lesson_quota(child_id, quota_date);
CREATE INDEX idx_lesson_tokens_child ON public.lesson_tokens(child_id);
CREATE INDEX idx_child_generated_lessons_child ON public.child_generated_lessons(child_id);
CREATE INDEX idx_child_generated_lessons_parent ON public.child_generated_lessons(parent_id);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_lesson_quota_updated_at
  BEFORE UPDATE ON public.daily_lesson_quota
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_tokens_updated_at
  BEFORE UPDATE ON public.lesson_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_child_generated_lessons_updated_at
  BEFORE UPDATE ON public.child_generated_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();