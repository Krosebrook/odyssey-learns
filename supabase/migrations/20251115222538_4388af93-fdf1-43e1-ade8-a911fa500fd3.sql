-- Create error_logs table for centralized error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  component TEXT,
  action TEXT,
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying by severity and date
CREATE INDEX idx_error_logs_severity_created ON error_logs(severity, created_at DESC);

-- Add index for querying by user
CREATE INDEX idx_error_logs_user_created ON error_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Add index for querying by component
CREATE INDEX idx_error_logs_component_created ON error_logs(component, created_at DESC) WHERE component IS NOT NULL;

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
  ON error_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: System can insert error logs
CREATE POLICY "System can insert error logs"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to clean up old error logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
$$;

-- Add comment for documentation
COMMENT ON TABLE error_logs IS 'Centralized error logging for monitoring and debugging';
COMMENT ON FUNCTION cleanup_old_error_logs() IS 'Cleanup function to remove error logs older than 30 days';