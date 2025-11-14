-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- PHASE 1: EMOTION LOGS ENCRYPTION
-- ============================================

-- Add encrypted columns to emotion_logs
ALTER TABLE emotion_logs
ADD COLUMN IF NOT EXISTS trigger_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS coping_strategy_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS reflection_notes_encrypted BYTEA;

-- Create encryption function
CREATE OR REPLACE FUNCTION encrypt_emotion_field(
  plaintext TEXT,
  encryption_key TEXT
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_encrypt(plaintext, encryption_key);
END;
$$;

-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_emotion_field(
  ciphertext BYTEA,
  encryption_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(ciphertext, encryption_key);
END;
$$;

-- Update RLS policies for emotion_logs with time-based restrictions
DROP POLICY IF EXISTS "Parents can view children emotion logs" ON emotion_logs;

CREATE POLICY "Parents can view recent emotion logs only"
ON emotion_logs FOR SELECT
TO authenticated
USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  AND logged_at > NOW() - INTERVAL '90 days'
);

CREATE POLICY "Admins can view all emotion logs"
ON emotion_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PHASE 2: RATE LIMITING SYSTEM
-- ============================================

-- Generic rate limiting table
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- Enable RLS on rate limits
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
ON api_rate_limits FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Expand rate limit violations table
ALTER TABLE rate_limit_violations
ADD COLUMN IF NOT EXISTS endpoint TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Clean up old records
  DELETE FROM api_rate_limits
  WHERE window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current count
  SELECT request_count, window_start
  INTO v_count, v_window_start
  FROM api_rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- No record or expired window
  IF v_count IS NULL THEN
    INSERT INTO api_rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW())
    ON CONFLICT (user_id, endpoint)
    DO UPDATE SET
      request_count = 1,
      window_start = NOW();
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'reset_time', NOW() + (p_window_minutes || ' minutes')::INTERVAL
    );
  END IF;
  
  -- Check if limit exceeded
  IF v_count >= p_max_requests THEN
    -- Log violation
    INSERT INTO rate_limit_violations (parent_id, violation_type, metadata)
    VALUES (p_user_id, p_endpoint, jsonb_build_object(
      'count', v_count,
      'max', p_max_requests,
      'endpoint', p_endpoint,
      'timestamp', NOW()
    ));
    
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_time', v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
      'retry_after_seconds', EXTRACT(EPOCH FROM (v_window_start + (p_window_minutes || ' minutes')::INTERVAL - NOW()))::INTEGER
    );
  END IF;
  
  -- Increment counter
  UPDATE api_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = p_user_id AND endpoint = p_endpoint;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - (v_count + 1),
    'reset_time', v_window_start + (p_window_minutes || ' minutes')::INTERVAL
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON api_rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON api_rate_limits(window_start);

-- ============================================
-- PHASE 3: SECURITY AUDIT LOGGING
-- ============================================

-- Comprehensive access logging table
CREATE TABLE IF NOT EXISTS security_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_table TEXT NOT NULL,
  accessed_record_id UUID,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'insert', 'update', 'delete')),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on security logs
ALTER TABLE security_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
ON security_access_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own access logs"
ON security_access_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_log_user_id ON security_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_table_record ON security_access_log(accessed_table, accessed_record_id);
CREATE INDEX IF NOT EXISTS idx_access_log_timestamp ON security_access_log(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_type ON security_access_log(access_type);

-- Logging function
CREATE OR REPLACE FUNCTION log_sensitive_access(
  p_table_name TEXT,
  p_record_id UUID,
  p_access_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_access_log (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type,
    metadata
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_record_id,
    p_access_type,
    jsonb_build_object(
      'timestamp', NOW()
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently fail to not break operations
    NULL;
END;
$$;

-- Trigger function for automatic logging
CREATE OR REPLACE FUNCTION trigger_log_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_sensitive_access(TG_TABLE_NAME, NEW.id, 'insert');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_sensitive_access(TG_TABLE_NAME, NEW.id, 'update');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_sensitive_access(TG_TABLE_NAME, OLD.id, 'delete');
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Add triggers to sensitive tables
DROP TRIGGER IF EXISTS log_emotion_logs_access ON emotion_logs;
CREATE TRIGGER log_emotion_logs_access
AFTER INSERT OR UPDATE OR DELETE ON emotion_logs
FOR EACH ROW EXECUTE FUNCTION trigger_log_access();

DROP TRIGGER IF EXISTS log_messages_access ON parent_child_messages;
CREATE TRIGGER log_messages_access
AFTER INSERT OR UPDATE OR DELETE ON parent_child_messages
FOR EACH ROW EXECUTE FUNCTION trigger_log_access();

DROP TRIGGER IF EXISTS log_children_access ON children;
CREATE TRIGGER log_children_access
AFTER INSERT OR UPDATE OR DELETE ON children
FOR EACH ROW EXECUTE FUNCTION trigger_log_access();

DROP TRIGGER IF EXISTS log_progress_access ON user_progress;
CREATE TRIGGER log_progress_access
AFTER INSERT OR UPDATE OR DELETE ON user_progress
FOR EACH ROW EXECUTE FUNCTION trigger_log_access();