-- Security Fix: Set explicit search_path for calculate_streak function
-- Prevents name resolution hijacking and follows PostgreSQL best practices
-- Issue: SUPA_function_search_path_mutable

-- Pin search_path to public schema and pg_temp
-- This ensures consistent behavior regardless of caller's session settings
ALTER FUNCTION public.calculate_streak(p_child_id uuid) 
SET search_path = public, pg_temp;

-- Verification comment: This function should now have search_path configured
-- Query to verify: 
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args, p.proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'calculate_streak';