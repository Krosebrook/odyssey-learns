import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if a child has earned any new badges and awards them
 * Returns array of newly earned badge IDs
 */
export const checkAndAwardBadges = async (childId: string): Promise<string[]> => {
  try {
    // Get all available badges
    const { data: allBadges } = await supabase
      .from('achievement_badges')
      .select('*')
      .eq('is_active', true);

    if (!allBadges) return [];

    // Get already earned badges
    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('child_id', childId);

    const earnedIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

    // Get user stats
    const { count: lessonCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('status', 'completed');

    const { count: emotionCount } = await supabase
      .from('emotion_logs')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId);

    // Calculate streak
    const { data: recentProgress } = await supabase
      .from('user_progress')
      .select('completed_at')
      .eq('child_id', childId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(30);

    let streak = 0;
    if (recentProgress && recentProgress.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dates = recentProgress
        .map(p => {
          const date = new Date(p.completed_at!);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => b - a);

      for (let i = 0; i < dates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        if (dates[i] === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Check completed subjects
    const { data: completedLessons } = await supabase
      .from('user_progress')
      .select('lessons(subject)')
      .eq('child_id', childId)
      .eq('status', 'completed');

    const uniqueSubjects = new Set(
      completedLessons?.map((p: any) => p.lessons?.subject).filter(Boolean) || []
    );

    // Check quests completed
    const { data: childData } = await supabase
      .from('children')
      .select('quest_bonus_points')
      .eq('id', childId)
      .single();

    const questsCompleted = childData?.quest_bonus_points ? 
      Math.floor((childData.quest_bonus_points) / 25) : 0; // Assuming 25 bonus per quest

    // Check each badge
    const newlyEarned: string[] = [];

    for (const badge of allBadges) {
      if (earnedIds.has(badge.badge_id)) continue;

      const criteria = badge.unlock_criteria as any;
      let qualified = false;

      switch (criteria.type) {
        case 'lesson_count':
          qualified = (lessonCount || 0) >= criteria.target;
          break;
        case 'emotion_count':
          qualified = (emotionCount || 0) >= criteria.target;
          break;
        case 'streak':
          qualified = streak >= criteria.target;
          break;
        case 'quest_count':
          qualified = questsCompleted >= criteria.target;
          break;
        case 'all_subjects':
          qualified = uniqueSubjects.size >= criteria.target;
          break;
      }

      if (qualified) {
        // Award the badge
        const { error } = await supabase
          .from('user_badges')
          .insert({
            child_id: childId,
            badge_id: badge.badge_id,
            progress: 100,
          });

        if (!error) {
          newlyEarned.push(badge.badge_id);

          // Award bonus points
          if (badge.points_reward > 0) {
            const { data: child } = await supabase
              .from('children')
              .select('total_points')
              .eq('id', childId)
              .single();

            await supabase
              .from('children')
              .update({
                total_points: (child?.total_points || 0) + badge.points_reward,
              })
              .eq('id', childId);
          }
        }
      }
    }

    return newlyEarned;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
};
