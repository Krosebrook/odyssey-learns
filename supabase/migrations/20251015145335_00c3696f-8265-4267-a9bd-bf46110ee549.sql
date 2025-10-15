-- Fix 1: Add search_path to cleanup_idempotency_cache function
CREATE OR REPLACE FUNCTION public.cleanup_idempotency_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  DELETE FROM idempotency_cache 
  WHERE created_at < now() - interval '24 hours';
$function$;

-- Fix 2: Add DELETE policy to lesson_notes table
CREATE POLICY "Parents can delete their children's notes"
ON lesson_notes
FOR DELETE
USING (
  auth.uid() IN (
    SELECT parent_id FROM children 
    WHERE id = lesson_notes.child_id
  )
);

-- Fix 3: Fix rewards policy to properly verify parent ownership
DROP POLICY IF EXISTS "Children can view parent rewards" ON rewards;

CREATE POLICY "Parents can view their own rewards"
ON rewards
FOR SELECT
USING (
  auth.uid() = parent_id
  AND is_active = true
);