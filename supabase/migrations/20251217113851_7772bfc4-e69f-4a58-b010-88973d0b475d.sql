-- Fix profiles policies - drop existing first
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate insert policy
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add admin view policy (drop if exists first)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add indexes for faster audit queries
CREATE INDEX IF NOT EXISTS idx_data_access_audit_user_table_time 
ON data_access_audit(user_id, accessed_table, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_access_log_user_table_time
ON security_access_log(user_id, accessed_table, accessed_at DESC);

-- Run ANALYZE on affected tables
ANALYZE data_access_audit;
ANALYZE security_access_log;
ANALYZE children;
ANALYZE profiles;