-- Create enum for review status
CREATE TYPE public.review_status AS ENUM (
  'pending',
  'in_review',
  'approved',
  'rejected',
  'needs_revision'
);

-- Create lesson_reviews table
CREATE TABLE public.lesson_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.review_status NOT NULL DEFAULT 'pending',
  
  -- Quality scores (1-5)
  age_appropriate_score INTEGER CHECK (age_appropriate_score BETWEEN 1 AND 5),
  content_accuracy_score INTEGER CHECK (content_accuracy_score BETWEEN 1 AND 5),
  clarity_score INTEGER CHECK (clarity_score BETWEEN 1 AND 5),
  engagement_score INTEGER CHECK (engagement_score BETWEEN 1 AND 5),
  assessment_quality_score INTEGER CHECK (assessment_quality_score BETWEEN 1 AND 5),
  
  -- Overall score (calculated average)
  overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
    (COALESCE(age_appropriate_score, 0) + 
     COALESCE(content_accuracy_score, 0) + 
     COALESCE(clarity_score, 0) + 
     COALESCE(engagement_score, 0) + 
     COALESCE(assessment_quality_score, 0)) / 5.0
  ) STORED,
  
  -- Feedback
  strengths TEXT,
  weaknesses TEXT,
  suggestions TEXT,
  reviewer_notes TEXT,
  
  -- Metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one review per lesson
  UNIQUE(lesson_id)
);

-- Create indexes
CREATE INDEX idx_lesson_reviews_status ON public.lesson_reviews(status);
CREATE INDEX idx_lesson_reviews_reviewer ON public.lesson_reviews(reviewer_id);
CREATE INDEX idx_lesson_reviews_lesson ON public.lesson_reviews(lesson_id);
CREATE INDEX idx_lesson_reviews_score ON public.lesson_reviews(overall_score DESC);

-- Create review_history table
CREATE TABLE public.review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.lesson_reviews(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status public.review_status,
  new_status public.review_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_history_review ON public.review_history(review_id);

-- Enable RLS
ALTER TABLE public.lesson_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all reviews"
  ON public.lesson_reviews FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage reviews"
  ON public.lesson_reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view history"
  ON public.review_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can log history"
  ON public.review_history FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to auto-create review for new lessons
CREATE OR REPLACE FUNCTION public.create_review_for_new_lesson()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lesson_reviews (lesson_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER trigger_create_review_for_new_lesson
  AFTER INSERT ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.create_review_for_new_lesson();

-- Function to log status changes
CREATE OR REPLACE FUNCTION public.log_review_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.review_history (review_id, changed_by, previous_status, new_status)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
    
    IF NEW.status = 'in_review' AND OLD.status = 'pending' THEN
      NEW.started_at = NOW();
    ELSIF NEW.status IN ('approved', 'rejected') THEN
      NEW.completed_at = NOW();
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for status changes
CREATE TRIGGER trigger_log_review_status_change
  BEFORE UPDATE ON public.lesson_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.log_review_status_change();

-- Stats function
CREATE OR REPLACE FUNCTION public.get_review_statistics()
RETURNS TABLE (
  total_reviews BIGINT,
  pending_reviews BIGINT,
  in_review BIGINT,
  approved_reviews BIGINT,
  rejected_reviews BIGINT,
  needs_revision BIGINT,
  avg_review_time_hours NUMERIC,
  avg_overall_score NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_reviews,
    COUNT(*) FILTER (WHERE status = 'in_review') as in_review,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_reviews,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_reviews,
    COUNT(*) FILTER (WHERE status = 'needs_revision') as needs_revision,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600) as avg_review_time_hours,
    AVG(overall_score) as avg_overall_score
  FROM public.lesson_reviews;
$$;

-- Dashboard view
CREATE OR REPLACE VIEW public.lesson_review_dashboard AS
SELECT
  l.id as lesson_id,
  l.title,
  l.subject,
  l.grade_level,
  l.created_at as lesson_created_at,
  lr.id as review_id,
  lr.status as review_status,
  lr.overall_score,
  lr.reviewer_id,
  p.full_name as reviewer_name,
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
  END as status_label
FROM public.lessons l
LEFT JOIN public.lesson_reviews lr ON l.id = lr.lesson_id
LEFT JOIN public.profiles p ON lr.reviewer_id = p.id
WHERE l.is_active = true;

GRANT SELECT ON public.lesson_review_dashboard TO authenticated;