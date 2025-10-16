-- Security Fix: Move pg_net extension from public to extensions schema
-- pg_net is NOT relocatable, so we must drop and recreate it
-- This is safe because pg_net has no persistent data - it's just HTTP request functions
-- Issue: SUPA_extension_in_public

-- Step 1: Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION postgres;

-- Step 2: Drop pg_net from public and recreate in extensions
-- This is safe because pg_net stores no data, only provides functions
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Step 3: Set up proper grants for controlled access
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Step 4: Improve public schema security hygiene
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- Verification: pg_net should now be in extensions schema, not public