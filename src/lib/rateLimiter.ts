import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side rate limiting utilities
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check if a request is rate limited
 * @returns true if rate limit is exceeded, false if allowed
 */
export const checkRateLimit = (config: RateLimitConfig): boolean => {
  const now = Date.now();
  const key = config.identifier;
  
  // Clean up expired entries
  rateLimitStore.forEach((value, storeKey) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(storeKey);
    }
  });
  
  const record = rateLimitStore.get(key);
  
  // No record exists, create one
  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }
  
  // Record exists but window has expired
  if (record.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }
  
  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return true;
  }
  
  // Increment count
  record.count++;
  return false;
};

/**
 * Get time remaining until rate limit resets (in milliseconds)
 */
export const getRateLimitReset = (identifier: string): number => {
  const record = rateLimitStore.get(identifier);
  if (!record) return 0;
  
  const now = Date.now();
  if (record.resetTime < now) return 0;
  
  return record.resetTime - now;
};

/**
 * Clear rate limit for a specific identifier
 */
export const clearRateLimit = (identifier: string): void => {
  rateLimitStore.delete(identifier);
};

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
