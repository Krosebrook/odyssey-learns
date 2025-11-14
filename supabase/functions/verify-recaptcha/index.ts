import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'No reCAPTCHA token provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get reCAPTCHA secret key from environment
    const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');

    // Validate production key is configured
    if (!RECAPTCHA_SECRET_KEY) {
      console.error('🚨 RECAPTCHA_SECRET_KEY not configured!');
      return new Response(
        JSON.stringify({ valid: false, error: 'reCAPTCHA not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Warn if using test key in production
    if (RECAPTCHA_SECRET_KEY.startsWith('6LeIxAcTAAAAAG')) {
      console.warn('⚠️ Using reCAPTCHA test key. Replace with production key!');
    }

    console.log(`Verifying reCAPTCHA token for action: ${action}`);

    // Verify token with Google
    const verifyResponse = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
      }
    );

    const verifyData = await verifyResponse.json();

    console.log('reCAPTCHA verification result:', {
      success: verifyData.success,
      score: verifyData.score,
      action: verifyData.action,
      challenge_ts: verifyData.challenge_ts
    });

    // For reCAPTCHA v3, check the score (0.0-1.0, higher is more human-like)
    const scoreThreshold = 0.5;
    const isValid = verifyData.success && (verifyData.score >= scoreThreshold);

    if (!isValid) {
      console.warn(`reCAPTCHA validation failed: score=${verifyData.score}, threshold=${scoreThreshold}`);
    }

    return new Response(
      JSON.stringify({
        valid: isValid,
        score: verifyData.score,
        action: verifyData.action,
        reason: isValid ? 'Verified' : 'Score below threshold or verification failed'
      }),
      {
        status: isValid ? 200 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('reCAPTCHA verification error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
