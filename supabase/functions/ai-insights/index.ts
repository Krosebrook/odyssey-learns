import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { childId } = await req.json();
    
    if (!childId) {
      return new Response(JSON.stringify({ error: "childId is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch child data
    const { data: child } = await supabase
      .from('children')
      .select('name, grade_level, total_points')
      .eq('id', childId)
      .single();

    // Fetch recent progress
    const { data: recentProgress } = await supabase
      .from('user_progress')
      .select('*, lessons(subject, title)')
      .eq('child_id', childId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    // Fetch emotion logs
    const { data: emotionLogs } = await supabase
      .from('emotion_logs')
      .select('emotion_type, intensity, trigger')
      .eq('child_id', childId)
      .order('logged_at', { ascending: false })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare context for AI
    const subjectCounts: Record<string, number> = {};
    let totalScore = 0;
    recentProgress?.forEach((p: any) => {
      const subject = p.lessons?.subject || 'Unknown';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      totalScore += p.score || 0;
    });

    const avgScore = recentProgress?.length ? Math.round(totalScore / recentProgress.length) : 0;
    const topSubject = Object.entries(subjectCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Not enough data';

    const emotionSummary = emotionLogs?.slice(0, 5).map((e: any) => 
      `${e.emotion_type} (intensity: ${e.intensity})`
    ).join(', ') || 'No recent emotions logged';

    const prompt = `You are an AI educational advisor. Analyze this student's learning data and provide actionable insights.

Child: ${child?.name || 'Student'} (Grade ${child?.grade_level})
Total Points: ${child?.total_points || 0}
Recent Performance: ${avgScore}% average across ${recentProgress?.length || 0} lessons
Top Subject: ${topSubject}
Recent Emotions: ${emotionSummary}

Provide insights in exactly this JSON format:
{
  "strengths": ["strength 1", "strength 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "alerts": ["alert if any concern detected, or empty array"],
  "nextSteps": ["next step 1", "next step 2"]
}

Keep each item concise (max 15 words). Focus on actionable advice for parents.`;

    console.log('Calling Lovable AI for insights...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert K-12 educational advisor. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;

    // Parse JSON from response
    let insights;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      insights = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback insights
      insights = {
        strengths: [`Strong performance in ${topSubject}`, "Consistent learning engagement"],
        recommendations: ["Continue current learning pace", "Explore related subjects", "Practice emotional check-ins"],
        alerts: avgScore < 60 ? ["Scores below 60% - may need additional support"] : [],
        nextSteps: ["Review challenging topics", "Set weekly learning goals"]
      };
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
