import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all NPS responses
    const { data: responses, error: responsesError } = await supabaseClient
      .from('survey_responses')
      .select('*')
      .eq('survey_type', 'nps');

    if (responsesError) throw responsesError;

    // Calculate NPS Score
    const promoters = responses.filter(r => r.nps_score >= 9).length;
    const passives = responses.filter(r => r.nps_score >= 7 && r.nps_score <= 8).length;
    const detractors = responses.filter(r => r.nps_score <= 6).length;
    const total = responses.length;

    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

    // Analyze feedback themes (simple keyword extraction)
    const feedbackTexts = responses
      .map(r => r.responses?.feedback)
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const commonThemes = [
      'content quality',
      'technical issues',
      'too expensive',
      'confusing',
      'engaging',
      'love it',
      'child enjoys',
      'helpful',
      'improvement needed'
    ];

    const themeCounts = commonThemes.map(theme => ({
      theme,
      count: (feedbackTexts.match(new RegExp(theme, 'g')) || []).length
    })).filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count);

    // Segmentation by score category
    const segmentation = {
      promoters: {
        count: promoters,
        percentage: total > 0 ? Math.round((promoters / total) * 100) : 0,
        topFeedback: responses
          .filter(r => r.nps_score >= 9 && r.responses?.feedback)
          .slice(0, 5)
          .map(r => r.responses.feedback)
      },
      passives: {
        count: passives,
        percentage: total > 0 ? Math.round((passives / total) * 100) : 0,
        topFeedback: responses
          .filter(r => r.nps_score >= 7 && r.nps_score <= 8 && r.responses?.feedback)
          .slice(0, 5)
          .map(r => r.responses.feedback)
      },
      detractors: {
        count: detractors,
        percentage: total > 0 ? Math.round((detractors / total) * 100) : 0,
        topFeedback: responses
          .filter(r => r.nps_score <= 6 && r.responses?.feedback)
          .slice(0, 5)
          .map(r => r.responses.feedback)
      }
    };

    return new Response(
      JSON.stringify({
        npsScore,
        totalResponses: total,
        segmentation,
        themes: themeCounts,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
