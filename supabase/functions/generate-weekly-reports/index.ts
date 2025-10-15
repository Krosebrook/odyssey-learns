import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, parent_id, name, grade_level');

    if (childrenError) throw childrenError;

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    for (const child of children || []) {
      // Get progress for the week
      const { data: progress, count: lessonsCompleted } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact' })
        .eq('child_id', child.id)
        .eq('status', 'completed')
        .gte('completed_at', weekStart.toISOString());

      // Calculate total points
      let totalPoints = 0;
      for (const p of progress || []) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('points_value')
          .eq('id', p.lesson_id)
          .single();
        totalPoints += lesson?.points_value || 0;
      }

      // Get subject performance
      const subjectScores: Record<string, { total: number; count: number }> = {};
      for (const p of progress || []) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('subject')
          .eq('id', p.lesson_id)
          .single();
        
        if (lesson && p.score) {
          if (!subjectScores[lesson.subject]) {
            subjectScores[lesson.subject] = { total: 0, count: 0 };
          }
          subjectScores[lesson.subject].total += p.score;
          subjectScores[lesson.subject].count += 1;
        }
      }

      const strongestSubject = Object.entries(subjectScores)
        .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0]?.[0] || 'N/A';

      const growthArea = Object.entries(subjectScores)
        .sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))[0]?.[0] || 'N/A';

      // Get emotion logs
      const { data: emotions } = await supabase
        .from('emotion_logs')
        .select('emotion_type, intensity')
        .eq('child_id', child.id)
        .gte('logged_at', weekStart.toISOString());

      const emotionSummary = emotions?.reduce((acc, e) => {
        acc[e.emotion_type] = (acc[e.emotion_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topEmotion = Object.entries(emotionSummary || {})
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

      // Generate conversation starters
      const conversationStarters = [
        `What was your favorite thing you learned about ${strongestSubject} this week?`,
        `I noticed you're working on ${growthArea}. What's one thing that would make it easier?`,
        `You seemed ${topEmotion} this week. Want to tell me more about that?`,
      ];

      // Insert report
      await supabase.from('parent_weekly_reports').insert({
        parent_id: child.parent_id,
        child_id: child.id,
        week_start_date: weekStart.toISOString().split('T')[0],
        lessons_completed: lessonsCompleted || 0,
        total_points_earned: totalPoints,
        strongest_subject: strongestSubject,
        growth_area: growthArea,
        top_achievement: `Completed ${lessonsCompleted} lessons!`,
        conversation_starter: conversationStarters[Math.floor(Math.random() * conversationStarters.length)],
        report_data: {
          subject_scores: subjectScores,
          emotion_summary: emotionSummary,
        }
      });

      // Create notification
      await supabase.from('parent_notifications').insert({
        parent_id: child.parent_id,
        child_id: child.id,
        notification_type: 'weekly_report',
        title: `${child.name}'s Weekly Report Ready 📊`,
        message: `${child.name} completed ${lessonsCompleted} lessons this week!`,
        action_url: '/parent-dashboard',
      });
    }

    return new Response(
      JSON.stringify({ success: true, reportsGenerated: children?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating weekly reports:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
