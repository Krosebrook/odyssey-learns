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

    // Get all children
    const { data: children, error: childrenError } = await supabaseClient
      .from('children')
      .select('id, grade_level');

    if (childrenError) throw childrenError;

    const results = [];

    for (const child of children) {
      // Fetch recent activity sessions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sessions, error: sessionsError } = await supabaseClient
        .from('user_progress')
        .select('lesson_id, score, time_spent_seconds, completed_at')
        .eq('child_id', child.id)
        .eq('status', 'completed')
        .gte('completed_at', thirtyDaysAgo.toISOString());

      if (sessionsError) {
        console.error(`Error fetching sessions for child ${child.id}:`, sessionsError);
        continue;
      }

      if (!sessions || sessions.length === 0) continue;

      // Get lesson subjects for skill breakdown
      const lessonIds = [...new Set(sessions.map(s => s.lesson_id))];
      const { data: lessons } = await supabaseClient
        .from('lessons')
        .select('id, subject')
        .in('id', lessonIds);

      const lessonSubjectMap = new Map(lessons?.map(l => [l.id, l.subject]) || []);

      // Group by subject
      const subjectPerformance = new Map<string, { scores: number[], times: number[] }>();

      sessions.forEach(session => {
        const subject = lessonSubjectMap.get(session.lesson_id) || 'Unknown';
        if (!subjectPerformance.has(subject)) {
          subjectPerformance.set(subject, { scores: [], times: [] });
        }
        const data = subjectPerformance.get(subject)!;
        if (session.score !== null) data.scores.push(session.score);
        if (session.time_spent_seconds) data.times.push(session.time_spent_seconds);
      });

      // Calculate and store analytics
      for (const [subject, data] of subjectPerformance.entries()) {
        if (data.scores.length === 0) continue;

        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const avgTime = data.times.reduce((a, b) => a + b, 0) / (data.times.length || 1);

        // Determine current level and mastery
        let currentLevel: string;
        if (avgScore >= 85) currentLevel = 'advanced';
        else if (avgScore >= 70) currentLevel = 'intermediate';
        else currentLevel = 'beginner';

        const masteryScore = avgScore;

        // Recommend next difficulty
        let recommendedDifficulty: string;
        if (avgScore >= 90) recommendedDifficulty = 'increase';
        else if (avgScore < 60) recommendedDifficulty = 'decrease';
        else recommendedDifficulty = 'maintain';

        // Upsert learning analytics
        const { error: analyticsError } = await supabaseClient
          .from('learning_analytics')
          .upsert({
            child_id: child.id,
            subject,
            skill: subject, // Simplified: using subject as skill
            current_level: currentLevel,
            mastery_score: masteryScore,
            recommended_difficulty: recommendedDifficulty,
            prediction_confidence: 75, // Fixed confidence for now
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'child_id,subject,skill'
          });

        if (analyticsError) {
          console.error(`Error upserting analytics for child ${child.id}:`, analyticsError);
        } else {
          results.push({ childId: child.id, subject, masteryScore, currentLevel });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results.slice(0, 10), // Sample of results
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
