-- Fix MISSING_RLS: Add INSERT policy for collaboration_requests
CREATE POLICY "Parents can create collaboration requests for their children"
ON collaboration_requests FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT parent_id FROM children WHERE id = requester_child_id
  )
);

-- Add rate limiting protection via check constraint on audit
CREATE TABLE IF NOT EXISTS collaboration_rate_limit (
  parent_id uuid NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  PRIMARY KEY (parent_id)
);

-- Function to enforce rate limits (10 per 15 minutes)
CREATE OR REPLACE FUNCTION check_collaboration_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id uuid;
  v_count integer;
BEGIN
  -- Get parent of requesting child
  SELECT parent_id INTO v_parent_id
  FROM children
  WHERE id = NEW.requester_child_id;
  
  -- Check recent request count
  SELECT COUNT(*) INTO v_count
  FROM collaboration_requests
  WHERE requester_child_id IN (
    SELECT id FROM children WHERE parent_id = v_parent_id
  )
  AND created_at > now() - interval '15 minutes';
  
  IF v_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 10 collaboration requests per 15 minutes';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_collaboration_rate_limit
BEFORE INSERT ON collaboration_requests
FOR EACH ROW
EXECUTE FUNCTION check_collaboration_rate_limit();

-- Add DELETE policy for parents
CREATE POLICY "Parents can delete their own collaboration requests"
ON collaboration_requests FOR DELETE
USING (
  auth.uid() IN (
    SELECT parent_id FROM children WHERE id = requester_child_id
  )
);