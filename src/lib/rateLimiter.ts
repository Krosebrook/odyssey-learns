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
