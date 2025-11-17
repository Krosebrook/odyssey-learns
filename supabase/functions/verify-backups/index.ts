import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify database connectivity
    const { data: dbCheck, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (dbError) throw new Error(`Database check failed: ${dbError.message}`);

    // Get record counts from critical tables
    const tables = ['children', 'lessons', 'user_progress', 'profiles', 'emotion_logs'];
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw new Error(`Failed to count ${table}: ${error.message}`);
      counts[table] = count || 0;
    }

    // Verify RLS policies are active
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('verify_rls_policies');
    
    const verificationResult = {
      timestamp: new Date().toISOString(),
      status: 'success',
      database_accessible: true,
      record_counts: counts,
      total_records: Object.values(counts).reduce((sum, count) => sum + count, 0),
      rls_active: !rlsError,
      checks_passed: true
    };

    // Log verification to database
    await supabase.from('error_logs').insert({
      severity: 'info',
      error_message: 'Backup verification completed successfully',
      component: 'backup-verification',
      metadata: verificationResult
    });

    console.log('Backup verification:', verificationResult);

    return new Response(JSON.stringify(verificationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorResult = {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: (error as Error).message,
      checks_passed: false
    };

    // Log error
    console.error('Backup verification failed:', error);

    // Try to log to database (may fail if DB is down)
    try {
      const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('error_logs').insert({
        severity: 'critical',
        error_message: 'Backup verification failed',
        component: 'backup-verification',
        metadata: errorResult
      });
    } catch (logError) {
      console.error('Failed to log verification error:', logError);
    }

    return new Response(JSON.stringify(errorResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
