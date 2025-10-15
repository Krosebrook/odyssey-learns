import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Award, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BadgeShowcaseProps {
  childId: string;
  compact?: boolean;
}

interface AchievementBadge {
  badge_id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tier: string;
  points_reward: number;
  unlock_criteria: any;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
  progress: number;
}

export const BadgeShowcase = ({ childId, compact = false }: BadgeShowcaseProps) => {
  const [allBadges, setAllBadges] = useState<AchievementBadge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [childId]);

  const loadBadges = async () => {
    try {
      // Load all available badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('achievement_badges')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true });

      if (badgesError) throw badgesError;

      // Load earned badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('child_id', childId);

      if (userBadgesError) throw userBadgesError;

      setAllBadges(badgesData || []);
      setEarnedBadges(userBadgesData || []);

      // Calculate progress for unearned badges
      await calculateBadgeProgress(badgesData || [], userBadgesData || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBadgeProgress = async (badges: AchievementBadge[], earned: UserBadge[]) => {
    const earnedIds = new Set(earned.map(b => b.badge_id));
    const progress: Record<string, number> = {};

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

    // Calculate progress for each badge
    for (const badge of badges) {
      if (earnedIds.has(badge.badge_id)) continue;

      const criteria = badge.unlock_criteria;
      let current = 0;
      let target = 1;

      if (criteria.type === 'lesson_count') {
        current = lessonCount || 0;
        target = criteria.target;
      } else if (criteria.type === 'emotion_count') {
        current = emotionCount || 0;
        target = criteria.target;
      } else if (criteria.type === 'streak') {
        current = streak;
        target = criteria.target;
      }

      progress[badge.badge_id] = Math.min(100, Math.round((current / target) * 100));
    }

    setBadgeProgress(progress);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'silver': return 'bg-gray-100 border-gray-300 text-gray-800';
      case 'gold': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'platinum': return 'bg-purple-100 border-purple-300 text-purple-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const isEarned = (badgeId: string) => earnedBadges.some(b => b.badge_id === badgeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const displayBadges = compact ? allBadges.slice(0, 6) : allBadges;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">
            {compact ? 'Recent Badges' : 'Achievement Badges'}
          </h3>
        </div>
        <Badge variant="secondary">
          {earnedBadges.length} / {allBadges.length}
        </Badge>
      </div>

      <div className={`grid ${compact ? 'grid-cols-3 gap-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
        {displayBadges.map((badge) => {
          const earned = isEarned(badge.badge_id);
          const progress = badgeProgress[badge.badge_id] || 0;

          return (
            <Card
              key={badge.badge_id}
              className={`
                p-4 text-center transition-all
                ${earned ? getTierColor(badge.tier) : 'bg-gray-50 border-gray-200 opacity-60'}
                ${earned ? 'hover-scale' : ''}
              `}
            >
              <div className="relative inline-block mb-2">
                <div className={`
                  text-4xl
                  ${earned ? '' : 'grayscale opacity-50'}
                `}>
                  {badge.icon}
                </div>
                {!earned && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {badge.description}
              </p>

              {!earned && progress > 0 && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progress}% complete</p>
                </div>
              )}

              {earned && (
                <Badge variant="secondary" className="text-xs">
                  +{badge.points_reward} points
                </Badge>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
