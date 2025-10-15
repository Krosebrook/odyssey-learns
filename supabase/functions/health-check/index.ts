import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResponse {
  db: "ok" | "error";
  gemini: "ok" | "error";
  config: {
    safe_mode: boolean;
    kill_switch: boolean;
    has_gemini_key: boolean;
  };
  version: string;
  time: string;
  latency_ms: {
    db?: number;
    gemini?: number;
    total: number;
  };
}

// Exponential backoff helper
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 100
): Promise<{ result: T | null; error: Error | null }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, error: null };
    } catch (error) {
      if (attempt === maxRetries) {
        return { result: null, error: error as Error };
      }
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return { result: null, error: new Error("Max retries exceeded") };
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response: HealthCheckResponse = {
      db: "error",
      gemini: "error",
      config: {
        safe_mode: false,
        kill_switch: false,
        has_gemini_key: false,
      },
      version: "1.0.0", // Could read from package.json if needed
      time: new Date().toISOString(),
      latency_ms: {
        total: 0,
      },
    };

    // 1. DATABASE PROBE
    const dbStart = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { result: dbResult, error: dbError } = await withRetry(async () => {
      const { data, error } = await supabase
        .from('parent_weekly_reports')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      return data;
    });

    response.latency_ms.db = Date.now() - dbStart;
    
    if (!dbError && dbResult !== null) {
      response.db = "ok";
      console.log(`[HEALTH] DB probe OK (${response.latency_ms.db}ms)`);
    } else {
      console.error(`[HEALTH] DB probe FAILED (${response.latency_ms.db}ms):`, dbError?.message);
    }

    // 2. GEMINI PROBE
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    response.config.has_gemini_key = !!geminiApiKey;

    if (geminiApiKey) {
      const geminiStart = Date.now();
      
      const { result: geminiResult, error: geminiError } = await withRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: "ping" }]
                }]
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!geminiResponse.ok) {
            throw new Error(`Gemini API returned ${geminiResponse.status}`);
          }

          return await geminiResponse.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      response.latency_ms.gemini = Date.now() - geminiStart;

      if (!geminiError && geminiResult) {
        response.gemini = "ok";
        console.log(`[HEALTH] Gemini probe OK (${response.latency_ms.gemini}ms)`);
      } else {
        console.error(`[HEALTH] Gemini probe FAILED (${response.latency_ms.gemini}ms):`, geminiError?.message);
      }
    } else {
      console.warn('[HEALTH] Gemini API key not configured, skipping probe');
    }

    // 3. CONFIG PROBE
    const safeMode = Deno.env.get('SAFE_MODE_NO_LLM');
    const killSwitch = Deno.env.get('KILL_SWITCH_TRIAGE');
    
    response.config.safe_mode = safeMode === 'true' || safeMode === '1';
    response.config.kill_switch = killSwitch === 'true' || killSwitch === '1';

    console.log('[HEALTH] Config probe:', response.config);

    // Calculate total latency
    response.latency_ms.total = Date.now() - startTime;

    // Log outcome
    const outcomeCode = response.db === "ok" && response.gemini === "ok" ? 200 : 
                        response.db === "ok" ? 206 : 500;
    
    console.log(`[HEALTH] Completed with code ${outcomeCode}, total latency: ${response.latency_ms.total}ms`);

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200, // Always return 200 for health checks
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[HEALTH] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        db: "error",
        gemini: "error",
        config: { safe_mode: false, kill_switch: false, has_gemini_key: false },
        version: "1.0.0",
        time: new Date().toISOString(),
        latency_ms: { total: Date.now() - startTime },
        error: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
