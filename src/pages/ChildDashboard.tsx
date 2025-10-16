import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BookOpen, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useValidatedChild } from "@/hooks/useValidatedChild";
import { CelebrationModal } from "@/components/celebration/CelebrationModal";
import { generateDailyQuest, isQuestStale } from "@/lib/questGenerator";
import { Sparkles, Settings } from "lucide-react";
import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";
import { EmotionCheckIn } from "@/components/emotional/EmotionCheckIn";
import { BadgeShowcase } from "@/components/badges/BadgeShowcase";
import { checkAndAwardBadges } from "@/lib/badgeChecker";
import { DailyQuest } from "@/components/quests/DailyQuest";
import { CustomLessonGenerator } from "@/components/learning/CustomLessonGenerator";
import { LessonTokenDisplay } from "@/components/gamification/LessonTokenDisplay";

const ChildDashboard = () => {
  const { childId, isValidating } = useValidatedChild();
  const [child, setChild] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [dailyQuest, setDailyQuest] = useState<any>(null);
  const [celebration, setCelebration] = useState<any>(null);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isValidating && childId) {
      loadDashboardData();
    }
  }, [childId, isValidating]);

  const loadDashboardData = async () => {
    if (!childId) return;

    // Fetch child data
    const { data: childData } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    // Fetch lessons for the child's grade
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .eq('grade_level', childData?.grade_level || 1)
      .eq('is_active', true)
      .limit(6);

    // Fetch completed lessons count
    const { data: progressData, count: completedCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact' })
      .eq('child_id', childId)
      .eq('status', 'completed');

    // Calculate streak using optimized database function
    const { data: streakData } = await supabase.rpc('calculate_streak', { p_child_id: childId });
    const streak = streakData || 0;

    setChild(childData);
    setLessons(lessonsData || []);
    setStats({ completed: completedCount || 0, streak });

    // Generate or load daily quest
    if (childData) {
      await loadOrGenerateQuest(childData);
    }

    setLoading(false);
  };

  const loadOrGenerateQuest = async (childData: any) => {
    // Check if quest needs to be regenerated
    const needsNewQuest = 
      !childData.daily_quest_id || 
      isQuestStale(childData.quest_completed_at);

    if (needsNewQuest) {
      const quest = await generateDailyQuest(childData.id, childData.grade_level);
      if (quest) {
        // Save quest to database
        await supabase
          .from('children')
          .update({ 
            daily_quest_id: quest.lesson_id,
            quest_bonus_points: quest.bonus_points,
            quest_completed_at: null
          })
          .eq('id', childData.id);

        // Load full lesson details
        const { data: questLesson } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', quest.lesson_id)
          .single();

        setDailyQuest({ ...quest, lesson: questLesson });
      }
    } else if (childData.daily_quest_id) {
      // Load existing quest
      const { data: questLesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', childData.daily_quest_id)
        .single();

      setDailyQuest({
        lesson_id: childData.daily_quest_id,
        bonus_points: childData.quest_bonus_points,
        lesson: questLesson,
      });
    }
  };

  if (isValidating || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!childId) {
    navigate('/');
    return null;
  }

  return (
    <AppLayout childName={child?.name} points={child?.total_points || 0}>
      {celebration && (
        <CelebrationModal
          open={true}
          onClose={() => setCelebration(null)}
          type={celebration.type}
          title={celebration.title}
          message={celebration.message}
          points={celebration.points}
          gradeLevel={child?.grade_level || 5}
        />
      )}
      {showAvatarCustomizer && child && (
        <AvatarCustomizer
          open={showAvatarCustomizer}
          onClose={() => setShowAvatarCustomizer(false)}
          childId={child.id}
          currentConfig={child.avatar_config}
          onSave={(newConfig) => {
            setChild({ ...child, avatar_config: newConfig });
            setShowAvatarCustomizer(false);
          }}
        />
      )}
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {child?.name}! 👋
          </h1>
          <p className="text-muted-foreground mb-4">
            Ready to learn something amazing today?
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAvatarCustomizer(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Customize Avatar
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 elevated-card hover-scale">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 elevated-card hover-scale">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{child?.total_points || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 elevated-card hover-scale">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Learning Streak</p>
                <p className="text-2xl font-bold">{stats.streak} days</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Daily Quest - Age-Adaptive UI */}
        <DailyQuest />

        {/* Lesson Tokens Display */}
        {child && <LessonTokenDisplay childId={child.id} />}

        {/* Custom Lesson Generator */}
        {child && (
          <CustomLessonGenerator
            childId={child.id}
            gradeLevel={child.grade_level}
            onLessonCreated={(lesson) => {
              setCelebration({
                type: 'lesson',
                title: '✨ Lesson Created!',
                message: `Your custom lesson "${lesson.title}" is ready to explore!`,
                points: 0,
              });
            }}
          />
        )}

        {/* Emotional Check-In */}
        <EmotionCheckIn 
          childId={childId} 
          gradeLevel={child?.grade_level || 5}
          onComplete={async () => {
            // Check for new badges after emotion check-in
            const newBadges = await checkAndAwardBadges(childId);
            if (newBadges.length > 0) {
              setCelebration({
                type: 'badge',
                title: '🏆 New Badge Earned!',
                message: `You've unlocked ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`,
                points: 0,
              });
            }
          }}
        />

        {/* Badge Showcase */}
        <BadgeShowcase childId={childId} compact />

        {/* Available Lessons */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Start Learning</h2>
            <Button variant="ghost" onClick={() => navigate('/lessons')}>
              View All
            </Button>
          </div>

          {lessons.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No lessons available yet. Check back soon!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className="p-6 elevated-card hover-scale cursor-pointer"
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                >
                  <SubjectBadge subject={lesson.subject} className="mb-4" />
                  <h3 className="font-semibold mb-2">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {lesson.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {lesson.estimated_minutes} min
                    </span>
                    <span className="font-medium text-accent">
                      +{lesson.points_value} points
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ChildDashboard;
