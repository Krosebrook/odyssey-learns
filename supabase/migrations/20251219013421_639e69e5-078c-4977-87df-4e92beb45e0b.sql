-- ============================================
-- ENHANCED RLS POLICIES FOR profiles TABLE
-- ============================================

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (critical for preventing bypasses)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- CRITICAL: Explicit deny for anonymous/public access (evaluated first due to RESTRICTIVE)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can only insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (for support purposes)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ENHANCED RLS POLICIES FOR children TABLE
-- ============================================

-- Ensure RLS is enabled and forced
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children FORCE ROW LEVEL SECURITY;

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Parents and admins can view children" ON public.children;
DROP POLICY IF EXISTS "Parents and admins can insert children" ON public.children;
DROP POLICY IF EXISTS "Parents and admins can update children" ON public.children;
DROP POLICY IF EXISTS "Parents and admins can delete children" ON public.children;

-- CRITICAL: Explicit deny for anonymous/public access
CREATE POLICY "Deny anonymous access to children"
ON public.children AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Parents can only view their own children
CREATE POLICY "Parents can view own children"
ON public.children FOR SELECT
USING (parent_id = auth.uid());

-- Parents can only insert children linked to themselves
CREATE POLICY "Parents can insert own children"
ON public.children FOR INSERT
WITH CHECK (parent_id = auth.uid());

-- Parents can only update their own children
CREATE POLICY "Parents can update own children"
ON public.children FOR UPDATE
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- Parents can only delete their own children
CREATE POLICY "Parents can delete own children"
ON public.children FOR DELETE
USING (parent_id = auth.uid());

-- Admins can view all children (for support)
CREATE POLICY "Admins can view all children"
ON public.children FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all children (for support escalations)
CREATE POLICY "Admins can manage all children"
ON public.children FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CREATE SECURE VIEW FOR SENSITIVE CHILD DATA
-- ============================================

-- Create a view that masks sensitive fields for non-admin access
CREATE OR REPLACE VIEW public.children_safe AS
SELECT 
  id,
  parent_id,
  name,
  grade_level,
  avatar_config,
  total_points,
  created_at,
  challenge_mode_enabled,
  weekly_report_enabled,
  daily_quest_id,
  quest_completed_at,
  quest_bonus_points,
  daily_screen_time_limit_minutes,
  screen_time_enabled,
  -- Mask sensitive fields
  CASE WHEN pin_hash IS NOT NULL THEN '***PROTECTED***' ELSE NULL END as pin_status,
  deleted_at IS NOT NULL as is_deleted
  -- Note: pin_hash and deletion_reason are NOT exposed
FROM public.children;

-- Grant access to the safe view
GRANT SELECT ON public.children_safe TO authenticated;

COMMENT ON VIEW public.children_safe IS 
'Safe view of children table that masks sensitive fields (pin_hash, deletion_reason). Use this view for display purposes.';

-- ============================================
-- ADD AUDIT TRIGGERS FOR SENSITIVE OPERATIONS
-- ============================================

-- Function to log access to sensitive child fields
CREATE OR REPLACE FUNCTION public.log_sensitive_child_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log any access to sensitive fields
  IF TG_OP = 'UPDATE' AND (
    OLD.pin_hash IS DISTINCT FROM NEW.pin_hash OR
    OLD.deletion_reason IS DISTINCT FROM NEW.deletion_reason OR
    OLD.deleted_at IS DISTINCT FROM NEW.deleted_at OR
    OLD.deletion_scheduled_at IS DISTINCT FROM NEW.deletion_scheduled_at
  ) THEN
    INSERT INTO security_access_log (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type,
      metadata
    ) VALUES (
      auth.uid(),
      'children',
      NEW.id,
      'sensitive_field_update',
      jsonb_build_object(
        'fields_changed', ARRAY[
          CASE WHEN OLD.pin_hash IS DISTINCT FROM NEW.pin_hash THEN 'pin_hash' END,
          CASE WHEN OLD.deletion_reason IS DISTINCT FROM NEW.deletion_reason THEN 'deletion_reason' END,
          CASE WHEN OLD.deleted_at IS DISTINCT FROM NEW.deleted_at THEN 'deleted_at' END,
          CASE WHEN OLD.deletion_scheduled_at IS DISTINCT FROM NEW.deletion_scheduled_at THEN 'deletion_scheduled_at' END
        ],
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for sensitive child field updates
DROP TRIGGER IF EXISTS tr_log_sensitive_child_access ON public.children;
CREATE TRIGGER tr_log_sensitive_child_access
  AFTER UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_child_access();

-- ============================================
-- RUN ANALYZE ON AFFECTED TABLES
-- ============================================
ANALYZE public.profiles;
ANALYZE public.children;