import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch metrics from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: metrics, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('timestamp', oneHourAgo);

    if (error) throw error;

    const alerts: string[] = [];

    // Check LCP (Largest Contentful Paint)
    const lcpMetrics = metrics.filter((m: any) => m.metric_name === 'LCP');
    if (lcpMetrics.length > 0) {
      const avgLCP = lcpMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / lcpMetrics.length;
      const poorLCP = lcpMetrics.filter((m: any) => m.value > 2500).length;
      const poorPercentage = (poorLCP / lcpMetrics.length) * 100;

      if (poorPercentage > 10) {
        alerts.push(`🚨 LCP Alert: ${poorPercentage.toFixed(1)}% of users experiencing poor LCP (avg: ${avgLCP.toFixed(0)}ms)`);
      }
    }

    // Check FID (First Input Delay)
    const fidMetrics = metrics.filter((m: any) => m.metric_name === 'FID');
    if (fidMetrics.length > 0) {
      const avgFID = fidMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / fidMetrics.length;
      if (avgFID > 100) {
        alerts.push(`⚠️ FID Alert: Average first input delay is ${avgFID.toFixed(0)}ms (target: <100ms)`);
      }
    }

    // Check CLS (Cumulative Layout Shift)
    const clsMetrics = metrics.filter((m: any) => m.metric_name === 'CLS');
    if (clsMetrics.length > 0) {
      const avgCLS = clsMetrics.reduce((sum: number, m: any) => sum + m.value, 0) / clsMetrics.length;
      if (avgCLS > 0.1) {
        alerts.push(`📐 CLS Alert: Average layout shift is ${avgCLS.toFixed(3)} (target: <0.1)`);
      }
    }

    // Check error rate (if we have error tracking)
    const errorMetrics = metrics.filter((m: any) => m.metric_name === 'error');
    if (errorMetrics.length > 0) {
      const totalRequests = metrics.length;
      const errorRate = (errorMetrics.length / totalRequests) * 100;
      if (errorRate > 1) {
        alerts.push(`❌ Error Rate Alert: ${errorRate.toFixed(2)}% error rate (target: <1%)`);
      }
    }

    // Send alerts if any
    if (alerts.length > 0) {
      console.log('Performance Alerts:', alerts);
      // TODO: Send to Slack/Email/GitHub
      // For now, just log them
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        metrics_checked: metrics.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Performance alerts error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
