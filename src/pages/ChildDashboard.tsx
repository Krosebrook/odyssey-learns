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

const ChildDashboard = () => {
  const { childId, isValidating } = useValidatedChild();
  const [child, setChild] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
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

    // Calculate streak (days with consecutive completed lessons)
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

    setChild(childData);
    setLessons(lessonsData || []);
    setStats({ completed: completedCount || 0, streak });
    setLoading(false);
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
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {child?.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to learn something amazing today?
          </p>
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
