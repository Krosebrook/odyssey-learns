-- Fix search_path security warnings for cleanup function
DROP FUNCTION IF EXISTS cleanup_old_error_logs();

CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
$$;