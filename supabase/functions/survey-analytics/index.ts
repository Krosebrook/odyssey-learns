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

    // Fetch all survey responses
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate NPS
    const promoters = responses.filter((r: any) => r.nps_score >= 9).length;
    const passives = responses.filter((r: any) => r.nps_score >= 7 && r.nps_score <= 8).length;
    const detractors = responses.filter((r: any) => r.nps_score <= 6).length;
    const total = responses.length;
    
    const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

    // Extract common themes using simple keyword analysis
    const feedbackTexts = responses
      .map((r: any) => r.feedback_text)
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const commonWords = extractKeywords(feedbackTexts);

    // Segment by grade tier (if we have child_id data)
    const segmentation = {
      by_score: {
        promoters,
        passives,
        detractors,
      },
      total_responses: total,
      nps_score: nps,
      common_themes: commonWords.slice(0, 10),
    };

    // Update campaign with latest NPS
    const { data: campaigns } = await supabase
      .from('survey_campaigns')
      .select('id')
      .eq('active', true)
      .limit(1);

    if (campaigns && campaigns.length > 0) {
      await supabase
        .from('survey_campaigns')
        .update({
          nps_score: nps,
          response_count: total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaigns[0].id);
    }

    return new Response(
      JSON.stringify({ success: true, analytics: segmentation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Survey analytics error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractKeywords(text: string): string[] {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'for', 'on', 'with'];
  const words = text.split(/\s+/).filter((w) => w.length > 3 && !stopWords.includes(w));
  
  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}
