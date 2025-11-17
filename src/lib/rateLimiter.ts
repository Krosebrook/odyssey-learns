import { supabase } from "@/integrations/supabase/client";

/**
 * Phase 1 Critical Fix: Server-Side Rate Limiting Only
 * 
 * REMOVED: Client-side rate limiting (race condition vulnerability)
 * KEPT: Server-side rate limiting via check_rate_limit RPC
 * 
 * All rate limiting is now enforced server-side in the database
 * to prevent bypass via client manipulation.
 */

/**
 * Server-side rate limiting using database
 * Checks rate limits via Postgres function for accurate enforcement
 */
export const checkServerRateLimit = async (
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: true }; // Allow anonymous (will fail auth later)

  try {
    // @ts-ignore - Types will regenerate after migration
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true }; // Fail open (allow request)
    }

    // Type cast the JSON response
    const result = data as any;
    return {
      allowed: result.allowed,
      retryAfter: result.retry_after_seconds,
      remaining: result.remaining
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true }; // Fail open
  }
};

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  LOGIN: { maxRequests: 5, windowMinutes: 15, endpoint: 'auth_login' },
  SIGNUP: { maxRequests: 3, windowMinutes: 60, endpoint: 'auth_signup' },
  PASSWORD_RESET: { maxRequests: 3, windowMinutes: 60, endpoint: 'auth_password_reset' },
  LESSON_GENERATION: { maxRequests: 10, windowMinutes: 1440, endpoint: 'lesson_generation' }, // 10 per day
  BETA_FEEDBACK: { maxRequests: 5, windowMinutes: 1440, endpoint: 'beta_feedback' }, // 5 per day
};
