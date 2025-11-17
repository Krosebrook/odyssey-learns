/**
 * Rate Limiting Middleware for Supabase Edge Functions
 * 
 * USAGE:
 * ```typescript
 * import { rateLimitMiddleware } from '../_shared/rateLimitMiddleware.ts';
 * 
 * serve(async (req) => {
 *   const rateLimitResponse = await rateLimitMiddleware(req, {
 *     maxRequests: 10,
 *     windowMinutes: 60,
 *     endpoint: 'my-function'
 *   });
 *   
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // ... rest of function logic
 * });
 * ```
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  endpoint: string;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
}

/**
 * Check rate limit using Supabase RPC function
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig,
  supabase: any
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_endpoint: config.endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: config.windowMinutes
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true }; // Fail open
    }

    return data as RateLimitResult;
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true }; // Fail open
  }
}

/**
 * Middleware function to handle rate limiting
 * Returns a Response object if rate limit is exceeded, null otherwise
 */
export async function rateLimitMiddleware(
  req: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  // Extract Supabase client from request
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user from auth header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(user.id, config, supabase);

  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for user ${user.id} on ${config.endpoint}`);
    
    // Log violation
    await supabase.from('rate_limit_violations').insert({
      parent_id: user.id,
      violation_type: 'api_rate_limit',
      endpoint: config.endpoint,
      metadata: {
        maxRequests: config.maxRequests,
        windowMinutes: config.windowMinutes
      }
    });

    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
        remaining: 0
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + (rateLimitResult.retryAfter || 60) * 1000).toString()
        }
      }
    );
  }

  return null; // No rate limit exceeded, continue processing
}

/**
 * Validate input using zod-like schema
 */
export function validateInput<T>(
  data: unknown,
  schema: {
    parse: (data: unknown) => T;
  }
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Validation failed' };
  }
}
