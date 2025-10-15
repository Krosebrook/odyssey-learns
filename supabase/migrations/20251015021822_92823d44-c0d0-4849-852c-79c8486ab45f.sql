-- Create profiles table extending auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level >= 0 AND grade_level <= 12),
  avatar_config JSONB DEFAULT '{"hair": "short", "color": "brown", "accessory": "none"}'::jsonb,
  total_points INTEGER DEFAULT 0,
  pin_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on children
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Children policies
CREATE POLICY "Parents can view own children"
  ON public.children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can manage own children"
  ON public.children FOR ALL
  USING (auth.uid() = parent_id);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level INTEGER NOT NULL CHECK (grade_level >= 0 AND grade_level <= 12),
  subject TEXT NOT NULL CHECK (subject IN ('reading', 'math', 'science', 'social', 'lifeskills')),
  title TEXT NOT NULL,
  description TEXT,
  content_markdown TEXT NOT NULL,
  estimated_minutes INTEGER DEFAULT 15,
  points_value INTEGER DEFAULT 50,
  quiz_questions JSONB,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Lessons are publicly readable (all authenticated users can view)
CREATE POLICY "Authenticated users can view active lessons"
  ON public.lessons FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, lesson_id)
);

-- Enable RLS on user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Progress policies - parents can view their children's progress
CREATE POLICY "Parents can view children progress"
  ON public.user_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = user_progress.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage children progress"
  ON public.user_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = user_progress.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create rewards table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  is_active BOOLEAN DEFAULT true,
  redemption_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Rewards policies
CREATE POLICY "Parents can manage own rewards"
  ON public.rewards FOR ALL
  USING (auth.uid() = parent_id);

CREATE POLICY "Children can view parent rewards"
  ON public.rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.parent_id = rewards.parent_id
      AND is_active = true
    )
  );

-- Create reward_redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS on reward_redemptions
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Redemptions policies
CREATE POLICY "Parents can view children redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = reward_redemptions.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage children redemptions"
  ON public.reward_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = reward_redemptions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Create screen_time_sessions table
CREATE TABLE public.screen_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  minutes_used INTEGER
);

-- Enable RLS on screen_time_sessions
ALTER TABLE public.screen_time_sessions ENABLE ROW LEVEL SECURITY;

-- Screen time policies
CREATE POLICY "Parents can view children screen time"
  ON public.screen_time_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = screen_time_sessions.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage children screen time"
  ON public.screen_time_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE children.id = screen_time_sessions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'parent',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Parent')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default rewards template
INSERT INTO public.rewards (parent_id, name, description, points_cost, is_active)
SELECT 
  id,
  reward_data->>'name',
  reward_data->>'description',
  (reward_data->>'points')::integer,
  false -- Disabled by default, parents can enable
FROM public.profiles
CROSS JOIN (
  SELECT jsonb_array_elements('[
    {"name": "Extra 30 Min Screen Time", "points": 200, "description": "Stay on devices 30 minutes longer"},
    {"name": "Pick Tonight''s Dinner", "points": 150, "description": "Choose what we eat tonight"},
    {"name": "Stay Up 15 Min Late", "points": 300, "description": "Bedtime extended by 15 minutes"},
    {"name": "$5 Toy Budget", "points": 500, "description": "Pick a small toy next shopping trip"},
    {"name": "Extra Dessert", "points": 100, "description": "Have a second dessert tonight"},
    {"name": "Friend Playdate", "points": 800, "description": "Invite a friend over to play"},
    {"name": "Family Movie Night Pick", "points": 250, "description": "Choose our next movie"},
    {"name": "Skip One Chore", "points": 400, "description": "Take a break from one daily chore"}
  ]'::jsonb) AS reward_data
) rewards_template
WHERE profiles.role = 'parent'
ON CONFLICT DO NOTHING;