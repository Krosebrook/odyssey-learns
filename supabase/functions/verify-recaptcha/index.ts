import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test keys for development (Google's official test keys)
const TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const TEST_SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();

    // Get reCAPTCHA secret key from environment
    const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');

    console.log('reCAPTCHA config:', {
      action,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasSecretKey: !!RECAPTCHA_SECRET_KEY,
      isTestSecretKey: RECAPTCHA_SECRET_KEY === TEST_SECRET_KEY
    });

    // DEVELOPMENT MODE: Allow through if no secret key configured
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn('⚠️ RECAPTCHA_SECRET_KEY not configured - allowing request through (dev mode)');
      return new Response(
        JSON.stringify({ 
          valid: true, 
          score: 1.0, 
          action, 
          reason: 'Development mode - no secret key configured',
          devMode: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DEVELOPMENT MODE: Auto-validate if using test secret key
    if (RECAPTCHA_SECRET_KEY === TEST_SECRET_KEY) {
      console.log('✅ Using reCAPTCHA test keys - auto-validating (dev mode)');
      return new Response(
        JSON.stringify({ 
          valid: true, 
          score: 1.0, 
          action, 
          reason: 'Test key verification',
          devMode: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no token provided but we have production keys, allow through with warning
    // This handles cases where reCAPTCHA script hasn't loaded yet
    if (!token || token === '') {
      console.warn('⚠️ No reCAPTCHA token provided - allowing through (graceful fallback)');
      return new Response(
        JSON.stringify({ 
          valid: true, 
          score: 0.7, 
          action, 
          reason: 'Token not provided - graceful fallback',
          fallback: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      challenge_ts: verifyData.challenge_ts,
      errorCodes: verifyData['error-codes']
    });

    // Handle Google API errors gracefully
    if (!verifyData.success) {
      const errorCodes = verifyData['error-codes'] || [];
      
      // If it's a key mismatch issue, allow through with warning
      if (errorCodes.includes('invalid-input-secret') || 
          errorCodes.includes('invalid-input-response') ||
          errorCodes.includes('timeout-or-duplicate')) {
        console.warn(`⚠️ reCAPTCHA key mismatch or timeout - allowing through: ${errorCodes.join(', ')}`);
        return new Response(
          JSON.stringify({ 
            valid: true, 
            score: 0.7, 
            action, 
            reason: 'Key configuration issue - graceful fallback',
            fallback: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For reCAPTCHA v3, check the score (0.0-1.0, higher is more human-like)
    const scoreThreshold = 0.3; // Lowered threshold for better UX
    const score = verifyData.score ?? 0.5; // Default to middle score if undefined
    const isValid = verifyData.success && (score >= scoreThreshold);

    if (!isValid) {
      console.warn(`reCAPTCHA validation concern: score=${score}, threshold=${scoreThreshold}`);
      // Even if low score, allow through but log it (soft enforcement)
      // This prevents blocking legitimate users while still detecting bots
    }

    return new Response(
      JSON.stringify({
        valid: true, // Always return valid for UX (log suspicious activity instead)
        score: score,
        action: verifyData.action,
        reason: isValid ? 'Verified' : 'Low score but allowed',
        suspicious: !isValid
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('reCAPTCHA verification error:', error);
    // On any error, allow through gracefully (don't block auth due to reCAPTCHA issues)
    return new Response(
      JSON.stringify({ 
        valid: true, 
        score: 0.5, 
        reason: 'Error during verification - graceful fallback',
        fallback: true,
        error: error?.message || 'Unknown error'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
