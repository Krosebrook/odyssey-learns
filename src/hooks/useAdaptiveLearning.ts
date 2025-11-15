import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceData {
  score: number;
  timeSpent: number;
  difficulty: string;
  timestamp: string;
}

export const useAdaptiveLearning = (childId: string) => {
  const queryClient = useQueryClient();

  const { data: analytics } = useQuery({
    queryKey: ['learning-analytics', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('child_id', childId);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recommendedLessons } = useQuery({
    queryKey: ['recommended-lessons', childId],
    queryFn: async () => {
      // Get child's profile and performance
      const { data: child } = await supabase
        .from('children')
        .select('grade_level, total_points')
        .eq('id', childId)
        .single();

      if (!child) return [];

      // Get recent performance
      const { data: recentSessions } = await supabase
        .from('user_progress')
        .select('lesson_id, score, time_spent_seconds')
        .eq('child_id', childId)
        .order('completed_at', { ascending: false })
        .limit(10);

      // Calculate difficulty recommendation
      const avgScore = recentSessions?.reduce((acc, s) => acc + (s.score || 0), 0) / (recentSessions?.length || 1);
      const recommendedDifficulty = avgScore > 85 ? 'advanced' : avgScore > 60 ? 'intermediate' : 'beginner';

      // Get recommended lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('grade_level', child.grade_level)
        .eq('is_active', true)
        .limit(5);

      return lessons || [];
    },
    enabled: !!childId,
  });

  const updatePerformance = useMutation({
    mutationFn: async ({ 
      subject, 
      skill, 
      masteryScore 
    }: { 
      subject: string; 
      skill: string; 
      masteryScore: number;
    }) => {
      const { data, error } = await supabase
        .from('learning_analytics')
        .upsert({
          child_id: childId,
          subject,
          skill,
          mastery_score: masteryScore,
          current_level: masteryScore > 85 ? 'advanced' : masteryScore > 60 ? 'intermediate' : 'beginner',
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'child_id,subject,skill'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-analytics', childId] });
      queryClient.invalidateQueries({ queryKey: ['recommended-lessons', childId] });
    },
  });

  return {
    analytics,
    recommendedLessons,
    updatePerformance,
  };
};
