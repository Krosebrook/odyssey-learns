-- Add missing columns to child_generated_lessons for community sharing

-- Add description column (optional short description separate from content)
ALTER TABLE child_generated_lessons 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add times_used column to track popularity
ALTER TABLE child_generated_lessons 
ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- Add share_status column to control visibility
ALTER TABLE child_generated_lessons 
ADD COLUMN IF NOT EXISTS share_status TEXT DEFAULT 'private' 
CHECK (share_status IN ('private', 'pending_approval', 'public', 'rejected'));

-- Add creator_child_id reference (for proper attribution)
ALTER TABLE child_generated_lessons 
ADD COLUMN IF NOT EXISTS creator_child_id UUID REFERENCES children(id) ON DELETE CASCADE;

-- Backfill creator_child_id with child_id for existing records
UPDATE child_generated_lessons 
SET creator_child_id = child_id 
WHERE creator_child_id IS NULL;

-- Add index for efficient filtering by share status
CREATE INDEX IF NOT EXISTS idx_child_generated_lessons_share_status 
ON child_generated_lessons(share_status) WHERE share_status = 'public';

-- Add index for efficient sorting by popularity
CREATE INDEX IF NOT EXISTS idx_child_generated_lessons_times_used 
ON child_generated_lessons(times_used DESC) WHERE share_status = 'public';

-- Update RLS policy to allow viewing public lessons
DROP POLICY IF EXISTS "Parents can view their children's generated lessons" ON child_generated_lessons;

CREATE POLICY "Parents can view their children's generated lessons or public lessons" 
ON child_generated_lessons FOR SELECT
USING (
  parent_id = auth.uid() 
  OR (share_status = 'public' AND is_active = true)
);

-- Add RLS policy for incrementing times_used counter
CREATE POLICY "Authenticated users can update times_used on public lessons" 
ON child_generated_lessons FOR UPDATE
USING (share_status = 'public' AND is_active = true)
WITH CHECK (share_status = 'public' AND is_active = true);

-- Add function to safely increment lesson usage count
CREATE OR REPLACE FUNCTION increment_lesson_usage(lesson_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE child_generated_lessons
  SET times_used = times_used + 1
  WHERE id = lesson_uuid 
    AND share_status = 'public' 
    AND is_active = true;
END;
$$;