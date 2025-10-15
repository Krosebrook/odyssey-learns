-- Drop old trigger-based system
DROP TRIGGER IF EXISTS enforce_collaboration_rate_limit ON collaboration_requests;
DROP FUNCTION IF EXISTS check_collaboration_rate_limit();

-- Drop old unique constraint (the constraint, not the index)
ALTER TABLE collaboration_requests 
DROP CONSTRAINT IF EXISTS collaboration_requests_requester_child_id_recipient_child_i_key;

-- Add partial unique index for pending requests only
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_collaboration 
  ON collaboration_requests (requester_child_id, recipient_child_id, lesson_id)
  WHERE status = 'pending';

-- Idempotency cache table
CREATE TABLE IF NOT EXISTS idempotency_cache (
  key text PRIMARY KEY,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Rate limit violations tracking (NO FOREIGN KEY to auth.users per guidelines)
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  violation_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violations_by_parent ON rate_limit_violations(parent_id, created_at);

-- Cleanup function for idempotency cache
CREATE OR REPLACE FUNCTION cleanup_idempotency_cache()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM idempotency_cache 
  WHERE created_at < now() - interval '24 hours';
$$;

COMMENT ON FUNCTION cleanup_idempotency_cache() IS 
  'Run daily via scheduler: SELECT cleanup_idempotency_cache();';

-- Secure RPC function for collaboration requests
CREATE OR REPLACE FUNCTION request_collaboration(
  p_child_id uuid,
  p_target_child_id uuid,
  p_lesson_id uuid,
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id uuid;
  v_request_count integer;
  v_request_id uuid;
  v_result jsonb;
  v_cached_result jsonb;
BEGIN
  -- Step 0: Check idempotency cache
  IF p_idempotency_key IS NOT NULL THEN
    SELECT result INTO v_cached_result
    FROM idempotency_cache
    WHERE key = p_idempotency_key 
      AND created_at > now() - interval '24 hours';
    
    IF v_cached_result IS NOT NULL THEN
      RETURN v_cached_result;
    END IF;
  END IF;

  -- Step 1: Verify ownership (defense in depth)
  SELECT parent_id INTO v_parent_id
  FROM children
  WHERE id = p_child_id AND parent_id = auth.uid();
  
  IF v_parent_id IS NULL THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'You can only create requests for your own children'
    );
  ELSIF p_child_id = p_target_child_id THEN
    -- Step 2: Prevent self-collaboration
    v_result := jsonb_build_object(
      'success', false,
      'error', 'invalid_target',
      'message', 'A child cannot collaborate with themselves'
    );
  ELSIF NOT pg_try_advisory_xact_lock(hashtext(v_parent_id::text)) THEN
    -- Step 2.5: Acquire advisory lock (prevents race conditions)
    v_result := jsonb_build_object(
      'success', false,
      'error', 'concurrent_request',
      'message', 'Another request is being processed. Please wait and retry.',
      'retry_after_seconds', 2
    );
  ELSIF EXISTS (
    SELECT 1 FROM collaboration_requests
    WHERE requester_child_id = p_child_id
      AND recipient_child_id = p_target_child_id
      AND lesson_id = p_lesson_id
      AND status = 'pending'
  ) THEN
    -- Step 3: Check for duplicate pending request
    v_result := jsonb_build_object(
      'success', false,
      'error', 'duplicate_request',
      'message', 'A collaboration request is already pending for this lesson'
    );
  ELSE
    -- Step 4: Check rate limit with atomic counter
    SELECT COUNT(*) INTO v_request_count
    FROM collaboration_requests
    WHERE requester_child_id IN (
      SELECT id FROM children WHERE parent_id = v_parent_id
    )
    AND created_at > now() - interval '15 minutes';
    
    IF v_request_count >= 10 THEN
      -- Log violation for monitoring
      INSERT INTO rate_limit_violations (parent_id, violation_type, metadata)
      VALUES (v_parent_id, 'collaboration_request', jsonb_build_object(
        'request_count', v_request_count,
        'child_id', p_child_id,
        'target_id', p_target_child_id,
        'lesson_id', p_lesson_id,
        'timestamp', now()
      ));
      
      v_result := jsonb_build_object(
        'success', false,
        'error', 'rate_limit_exceeded',
        'message', 'You have sent too many requests. Please wait 15 minutes.',
        'retry_after_seconds', 900
      );
    ELSE
      -- Step 5: Insert request
      INSERT INTO collaboration_requests (
        requester_child_id,
        recipient_child_id,
        lesson_id,
        status
      ) VALUES (
        p_child_id,
        p_target_child_id,
        p_lesson_id,
        'pending'
      ) RETURNING id INTO v_request_id;
      
      -- Step 6: Update rate limit tracking
      INSERT INTO collaboration_rate_limit (parent_id, request_count, window_start)
      VALUES (v_parent_id, 1, now())
      ON CONFLICT (parent_id) DO UPDATE
      SET request_count = collaboration_rate_limit.request_count + 1,
          window_start = CASE 
            WHEN collaboration_rate_limit.window_start < now() - interval '15 minutes'
            THEN now()
            ELSE collaboration_rate_limit.window_start
          END;
      
      v_result := jsonb_build_object(
        'success', true,
        'request_id', v_request_id,
        'message', 'Collaboration request sent successfully'
      );
    END IF;
  END IF;
  
  -- Cache result for idempotency
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO idempotency_cache (key, result)
    VALUES (p_idempotency_key, v_result)
    ON CONFLICT (key) DO NOTHING;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION request_collaboration(uuid, uuid, uuid, text) TO authenticated;

-- Enable RLS on new tables
ALTER TABLE idempotency_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Idempotency cache: system-only access
CREATE POLICY "System only" ON idempotency_cache
  FOR ALL USING (false);

-- Violations: service role can view for monitoring
CREATE POLICY "Service role can view violations" ON rate_limit_violations
  FOR SELECT USING (
    COALESCE(current_setting('request.jwt.claims', true)::json->>'role', '') = 'service_role'
  );